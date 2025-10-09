// 🌟 Dynamic BASE_URL Configuration
const BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "https://water-sim-backend.onrender.com";

// 🌟 WebSocket Connection with Fallback to Polling
let useWebSocket = true;
let pollingInterval = null;

console.log('🔧 Using BASE_URL:', BASE_URL);

const statusEl = document.getElementById('status');
const alertEl = document.getElementById('alert');
const logEl = document.getElementById('log');
const kpiSpectral = document.getElementById('kpiSpectral');
const kpiRMS = document.getElementById('kpiRMS');
const thWarnEl = document.getElementById('thWarn');
const thLeakEl = document.getElementById('thLeak');
let paused = false;

let netCache = { nodes: [], links: [] };

function appendLog(msg){ logEl.textContent += msg + "\n"; logEl.scrollTop = logEl.scrollHeight; }

const spectralCtx = document.getElementById('spectralChart').getContext('2d');
const statsCtx = document.getElementById('statsChart').getContext('2d');
const rmsCtx = document.getElementById('rmsChart').getContext('2d');

const makeChart = (ctx, label, color) => new Chart(ctx, {
	type: 'line',
	data: { labels: [], datasets: [{ label, data: [], borderColor: color, borderWidth: 2, pointRadius: 0, tension: 0.25 }] },
	options: { responsive: true, animation: false, scales: { x: { display: false }, y: { grid: { color: '#1b2a4a' }, ticks: { color: '#8aa0c7' } } }, plugins: { legend: { labels: { color: '#8aa0c7' } } } }
});

const makeDualChart = (ctx, label1, label2, color1, color2) => new Chart(ctx, {
	type: 'line',
	data: {
		labels: [],
		datasets: [
			{ label: label1, data: [], borderColor: color1, borderWidth: 2, pointRadius: 0, tension: 0.25, yAxisID: 'y' },
			{ label: label2, data: [], borderColor: color2, borderWidth: 2, pointRadius: 0, tension: 0.25, yAxisID: 'y1' }
		]
	},
	options: {
		responsive: true,
		animation: false,
		scales: {
			x: { display: false },
			y: { grid: { color: '#1b2a4a' }, ticks: { color: '#8aa0c7' }, position: 'left' },
			y1: { grid: { color: '#1b2a4a' }, ticks: { color: '#8aa0c7' }, position: 'right' }
		},
		plugins: { legend: { labels: { color: '#8aa0c7' } } }
	}
});

const spectralChart = makeChart(spectralCtx, 'Spectral Frequency (Hz)', '#60a5fa');
const statsChart = makeDualChart(statsCtx, 'Kurtosis', 'Skewness', '#f59e0b', '#ef4444');
const rmsChart = makeChart(rmsCtx, 'RMS Power', '#8b5cf6');

function pushPoint(chart, value){
	const now = new Date();
	chart.data.labels.push(now.toLocaleTimeString());
	chart.data.datasets[0].data.push(value);
	if (chart.data.labels.length > 60) { chart.data.labels.shift(); chart.data.datasets[0].data.shift(); }
	chart.update('none');
}

function pushDualPoint(chart, value1, value2){
	const now = new Date();
	chart.data.labels.push(now.toLocaleTimeString());
	chart.data.datasets[0].data.push(value1);
	chart.data.datasets[1].data.push(value2);
	if (chart.data.labels.length > 60) {
		chart.data.labels.shift();
		chart.data.datasets[0].data.shift();
		chart.data.datasets[1].data.shift();
	}
	chart.update('none');
}

function resetCharts(){
	[spectralChart, statsChart, rmsChart].forEach(c => {
		c.data.labels = [];
		c.data.datasets.forEach(dataset => dataset.data = []);
		c.update('none');
	});
}

function setAlert(score, location){
	const warn = Number(thWarnEl.value || 0.4);
	const leak = Number(thLeakEl.value || 0.7);
	const s = Number(score);
	// Note: kpiScore element removed as requested
	alertEl.style.transform = 'scale(1.02)';
	setTimeout(() => { alertEl.style.transform = 'scale(1)'; }, 120);
	if (s >= leak) { alertEl.textContent = `Leak likely (score=${s.toFixed(2)}) at ${location || 'unknown'}`; alertEl.className = 'alert high'; }
	else if (s >= warn) { alertEl.textContent = `Anomaly detected (score=${s.toFixed(2)})`; alertEl.className = 'alert med'; }
	else { alertEl.textContent = ''; alertEl.className = 'alert'; }
}

async function seedHistory(){
	try {
		const res = await fetch(`${BASE_URL}/api/readings/recent?limit=60`);
		const rows = await res.json();
		const sorted = rows.slice().reverse();
		sorted.forEach(r => {
			if (r.sensor_id === 'P1') pushPoint(pressureChart, r.value);
			if (r.sensor_id === 'F1') pushPoint(flowChart, r.value);
		});
	} catch(e){ appendLog('history error: ' + e); }
}

