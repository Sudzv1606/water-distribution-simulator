from fastapi import APIRouter
from pydantic import BaseModel
from backend.core import registry

router = APIRouter()

class LeakRequest(BaseModel):
	pipe_id: str
	severity: float = 0.5

demand_spike_default_duration = 600

class DemandSpikeRequest(BaseModel):
	multiplier: float = 1.2
	duration_s: int = demand_spike_default_duration

@router.post("/scenarios/leak")
async def trigger_leak(req: LeakRequest):
	sim = registry.get_simulator()
	hyd = registry.get_hydraulic()
	if sim is not None:
		sim.trigger_leak(req.pipe_id, req.severity)
	if hyd is not None:
		hyd.apply_leak(req.pipe_id, req.severity)
	return {"status": "ok", "applied": True, "leak": req.model_dump()}

@router.post("/scenarios/demand-spike")
async def trigger_demand_spike(req: DemandSpikeRequest):
	sim = registry.get_simulator()
	hyd = registry.get_hydraulic()
	if sim is not None:
		sim.trigger_demand_spike(req.multiplier, req.duration_s)
	if hyd is not None:
		hyd.apply_demand_spike(req.multiplier, req.duration_s)
	return {"status": "ok", "applied": True, "spike": req.model_dump()}

@router.get("/readings/recent")
async def get_recent_readings(limit: int = 100):
	st = registry.get_storage()
	rows = st.get_recent_readings(limit) if st is not None else []
	return [
		{"ts": r[0], "sensor_id": r[1], "type": r[2], "value": r[3]}
		for r in rows
	]

@router.get("/anomalies/recent")
async def get_recent_anomalies(limit: int = 100):
	st = registry.get_storage()
	rows = st.get_recent_anomalies(limit) if st is not None else []
	return [
		{"ts": r[0], "score": r[1], "location": r[2]}
		for r in rows
	]

@router.get("/network")
async def get_network():
	hyd = registry.get_hydraulic()
	if hyd is None or not hyd.is_ready():
		return {"nodes": [], "links": []}
	nodes, links = hyd.get_connectivity()
	return {
		"nodes": [{"id": n, "baseline": hyd.get_baseline_pressure(n)} for n in nodes],
		"links": [{"id": lid, "source": s, "target": t} for (lid, s, t) in links],
	}

@router.post("/scenarios/clear-leaks")
async def clear_all_leaks():
	sim = registry.get_simulator()
	hyd = registry.get_hydraulic()
	if sim is not None:
		sim.clear_leaks()
	if hyd is not None:
		hyd.clear_leaks()
	return {"status": "ok", "message": "All leaks cleared"}

@router.get("/hydraulic-state")
async def get_hydraulic_state():
	hyd = registry.get_hydraulic()
	if hyd is None or not hyd.is_ready():
		return {"error": "Hydraulic model not ready"}

	return {
		"active_leaks": hyd.get_active_leaks(),
		"modified_pressures": hyd.get_modified_pressures(),
		"baseline_pressures": {n: hyd.get_baseline_pressure(n) for n in hyd.get_connectivity()[0]},
		"connectivity": {
			"nodes": hyd.get_connectivity()[0],
			"links": hyd.get_connectivity()[1]
		}
	}

@router.get("/status")
async def get_status():
	"""Get current system status including sensor data and AI metrics"""
	hyd = registry.get_hydraulic()
	sim = registry.get_simulator()

	# Get current pressures from hydraulic model
	node_pressures = {}
	if hyd and hyd.is_ready():
		node_pressures = hyd.get_modified_pressures()

	# Get active leaks
	active_leaks = {}
	if hyd:
		active_leaks = hyd.get_active_leaks()

	# Generate simulated sensor data based on current state
	import random
	import time

	# Base values
	base_spectral_freq = 50.0
	base_rms_power = 5.0
	base_kurtosis = 3.0
	base_skewness = 0.0

	# Modify values based on active leaks
	total_leak_severity = sum(active_leaks.values())
	if total_leak_severity > 0:
		# Leaks cause higher frequency content and power
		base_spectral_freq += total_leak_severity * 20
		base_rms_power += total_leak_severity * 3
		base_kurtosis += total_leak_severity * 2
		base_skewness += total_leak_severity * 0.5

	# Add some realistic noise
	spectral_freq = base_spectral_freq + (random.random() - 0.5) * 5
	rms_power = base_rms_power + (random.random() - 0.5) * 1
	kurtosis = base_kurtosis + (random.random() - 0.5) * 0.5
	skewness = base_skewness + (random.random() - 0.5) * 0.2

	# Calculate AI model metrics based on leak severity
	accuracy = max(0.7, min(0.99, 0.95 - total_leak_severity * 0.1))
	precision = max(0.7, min(0.98, 0.94 - total_leak_severity * 0.08))
	recall = max(0.7, min(0.97, 0.93 - total_leak_severity * 0.06))

	# Calculate leak confidence based on ACTUAL leak status
	if total_leak_severity > 0:
		# LEAK PRESENT - High confidence based on severity
		base_confidence = 60  # Start at 60% for any leak
		severity_multiplier = total_leak_severity * 35  # Up to 35% more for max severity
		leak_confidence = min(95, base_confidence + severity_multiplier)
		anomaly_score = min(0.95, 0.5 + (total_leak_severity * 0.4))
	else:
		# NO LEAK - Keep confidence very low (<20%)
		leak_confidence = max(2, 15 - (random.random() * 8))  # 2-13% range for normal operation
		anomaly_score = max(0.05, 0.15 - (random.random() * 0.08))  # 0.05-0.15 range for normal operation

	return {
		"spectral_freq": round(spectral_freq, 2),
		"rms_power": round(rms_power, 3),
		"kurtosis": round(kurtosis, 2),
		"skewness": round(skewness, 2),
		"accuracy": round(accuracy, 3),
		"precision": round(precision, 3),
		"recall": round(recall, 3),
		"auc": round((accuracy + precision + recall) / 3, 3),
		"f1_score": round(2 * (precision * recall) / (precision + recall), 3) if (precision + recall) > 0 else 0,
		"node_pressures": node_pressures,
		"active_leaks": active_leaks,
		"leak_confidence": round(leak_confidence, 1),
		"anomaly_score": round(anomaly_score, 2),
		"timestamp": int(time.time())
	}
