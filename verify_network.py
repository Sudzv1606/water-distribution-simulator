#!/usr/bin/env python3
"""
Script to verify the network.inp file structure and parameters
"""
import re
from typing import Dict, List, Tuple

def parse_inp_file(filepath: str) -> Dict:
    """Parse EPANET INP file and extract key information"""
    result = {
        "junctions": {},
        "reservoirs": {},
        "tanks": {},
        "pipes": []
    }

    current_section = None

    with open(filepath, 'r') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()

            # Skip empty lines and comments
            if not line or line.startswith(';'):
                continue

            # Check for section headers
            if line.startswith('[') and line.endswith(']'):
                current_section = line[1:-1].upper()
                continue

            # Parse different sections
            if current_section == "JUNCTIONS":
                parts = line.split()
                if len(parts) >= 3:
                    node_id = parts[0]
                    elevation = float(parts[1])
                    demand = float(parts[2])
                    result["junctions"][node_id] = {
                        "elevation": elevation,
                        "demand": demand
                    }

            elif current_section == "RESERVOIRS":
                parts = line.split()
                if len(parts) >= 2:
                    res_id = parts[0]
                    head = float(parts[1])
                    result["reservoirs"][res_id] = {
                        "head": head
                    }

            elif current_section == "TANKS":
                parts = line.split()
                if len(parts) >= 3:
                    tank_id = parts[0]
                    elevation = float(parts[1])
                    result["tanks"][tank_id] = {
                        "elevation": elevation
                    }

            elif current_section == "PIPES":
                parts = line.split()
                if len(parts) >= 3:
                    pipe_id = parts[0]
                    node1 = parts[1]
                    node2 = parts[2]
                    result["pipes"].append({
                        "id": pipe_id,
                        "node1": node1,
                        "node2": node2
                    })

    return result

def analyze_lake_branch(data: Dict) -> Dict:
    """Analyze the Lake branch specifically"""
    lake_branch = {
        "nodes": {},
        "links": [],
        "total_demand": 0.0
    }

    # Lake branch nodes and links
    lake_nodes = ["LAKE", "J1", "J2", "TANK_1", "J3", "J4"]
    lake_links = ["P1", "P2", "P3", "P4", "P5"]

    # Get node information
    for node_id in lake_nodes:
        if node_id in data["reservoirs"]:
            lake_branch["nodes"][node_id] = {
                "type": "reservoir",
                "head": data["reservoirs"][node_id]["head"]
            }
        elif node_id in data["tanks"]:
            lake_branch["nodes"][node_id] = {
                "type": "tank",
                "elevation": data["tanks"][node_id]["elevation"]
            }
        elif node_id in data["junctions"]:
            lake_branch["nodes"][node_id] = {
                "type": "junction",
                "elevation": data["junctions"][node_id]["elevation"],
                "demand": data["junctions"][node_id]["demand"]
            }
            if node_id.startswith("J"):  # Only count junction demands
                lake_branch["total_demand"] += data["junctions"][node_id]["demand"]

    # Get link information
    for link in data["pipes"]:
        if link["id"] in lake_links:
            lake_branch["links"].append(link)

    return lake_branch

def main():
    """Main verification function"""
    print("🔍 Network Verification Tool")
    print("=" * 50)

    # Parse the INP file
    data = parse_inp_file("backend/assets/network.inp")

    print(f"📊 Network Statistics:")
    print(f"  • Junctions: {len(data['junctions'])}")
    print(f"  • Reservoirs: {len(data['reservoirs'])}")
    print(f"  • Tanks: {len(data['tanks'])}")
    print(f"  • Pipes: {len(data['pipes'])}")

    # Analyze Lake branch
    lake_branch = analyze_lake_branch(data)

    print(f"\n🏔️  Lake Branch Analysis:")
    print(f"  • Total Demand: {lake_branch['total_demand']:.1f} L/s")
    print(f"  • Expected: 43.4 L/s")

    print(f"\nNodes in Lake Branch:")
    for node_id, node_info in lake_branch["nodes"].items():
        if node_info["type"] == "reservoir":
            print(f"  • {node_id}: {node_info['type']} ({node_info['head']:.1f}m head)")
        elif node_info["type"] == "tank":
            print(f"  • {node_id}: {node_info['type']} ({node_info['elevation']:.1f}m elevation)")
        elif node_info["type"] == "junction":
            print(f"  • {node_id}: {node_info['type']} ({node_info['elevation']:.1f}m, {node_info['demand']:.1f} L/s demand)")

    print(f"\nLinks in Lake Branch:")
    for link in lake_branch["links"]:
        print(f"  • {link['id']}: {link['node1']} → {link['node2']}")

    # Verify against requirements
    print(f"\n✅ Verification against Requirements:")
    print(f"  • Expected total demand: 43.4 L/s")
    print(f"  • Actual total demand: {lake_branch['total_demand']:.1f} L/s")

    expected_demands = {
        "J1": 5.0,
        "J2": 8.0,
        "J3": 10.0,
        "J4": 20.4
    }

    print(f"  • Expected demands: {expected_demands}")
    print(f"  • Actual demands:")
    for node_id in expected_demands:
        if node_id in lake_branch["nodes"]:
            actual = lake_branch["nodes"][node_id].get("demand", 0)
            expected = expected_demands[node_id]
            status = "✅" if abs(actual - expected) < 0.1 else "❌"
            print(f"    {node_id}: {actual:.1f} L/s {status}")

    # Check if J2 exists
    j2_exists = "J2" in lake_branch["nodes"]
    print(f"  • J2 node exists: {'✅' if j2_exists else '❌'}")

    # Check flow path
    expected_path = ["LAKE", "J1", "J2", "TANK_1", "J3", "J4"]
    print(f"  • Expected flow path: {' → '.join(expected_path)}")

    actual_path = []
    for link in lake_branch["links"]:
        if not actual_path:
            if link["node1"] == "LAKE":
                actual_path.extend([link["node1"], link["node2"]])
        else:
            # Find the next link that continues from the last node
            for link2 in lake_branch["links"]:
                if link2["node1"] == actual_path[-1]:
                    actual_path.append(link2["node2"])
                    break

    print(f"  • Actual flow path: {' → '.join(actual_path)}")

    path_correct = actual_path == expected_path
    print(f"  • Flow path correct: {'✅' if path_correct else '❌'}")

if __name__ == "__main__":
    main()
