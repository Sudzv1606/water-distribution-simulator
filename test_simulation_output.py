#!/usr/bin/env python3
"""
Test script to verify that modified pressures appear in simulation output
"""
import sys
import os
import asyncio

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.services.simulator import DataSimulator
from backend.core import registry
from backend.services.hydraulic import HydraulicModel

async def test_simulation_output():
    """Test that simulation output includes modified pressures"""
    print("TESTING SIMULATION OUTPUT WITH LEAKS")
    print("=" * 50)

    # Initialize hydraulic model and register it
    inp_path = "backend/assets/network.inp"
    hydraulic_model = HydraulicModel(inp_path)
    hydraulic_model.load()
    registry.set_hydraulic(hydraulic_model)

    print("Hydraulic model loaded and registered")

    # Get baseline pressures
    baseline_pressures = hydraulic_model.get_modified_pressures()
    print("Baseline pressures:")
    for node in ["LAKE", "J1", "J2"]:
        print(f"  {node}: {baseline_pressures.get(node, 0):.1f} psi")

    # Initialize simulator
    simulator = DataSimulator()
    print("Simulator initialized")

    # Test 1: Generate reading without leak
    print("\n--- TEST 1: Reading without leak ---")
    reading_no_leak = simulator._generate_reading()
    node_pressures_no_leak = reading_no_leak.get("node_pressures", {})
    print("Node pressures in simulation output (no leak):")
    for node in ["LAKE", "J1", "J2"]:
        pressure = node_pressures_no_leak.get(node, 0)
        print(f"  {node}: {pressure:.1f} psi")

    # Test 2: Apply leak and generate reading
    print("\n--- TEST 2: Reading with leak ---")
    simulator.trigger_leak("P1", 0.5)
    reading_with_leak = simulator._generate_reading()
    node_pressures_with_leak = reading_with_leak.get("node_pressures", {})
    print("Node pressures in simulation output (with leak):")
    for node in ["LAKE", "J1", "J2"]:
        baseline = baseline_pressures.get(node, 0)
        with_leak = node_pressures_with_leak.get(node, 0)
        change = with_leak - baseline
        print(f"  {node}: {with_leak:.1f} psi (change: {change:+.1f})")

    # Test 3: Clear leak and generate reading
    print("\n--- TEST 3: Reading after clearing leak ---")
    simulator.clear_leaks()
    reading_after_clear = simulator._generate_reading()
    node_pressures_after_clear = reading_after_clear.get("node_pressures", {})
    print("Node pressures in simulation output (after clear):")
    for node in ["LAKE", "J1", "J2"]:
        baseline = baseline_pressures.get(node, 0)
        after_clear = node_pressures_after_clear.get(node, 0)
        change = after_clear - baseline
        print(f"  {node}: {after_clear:.1f} psi (change: {change:+.1f})")

    # Verification
    print("\n--- VERIFICATION ---")
    
    # Check if pressure drops are visible in simulation output
    pressure_drops_in_output = any(
        node_pressures_with_leak.get(node, 0) < baseline_pressures.get(node, 0) - 1.0  # Allow for some random variation
        for node in ["LAKE", "J1", "J2"]
    )
    
    # Check if pressures return after clear
    pressures_return_in_output = all(
        abs(node_pressures_after_clear.get(node, 0) - baseline_pressures.get(node, 0)) < 5.0  # Allow for random variation
        for node in ["LAKE", "J1", "J2"]
    )
    
    print(f"Pressure drops visible in simulation output: {pressure_drops_in_output}")
    print(f"Pressures return in simulation output: {pressures_return_in_output}")

    if pressure_drops_in_output and pressures_return_in_output:
        print("\nSUCCESS: Modified pressures are correctly used in simulation output!")
        return True
    else:
        print("\nISSUE: Modified pressures not properly reflected in simulation output")
        
        # Debug info
        print("\nDEBUG INFO:")
        print(f"Baseline: {baseline_pressures}")
        print(f"With leak: {node_pressures_with_leak}")
        print(f"After clear: {node_pressures_after_clear}")
        print(f"Hydraulic model active leaks: {hydraulic_model.get_active_leaks()}")
        
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(test_simulation_output())
        exit(0 if success else 1)
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()
        exit(1)