function connect(){
	// Try WebSocket first, fallback to polling if it fails
	try {
		const ws = new WebSocket(BASE_URL.replace("http", "ws") + "/ws");
		ws.onopen = () => {
			statusEl.textContent = 'Connected (WebSocket)';
			statusEl.style.background = '#10341f';
			statusEl.style.borderColor = '#1f6f3b';
			appendLog('✅ WebSocket connected');
			useWebSocket = true;
			if (pollingInterval) {
				clearInterval(pollingInterval);
				pollingInterval = null;
			}
		};
		ws.onmessage = (ev) => {
			if (paused) return;
			try {
				const data = JSON.parse(ev.data);

				// Update sensor data based on current mode
				if (window.currentMode === 'simulation') {
					// 🌟 Simulation Mode 2.0 - Update map with sensor data
					if (window.updateMapWithSensorData) {
						window.updateMapWithSensorData(data);
					}
				}

				// Update new sensor charts (both modes)
				pushPoint(spectralChart, data.spectral_freq);
				pushDualPoint(statsChart, data.kurtosis, data.skewness);
				pushPoint(rmsChart, data.rms_power);

				// Update KPIs
				kpiSpectral.textContent = data.spectral_freq.toFixed(2);
				kpiRMS.textContent = data.rms_power.toFixed(3);

				// Update model performance scores
				document.getElementById("accScore").innerText = (data.accuracy * 100).toFixed(2) + "%";
				document.getElementById("precScore").innerText = (data.precision * 100).toFixed(2) + "%";
				document.getElementById("recScore").innerText = (data.recall * 100).toFixed(2) + "%";
				document.getElementById("aucScore").innerText = (data.auc * 100).toFixed(2) + "%";

				// Handle anomaly data (both modes)
				if (data.anomaly) {
					setAlert(data.anomaly.score, data.anomaly.location);
				}

				// Handle node pressures (both modes)
				if (data.node_pressures) {
					if (window.currentMode === 'simulation' && window.updateMapWithSensorData) {
						// Map already updated above
					} else {
						// Monitoring mode - use canvas network
						renderNetwork(data.node_pressures);
					}

					// 🌟 Update bottom panel with hydraulic data (simulation mode)
					if (window.currentMode === 'simulation') {
						updateBottomPanelData(data);
					}
				}

			} catch(e) { appendLog('WS message error: ' + e); appendLog('Raw data: ' + ev.data); }
		};
		ws.onclose = () => {
			statusEl.textContent = 'Disconnected (WebSocket)';
			statusEl.style.background = '#3a0a0a';
			statusEl.style.borderColor = '#7c1d18';
			appendLog('❌ WebSocket closed, falling back to polling...');
			useWebSocket = false;
			startPolling(); // Fallback to polling
		};
		ws.onerror = (error) => {
			statusEl.textContent = 'WebSocket Error';
			statusEl.style.background = '#3a0a0a';
			statusEl.style.borderColor = '#7c1d18';
			appendLog('❌ WebSocket error, falling back to polling...');
			console.error('WebSocket error:', error);
			useWebSocket = false;
			startPolling(); // Fallback to polling
		};
	} catch (error) {
		appendLog('❌ WebSocket failed, using polling mode');
		console.error('WebSocket initialization failed:', error);
		useWebSocket = false;
		startPolling();
	}
}

// 🌟 Polling fallback function
function startPolling() {
	if (pollingInterval) return; // Already polling

	appendLog('🔄 Starting polling mode (2 second intervals)');
	pollingInterval = setInterval(async () => {
		try {
			const response = await fetch(`${BASE_URL}/api/status`);
			const data = await response.json();

			if (paused) return;

			statusEl.textContent = 'Connected (Polling)';
			statusEl.style.background = '#10341f';
			statusEl.style.borderColor = '#1f6f3b';

			// Update charts with simulated real-time data
			pushPoint(spectralChart, data.spectral_freq || Math.random() * 100);
			pushDualPoint(statsChart, data.kurtosis || Math.random() * 5, data.skewness || Math.random() * 2);
			pushPoint(rmsChart, data.rms_power || Math.random() * 10);

			// Update KPIs
			if (data.spectral_freq) kpiSpectral.textContent = data.spectral_freq.toFixed(2);
			if (data.rms_power) kpiRMS.textContent = data.rms_power.toFixed(3);

		} catch (error) {
			statusEl.textContent = 'Polling Error';
			statusEl.style.background = '#3a0a0a';
			statusEl.style.borderColor = '#7c1d18';
			appendLog('❌ Polling error: ' + error.message);
		}
	}, 2000); // Poll every 2 seconds
}

async function drawNetwork(){
	const wrap = document.getElementById('networkCanvasWrap');
	const canvas = document.getElementById('networkCanvas');

	// Only proceed if elements exist (monitoring mode)
	if (!wrap || !canvas) {
		console.log('📊 Network canvas not available in current view');
		return;
	}

	try {
		canvas.width = wrap.clientWidth - 4;
		canvas.height = 260;
		const ctx = canvas.getContext('2d');

		const res = await fetch(`${BASE_URL}/api/network`);
		const net = await res.json();
		netCache = net;
		renderNetwork();
	} catch(e){ appendLog('network error: ' + e); }
}

function renderNetwork(nodePressures){
	const wrap = document.getElementById('networkCanvasWrap');
	const canvas = document.getElementById('networkCanvas');

	// Only proceed if elements exist (monitoring mode)
	if (!wrap || !canvas) {
		console.log('📊 Network canvas not available in current view');
		return;
	}

	const ctx = canvas.getContext('2d');
	canvas.width = wrap.clientWidth - 4;
	canvas.height = 260;
	const nodes = netCache.nodes || [];
	const links = netCache.links || [];
	const cx = canvas.width/2, cy = canvas.height/2; const R = Math.min(cx, cy) - 30;
	const pos = {};
	nodes.forEach((n, i) => { const a = (i / Math.max(1, nodes.length)) * Math.PI * 2; pos[n.id] = { x: cx + R*Math.cos(a), y: cy + R*Math.sin(a) }; });
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
	links.forEach(l => { const s = pos[l.source] || {x: cx-50, y: cy}; const t = pos[l.target] || {x: cx+50, y: cy}; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); ctx.stroke(); });
	// leak pulse
	const leakPipe = (window.lastLeakPipe || null);
	if (leakPipe){
		const link = links.find(l => l.id === leakPipe);
		if (link){
			const s = pos[link.source]; const t = pos[link.target];
			const now = performance.now()/1000;
			const pulse = (Math.sin(now*4)+1)/2; // 0..1
			ctx.strokeStyle = `rgba(239,68,68,${0.4 + 0.4*pulse})`;
			ctx.lineWidth = 4;
			ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); ctx.stroke();
			ctx.lineWidth = 2; ctx.strokeStyle = '#64748b';
		}
	}
	nodes.forEach(n => {
		const p = pos[n.id];
		const baseline = n.baseline || 52;
		const current = nodePressures && nodePressures[n.id] !== undefined ? nodePressures[n.id] : baseline;
		const drop = Math.max(0, baseline - current);
		const t = Math.min(1, drop / 15);
		const r = Math.floor(147 + t * (239-147));
		const g = Math.floor(197 + t * (68-197));
		const b = Math.floor(253 + t * (68-253));
		ctx.fillStyle = `rgb(${r},${g},${b})`;
		ctx.beginPath(); ctx.arc(p.x, p.y, 6 + 2*t, 0, Math.PI*2); ctx.fill();
		ctx.fillStyle = '#8aa0c7'; ctx.fillText(n.id, p.x+8, p.y-8);
	});
	if (leakPipe) requestAnimationFrame(() => renderNetwork(nodePressures));
}

async function refreshAnomalies(){
	try{
		const res = await fetch(`${BASE_URL}/api/anomalies/recent?limit=10`);
		const rows = await res.json();
		const tbody = document.querySelector('#anomTable tbody');
		tbody.innerHTML = '';
		rows.forEach(r => {
			const tr = document.createElement('tr');
			const t = new Date(r.ts).toLocaleTimeString();
			tr.innerHTML = `<td>${t}</td><td>${Number(r.score).toFixed(2)}</td><td>${r.location || ''}</td>`;
			tbody.appendChild(tr);
		});
	} catch(e){ appendLog('anom error: ' + e); }
}

