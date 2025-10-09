#!/usr/bin/env python3
"""
🚀 Smart Water Digital Twin Server Launcher

This script launches the complete Smart Water Digital Twin application
with both backend API and frontend serving capabilities.

Usage:
    python run_server.py

The server will be available at:
    🌐 Frontend & API: http://localhost:8000
    🔗 WebSocket: ws://localhost:8000/ws

Features:
    ✅ Single port for everything (frontend + backend)
    ✅ Auto-reload during development
    ✅ Proper static file serving
    ✅ WebSocket real-time updates
    ✅ EPANET hydraulic simulation
    ✅ Interactive network visualization
"""

import uvicorn
import os
import sys

def main():
    """Launch the Smart Water Digital Twin server"""

    # Ensure we're in the correct directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    print("🚀 Starting Smart Water Digital Twin Prototype...")
    print("📊 Features: Real-time monitoring, hydraulic simulation, EPANET modeling")
    print("🌐 Server will be available at: http://localhost:8000")
    print("🔗 WebSocket: ws://localhost:8000/ws")
    print("=" * 60)

    # Launch server with auto-reload for development
    try:
        uvicorn.run(
            "backend.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            reload_dirs=["backend", "frontend"],
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
