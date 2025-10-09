from pydantic import BaseModel

class Settings(BaseModel):
	websocket_path: str = "/ws"
	ws_broadcast_interval_s: float = 1.0

settings = Settings()

