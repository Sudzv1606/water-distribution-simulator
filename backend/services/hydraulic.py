from typing import Optional, Dict, List, Tuple
import math

class HydraulicModel:
	def __init__(self, inp_path: str) -> None:
		self.inp_path: str = inp_path
		self._loaded: bool = False
		self._baseline_pressure: Dict[str, float] = {}
		self._baseline_flow: Dict[str, float] = {}
		self._nodes: List[str] = []
		self._links: List[Tuple[str, str, str]] = []  # (id, source, target)
		self._active_leaks: Dict[str, float] = {}  # pipe_id -> severity
		self._modified_pressures: Dict[str, float] = {}  # node_id -> modified_pressure
		self._connectivity_graph: Dict[str, List[str]] = {}  # node_id -> [connected_nodes]

	def load(self) -> None:
		# Try WNTR first for baselines
		try:
			import wntr  # type: ignore
			wn = wntr.network.WaterNetworkModel(self.inp_path)
			sim = wntr.sim.EpanetSimulator(wn)
			results = sim.run_sim()
			if len(results.time) > 0:
				last_idx = -1
				pressures = results.node["pressure"].iloc[last_idx].to_dict()
				flows = results.link["flowrate"].iloc[last_idx].to_dict()
				self._baseline_pressure = {str(k): float(v) for k, v in pressures.items()}
				self._baseline_flow = {str(k): float(v) for k, v in flows.items()}
		except Exception:
			# Ignore failures; we'll still parse connectivity and use defaults
			self._baseline_pressure = {}
			self._baseline_flow = {}
		# Always parse connectivity from INP
		self._parse_inp_connectivity()
		# Seed baselines for any nodes missing values
		for nid in self._nodes:
			if nid not in self._baseline_pressure:
				self._baseline_pressure[nid] = 52.0
		self._loaded = True

	def _parse_inp_connectivity(self) -> None:
		nodes: List[str] = []
		links: List[Tuple[str, str, str]] = []
		section: Optional[str] = None
		try:
			with open(self.inp_path, "r", encoding="utf-8") as f:
				for raw in f:
					line = raw.strip()
					if not line or line.startswith(";"):
						continue
					if line.startswith("[") and line.endswith("]"):
						section = line.strip("[]").upper()
						continue
					if section in ("JUNCTIONS", "RESERVOIRS", "TANKS"):
						parts = line.split()
						if parts:
							nodes.append(parts[0])
					elif section in ("PIPES", "PUMPS", "VALVES"):
						parts = line.split()
						if len(parts) >= 3:
							lid = parts[0]
							src = parts[1]
							tgt = parts[2]
							links.append((lid, src, tgt))
		except Exception:
			pass
		# Deduplicate
		self._nodes = list(dict.fromkeys(nodes))
		self._links = links

	def is_ready(self) -> bool:
		return self._loaded

	def get_baseline_pressure(self, node_id: str, default: float = 50.0) -> float:
		return self._baseline_pressure.get(node_id, default)

	def get_baseline_flow(self, link_id: str, default: float = 60.0) -> float:
		return self._baseline_flow.get(link_id, default)

	def get_connectivity(self) -> Tuple[List[str], List[Tuple[str, str, str]]]:
		return self._nodes, self._links

	def apply_leak(self, pipe_id: str, severity: float) -> None:
		"""Apply leak effect to hydraulic model with realistic pressure propagation"""
		print(f"🔧 HYDRAULIC: Applying leak to pipe {pipe_id} with severity {severity}")

		# Store the leak
		self._active_leaks[pipe_id] = severity

		# Build connectivity graph if not already built
		if not self._connectivity_graph:
			self._build_connectivity_graph()

		# Find the pipe and its endpoints
		pipe_endpoints = None
		for link_id, source, target in self._links:
			if link_id == pipe_id:
				pipe_endpoints = (source, target)
				break

		if not pipe_endpoints:
			print(f"❌ HYDRAULIC: Pipe {pipe_id} not found in network")
			return

		print(f"✅ HYDRAULIC: Found pipe endpoints: {pipe_endpoints}")

		# Calculate pressure drops using BFS propagation
		self._calculate_leak_pressure_drops(pipe_endpoints, severity)

		# Calculate flow changes based on pressure drops
		self._calculate_flow_changes()

		print(f"✅ HYDRAULIC: Leak applied successfully. Modified pressures: {self._modified_pressures}")

	def _build_connectivity_graph(self) -> None:
		"""Build undirected graph for connectivity analysis"""
		self._connectivity_graph = {node: [] for node in self._nodes}

		for link_id, source, target in self._links:
			if source in self._connectivity_graph and target in self._connectivity_graph:
				self._connectivity_graph[source].append(target)
				self._connectivity_graph[target].append(source)

		print(f"✅ HYDRAULIC: Built connectivity graph with {len(self._connectivity_graph)} nodes")

	def _calculate_leak_pressure_drops(self, pipe_endpoints: Tuple[str, str], severity: float) -> None:
		"""Calculate pressure drops using BFS propagation from leak location"""
		from collections import deque

		source_node, target_node = pipe_endpoints

		# Reset modified pressures to baseline
		self._modified_pressures = self._baseline_pressure.copy()

		# BFS to propagate pressure drops
		visited = set()
		queue = deque([(source_node, 0), (target_node, 0)])  # (node, distance_from_leak)

		while queue:
			node, distance = queue.popleft()

			if node in visited:
				continue
			visited.add(node)

			# Calculate pressure drop based on distance and severity
			# Closer nodes experience greater pressure drops
			if distance == 0:
				# Direct leak location - maximum pressure drop
				pressure_drop = severity * 25.0  # Up to 25 psi drop
			else:
				# Propagated pressure drop decreases with distance
				pressure_drop = severity * max(5.0, 20.0 / (distance + 1))

			# Apply pressure drop
			old_pressure = self._modified_pressures.get(node, 52.0)
			new_pressure = max(10.0, old_pressure - pressure_drop)  # Minimum 10 psi
			self._modified_pressures[node] = new_pressure

			print(f"  📉 HYDRAULIC: Node {node}: {old_pressure:.1f} → {new_pressure:.1f} psi (drop: {pressure_drop:.1f})")

			# Continue propagation to connected nodes
			for neighbor in self._connectivity_graph.get(node, []):
				if neighbor not in visited:
					queue.append((neighbor, distance + 1))

	def _calculate_flow_changes(self) -> None:
		"""Calculate flow rate changes based on pressure drops"""
		# Simple flow calculation: flow proportional to pressure difference
		# In a real system, this would use more sophisticated hydraulic equations

		for link_id, source, target in self._links:
			source_pressure = self._modified_pressures.get(source, 52.0)
			target_pressure = self._modified_pressures.get(target, 52.0)

			# Calculate pressure difference
			pressure_diff = abs(source_pressure - target_pressure)

			# Base flow calculation (simplified Darcy-Weisbach)
			baseline_flow = self._baseline_flow.get(link_id, 60.0)

			# Flow reduction due to pressure drops
			# Lower pressures = reduced flow capacity
			avg_pressure = (source_pressure + target_pressure) / 2
			pressure_factor = avg_pressure / 52.0  # Normalize to baseline

			# Apply realistic flow reduction
			new_flow = baseline_flow * max(0.3, pressure_factor * (1.0 - self._get_pipe_leak_factor(link_id)))

			# Store modified flow (update baseline_flow for simulator to use)
			self._baseline_flow[link_id] = new_flow

			print(f"  🌊 HYDRAULIC: Pipe {link_id}: flow {baseline_flow:.1f} → {new_flow:.1f} L/s")

	def _get_pipe_leak_factor(self, pipe_id: str) -> float:
		"""Get additional flow reduction factor if pipe has a leak"""
		if pipe_id in self._active_leaks:
			severity = self._active_leaks[pipe_id]
			return severity * 0.4  # Up to 40% additional flow loss
		return 0.0

	def apply_demand_spike(self, multiplier: float, duration_s: int) -> None:
		"""Apply demand spike effect to hydraulic model"""
		print(f"⚡ HYDRAULIC: Applying demand spike: {multiplier}x for {duration_s}s")

		# Apply pressure reduction across all nodes
		self._modified_pressures = {}
		for node_id, baseline_pressure in self._baseline_pressure.items():
			# Reduce pressure based on demand multiplier
			reduction_factor = max(0.7, 1.0 - 0.05 * (multiplier - 1.0))
			new_pressure = baseline_pressure * reduction_factor
			self._modified_pressures[node_id] = new_pressure

		print(f"✅ HYDRAULIC: Demand spike applied. Pressures reduced by {((1.0 - reduction_factor) * 100):.1f}%")

	def clear_leaks(self) -> None:
		"""Clear all active leaks and reset to baseline pressures"""
		print("🧹 HYDRAULIC: Clearing all leaks")

		self._active_leaks.clear()
		self._modified_pressures = self._baseline_pressure.copy()

		# Reset flows to baseline
		# Note: In a real implementation, you might want to store original flows separately
		print("✅ HYDRAULIC: All leaks cleared, pressures reset to baseline")

	def get_modified_pressures(self) -> Dict[str, float]:
		"""Get current modified pressures (including leak effects)"""
		if self._modified_pressures:
			return self._modified_pressures.copy()
		return self._baseline_pressure.copy()

	def get_active_leaks(self) -> Dict[str, float]:
		"""Get currently active leaks"""
		return self._active_leaks.copy()
