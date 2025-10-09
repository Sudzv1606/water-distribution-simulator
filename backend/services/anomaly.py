from typing import Dict, Any, Deque
from collections import deque
import numpy as np

class AnomalyDetector:
	def __init__(self, window_size: int = 30) -> None:
		self.window_size = window_size
		self._pressure_buf: Deque[float] = deque(maxlen=window_size)
		self._acoustic_buf: Deque[float] = deque(maxlen=window_size)

	def score(self, sensors: Dict[str, float]) -> Dict[str, Any]:
		pressure = float(sensors.get("P1", 0.0))
		acoustic = float(sensors.get("A1", 0.0))
		self._pressure_buf.append(pressure)
		self._acoustic_buf.append(acoustic)

		z = 0.0
		if len(self._pressure_buf) >= 5:
			arr = np.array(self._pressure_buf, dtype=float)
			mu = arr.mean()
			sigma = arr.std(ddof=1) if arr.size > 1 else 1.0
			if sigma <= 1e-6:
				sigma = 1.0
			z = abs((pressure - mu) / sigma)

		fft_energy = 0.0
		if len(self._acoustic_buf) >= 8:
			arr = np.array(self._acoustic_buf, dtype=float)
			fft = np.fft.rfft(arr - arr.mean())
			power = np.abs(fft) ** 2
			# ignore DC
			fft_energy = float(power[1:].sum())

		# Combine into a score [0..1] via simple normalization and clamp
		z_norm = min(1.0, z / 3.0)
		ac_norm = min(1.0, fft_energy / (fft_energy + 5.0))
		score = 0.6 * z_norm + 0.4 * ac_norm
		return {"score": round(float(score), 3)}