seedHistory();
connect();
drawNetwork();
refreshAnomalies();
setInterval(refreshAnomalies, 10000);

// Initialize mode toggle after initial setup
setTimeout(() => {
    console.log('🚀 APP.JS: Final mode toggle setup attempt');
    setupModeToggle();
}, 100);

// 🌟 New Layout Panel Management
let bottomPanel = null;
let activeTab = 'scenarioTab';
let isInitializing = true; // Flag to prevent auto-collapse during initialization

function initPanelManagement() {
    console.log('🎛️ Initializing panel management for new layout');

    // Get panel elements
    bottomPanel = document.querySelector('.bottom-panel');
    const panelTabs = document.querySelectorAll('.panel-tabs .tab');
    const panelToggleBtn = document.getElementById('panelToggleBtn');

    // Set up tab switching
    panelTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            switchTab(tab.textContent.trim());
        });
    });

    // Set up panel toggle button
    if (panelToggleBtn) {
        panelToggleBtn.addEventListener('click', () => {
            togglePanel();
        });
    }

    // Set up click-outside-to-collapse (with initialization protection)
    document.addEventListener('click', (e) => {
        if (!bottomPanel || isInitializing) return;

        const isClickInsidePanel = bottomPanel.contains(e.target);
        const isClickOnToggleBtn = e.target.closest('.panel-toggle-btn');
        const isClickOnTab = e.target.closest('.tab');

        // Collapse panel if click is outside panel and not on toggle button or tab
        if (!isClickInsidePanel && !isClickOnToggleBtn && !isClickOnTab && bottomPanel.classList.contains('expanded')) {
            bottomPanel.classList.remove('expanded');
            bottomPanel.classList.add('collapsed');
            console.log('📱 Panel collapsed via click outside');
        }
    });

    // Initialize panel state
    if (bottomPanel) {
        console.log('✅ Bottom panel found, setting initial state');
        // Start collapsed for better map visibility
        bottomPanel.classList.remove('expanded');
        bottomPanel.classList.add('collapsed');

        // Expand after a delay, but mark as initialization
        setTimeout(() => {
            if (bottomPanel) {
                bottomPanel.classList.remove('collapsed');
                bottomPanel.classList.add('expanded');
                console.log('📱 Panel expanded after initialization');
            }
            // End initialization phase after expansion
            setTimeout(() => {
                isInitializing = false;
                console.log('✅ Panel initialization complete');
            }, 600);
        }, 800); // Increased delay to ensure stability
    }

    // Set up floating controls
    setupFloatingControls();

    console.log('🎛️ Panel management initialized');
}

function switchTab(tabName) {
    console.log('🔄 Switching to tab:', tabName);

    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    // Remove active state from all tabs
    const tabs = document.querySelectorAll('.panel-tabs .tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab content
    let targetTabContent = null;
    switch(tabName) {
        case 'Scenario Controls':
            targetTabContent = document.getElementById('scenarioTab');
            activeTab = 'scenarioTab';
            break;
        case 'Hydraulic Data':
            targetTabContent = document.getElementById('hydraulicTab');
            activeTab = 'hydraulicTab';
            break;
        case 'Acoustic Data':
            targetTabContent = document.getElementById('acousticTab');
            activeTab = 'acousticTab';
            break;
        case 'AI Metrics':
            targetTabContent = document.getElementById('aiTab');
            activeTab = 'aiTab';
            break;
    }

    if (targetTabContent) {
        targetTabContent.classList.add('active');
        console.log('✅ Switched to tab:', tabName);
    }

    // Update active tab button
    tabs.forEach(tab => {
        if (tab.textContent.trim() === tabName) {
            tab.classList.add('active');
        }
    });

    // Auto-expand panel when switching tabs
    if (bottomPanel && !bottomPanel.classList.contains('expanded')) {
        togglePanel();
    }
}

function togglePanel() {
    if (bottomPanel) {
        const isExpanded = bottomPanel.classList.contains('expanded');

        if (isExpanded) {
            bottomPanel.classList.remove('expanded');
            bottomPanel.classList.add('collapsed');
            console.log('📱 Panel collapsed');
        } else {
            bottomPanel.classList.remove('collapsed');
            bottomPanel.classList.add('expanded');
            console.log('📱 Panel expanded');
        }
    }
}

function setupFloatingControls() {
    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            // Implement search functionality for nodes/pipes
            if (window.searchNetworkElements) {
                window.searchNetworkElements(searchTerm);
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = e.target.value.toLowerCase();
                if (window.searchNetworkElements) {
                    window.searchNetworkElements(searchTerm);
                }
            }
        });
    }

    // Panel toggle on mode switch
    const modeToggleBtn = document.querySelector('.mode-toggle');
    if (modeToggleBtn) {
        // The mode toggle is already handled in setupModeToggle()
        // But we can add panel behavior here
        const originalOnClick = modeToggleBtn.onclick;
        modeToggleBtn.onclick = function() {
            if (originalOnClick) originalOnClick();

            // Auto-collapse panel when switching to monitoring mode
            if (window.currentMode === 'monitoring' && bottomPanel) {
                setTimeout(() => {
                    bottomPanel.classList.remove('expanded');
                    bottomPanel.classList.add('collapsed');
                }, 300);
            }
        };
    }
}

// Initialize panel management when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initPanelManagement, 200);
    setTimeout(setupDirectLeakInjection, 500); // Add direct setup
});

// Scenario controls
const leakBtn = document.getElementById('leakBtn');
const leakPipe = document.getElementById('leakPipe');
const leakSev = document.getElementById('leakSev');
leakBtn.onclick = async () => {
	window.lastLeakPipe = leakPipe.value;
	try { const res = await fetch(`${BASE_URL}/scenarios/leak`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pipe_id: leakPipe.value, severity: Number(leakSev.value) }) }); appendLog('Leak response: ' + res.status); } catch(err) { appendLog('Leak error: ' + err); }
};

const spikeBtn = document.getElementById('spikeBtn');
const spikeMul = document.getElementById('spikeMul');
const spikeDur = document.getElementById('spikeDur');
spikeBtn.onclick = async () => {
	try { const res = await fetch(`${BASE_URL}/scenarios/demand-spike`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ multiplier: Number(spikeMul.value), duration_s: Number(spikeDur.value) }) }); appendLog('Spike response: ' + res.status); } catch(err) { appendLog('Spike error: ' + err); }
};

