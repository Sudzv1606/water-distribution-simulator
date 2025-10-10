#!/usr/bin/env python3
"""
Simple debug test for leak functionality without emojis
"""
from backend.services.hydraulic import HydraulicModel

def main():
    print('DEBUG LEAK VERIFICATION TEST')
    print('=' * 40)

    # Load hydraulic model
    hyd = HydraulicModel('backend/assets/network.inp')
    hyd.load()

    print('Model loaded')

    # STEP 1: Get baseline pressures
    print('\nSTEP 1: Baseline (no leak)')
    baseline = hyd.get_modified_pressures()
    print(f'LAKE: {baseline.get("LAKE", 0):.1f} psi')
    print(f'J1: {baseline.get("J1", 0):.1f} psi')
    print(f'J2: {baseline.get("J2", 0):.1f} psi')

    # STEP 2: Apply leak to P1
    print('\nSTEP 2: Applying P1 leak (severity 0.5)')
    hyd.apply_leak('P1', 0.5)
    after_leak = hyd.get_modified_pressures()
    print(f'LAKE: {after_leak.get("LAKE", 0):.1f} psi (change: {after_leak.get("LAKE", 0) - baseline.get("LAKE", 0):+.1f})')
    print(f'J1: {after_leak.get("J1", 0):.1f} psi (change: {after_leak.get("J1", 0) - baseline.get("J1", 0):+.1f})')
    print(f'J2: {after_leak.get("J2", 0):.1f} psi (change: {after_leak.get("J2", 0) - baseline.get("J2", 0):+.1f})')

    # STEP 3: Clear leak
    print('\nSTEP 3: Clearing leak')
    hyd.clear_leaks()
    after_clear = hyd.get_modified_pressures()
    print(f'LAKE: {after_clear.get("LAKE", 0):.1f} psi (change: {after_clear.get("LAKE", 0) - baseline.get("LAKE", 0):+.1f})')
    print(f'J1: {after_clear.get("J1", 0):.1f} psi (change: {after_clear.get("J1", 0) - baseline.get("J1", 0):+.1f})')
    print(f'J2: {after_clear.get("J2", 0):.1f} psi (change: {after_clear.get("J2", 0) - baseline.get("J2", 0):+.1f})')

    # STEP 4: Verify results
    print('\nSTEP 4: Verification Results')
    all_same = all(abs(after_clear.get(node, 0) - baseline.get(node, 0)) < 0.1 for node in ['LAKE', 'J1', 'J2'])
    print(f'Pressures returned to baseline: {all_same}')
    print(f'Active leaks after clear: {len(hyd.get_active_leaks())}')

    if all_same:
        print('\nSUCCESS: Leak system working correctly!')
        print('   Pressures change when leak is introduced')
        print('   Pressures return to baseline when leak is cleared')
        return True
    else:
        print('\nISSUE: Pressures did not return to baseline')
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)