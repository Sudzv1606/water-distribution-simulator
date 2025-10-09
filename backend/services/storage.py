import sqlite3
import threading
from typing import Any, Dict, List, Tuple

class Storage:
	def __init__(self, db_path: str = "data.db") -> None:
		self._db_path: str = db_path
		self._lock = threading.Lock()
		self._init_db()

	def _init_db(self) -> None:
		with self._connect() as conn:
			conn.execute(
				"""
				CREATE TABLE IF NOT EXISTS readings (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					ts INTEGER NOT NULL,
					sensor_id TEXT NOT NULL,
					type TEXT NOT NULL,
					value REAL NOT NULL
				)
				"""
			)
			conn.execute(
				"""
				CREATE TABLE IF NOT EXISTS anomalies (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					ts INTEGER NOT NULL,
					score REAL NOT NULL,
					location TEXT
				)
				"""
			)
			# Create indexes for better query performance with new sensor types
			conn.execute(
				"""
				CREATE INDEX IF NOT EXISTS idx_readings_ts_type
				ON readings(ts, type)
				"""
			)
			conn.execute(
				"""
				CREATE INDEX IF NOT EXISTS idx_readings_sensor_id
				ON readings(sensor_id)
				"""
			)

	def _connect(self) -> sqlite3.Connection:
		conn = sqlite3.connect(self._db_path, check_same_thread=False)
		return conn

	def insert_readings(self, ts_ms: int, readings: List[Dict[str, Any]]) -> None:
		with self._lock:
			with self._connect() as conn:
				conn.executemany(
					"INSERT INTO readings (ts, sensor_id, type, value) VALUES (?, ?, ?, ?)",
					[(ts_ms, r["id"], r["type"], float(r["value"])) for r in readings],
				)

	def insert_anomaly(self, ts_ms: int, score: float, location: str | None) -> None:
		with self._lock:
			with self._connect() as conn:
				conn.execute(
					"INSERT INTO anomalies (ts, score, location) VALUES (?, ?, ?)",
					(ts_ms, float(score), location),
				)

	def get_recent_readings(self, limit: int = 100) -> List[Tuple[int, str, str, float]]:
		with self._connect() as conn:
			cur = conn.execute(
				"SELECT ts, sensor_id, type, value FROM readings ORDER BY id DESC LIMIT ?",
				(limit,),
			)
			rows = cur.fetchall()
		return rows

	def get_recent_anomalies(self, limit: int = 100) -> List[Tuple[int, float, str | None]]:
		with self._connect() as conn:
			cur = conn.execute(
				"SELECT ts, score, location FROM anomalies ORDER BY id DESC LIMIT ?",
				(limit,),
			)
			rows = cur.fetchall()
		return rows

	# 🌟 NEW METHODS FOR LEAK INJECTION SYSTEM

	def insert_leak_event(self, pipe_id: str, leak_fraction: float, probability_score: float,
						 detected_by: str, detected_at: int, scenario_label: str = None,
						 notes: str = None) -> int:
		"""Insert a new leak event and return the ID"""
		with self._lock:
			with self._connect() as conn:
				cursor = conn.execute(
					"""
					INSERT INTO leak_events (pipe_id, leak_fraction, probability_score, detected_by, detected_at, scenario_label, notes)
					VALUES (?, ?, ?, ?, ?, ?, ?)
					""",
					(pipe_id, leak_fraction, probability_score, detected_by, detected_at, scenario_label, notes)
				)
				return cursor.lastrowid

	def get_leak_events(self, limit: int = 100) -> List[Dict]:
		"""Get recent leak events with full details"""
		with self._connect() as conn:
			cur = conn.execute(
				"""
				SELECT id, pipe_id, leak_fraction, probability_score, detected_by, detected_at,
					   assigned_to, status, resolved_at, notes, scenario_label, created_at
				FROM leak_events ORDER BY created_at DESC LIMIT ?
				""",
				(limit,)
			)
			rows = cur.fetchall()
			return [
				{
					"id": row[0], "pipe_id": row[1], "leak_fraction": row[2], "probability_score": row[3],
					"detected_by": row[4], "detected_at": row[5], "assigned_to": row[6], "status": row[7],
					"resolved_at": row[8], "notes": row[9], "scenario_label": row[10], "created_at": row[11]
				}
				for row in rows
			]

	def get_leak_event(self, leak_id: int) -> Dict | None:
		"""Get a specific leak event by ID"""
		with self._connect() as conn:
			cur = conn.execute(
				"""
				SELECT id, pipe_id, leak_fraction, probability_score, detected_by, detected_at,
					   assigned_to, status, resolved_at, notes, scenario_label, created_at
				FROM leak_events WHERE id = ?
				""",
				(leak_id,)
			)
			row = cur.fetchone()
			if row:
				return {
					"id": row[0], "pipe_id": row[1], "leak_fraction": row[2], "probability_score": row[3],
					"detected_by": row[4], "detected_at": row[5], "assigned_to": row[6], "status": row[7],
					"resolved_at": row[8], "notes": row[9], "scenario_label": row[10], "created_at": row[11]
				}
		return None

	def update_leak_event(self, leak_id: int, **updates) -> bool:
		"""Update leak event fields"""
		with self._lock:
			with self._connect() as conn:
				set_parts = []
				values = []
				for key, value in updates.items():
					if key in ['leak_fraction', 'probability_score', 'notes', 'assigned_to', 'status', 'resolved_at']:
						set_parts.append(f"{key} = ?")
						values.append(value)

				if set_parts:
					values.append(leak_id)
					conn.execute(
						f"UPDATE leak_events SET {', '.join(set_parts)} WHERE id = ?",
						values
					)
					return True
		return False

	def insert_contractor(self, name: str, specialty: str = None, phone: str = None, email: str = None) -> int:
		"""Insert a new contractor and return the ID"""
		with self._lock:
			with self._connect() as conn:
				cursor = conn.execute(
					"INSERT INTO contractors (name, specialty, phone, email) VALUES (?, ?, ?, ?)",
					(name, specialty, phone, email)
				)
				return cursor.lastrowid

	def get_contractors(self) -> List[Dict]:
		"""Get all active contractors"""
		with self._connect() as conn:
			cur = conn.execute(
				"SELECT id, name, specialty, phone, email, active, created_at FROM contractors WHERE active = 1"
			)
			rows = cur.fetchall()
			return [
				{
					"id": row[0], "name": row[1], "specialty": row[2], "phone": row[3],
					"email": row[4], "active": row[5], "created_at": row[6]
				}
				for row in rows
			]

	def insert_notification(self, ntype: str, title: str, message: str, severity: str = 'info',
						   related_leak_id: int = None) -> int:
		"""Insert a new notification and return the ID"""
		with self._lock:
			with self._connect() as conn:
				cursor = conn.execute(
					"INSERT INTO notifications (type, title, message, severity, related_leak_id) VALUES (?, ?, ?, ?, ?)",
					(ntype, title, message, severity, related_leak_id)
				)
				return cursor.lastrowid

	def get_notifications(self, limit: int = 50) -> List[Dict]:
		"""Get recent notifications"""
		with self._connect() as conn:
			cur = conn.execute(
				"""
				SELECT id, type, title, message, severity, related_leak_id, created_at, read
				FROM notifications ORDER BY created_at DESC LIMIT ?
				""",
				(limit,)
			)
			rows = cur.fetchall()
			return [
				{
					"id": row[0], "type": row[1], "title": row[2], "message": row[3],
					"severity": row[4], "related_leak_id": row[5], "created_at": row[6], "read": row[7]
				}
				for row in rows
			]

	def mark_notification_read(self, notification_id: int) -> bool:
		"""Mark a notification as read"""
		with self._lock:
			with self._connect() as conn:
				cursor = conn.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notification_id,))
				return cursor.rowcount > 0

	def insert_audit_log(self, action: str, entity_type: str, entity_id: str, user_id: str = None, details: str = None) -> int:
		"""Insert an audit log entry and return the ID"""
		with self._lock:
			with self._connect() as conn:
				cursor = conn.execute(
					"INSERT INTO audit_log (action, entity_type, entity_id, user_id, details) VALUES (?, ?, ?, ?, ?)",
					(action, entity_type, entity_id, user_id, details)
				)
				return cursor.lastrowid

	def get_audit_log(self, limit: int = 100) -> List[Dict]:
		"""Get recent audit log entries"""
		with self._connect() as conn:
			cur = conn.execute(
				"""
				SELECT id, action, entity_type, entity_id, user_id, details, created_at
				FROM audit_log ORDER BY created_at DESC LIMIT ?
				""",
				(limit,)
			)
			rows = cur.fetchall()
			return [
				{
					"id": row[0], "action": row[1], "entity_type": row[2], "entity_id": row[3],
					"user_id": row[4], "details": row[5], "created_at": row[6]
				}
				for row in rows
			]