// Mode Toggle Variables - Declare early
let modeToggle, monitoringView, simulationView;
let currentMode = 'monitoring';

function setupModeToggle() {
    console.log('🔧 APP.JS: Attempting to setup mode toggle...');

    // Get elements fresh each time
    const headerToggleBtn = document.getElementById('modeToggle');
    const monitorView = document.getElementById('monitoringView');
    const simView = document.getElementById('simulationView');

    console.log('🔍 APP.JS: Element check in setupModeToggle:', {
        headerToggle: !!headerToggleBtn,
        monitoringView: !!monitorView,
        simulationView: !!simView
    });

    if (headerToggleBtn && monitorView && simView) {
        console.log('✅ APP.JS: Elements found, setting up handler');

        // Toggle function
        headerToggleBtn.onclick = () => {
            console.log('🚀 APP.JS: Mode toggle clicked! Current mode:', window.currentMode);

            if (window.currentMode === 'monitoring') {
                console.log('📊 APP.JS: Switching to simulation mode');

                monitorView.style.display = 'none';
                simView.style.display = 'block';

                // Update button text
                headerToggleBtn.textContent = 'Switch to Monitoring Mode';

                window.currentMode = 'simulation';
                console.log('✅ APP.JS: Switched to simulation mode');

                // 🌟 Initialize EPANET Simulation Mode with new layout
                setTimeout(() => {
                    console.log('🔍 Checking EPANET container after switch:', {
                        mapContainer: !!document.querySelector('.map-container'),
                        epanetCanvas: !!document.getElementById('epanetCanvas'),
                        bottomPanel: !!document.querySelector('.bottom-panel')
                    });

                    // Initialize new layout panel management
                    initPanelManagement();

                    // Try multiple initialization approaches
                    if (window.initEpanetVisualization) {
                        console.log('🚀 APP.JS: Calling initEpanetVisualization');
                        window.initEpanetVisualization();
                    } else if (window.initSimulationMode) {
                        console.log('🚀 APP.JS: Falling back to initSimulationMode');
                        window.initSimulationMode();
                    } else {
                        console.warn('⚠️ EPANET initialization function not available');
                        console.log('🔍 Available window functions:', Object.keys(window).filter(key => key.includes('init')));
                        // Show fallback interface
                        showEpanetFallback();
                    }
                }, 200);
            } else {
                console.log('📊 APP.JS: Switching to monitoring mode');
                simView.style.display = 'none';
                monitorView.style.display = 'block';

                // Update button text
                headerToggleBtn.textContent = 'Switch to Simulation Mode';

                window.currentMode = 'monitoring';

                // Collapse panel when switching to monitoring mode
                if (bottomPanel) {
                    bottomPanel.classList.remove('expanded');
                    bottomPanel.classList.add('collapsed');
                }

                console.log('✅ APP.JS: Switched to monitoring mode');
            }

            // Visual feedback
            headerToggleBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                headerToggleBtn.style.transform = 'scale(1)';
            }, 100);

            console.log('🎯 APP.JS: Mode toggle completed');
        };

        console.log('✅ APP.JS: Mode toggle handler attached successfully');
        return true;
    } else {
        console.error('❌ APP.JS: Elements missing in setupModeToggle:', {
            headerToggle: !!headerToggleBtn,
            monitoringView: !!monitorView,
            simulationView: !!simView
        });
        return false;
    }
}

// Try to set up immediately
if (!setupModeToggle()) {
    // If setup fails, try again when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔄 APP.JS: Retrying mode toggle setup after DOM ready');
        setupModeToggle();
    });

    // And try again when everything is loaded
    window.addEventListener('load', () => {
        console.log('🔄 APP.JS: Retrying mode toggle setup after window load');
        setupModeToggle();
    });
}

// Streaming controls
const pauseBtn = document.getElementById('pauseBtn');
pauseBtn.onclick = () => { paused = !paused; pauseBtn.textContent = paused ? 'Resume' : 'Pause'; };
const resetBtn = document.getElementById('resetBtn');
resetBtn.onclick = resetCharts;

// Simulation Mode Variables
let selectedPipe = 'P1';
let simLeaks = {};
let simDemandMultiplier = 1.0;
let simStartTime = Date.now();

// Simulation Mode Functions
function initSimulationMode() {
    console.log('🚀 APP.JS: initSimulationMode called - using new map-based system');

    // Use the new map-based simulation system instead of the old canvas system
    if (window.initSimulationMode) {
        console.log('✅ Using new map-based simulation system');
        updateSimulationStatus('🗺️ Map-based simulation mode active - Click on pipes to select them');
    } else {
        console.log('⚠️ Falling back to old simulation system');
        drawSimulationNetwork();
        setupSimulationEventListeners();
        updateSimulationStatus('Simulation mode active - Click on pipes to select them');
    }
}

