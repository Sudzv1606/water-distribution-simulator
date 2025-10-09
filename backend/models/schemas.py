from pydantic import BaseModel
from typing import List, Optional

class SensorReading(BaseModel):
	id: str
	type: str
	value: float

class Anomaly(BaseModel):
	score: float
	location: Optional[str] = None

class TickMessage(BaseModel):
	timestamp: int
	sensors: List[SensorReading]
	anomaly: Anomaly

