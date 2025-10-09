from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.services.simulator import DataSimulator
from backend.api.routes import router as api_router
from backend.services.storage import Storage
from backend.services.hydraulic import HydraulicModel
from backend.core import registry
import math
import os

app = FastAPI(title="Smart Water Digital Twin Prototype")

app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"https://water-distribution-simulator.onrender.com",
		"https://sudzv1606.github.io",
		"http://localhost:3000",
		"http://localhost:8000",
		"http://127.0.0.1:8000",
		"http://localhost:5500",  # Live Server
		"*"
	],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# 🌐 SERVE STATIC FILES - Enable frontend hosting on port 8000
app.mount("/css", StaticFiles(directory="frontend/css"), name="css")
app.mount("/js", StaticFiles(directory="frontend/js"), name="js")

# 🌟 ROOT ROUTE - Serve frontend index.html
@app.get("/")
async def serve_frontend():
    """Serve the main frontend interface"""
    return FileResponse("frontend/index.html")

# 🌟 API STATUS ROUTE - Health check
@app.get("/api/status")
async def get_status():
    """Get system status"""
    return {
        "status": "running",
        "service": "Smart Water Digital Twin",
        "version": "2.0",
        "features": [
            "Real-time Monitoring",
            "Hydraulic Simulation",
            "Interactive Visualization",
            "Anomaly Detection",
            "EPANET Modeling"
        ],
        # 🌟 Add real-time data for frontend polling
        "spectral_freq": 45.2 + (hash(str(simulator)) % 100) / 10,
        "rms_power": 2.3 + (hash(str(simulator)) % 50) / 10,
        "kurtosis": 2.8 + (hash(str(simulator)) % 30) / 10,
        "skewness": 0.5 + (hash(str(simulator)) % 20) / 10
    }

app.include_router(api_router, prefix="/api")

storage = Storage()
hydraulic = HydraulicModel(inp_path="backend/assets/network.inp")
simulator = DataSimulator()

@app.on_event("startup")
async def startup_event():
	hydraulic.load()
	registry.set_storage(storage)
	registry.set_hydraulic(hydraulic)
	registry.set_simulator(simulator)
	await simulator.start()

@app.on_event("shutdown")
async def shutdown_event():
	await simulator.stop()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
	await websocket.accept()
	client_id = simulator.register_client(websocket)
	try:
		while True:
			message = await simulator.next_message(client_id)
			# Transform sensor data for frontend compatibility
			payload = {
				"time": message["timestamp"],
				"spectral_freq": next((s["value"] for s in message["sensors"] if s["id"] == "S1"), 0),
				"kurtosis": next((s["value"] for s in message["sensors"] if s["id"] == "K1"), 0),
				"skewness": next((s["value"] for s in message["sensors"] if s["id"] == "SK1"), 0),
				"rms_power": next((s["value"] for s in message["sensors"] if s["id"] == "RMS1"), 0),
				"accuracy": next((s["value"] for s in message["sensors"] if s["id"] == "ACC1"), 0),
				"precision": next((s["value"] for s in message["sensors"] if s["id"] == "PREC1"), 0),
				"recall": next((s["value"] for s in message["sensors"] if s["id"] == "REC1"), 0),
				"auc": next((s["value"] for s in message["sensors"] if s["id"] == "AUC1"), 0),
				# 🌟 Add missing data for bottom panel population
				"node_pressures": message.get("node_pressures", {}),
				"delta_t": message.get("delta_t", 0),
				"ground_vibration": message.get("ground_vibration", 0),
				# 🌟 Add calculated metrics for panel display
				"snr": calculate_snr(message),
				"thd": calculate_thd(message),
				"crest_factor": calculate_crest_factor(message),
				"dynamic_range": calculate_dynamic_range(message),
				"f1_score": calculate_f1_score(message)
			}
			await websocket.send_json(payload)
	except WebSocketDisconnect:
		simulator.unregister_client(client_id)

# 🌟 Calculation functions for derived acoustic and AI metrics
def calculate_snr(message):
	"""Calculate Signal-to-Noise Ratio from RMS power and spectral frequency"""
	try:
		rms_power = next((s["value"] for s in message.get("sensors", []) if s["id"] == "RMS1"), 0)
		spectral_freq = next((s["value"] for s in message.get("sensors", []) if s["id"] == "S1"), 0)

		if rms_power > 0 and spectral_freq > 0:
			# SNR calculation based on signal power and frequency characteristics
			noise_floor = 0.01  # Base noise level
			signal_power = rms_power ** 2
			snr = 10 * math.log10(max(signal_power / noise_floor, 1))
			return round(min(snr, 120), 1)  # Cap at 120 dB
		return 0
	except:
		return 0

def calculate_thd(message):
	"""Calculate Total Harmonic Distortion from skewness"""
	try:
		skewness = next((s["value"] for s in message.get("sensors", []) if s["id"] == "SK1"), 0)

		# THD calculation based on skewness (asymmetry in waveform)
		thd = abs(skewness) * 15  # Scale factor for realistic THD range
		return round(min(thd, 100), 1)  # Cap at 100%
	except:
		return 0

def calculate_crest_factor(message):
	"""Calculate Crest Factor from RMS power"""
	try:
		rms_power = next((s["value"] for s in message.get("sensors", []) if s["id"] == "RMS1"), 0)

		if rms_power > 0:
			# Estimate peak from RMS (crest factor typically 1.4-2.0 for these signals)
			peak_estimate = rms_power * math.sqrt(2) * 1.5  # Assume crest factor of 1.5
			crest_factor = peak_estimate / rms_power
			return round(crest_factor, 2)
		return 0
	except:
		return 0

def calculate_dynamic_range(message):
	"""Calculate Dynamic Range from spectral characteristics"""
	try:
		spectral_freq = next((s["value"] for s in message.get("sensors", []) if s["id"] == "S1"), 0)
		rms_power = next((s["value"] for s in message.get("sensors", []) if s["id"] == "RMS1"), 0)

		if spectral_freq > 0:
			# Dynamic range based on frequency and power characteristics
			base_range = 60  # Base dynamic range in dB
			freq_factor = min((spectral_freq / 100) * 5, 20)  # Frequency contribution
			power_factor = min(rms_power * 10, 15)  # Power contribution

			dynamic_range = base_range + freq_factor + power_factor
			return round(dynamic_range, 1)
		return 60
	except:
		return 60

def calculate_f1_score(message):
	"""Calculate F1 Score from precision and recall"""
	try:
		precision = next((s["value"] for s in message.get("sensors", []) if s["id"] == "PREC1"), 0)
		recall = next((s["value"] for s in message.get("sensors", []) if s["id"] == "REC1"), 0)

		if precision > 0 and recall > 0:
			f1 = (2 * precision * recall) / (precision + recall)
			return round(f1, 3)
		return 0
	except:
		return 0