function setupSimulationEventListeners() {
    // Pipe selection dropdown
    const pipeSelect = document.getElementById('simPipeSelect');
    if (pipeSelect) {
        pipeSelect.onchange = (e) => {
            selectedPipe = e.target.value;
            updateSimulationStatus(`Selected pipe: ${selectedPipe}`);
        };
    }

    // Leak severity slider
    const leakSlider = document.getElementById('simLeakSev');
    const leakValue = document.getElementById('simLeakValue');
    if (leakSlider && leakValue) {
        leakSlider.oninput = (e) => {
            leakValue.textContent = e.target.value;
        };
    }

    // Demand multiplier slider
    const demandSlider = document.getElementById('simDemandMul');
    const demandValue = document.getElementById('simDemandValue');
    if (demandSlider && demandValue) {
        demandSlider.oninput = (e) => {
            const multiplier = parseFloat(e.target.value);
            simDemandMultiplier = multiplier;
            demandValue.textContent = multiplier.toFixed(1) + 'x';
        };
    }

    // Quick scenario controls
    const quickLeakBtn = document.getElementById('quickLeakBtn');
    const quickDemandBtn = document.getElementById('quickDemandBtn');
    const simPauseBtn = document.getElementById('simPauseBtn');
    const simResetChartsBtn = document.getElementById('simResetChartsBtn');

    if (quickLeakBtn) quickLeakBtn.onclick = quickLeakInjection;
    if (quickDemandBtn) quickDemandBtn.onclick = quickDemandSpike;
    if (simPauseBtn) {
        simPauseBtn.onclick = () => {
            paused = !paused;
            simPauseBtn.textContent = paused ? '▶️ Resume Streaming' : '⏸️ Pause Streaming';
        };
    }
    if (simResetChartsBtn) simResetChartsBtn.onclick = resetCharts;

    // Threshold controls
    const simWarnTh = document.getElementById('simWarnTh');
    const simLeakTh = document.getElementById('simLeakTh');
    if (simWarnTh) {
        simWarnTh.onchange = (e) => {
            const thWarn = document.getElementById('thWarn');
            if (thWarn) thWarn.value = e.target.value;
        };
    }
    if (simLeakTh) {
        simLeakTh.onchange = (e) => {
            const thLeak = document.getElementById('thLeak');
            if (thLeak) thLeak.value = e.target.value;
        };
    }

    // Set up canvas click handler for pipe selection
    const simCanvas = document.getElementById('simNetworkCanvas');
    if (simCanvas) {
        simCanvas.onclick = (e) => {
            const rect = simCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Simple click detection for pipes (can be improved with more sophisticated logic)
            const nodes = [
                { id: 'N1', x: 100, y: 150 },
                { id: 'N2', x: 250, y: 100 },
                { id: 'N3', x: 400, y: 200 },
                { id: 'N4', x: 550, y: 150 }
            ];

            const links = [
                { source: 'N1', target: 'N2', id: 'P1' },
                { source: 'N2', target: 'N3', id: 'P2' },
                { source: 'N3', target: 'N4', id: 'P3' }
            ];

            // Check if click is near any pipe
            for (const link of links) {
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);

                if (sourceNode && targetNode) {
                    const midX = (sourceNode.x + targetNode.x) / 2;
                    const midY = (sourceNode.y + targetNode.y) / 2;

                    if (Math.abs(x - midX) < 30 && Math.abs(y - midY) < 15) {
                        selectedPipe = link.id;
                        const pipeSelectElem = document.getElementById('simPipeSelect');
                        if (pipeSelectElem) pipeSelectElem.value = link.id;
                        updateSimulationStatus(`Selected pipe: ${link.id}`);
                        drawSimulationNetwork(); // Redraw to show selection
                        break;
                    }
                }
            }
        };
    }

    // Simulation control buttons
    const simLeakBtn = document.getElementById('simLeakBtn');
    const simClearLeakBtn = document.getElementById('simClearLeakBtn');
    const simDemandBtn = document.getElementById('simDemandBtn');
    const simResetBtn = document.getElementById('simResetBtn');

    // Fix: Use EPANET leak injection function instead of old one
    if (simLeakBtn) {
        console.log('🔍 DEBUG: simLeakBtn found, setting up click handler');
        simLeakBtn.onclick = () => {
            console.log('🚰 DEBUG: Inject leak button clicked!');
            const pipeSelect = document.getElementById('simPipeSelect');
            const severityInput = document.getElementById('simLeakSev');
            console.log('🔍 DEBUG: Elements found:', {
                pipeSelect: !!pipeSelect,
                severityInput: !!severityInput,
                pipeValue: pipeSelect ? pipeSelect.value : 'N/A',
                severityValue: severityInput ? severityInput.value : 'N/A'
            });

            if (pipeSelect && severityInput) {
                const pipeId = pipeSelect.value;
                const severity = parseFloat(severityInput.value);
                console.log('🚰 DEBUG: About to call injectEpanetLeak:', pipeId, severity);
                console.log('🔍 DEBUG: window.injectEpanetLeak exists:', typeof window.injectEpanetLeak);
                console.log('🔍 DEBUG: window.currentMode:', window.currentMode);

                if (window.injectEpanetLeak) {
                    window.injectEpanetLeak(pipeId, severity);
                } else {
                    console.error('❌ DEBUG: window.injectEpanetLeak is not defined!');
                    console.log('🔍 DEBUG: Available window functions:', Object.keys(window).filter(key => key.includes('inject')));
                }
            } else {
                console.error('❌ DEBUG: Required elements not found!');
                console.log('🔍 DEBUG: Looking for elements with IDs:', {
                    simPipeSelect: !!document.getElementById('simPipeSelect'),
                    simLeakSev: !!document.getElementById('simLeakSev'),
                    simLeakBtn: !!document.getElementById('simLeakBtn')
                });
            }
        };
        console.log('✅ DEBUG: Click handler attached to simLeakBtn');
    } else {
        console.error('❌ DEBUG: simLeakBtn element not found!');
        console.log('🔍 DEBUG: Looking for button with ID "simLeakBtn":', !!document.getElementById('simLeakBtn'));
    }
    if (simClearLeakBtn) simClearLeakBtn.onclick = clearAllLeaks;
    if (simDemandBtn) simDemandBtn.onclick = applyDemandSpike;
    if (simResetBtn) simResetBtn.onclick = resetSimulation;

    console.log('Simulation event listeners set up');
}

function injectSimulatedLeak() {
    const severity = parseFloat(document.getElementById('simLeakSev').value);
    simLeaks[selectedPipe] = severity;

    // Send to backend
    fetch('http://localhost:8000/scenarios/leak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipe_id: selectedPipe, severity: severity })
    }).then(() => {
        updateSimulationStatus(`Injected ${severity.toFixed(1)} severity leak in ${selectedPipe}`);
        drawSimulationNetwork();
    }).catch(err => {
        updateSimulationStatus(`Error injecting leak: ${err}`);
    });
}

function clearAllLeaks() {
    simLeaks = {};
    fetch('http://localhost:8000/scenarios/leak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipe_id: 'NONE', severity: 0 })
    }).then(() => {
        updateSimulationStatus('All leaks cleared');
        drawSimulationNetwork();
    });
}

function applyDemandSpike() {
    const duration = parseInt(document.getElementById('simDemandDur').value);
    fetch('http://localhost:8000/scenarios/demand-spike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ multiplier: simDemandMultiplier, duration_s: duration })
    }).then(() => {
        updateSimulationStatus(`Applied ${simDemandMultiplier.toFixed(1)}x demand spike for ${duration}s`);
    }).catch(err => {
        updateSimulationStatus(`Error applying demand spike: ${err}`);
    });
}

function resetSimulation() {
    simLeaks = {};
    simDemandMultiplier = 1.0;
    document.getElementById('simDemandMul').value = 1.0;
    document.getElementById('simDemandValue').textContent = '1.0x';
    document.getElementById('simLeakSev').value = 0.5;
    document.getElementById('simLeakValue').textContent = '0.5';

    clearAllLeaks();
    updateSimulationStatus('Simulation reset complete');
}

