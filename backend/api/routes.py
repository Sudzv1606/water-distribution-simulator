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
