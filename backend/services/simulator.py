import asyncio
import random
import time
import contextlib
import numpy as np
from typing import Dict, Any, Optional
from fastapi import WebSocket
from backend.services.anomaly import AnomalyDetector
from backend.core import registry
import math

class DataSimulator:
	def __init__(self) -> None:
		self._running: bool = False
		self._task: Optional[asyncio.Task] = None
		self._clients: Dict[str, WebSocket] = {}
		self._queues: Dict[str, asyncio.Queue] = {}
		self._detector = AnomalyDetector()
		self._leak: Optional[Dict[str, Any]] = None
		self._demand_multiplier: float = 1.0
		self._demand_until_ts: int = 0
		self._interval_s: float = 2.0

	async def start(self) -> None:
		if self._running:
			return
		self._running = True
		self._task = asyncio.create_task(self._loop())

	async def stop(self) -> None:
		self._running = False
		if self._task:
			self._task.cancel()
			with contextlib.suppress(asyncio.CancelledError):
				await self._task

	def register_client(self, websocket: WebSocket) -> str:
		client_id = f"c-{int(time.time()*1000)}-{random.randint(1000,9999)}"
		self._clients[client_id] = websocket
		self._queues[client_id] = asyncio.Queue(maxsize=10)
		return client_id

	def unregister_client(self, client_id: str) -> None:
		self._clients.pop(client_id, None)
		self._queues.pop(client_id, None)

	async def next_message(self, client_id: str) -> Dict[str, Any]:
		queue = self._queues.get(client_id)
		if queue is None:
			raise RuntimeError("Client not registered")
		return await queue.get()

	def trigger_leak(self, pipe_id: str, severity: float) -> None:
		self._leak = {"pipe_id": pipe_id, "severity": max(0.0, min(severity, 1.0))}

	def trigger_demand_spike(self, multiplier: float, duration_s: int) -> None:
		self._demand_multiplier = max(0.1, multiplier)
		self._demand_until_ts = int(time.time()) + max(1, duration_s)

	def clear_leaks(self) -> None:
		"""Clear all active leaks"""
		self._leak = None
		# Also clear leaks from hydraulic model
		hyd = registry.get_hydraulic()
		if hyd is not None:
			hyd.clear_leaks()

	async def _loop(self) -> None:
		while self._running:
			reading = self._generate_reading()
			storage = registry.get_storage()
			if storage is not None:
				storage.insert_readings(reading["timestamp"], reading["sensors"])
				storage.insert_anomaly(reading["timestamp"], reading["anomaly"]["score"], reading["anomaly"].get("location"))
			for q in list(self._queues.values()):
				if not q.full():
					q.put_nowait(reading)
			await asyncio.sleep(self._interval_s)

	def _generate_reading(self) -> Dict[str, Any]:
		hs = registry.get_hydraulic()
		ts = int(time.time() * 1000)

		# Build per-node pressure from hydraulic model (which now handles leak propagation)
		node_pressures: Dict[str, float] = {}
		if hs and hs.is_ready():
			nodes, links = hs.get_connectivity()

			# Use hydraulic model's baseline pressures (which include leak modifications)
			for n in nodes:
				# Get the modified pressure from hydraulic model if available, otherwise baseline
				if hasattr(hs, '_modified_pressures') and n in hs._modified_pressures:
					node_pressures[n] = hs._modified_pressures[n]
				else:
					node_pressures[n] = random.gauss(hs.get_baseline_pressure(n, 52.0), 1.2)

			# demand spike effect: reduce all node pressures slightly
			if int(ts/1000) < self._demand_until_ts:
				scale = max(0.7, 1.0 - 0.05 * (self._demand_multiplier - 1.0))
				for n in node_pressures:
					node_pressures[n] *= scale

			# Set location for anomaly detection
			location = self._leak["pipe_id"] if self._leak is not None else None
		else:
			# Fallback single-node model if no hydraulic
			p = random.gauss(52.0, 1.5)
			if int(ts/1000) < self._demand_until_ts:
				p *= 0.95
			if self._leak is not None:
				p -= self._leak["severity"] * random.uniform(5, 15)
			node_pressures = {"J1": max(0.0, p)}
			location = self._leak["pipe_id"] if self._leak is not None else None
		# Generate new sensor signals
		sensor_data = self._generate_sensor_data(ts)

		sensors = [
			{"id": "S1", "type": "spectral_frequency", "value": round(sensor_data["spectral_freq"], 2)},
			{"id": "K1", "type": "kurtosis", "value": round(sensor_data["kurtosis"], 3)},
			{"id": "SK1", "type": "skewness", "value": round(sensor_data["skewness"], 3)},
			{"id": "RMS1", "type": "rms_power", "value": round(sensor_data["rms_power"], 3)},
			{"id": "ACC1", "type": "accuracy_score", "value": round(sensor_data["accuracy_score"], 3)},
			{"id": "PREC1", "type": "precision_score", "value": round(sensor_data["precision_score"], 3)},
			{"id": "REC1", "type": "recall_score", "value": round(sensor_data["recall_score"], 3)},
			{"id": "AUC1", "type": "auc_score", "value": round(sensor_data["auc_score"], 3)},
		]
		metrics = {s["id"]: s["value"] for s in sensors}
		score_obj = self._detector.score(metrics)
		if self._leak is not None:
			score_obj["location"] = self._leak["pipe_id"]
		return {
			"timestamp": ts,
			"sensors": sensors,
			"anomaly": score_obj,
			"node_pressures": node_pressures,
		}

	def _generate_sensor_data(self, timestep: int) -> Dict[str, float]:
		"""Generate 8 sensor signals with advanced DSP processing for Simulation Mode 2.0"""

		# Base signal parameters
		base_freq = 700  # Hz
		sample_rate = 44100  # Sample rate for acoustic simulation
		duration = 0.1  # 100ms window

		# Generate synthetic acoustic signal with leak characteristics
		t = np.linspace(0, duration, int(sample_rate * duration))

		# Base acoustic signal (pipe flow noise)
		base_signal = np.sin(2 * np.pi * base_freq * t)

		# Add leak-induced components if leak is active
		if self._leak is not None:
			leak_severity = self._leak["severity"]
			# Leak generates additional frequency components and broadband noise
			leak_freq = base_freq + random.uniform(100, 300)  # Leak frequency shift
			leak_signal = leak_severity * np.sin(2 * np.pi * leak_freq * t)
			white_noise = leak_severity * 0.5 * np.random.normal(0, 1, len(t))
			base_signal += leak_signal + white_noise

		# Add demand spike effects
		if int(timestep/1000) < self._demand_until_ts:
			# Demand spikes increase low-frequency turbulence
			lf_noise = 0.3 * np.sin(2 * np.pi * 50 * t) * self._demand_multiplier
			base_signal += lf_noise

		# Add realistic pipe/environmental noise
		environmental_noise = 0.1 * np.random.normal(0, 1, len(t))
		base_signal += environmental_noise

		# 🌊 DSP Processing Pipeline
		dsp_results = self._apply_dsp_processing(base_signal, sample_rate, timestep)

		# 📊 Generate ML Performance Metrics
		ml_metrics = self._generate_ml_metrics(timestep)

		return {
			"spectral_freq": dsp_results["spectral_freq"],
			"kurtosis": dsp_results["kurtosis"],
			"skewness": dsp_results["skewness"],
			"rms_power": dsp_results["rms_power"],
			"delta_t": dsp_results["delta_t"],
			"ground_vibration": dsp_results["ground_vibration"],
			"accuracy_score": ml_metrics["accuracy"],
			"precision_score": ml_metrics["precision"],
			"recall_score": ml_metrics["recall"],
			"auc_score": ml_metrics["auc"]
		}

	def _apply_dsp_processing(self, signal_data: np.ndarray, sample_rate: int, timestep: int) -> Dict[str, float]:
		"""Apply digital signal processing to extract acoustic features"""

		# 1. 🔊 Spectral Frequency Analysis
		# Apply FFT and find dominant frequency
		fft_values = np.fft.fft(signal_data)
		fft_freq = np.fft.fftfreq(len(signal_data), 1/sample_rate)
		magnitude = np.abs(fft_values)

		# Find peak frequency (excluding DC component)
		positive_freq_idx = fft_freq > 0
		peak_idx = np.argmax(magnitude[positive_freq_idx])
		spectral_freq = fft_freq[positive_freq_idx][peak_idx]

		# 2. 📊 Statistical Analysis
		# Kurtosis - measures "peakedness" of the waveform
		mean_signal = np.mean(signal_data)
		std_signal = np.std(signal_data)
		kurtosis = np.mean(((signal_data - mean_signal) / std_signal)**4) if std_signal > 0 else 0

		# Skewness - measures asymmetry of the waveform
		skewness = np.mean(((signal_data - mean_signal) / std_signal)**3) if std_signal > 0 else 0

		# 3. ⚡ RMS Power - root mean square energy
		rms_power = np.sqrt(np.mean(signal_data**2))

		# 4. ⏱️ Delta-T Analysis (cross-correlation for leak location)
		# Simulate time delay estimation between sensors
		ref_signal = signal_data
		delayed_signal = np.roll(ref_signal, int(random.uniform(1, 10)))  # Simulated delay

		# Cross-correlation to find time delay
		correlation = np.correlate(ref_signal, delayed_signal, mode='full')
		delta_t_idx = np.argmax(correlation)
		delta_t = (delta_t_idx - len(ref_signal) + 1) / sample_rate

		# 5. 🌍 Ground Vibration Simulation
		# Leaks create ground-borne vibrations that propagate differently
		if self._leak is not None:
			# Ground vibration amplitude depends on leak severity and soil conditions
			ground_vibration = self._leak["severity"] * random.uniform(0.05, 0.15)
			# Add some frequency-dependent attenuation
			ground_vibration *= (1 - 0.1 * math.log10(max(1, spectral_freq/100)))
		else:
			ground_vibration = random.uniform(0.01, 0.03)  # Background vibration

		# Add leak-induced modulation to ground vibration
		if self._leak is not None:
			modulation_freq = 25 + random.uniform(-5, 5)  # Hz
			modulation = 0.3 * np.sin(2 * np.pi * modulation_freq * timestep / 10000)
			ground_vibration *= (1 + modulation)

		return {
			"spectral_freq": max(100, min(5000, spectral_freq)),  # Clamp to realistic range
			"kurtosis": kurtosis,
			"skewness": skewness,
			"rms_power": rms_power,
			"delta_t": abs(delta_t),
			"ground_vibration": ground_vibration
		}

	def _generate_ml_metrics(self, timestep: int) -> Dict[str, float]:
		"""Generate realistic ML model performance metrics"""

		# Base performance levels
		base_accuracy = 0.90
		base_precision = 0.85
		base_recall = 0.88
		base_auc = 0.91

		# Add temporal variation (model performance can drift over time)
		time_factor = math.sin(timestep / 10000) * 0.02

		# Add scenario-based variation
		if self._leak is not None:
			# Leak scenarios typically improve detection metrics
			leak_factor = self._leak["severity"] * 0.05
			accuracy = min(0.98, base_accuracy + leak_factor + time_factor + random.uniform(-0.01, 0.01))
			precision = min(0.95, base_precision + leak_factor * 0.8 + time_factor + random.uniform(-0.01, 0.01))
			recall = min(0.96, base_recall + leak_factor * 1.2 + time_factor + random.uniform(-0.01, 0.01))
			auc = min(0.98, base_auc + leak_factor + time_factor + random.uniform(-0.01, 0.01))
		elif int(timestep/1000) < self._demand_until_ts:
			# Demand spikes can confuse the model initially
			demand_factor = (self._demand_multiplier - 1.0) * 0.02
			accuracy = max(0.85, base_accuracy - demand_factor + time_factor + random.uniform(-0.02, 0.02))
			precision = max(0.80, base_precision - demand_factor * 0.5 + time_factor + random.uniform(-0.02, 0.02))
			recall = max(0.83, base_recall - demand_factor * 0.8 + time_factor + random.uniform(-0.02, 0.02))
			auc = max(0.86, base_auc - demand_factor + time_factor + random.uniform(-0.02, 0.02))
		else:
			# Normal operation with gradual drift
			accuracy = base_accuracy + time_factor + random.uniform(-0.02, 0.02)
			precision = base_precision + time_factor + random.uniform(-0.03, 0.03)
			recall = base_recall + time_factor + random.uniform(-0.02, 0.02)
			auc = base_auc + time_factor + random.uniform(-0.03, 0.02)

		return {
			"accuracy": max(0.5, min(0.99, accuracy)),
			"precision": max(0.5, min(0.99, precision)),
			"recall": max(0.5, min(0.99, recall)),
			"auc": max(0.5, min(0.99, auc))
		}