function updateSimulationStatus(message) {
    // Check if simStatus element exists (old layout)
    const simStatusEl = document.getElementById('simStatus');
    if (simStatusEl) {
        simStatusEl.textContent = message;
    }

    // Also update the new layout panel if it exists
    const panelStatus = document.querySelector('.panel-status');
    if (panelStatus) {
        panelStatus.textContent = message;
    }

    appendLog(`SIM: ${message}`);
}

function drawSimulationNetwork() {
    console.log('🎨 APP.JS: drawSimulationNetwork called - checking for canvas elements');

    const wrap = document.getElementById('simNetworkCanvasWrap');
    const canvas = document.getElementById('simNetworkCanvas');

    // Check if old canvas elements exist (they don't exist in map interface)
    if (!wrap || !canvas) {
        console.log('📊 Old canvas elements not found - using map interface instead');
        return; // Exit early since we're using the new map interface
    }

    console.log('📊 Old canvas elements found - using legacy simulation');
    canvas.width = wrap.clientWidth - 4;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Draw network (simplified version)
    const nodes = [
        { id: 'N1', x: 100, y: 150 },
        { id: 'N2', x: 250, y: 100 },
        { id: 'N3', x: 400, y: 200 },
        { id: 'N4', x: 550, y: 150 }
    ];

    const links = [
        { source: 'N1', target: 'N2', id: 'P1' },
        { source: 'N2', target: 'N3', id: 'P2' },
        { source: 'N3', target: 'N4', id: 'P3' }
    ];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw links
    links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);

        if (sourceNode && targetNode) {
            const isLeaking = simLeaks[link.id] > 0;
            const severity = simLeaks[link.id] || 0;

            // Set link color based on leak status
            if (isLeaking) {
                ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + severity * 0.5})`;
                ctx.lineWidth = 4 + severity * 4;
            } else {
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 2;
            }

            ctx.beginPath();
            ctx.moveTo(sourceNode.x, sourceNode.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.stroke();

            // Add pipe label
            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;
            ctx.fillStyle = '#8aa0c7';
            ctx.font = '12px Inter';
            ctx.fillText(link.id, midX - 10, midY - 5);

            // Note: Click handlers are set up in setupSimulationEventListeners
        }
    });

    // Draw nodes
    nodes.forEach(node => {
        const pressure = 52 + (Math.random() - 0.5) * 10; // Simulate pressure variation
        const pressureColor = pressure > 55 ? '#f59e0b' : pressure < 45 ? '#ef4444' : '#22c55e';

        ctx.fillStyle = pressureColor;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(node.id, node.x, node.y + 4);

        // Node pressure value
        ctx.fillStyle = '#8aa0c7';
        ctx.font = '10px Inter';
        ctx.fillText(pressure.toFixed(1), node.x, node.y + 20);
    });

    // Update effects display
    updateSimulationEffects();
}

function updateSimulationEffects() {
    const totalLeaks = Object.keys(simLeaks).length;
    const maxLeakSeverity = Math.max(0, ...Object.values(simLeaks));
    const affectedNodes = totalLeaks * 2; // Rough estimate

    document.getElementById('effectFlow').textContent = `${(65 * simDemandMultiplier).toFixed(1)} L/s`;
    document.getElementById('effectPressure').textContent = `${(maxLeakSeverity * 15).toFixed(1)} psi`;
    document.getElementById('effectNodes').textContent = affectedNodes.toString();
    document.getElementById('effectTime').textContent = `${Date.now() - simStartTime} ms`;
}

// Quick scenario functions
function quickLeakInjection() {
    const pipeId = document.getElementById('quickLeakPipe').value;
    const severity = parseFloat(document.getElementById('quickLeakSev').value);

    fetch('http://localhost:8000/scenarios/leak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipe_id: pipeId, severity: severity })
    }).then(() => {
        updateSimulationStatus(`Quick leak injected: ${pipeId} @ ${severity}`);
        drawSimulationNetwork();
    }).catch(err => {
        updateSimulationStatus(`Error with quick leak: ${err}`);
    });
}

function quickDemandSpike() {
    const multiplier = parseFloat(document.getElementById('quickDemandMul').value);
    const duration = parseInt(document.getElementById('quickDemandDur').value);

    fetch('http://localhost:8000/scenarios/demand-spike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ multiplier: multiplier, duration_s: duration })
    }).then(() => {
        updateSimulationStatus(`Quick demand spike: ${multiplier}x for ${duration}s`);
    }).catch(err => {
        updateSimulationStatus(`Error with quick demand: ${err}`);
    });
}

// Fallback function for EPANET initialization
function showEpanetFallback() {
    console.log('🔧 Showing EPANET fallback interface');

    // Since we now have the main header, just show a loading message
    updateSimulationStatus('⚠️ EPANET visualization loading - Please wait');

    // The main header "Chennai Water Distribution Network (EPANET)" is already visible
    // No need to create additional headers
}

// 🌟 Bottom Panel Data Update Function
function updateBottomPanelData(data) {
    console.log('📊 Updating bottom panel data:', data);

    // Update Hydraulic Data Tab
    if (data.node_pressures) {
        updateHydraulicData(data.node_pressures);
    }

    // Update Acoustic Data Tab
    if (data.spectral_freq || data.rms_power || data.kurtosis || data.skewness) {
        updateAcousticData(data);
    }

    // Update AI Metrics Tab
    if (data.accuracy || data.precision || data.recall || data.auc) {
        updateAIMetrics(data);
    }
}

function updateHydraulicData(nodePressures) {
    console.log('🔧 Updating hydraulic data:', nodePressures);

    // Update pressure gauges (hydP1, hydP2, etc.)
    const pressureElements = ['hydP1', 'hydP2', 'hydP3', 'hydP4'];
    Object.entries(nodePressures).forEach(([nodeId, pressure], index) => {
        if (index < pressureElements.length) {
            const element = document.getElementById(pressureElements[index]);
            if (element) {
                element.textContent = `${pressure.toFixed(1)} psi`;
                // Color coding based on pressure levels
                if (pressure < 40) {
                    element.style.color = '#ef4444'; // Red for low pressure
                } else if (pressure > 70) {
                    element.style.color = '#f59e0b'; // Orange for high pressure
                } else {
                    element.style.color = '#22c55e'; // Green for normal pressure
                }
            }
        }
    });

    // Update flow rate monitoring (hydF1, hydF2, etc.)
    const flowElements = ['hydF1', 'hydF2', 'hydF3', 'hydF4'];
    Object.entries(nodePressures).forEach(([nodeId, pressure], index) => {
        if (index < flowElements.length) {
            const element = document.getElementById(flowElements[index]);
            if (element) {
                // Calculate flow based on pressure (simplified calculation)
                const flow = Math.max(0, (pressure - 30) * 2.5);
                element.textContent = `${flow.toFixed(1)} L/s`;
                // Color coding based on flow levels
                if (flow < 10) {
                    element.style.color = '#ef4444'; // Red for low flow
                } else if (flow > 50) {
                    element.style.color = '#f59e0b'; // Orange for high flow
                } else {
                    element.style.color = '#22c55e'; // Green for normal flow
                }
            }
        }
    });
}

function updateAcousticData(data) {
    console.log('🔊 Updating acoustic data:', data);

    // Update spectral analysis
    const specFreqElement = document.getElementById('specFreq');
    if (specFreqElement) {
        specFreqElement.textContent = `${data.spectral_freq.toFixed(1)} Hz`;
    }

    const freqRangeElement = document.getElementById('freqRange');
    if (freqRangeElement) {
        // Calculate frequency range based on spectral frequency
        const range = data.spectral_freq * 0.3;
        freqRangeElement.textContent = `±${range.toFixed(1)} Hz`;
    }

    const peakAmpElement = document.getElementById('peakAmp');
    if (peakAmpElement) {
        // Calculate peak amplitude from RMS power
        const peakAmp = data.rms_power * Math.sqrt(2);
        peakAmpElement.textContent = `${peakAmp.toFixed(2)} dB`;
    }

    const harmonicDistElement = document.getElementById('harmonicDist');
    if (harmonicDistElement) {
        // Calculate harmonic distortion based on kurtosis
        const distortion = Math.max(0, (data.kurtosis - 3) * 5);
        harmonicDistElement.textContent = `${distortion.toFixed(1)}%`;
    }

    // 🌟 Update signal quality metrics using backend-calculated values
    const snrElement = document.getElementById('snr');
    if (snrElement && data.snr !== undefined) {
        snrElement.textContent = `${data.snr} dB`;
    }

    const thdElement = document.getElementById('thd');
    if (thdElement && data.thd !== undefined) {
        thdElement.textContent = `${data.thd}%`;
    }

    const crestFactorElement = document.getElementById('crestFactor');
    if (crestFactorElement && data.crest_factor !== undefined) {
        crestFactorElement.textContent = data.crest_factor.toFixed(2);
    }

    const dynamicRangeElement = document.getElementById('dynamicRange');
    if (dynamicRangeElement && data.dynamic_range !== undefined) {
        dynamicRangeElement.textContent = `${data.dynamic_range} dB`;
    }
}

function updateAIMetrics(data) {
    console.log('🤖 Updating AI metrics:', data);

    // Update model performance metrics
    const aiAccElement = document.getElementById('aiAcc');
    if (aiAccElement) {
        aiAccElement.textContent = `${(data.accuracy * 100).toFixed(1)}%`;
    }

    const aiPrecElement = document.getElementById('aiPrec');
    if (aiPrecElement) {
        aiPrecElement.textContent = `${(data.precision * 100).toFixed(1)}%`;
    }

    const aiRecElement = document.getElementById('aiRec');
    if (aiRecElement) {
        aiRecElement.textContent = `${(data.recall * 100).toFixed(1)}%`;
    }

    const aiF1Element = document.getElementById('aiF1');
    if (aiF1Element && data.f1_score !== undefined) {
        aiF1Element.textContent = `${(data.f1_score * 100).toFixed(1)}%`;
    }

    // Update leak confidence meter
    const aiLeakConfidenceElement = document.getElementById('aiLeakConfidence');
    const aiConfidenceTextElement = document.getElementById('aiConfidenceText');
    if (aiLeakConfidenceElement && aiConfidenceTextElement) {
        // Calculate leak confidence based on model metrics
        const confidence = Math.min(100, (data.accuracy + data.precision + data.recall) * 100 / 3);
        aiLeakConfidenceElement.style.width = `${confidence}%`;
        aiConfidenceTextElement.textContent = `${Math.round(confidence)}%`;

        // Color coding for confidence levels
        if (confidence > 80) {
            aiConfidenceTextElement.style.color = '#22c55e'; // Green
        } else if (confidence > 60) {
            aiConfidenceTextElement.style.color = '#f59e0b'; // Orange
        } else {
            aiConfidenceTextElement.style.color = '#ef4444'; // Red
        }
    }

    // Update anomaly score
    const aiAnomalyScoreElement = document.getElementById('aiAnomalyScore');
    if (aiAnomalyScoreElement) {
        // Calculate anomaly score based on model performance deviation
        const anomalyScore = Math.abs(1 - data.accuracy) * 100;
        aiAnomalyScoreElement.textContent = anomalyScore.toFixed(2);

        // Color coding for anomaly levels
        if (anomalyScore > 0.7) {
            aiAnomalyScoreElement.style.color = '#ef4444'; // High anomaly
        } else if (anomalyScore > 0.4) {
            aiAnomalyScoreElement.style.color = '#f59e0b'; // Medium anomaly
        } else {
            aiAnomalyScoreElement.style.color = '#22c55e'; // Low anomaly
        }
    }

    // Update last detection time
    const aiLastDetectionElement = document.getElementById('aiLastDetection');
    if (aiLastDetectionElement) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        aiLastDetectionElement.textContent = `Node-7 @ ${timeStr}`;
    }
}

// 🌟 DIRECT LEAK INJECTION SYSTEM - Works regardless of initialization state
function setupDirectLeakInjection() {
    console.log('🚀 DIRECT: Setting up direct leak injection system');

    // Set up immediate button handler for leak injection
    const injectBtn = document.getElementById('simLeakBtn');
    if (injectBtn) {
        console.log('✅ DIRECT: Found inject button, attaching handler');

        injectBtn.onclick = function() {
            console.log('💧 DIRECT: Inject leak button clicked');

            // Get form values
            const pipeSelect = document.getElementById('simPipeSelect');
            const severityInput = document.getElementById('simLeakSev');

            if (pipeSelect && severityInput) {
                const pipeId = pipeSelect.value;
                const severity = parseFloat(severityInput.value);

                console.log('💧 DIRECT: Injecting leak in', pipeId, 'severity', severity);

                // Force visual update immediately
                forceLeakVisualUpdate(pipeId, severity);

                // Send to backend
                fetch('http://localhost:8000/scenarios/leak', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pipe_id: pipeId, severity: severity })
                }).then(response => {
                    console.log('🌐 DIRECT: Backend response:', response.status);
                    updateSimulationStatus(`💧 Injected ${severity.toFixed(1)} severity leak in ${pipeId}`);
                }).catch(error => {
                    console.error('❌ DIRECT: Backend error:', error);
                    updateSimulationStatus(`❌ Error injecting leak: ${error.message}`);
                });
            } else {
                console.error('❌ DIRECT: Required elements not found');
                console.log('🔍 DIRECT: Available elements:', {
                    simPipeSelect: !!document.getElementById('simPipeSelect'),
                    simLeakSev: !!document.getElementById('simLeakSev'),
                    simLeakBtn: !!document.getElementById('simLeakBtn')
                });
            }
        };

        console.log('✅ DIRECT: Direct leak injection handler attached successfully');
    } else {
        console.error('❌ DIRECT: Inject button not found');
        // Try again after a delay
        setTimeout(setupDirectLeakInjection, 1000);
    }

    // Set up clear leaks button
    const clearBtn = document.getElementById('simClearLeakBtn');
    if (clearBtn) {
        console.log('✅ DIRECT: Found clear button, attaching handler');

        clearBtn.onclick = function() {
            console.log('🧹 DIRECT: Clear leaks button clicked');

            // Clear visual effects immediately
            if (typeof window !== 'undefined') {
                if (window.activeScenarios) {
                    window.activeScenarios = {};
                    console.log('✅ DIRECT: Cleared window.activeScenarios');
                }
                try {
                    if (typeof activeScenarios !== 'undefined') {
                        activeScenarios = {};
                        console.log('✅ DIRECT: Cleared local activeScenarios');
                    }
                } catch (e) {
                    console.log('ℹ️ DIRECT: Local activeScenarios not accessible');
                }
            }

            // Force immediate visual update
            const canvasElement = document.getElementById('epanetCanvas');
            if (canvasElement && window.drawEpanetNetwork) {
                window.drawEpanetNetwork();
                console.log('🎨 DIRECT: Forced visual update after clearing leaks');
            }

            // Send to backend
            fetch('http://localhost:8000/scenarios/clear-leaks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(response => {
                console.log('🌐 DIRECT: Clear response:', response.status);
                updateSimulationStatus('🧹 All leaks cleared');
            }).catch(error => {
                console.error('❌ DIRECT: Error clearing leaks:', error);
                updateSimulationStatus(`❌ Error clearing leaks: ${error.message}`);
            });
        };

        console.log('✅ DIRECT: Clear leaks handler attached successfully');
    } else {
        console.error('❌ DIRECT: Clear button not found');
    }
}

function forceLeakVisualUpdate(pipeId, severity) {
    console.log('🎨 DIRECT: Forcing visual update for pipe', pipeId);

    // Update activeScenarios - create it if it doesn't exist
    if (typeof window !== 'undefined') {
        if (window.activeScenarios) {
            window.activeScenarios[pipeId] = severity;
            console.log('✅ DIRECT: Updated window.activeScenarios');
        } else {
            // Create it if it doesn't exist
            window.activeScenarios = { [pipeId]: severity };
            console.log('✅ DIRECT: Created window.activeScenarios');
        }

        // Also try to update the local activeScenarios in map.js if possible
        try {
            if (typeof activeScenarios !== 'undefined') {
                activeScenarios[pipeId] = severity;
                console.log('✅ DIRECT: Updated local activeScenarios in map.js');
            }
        } catch (e) {
            console.log('ℹ️ DIRECT: Local activeScenarios not accessible, using window version');
        }
    }

    // Force canvas redraw regardless of network data availability
    const canvasElement = document.getElementById('epanetCanvas');
    if (canvasElement) {
        const ctx = canvasElement.getContext('2d');
        if (ctx) {
            console.log('🎨 DIRECT: Found canvas and context, redrawing');

            // Redraw the entire network immediately
            if (window.drawEpanetNetwork) {
                window.drawEpanetNetwork();
                console.log('✅ DIRECT: Called window.drawEpanetNetwork()');
            } else {
                console.log('⚠️ DIRECT: window.drawEpanetNetwork not available, trying manual redraw');
                // Manual redraw as fallback
                manualRedrawNetwork();
            }
        } else {
            console.error('❌ DIRECT: Canvas context not available');
        }
    } else {
        console.error('❌ DIRECT: EPANET canvas not found');
        console.log('🔍 DIRECT: Available canvases:', Array.from(document.querySelectorAll('canvas')).map(c => c.id));
    }
}

function manualRedrawNetwork() {
    console.log('🔧 DIRECT: Manual network redraw');

    const canvas = document.getElementById('epanetCanvas');
    const ctx = canvas.getContext('2d');

    if (!ctx || !window.networkNodes || !window.networkPipes) {
        console.error('❌ DIRECT: Cannot manual redraw - missing requirements');
        return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pipes
    Object.values(window.networkPipes).forEach(pipe => {
        const startNode = window.networkNodes[pipe.startNode];
        const endNode = window.networkNodes[pipe.endNode];

        if (startNode && endNode) {
            // Determine pipe color based on leak status
            let pipeColor = '#96ceb4'; // Normal
            let lineWidth = Math.max(2, pipe.diameter / 100);

            if (window.activeScenarios && window.activeScenarios[pipe.id]) {
                const severity = window.activeScenarios[pipe.id];
                pipeColor = `rgba(255, 107, 53, ${0.6 + severity * 0.4})`; // Leaking
                lineWidth = Math.max(4, pipe.diameter / 80);
                console.log('🔴 DIRECT: Drawing leaking pipe', pipe.id, 'with severity', severity);
            }

            // Draw pipe
            ctx.strokeStyle = pipeColor;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(startNode.x, startNode.y);
            ctx.lineTo(endNode.x, endNode.y);
            ctx.stroke();

            // Draw pipe label
            const midX = (startNode.x + endNode.x) / 2;
            const midY = (startNode.y + endNode.y) / 2;
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '10px Inter';
            ctx.fillText(pipe.id, midX, midY - 8);
        }
    });

    // Draw nodes
    Object.values(window.networkNodes).forEach(node => {
        let nodeColor = '#96ceb4'; // Default
        if (node.nodeType === 'source') nodeColor = '#ff6b35';
        if (node.nodeType === 'tank') nodeColor = '#4ecdc4';

        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter';
        ctx.fillText(node.id, node.x, node.y + 20);
    });

    console.log('✅ DIRECT: Manual redraw completed');
}

// Initialize simulation effects
setInterval(updateSimulationEffects, 1000);
