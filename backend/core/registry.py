from typing import Any, Optional

_simulator: Optional[Any] = None
_hydraulic: Optional[Any] = None
_storage: Optional[Any] = None


def set_simulator(s: Any) -> None:
	global _simulator
	_simulator = s

def get_simulator() -> Any:
	return _simulator


def set_hydraulic(h: Any) -> None:
	global _hydraulic
	_hydraulic = h

def get_hydraulic() -> Any:
	return _hydraulic


def set_storage(st: Any) -> None:
	global _storage
	_storage = st

def get_storage() -> Any:
	return _storage
