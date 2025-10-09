# Smart Water Digital Twin Prototype

Advanced prototype demonstrating multi-sensor IoT data simulation, hydraulic modeling (WNTR/EPANET), AI-based leak detection, and a sophisticated dual-mode visualization dashboard with modern UI.

## Quick Start

Prereqs
- Python 3.10+
- pip
- Modern web browser (Chrome, Firefox, Safari, Edge)

Setup (Windows PowerShell)
```powershell
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Run backend
```powershell
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Open the dashboard
- Navigate to `http://localhost:8000` in your browser
- The dashboard features two modes: **Monitoring** and **Simulation**

The dashboard connects to the backend WebSocket at `ws://localhost:8000/ws` for real-time data streaming.

## Project Structure

```
backend/
  main.py
  api/
    __init__.py
    routes.py
  core/
    __init__.py
    config.py
    registry.py
  services/
    __init__.py
    simulator.py
    hydraulic.py
    anomaly.py
    storage.py
  models/
    __init__.py
    schemas.py
  assets/
    network.inp
frontend/
  index.html
  js/
    app.js
  css/
    styles.css
requirements.txt
README.md
```

## Features

### 🎯 Advanced Multi-Sensor System
- **7 Real-time Sensors** with sophisticated data generation:
  - **Spectral Frequency (S1)**: Frequency-domain analysis (FFT-derived features)
  - **Kurtosis & Skewness**: Statistical waveform analysis
  - **RMS Power**: Acoustic energy measurement
  - **ML Performance Metrics**: Accuracy, Precision, Recall, AUC scores
- **Intelligent Data Simulation**: Physics-based models with realistic noise patterns

### 🏭 Hydraulic Modeling
- **WNTR/EPANET Integration**: Professional hydraulic network simulation
- **Dynamic Scenario Response**: Leak propagation and demand spike effects
- **Real-time Network State**: Live pressure and flow calculations

### 🤖 AI-Powered Analytics
- **Advanced Anomaly Detection**: Multi-sensor correlation analysis
- **Real-time ML Metrics**: Live model performance monitoring
- **Adaptive Thresholds**: Dynamic alert sensitivity

### 🌐 Dual-Mode Dashboard
- **Monitoring Mode**: Clean, focused sensor data visualization
- **Simulation Mode**: Interactive pipeline testing environment
- **Seamless Toggle**: One-click switching between modes
- **Modern UI**: Professional design with animations and micro-interactions

### 🔗 Real-time Communication
- **WebSocket Streaming**: Live data updates (2-second intervals)
- **REST API**: Scenario injection and data retrieval
- **SQLite Persistence**: Historical data storage and analysis

## API Reference

### 🌐 WebSocket Streaming
**Endpoint:** `ws://localhost:8000/ws`

**Real-time Payload Structure:**
```json
{
  "time": 1699123456789,
  "spectral_freq": 687.23,
  "kurtosis": 2.847,
  "skewness": 0.123,
  "rms_power": 1.014,
  "accuracy": 0.892,
  "precision": 0.856,
  "recall": 0.883,
  "auc": 0.914
}
```

### 🔗 REST Endpoints

#### **Scenario Injection**
```bash
# Inject leak at specific pipe
POST /scenarios/leak
{
  "pipe_id": "P1",
  "severity": 0.5
}

# Apply demand spike
POST /scenarios/demand-spike
{
  "multiplier": 1.2,
  "duration_s": 600
}
```

#### **Data Retrieval**
```bash
# Get recent sensor readings
GET /readings/recent?limit=100

# Get anomaly history
GET /anomalies/recent?limit=100

# Get network topology
GET /network
```

#### **Response Formats**
**Sensor Readings:**
```json
[
  {
    "ts": 1699123456789,
    "sensor_id": "S1",
    "type": "spectral_frequency",
    "value": 687.23
  }
]
```

**Network Topology:**
```json
{
  "nodes": ["N1", "N2", "N3"],
  "links": [["N1", "N2", "P1"], ["N2", "N3", "P2"]]
}
```

## Dashboard

### 🌐 Dual-Mode Interface

#### **Monitoring Mode (Default)**
- **Clean Sensor Overview**: Spectral Frequency and RMS Power KPIs
- **Advanced Charts**: Spectral Frequency, Kurtosis/Skewness (dual-axis), RMS Power
- **ML Performance Panel**: Real-time Accuracy, Precision, Recall, AUC metrics
- **Network Visualization**: Interactive hydraulic network with live pressure data
- **Anomaly Detection**: Real-time alerts with location tracking
- **Historical Data**: Recent anomalies table with timestamps

