#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from fastapi import FastAPI
    print("✓ FastAPI imported successfully")

    from backend.services.simulator import DataSimulator
    print("✓ DataSimulator imported successfully")

    from backend.services.storage import Storage
    print("✓ Storage imported successfully")

    from backend.services.hydraulic import HydraulicModel
    print("✓ HydraulicModel imported successfully")

    print("\n🎉 All imports successful! The server should work.")
    print("Try running: python -m backend.main")

except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Other error: {e}")
