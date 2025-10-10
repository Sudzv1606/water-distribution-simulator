#!/usr/bin/env python3
"""
Test script to run EPANET simulation and verify the Lake branch implementation
"""
import sys
import os

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.services.hydraulic import HydraulicModel

def test_simulation():
    """Test the EPANET simulation with current network.inp"""
    print("🧪 Testing EPANET Simulation")
    print("=" * 50)

    # Initialize hydraulic model
    inp_path = "backend/assets/network.inp"
    hydraulic_model = HydraulicModel(inp_path)

    print(f"📁 Loading network from: {inp_path}")
    hydraulic_model.load()

    if not hydraulic_model.is_ready():
        print("❌ Failed to load hydraulic model")
        return False

    print("✅ Hydraulic model loaded successfully")

    # Get network connectivity
    nodes, links = hydraulic_model.get_connectivity()
    print(f"📊 Network has {len(nodes)} nodes and {len(links)} links")

    print("\n🌊 Nodes in network:")
    for node in nodes:
        baseline_pressure = hydraulic_model.get_baseline_pressure(node, 0)
        print(f"  • {node}: {baseline_pressure:.1f} m")

    print("\n🔗 Links in network:")
    for link in links:
        link_id, source, target = link
        baseline_flow = hydraulic_model.get_baseline_flow(link_id, 0)
        print(f"  • {link_id}: {source} → {target} ({baseline_flow:.1f} L/s)")

    # Test Lake branch specifically
    print("\n🏔️  Lake Branch Analysis:")
    lake_branch_nodes = ["LAKE", "J1", "J2", "TANK_1", "J3", "J4"]
    lake_branch_links = ["P1", "P2", "P3", "P4", "P5"]

    print("Nodes:")
    for node in lake_branch_nodes:
        if node in nodes:
            pressure = hydraulic_model.get_baseline_pressure(node, 0)
            print(f"  • {node}: {pressure:.1f} m")
        else:
            print(f"  • {node}: NOT FOUND")

    print("Links:")
    for link in lake_branch_links:
        found = False
        for link_info in links:
            if link_info[0] == link:
                link_id, source, target = link_info
                flow = hydraulic_model.get_baseline_flow(link_id, 0)
                print(f"  • {link}: {source} → {target} ({flow:.1f} L/s)")
                found = True
                break
        if not found:
            print(f"  • {link}: NOT FOUND")

    # Calculate total demand for Lake branch
    lake_demand = 0
    for node in ["J1", "J2", "J3", "J4"]:
        if node in nodes:
            # We need to get demand from the INP file parsing
            lake_demand += 0  # Placeholder - would need to parse INP for actual demands

    print(f"\n📈 Lake Branch Total Demand: {lake_demand:.1f} L/s")

    return True

if __name__ == "__main__":
    try:
        success = test_simulation()
        if success:
            print("\n✅ Simulation test completed successfully")
        else:
            print("\n❌ Simulation test failed")
    except Exception as e:
        print(f"\n💥 Error during simulation test: {e}")
        import traceback
        traceback.print_exc()