#### **Simulation Mode**
- **Interactive Pipeline Network**: Click-to-select pipes for scenario injection
- **Advanced Control Panels**:
  - 🚰 **Leak Injection**: Visual pipe selection with severity sliders
  - ⚡ **Demand Management**: Multiplier controls with duration settings
  - 🎛️ **Scenario Controls**: Quick injection tools and threshold management
  - 🎯 **Sensor Configuration**: Noise adjustment and simulation reset
- **Live Effects Display**: Real-time impact visualization with trend indicators
- **Visual Feedback**: Color-coded pipes, pressure indicators, leak animations

### 🎮 Key Features
- **One-Click Toggle**: Seamless switching between Monitoring and Simulation modes
- **Real-time Updates**: 2-second data refresh across all components
- **Interactive Elements**: Clickable pipes, draggable sliders, responsive buttons
- **Modern UI**: Gradient designs, smooth animations, professional styling
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Replace the Network
- Swap `backend/assets/network.inp` with your EPANET file.
- Restart the backend to reload the hydraulic model.

## Troubleshooting

### 🔧 Common Issues

**Dashboard Not Loading:**
- Ensure backend is running: `python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload`
- Check browser console (F12) for WebSocket connection errors
- Verify no firewall blocking `ws://localhost:8000/ws`

**Charts Not Updating:**
- Confirm WebSocket connection is established (green status indicator)
- Check that all 7 sensors are generating data properly
- Verify no JavaScript errors in browser console

**Simulation Mode Issues:**
- Click "Switch to Simulation Mode" button in header
- Use browser console to check for element loading issues
- Ensure all simulation controls are visible after mode switch

**Backend Errors:**
- WNTR import issues: `pip install -r requirements.txt`
- SQLite problems: Delete `data.db` to reset database
- Network file issues: Verify `backend/assets/network.inp` exists

### 🐛 Debug Tools

**Browser Console:**
- Check for element loading: "Element check" messages
- Monitor WebSocket connection status
- View real-time sensor data in Network tab

**Backend Logs:**
- Uvicorn will show startup errors and WebSocket connections
- Check for hydraulic model loading issues
- Monitor scenario injection responses

## Architecture Notes

### 🎯 Sensor Data Generation
The system generates 7 distinct sensor signals using sophisticated algorithms:
- **Spectral Frequency**: Sine wave + noise for frequency-domain simulation
- **Kurtosis/Skewness**: Statistical analysis of Gaussian waveforms
- **RMS Power**: Energy calculation from signal waveforms
- **ML Metrics**: Realistic performance variations around baseline values

### 🌐 Dual-Mode Design
- **Monitoring Mode**: Optimized for clean data observation
- **Simulation Mode**: Full control environment for scenario testing
- **Shared Backend**: Both modes use identical data sources
- **State Preservation**: Mode switching maintains all settings

### 🔄 Real-time Pipeline
```
Sensors → Simulator → WebSocket → Frontend → Charts & Visualizations
   ↓         ↓          ↓          ↓           ↓
Physics  Hydraulic   Anomaly    Storage    Interactive
Models   Models     Detection   Database   Controls
```

## Production Considerations

### 🚀 Scaling Up
- **Real Sensors**: Replace simulator with actual IoT sensor ingestion
- **Database**: Consider PostgreSQL for production data storage
- **Authentication**: Add user authentication and API security
- **Monitoring**: Implement proper logging and health checks

### 🤖 ML Integration
- **Live Models**: Connect real ML pipelines for actual predictions
- **Model Updates**: Implement online learning capabilities
- **Performance Tracking**: Enhanced metrics and model versioning

### 🏭 Enterprise Features
- **Multi-tenancy**: Support multiple network configurations
- **Historical Analysis**: Advanced data analytics and reporting
- **Alert Management**: Email/SMS notifications for critical events
- **API Rate Limiting**: Prevent abuse in production environments

---

**🎉 Ready to Explore!** Your Smart Water Digital Twin now features a modern, professional interface with advanced simulation capabilities. The dual-mode design provides both clean monitoring and comprehensive testing environments in a single, elegant solution.
