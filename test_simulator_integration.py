#!/usr/bin/env python3
"""
Test script to verify simulator integration with hydraulic model
"""
import sys
import os
import time

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.services.simulator import DataSimulator
from backend.core import registry
from backend.services.hydraulic import HydraulicModel

def test_simulator_leak_integration():
    """Test that simulator properly applies leaks to hydraulic model"""
    print("TESTING SIMULATOR LEAK INTEGRATION")
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

    # Test leak trigger
    print("\nTriggering leak through simulator...")
    simulator.trigger_leak("P1", 0.5)
    
    # Check if leak was applied to hydraulic model
    active_leaks = hydraulic_model.get_active_leaks()
    print(f"Active leaks in hydraulic model: {active_leaks}")
    
    # Get modified pressures after leak
    after_leak_pressures = hydraulic_model.get_modified_pressures()
    print("Pressures after leak:")
    for node in ["LAKE", "J1", "J2"]:
        baseline = baseline_pressures.get(node, 0)
        after = after_leak_pressures.get(node, 0)
        change = after - baseline
        print(f"  {node}: {after:.1f} psi (change: {change:+.1f})")

    # Test leak clearing
    print("\nClearing leak through simulator...")
    simulator.clear_leaks()
    
    # Check if leak was cleared from hydraulic model
    active_leaks_after_clear = hydraulic_model.get_active_leaks()
    print(f"Active leaks after clear: {active_leaks_after_clear}")
    
    # Get pressures after clearing
    after_clear_pressures = hydraulic_model.get_modified_pressures()
    print("Pressures after clear:")
    for node in ["LAKE", "J1", "J2"]:
        baseline = baseline_pressures.get(node, 0)
        after = after_clear_pressures.get(node, 0)
        change = after - baseline
        print(f"  {node}: {after:.1f} psi (change: {change:+.1f})")

    # Verify results
    print("\nVERIFICATION:")
    pressure_drops_occurred = any(
        after_leak_pressures.get(node, 0) < baseline_pressures.get(node, 0) 
        for node in ["LAKE", "J1", "J2"]
    )
    pressures_returned = all(
        abs(after_clear_pressures.get(node, 0) - baseline_pressures.get(node, 0)) < 0.1
        for node in ["LAKE", "J1", "J2"]
    )
    no_active_leaks = len(active_leaks_after_clear) == 0

    print(f"Pressure drops occurred: {pressure_drops_occurred}")
    print(f"Pressures returned to baseline: {pressures_returned}")
    print(f"No active leaks after clear: {no_active_leaks}")

    if pressure_drops_occurred and pressures_returned and no_active_leaks:
        print("\nSUCCESS: Simulator integration working correctly!")
        return True
    else:
        print("\nISSUE: Simulator integration not working properly")
        return False

if __name__ == "__main__":
    try:
        success = test_simulator_leak_integration()
        exit(0 if success else 1)
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()
        exit(1)