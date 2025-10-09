/**
 * 🌟 EPANET-Style Network Visualization System
 * Interactive canvas-based network diagram for water distribution system
 */

// Global network variables
let epanetCanvas;
let ctx;
let networkNodes = {};
let networkPipes = {};
let activeScenarios = {};
let epanetSelectedPipe = null;
let animationFrame = null;
let isInitialized = false;
let simulationTime = 0;

/**
 * Initialize the EPANET-style network visualization
 */
function initEpanetVisualization() {
    console.log('🏭 Initializing EPANET-style network visualization...');

    // Multiple attempts to find and initialize canvas
    let attempts = 0;
    const maxAttempts = 15;

    const attemptInitialization = () => {
        attempts++;
        console.log(`🔄 Canvas initialization attempt ${attempts}/${maxAttempts}`);

        try {
            // Get canvas element with multiple selectors
            epanetCanvas = document.getElementById('epanetCanvas');

            if (!epanetCanvas) {
                console.warn(`❌ Canvas not found on attempt ${attempts}, retrying...`);
                if (attempts < maxAttempts) {
                    setTimeout(attemptInitialization, 200);
                } else {
                    console.error('❌ EPANET canvas not found after maximum attempts');
                    showFallbackInterface();
                }
                return;
            }

            console.log('✅ Canvas element found:', {
                width: epanetCanvas.width,
                height: epanetCanvas.height,
                styleWidth: epanetCanvas.style.width,
                styleHeight: epanetCanvas.style.height
            });

            // Get canvas context
            ctx = epanetCanvas.getContext('2d');
            if (!ctx) {
                console.error('❌ Could not get 2D canvas context');
                showFallbackInterface();
                return;
            }

            console.log('✅ Canvas context created successfully');

            // Set canvas size to match container
            const container = epanetCanvas.parentElement;
            if (container) {
                const rect = container.getBoundingClientRect();
                epanetCanvas.width = rect.width || 1200;
                epanetCanvas.height = rect.height || 800;
                console.log('📏 Canvas resized to:', { width: epanetCanvas.width, height: epanetCanvas.height });
            }

            // Initialize EPANET network data
            initializeEpanetNetworkData();

            // Set up event handlers
            setupCanvasEventHandlers();

            // Set up responsive resize handling
            setupResponsiveResize();

            // Start animation loop
            startAnimationLoop();

            isInitialized = true;
            console.log('✅ EPANET network visualization initialized successfully');

            // Update status
            updateSimulationStatus('🏭 EPANET Network Active - Interactive visualization ready');

        } catch (error) {
            console.error(`❌ Error on initialization attempt ${attempts}:`, error);
            if (attempts < maxAttempts) {
                setTimeout(attemptInitialization, 200);
            } else {
                showFallbackInterface();
            }
        }
    };

    // Start initialization attempts
    setTimeout(attemptInitialization, 100);
}

/**
 * Show fallback interface if canvas fails
 */
function showFallbackInterface() {
    console.log('🔧 Showing fallback EPANET interface');

    const container = document.querySelector('.network-visualization');
    if (container) {
        container.innerHTML = `
            <div style="
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                height: 100%; color: #cbd5e1; font-family: Inter, sans-serif;
                background: linear-gradient(135deg, #1e293b, #334155);
                padding: 40px;
                text-align: center;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">🏭</div>
                <h2 style="color: #f1f5f9; margin-bottom: 16px; font-size: 24px; font-weight: 700;">
                    EPANET Network Visualization
                </h2>
                <p style="color: #94a3b8; margin-bottom: 24px; font-size: 16px; max-width: 400px;">
                    Interactive water distribution network with 12 nodes and comprehensive sensor monitoring
                </p>

                <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <h3 style="color: #3b82f6; margin-bottom: 16px; font-size: 18px;">Network Components</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: left;">
                        <div>
                            <strong style="color: #ff6b35;">🟧 Sources:</strong> Lake, River<br>
                            <strong style="color: #4ecdc4;">🟦 Tanks:</strong> 3 Storage tanks<br>
                            <strong style="color: #96ceb4;">🟢 Junctions:</strong> 7 Connection points
                        </div>
                        <div>
                            <strong style="color: #96ceb4;">🌊 Pipes:</strong> 12 Connections<br>
                            <strong style="color: #22c55e;">📊 Sensors:</strong> 8 Monitoring points<br>
                            <strong style="color: #f59e0b;">🤖 AI:</strong> Real-time analysis
                        </div>
                    </div>
                </div>

                <div style="font-size: 14px; color: #64748b;">
                    Canvas initialization issue detected. Please refresh the page or check browser console for details.
                </div>

                <button onclick="location.reload()" style="
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white; border: none; padding: 12px 24px; border-radius: 8px;
                    font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 20px;
                ">
                    🔄 Refresh Page
                </button>
            </div>
        `;

        updateSimulationStatus('⚠️ EPANET visualization in fallback mode - Canvas not available');
    }
}

/**
 * Initialize EPANET network data structure with responsive positioning
 */
function initializeEpanetNetworkData() {
    console.log('📊 Initializing EPANET network data...');

    // Store base network layout (relative positions)
    const baseLayout = {
        'LAKE': { x: 0.12, y: 0.25, name: 'Red Hills Lake', nodeType: 'source' },
        'RIV': { x: 0.25, y: 0.44, name: 'Chembarambakkam Reservoir', nodeType: 'source' },
        'TANK_1': { x: 0.38, y: 0.22, name: 'Kilpauk Tank', nodeType: 'tank' },
        'TANK_2': { x: 0.50, y: 0.31, name: 'Teynampet Tank', nodeType: 'tank' },
        'TANK_3': { x: 0.33, y: 0.50, name: 'Saidapet Tank', nodeType: 'tank' },
        'J1': { x: 0.21, y: 0.19, name: 'Junction 1', nodeType: 'junction' },
        'J2': { x: 0.29, y: 0.28, name: 'Junction 2', nodeType: 'junction' },
        'J3': { x: 0.42, y: 0.19, name: 'Junction 3', nodeType: 'junction' },
        'J4': { x: 0.54, y: 0.25, name: 'Junction 4', nodeType: 'junction' },
        'J5': { x: 0.46, y: 0.38, name: 'Junction 5', nodeType: 'junction' },
        'J6': { x: 0.38, y: 0.40, name: 'Junction 6', nodeType: 'junction' },
        'J7': { x: 0.25, y: 0.35, name: 'Junction 7', nodeType: 'junction' }
    };

    // Calculate actual positions based on canvas size
    updateNetworkNodePositions();

    function updateNetworkNodePositions() {
        if (!epanetCanvas) return;

        Object.keys(baseLayout).forEach(nodeId => {
            const baseNode = baseLayout[nodeId];
            networkNodes[nodeId] = {
                id: nodeId,
                name: baseNode.name,
                type: baseNode.nodeType,
                baseX: baseNode.x,
                baseY: baseNode.y,
                x: epanetCanvas.width * baseNode.x,
                y: epanetCanvas.height * baseNode.y,
                pressure: nodeId.includes('TANK') ? 60 + Math.random() * 15 : 50 + Math.random() * 20,
                flow: nodeId.includes('LAKE') || nodeId.includes('RIV') ? 80 + Math.random() * 40 : 10 + Math.random() * 20,
                elevation: 45 - Math.random() * 20,
                nodeType: baseNode.nodeType
            };
        });
    }

    // Store the update function globally for resize handling
    window.updateNetworkNodePositions = updateNetworkNodePositions;

    // Define network pipes (EPANET-style connections)
    networkPipes = {
        'P1': {
            id: 'P1',
            name: 'Main Supply Line',
            startNode: 'LAKE',
            endNode: 'J1',
            length: 1200,
            diameter: 400,
            material: 'DI',
            roughness: 100,
            flow: 45,
            velocity: 1.2,
            headloss: 2.1
        },
        'P2': {
            id: 'P2',
            name: 'Lake to Tank 1',
            startNode: 'J1',
            endNode: 'TANK_1',
            length: 800,
            diameter: 350,
            material: 'DI',
            roughness: 100,
            flow: 35,
            velocity: 1.1,
            headloss: 1.8
        },
        'P3': {
            id: 'P3',
            name: 'Tank 1 to J3',
            startNode: 'TANK_1',
            endNode: 'J3',
            length: 600,
            diameter: 300,
            material: 'PVC',
            roughness: 110,
            flow: 28,
            velocity: 0.9,
            headloss: 1.2
        },
        'P4': {
            id: 'P4',
            name: 'J3 to J4',
            startNode: 'J3',
            endNode: 'J4',
            length: 500,
            diameter: 250,
            material: 'PVC',
            roughness: 110,
            flow: 22,
            velocity: 0.8,
            headloss: 0.9
        },
        'P5': {
            id: 'P5',
            name: 'Reservoir Main',
            startNode: 'RIV',
            endNode: 'J2',
            length: 900,
            diameter: 380,
            material: 'DI',
            roughness: 100,
            flow: 42,
            velocity: 1.3,
            headloss: 2.3
        },
        'P6': {
            id: 'P6',
            name: 'J2 to Tank 2',
            startNode: 'J2',
            endNode: 'TANK_2',
            length: 700,
            diameter: 320,
            material: 'PVC',
            roughness: 110,
            flow: 32,
            velocity: 1.0,
            headloss: 1.5
        },
        'P7': {
            id: 'P7',
            name: 'Tank 2 to J5',
            startNode: 'TANK_2',
            endNode: 'J5',
            length: 550,
            diameter: 280,
            material: 'PE',
            roughness: 120,
            flow: 25,
            velocity: 0.9,
            headloss: 1.1
        },
        'P8': {
            id: 'P8',
            name: 'J5 to J6',
            startNode: 'J5',
            endNode: 'J6',
            length: 400,
            diameter: 220,
            material: 'PE',
            roughness: 120,
            flow: 18,
            velocity: 0.7,
            headloss: 0.8
        },
        'P9': {
            id: 'P9',
            name: 'Tank 3 Supply',
            startNode: 'RIV',
            endNode: 'TANK_3',
            length: 650,
            diameter: 300,
            material: 'PVC',
            roughness: 110,
            flow: 30,
            velocity: 1.0,
            headloss: 1.4
        },
        'P10': {
            id: 'P10',
            name: 'Tank 3 to J6',
            startNode: 'TANK_3',
            endNode: 'J6',
            length: 480,
            diameter: 260,
            material: 'PE',
            roughness: 120,
            flow: 20,
            velocity: 0.8,
            headloss: 0.9
        },
        'P11': {
            id: 'P11',
            name: 'J6 to J7',
            startNode: 'J6',
            endNode: 'J7',
            length: 350,
            diameter: 200,
            material: 'PE',
            roughness: 120,
            flow: 14,
            velocity: 0.6,
            headloss: 0.6
        },
        'P12': {
            id: 'P12',
            name: 'J2 to J7',
            startNode: 'J2',
            endNode: 'J7',
            length: 420,
            diameter: 240,
            material: 'PVC',
            roughness: 110,
            flow: 16,
            velocity: 0.7,
            headloss: 0.7
        }
    };

    console.log('✅ EPANET network data initialized:', {
        nodes: Object.keys(networkNodes).length,
        pipes: Object.keys(networkPipes).length
    });
}

/**
 * Set up canvas event handlers
 */
function setupCanvasEventHandlers() {
    if (!epanetCanvas) return;

    // Mouse move handler for hover effects
    epanetCanvas.addEventListener('mousemove', (e) => {
        const rect = epanetCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check if mouse is over a pipe
        for (const pipe of Object.values(networkPipes)) {
            if (isMouseOverPipe(mouseX, mouseY, pipe)) {
                epanetCanvas.style.cursor = 'pointer';
                return;
            }
        }

        // Check if mouse is over a node
        for (const node of Object.values(networkNodes)) {
            if (isMouseOverNode(mouseX, mouseY, node)) {
                epanetCanvas.style.cursor = 'pointer';
                return;
            }
        }

        epanetCanvas.style.cursor = 'default';
    });

    // Click handler for pipe/node selection
    epanetCanvas.addEventListener('click', (e) => {
        const rect = epanetCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check pipes first
        for (const pipe of Object.values(networkPipes)) {
            if (isMouseOverPipe(mouseX, mouseY, pipe)) {
                selectPipe(pipe.id);
                return;
            }
        }

        // Check nodes
        for (const node of Object.values(networkNodes)) {
            if (isMouseOverNode(mouseX, mouseY, node)) {
                selectNode(node.id);
                return;
            }
        }
    });

    console.log('✅ EPANET canvas event handlers set up');
}

/**
 * Set up responsive resize handling
 */
function setupResponsiveResize() {
    if (!epanetCanvas) return;

    let resizeTimeout;

    function handleResize() {
        console.log('🔄 Handling window resize for EPANET canvas');

        // Clear any existing timeout
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }

        // Debounce resize events
        resizeTimeout = setTimeout(() => {
            const container = epanetCanvas.parentElement;
            if (container) {
                const rect = container.getBoundingClientRect();

                // Update canvas size
                const newWidth = rect.width || 1200;
                const newHeight = rect.height || 800;

                // Only update if size actually changed
                if (newWidth !== epanetCanvas.width || newHeight !== epanetCanvas.height) {
                    console.log('📏 Updating canvas size:', { width: newWidth, height: newHeight });

                    // Update canvas dimensions
                    epanetCanvas.width = newWidth;
                    epanetCanvas.height = newHeight;

                    // Update node positions based on new canvas size
                    if (window.updateNetworkNodePositions) {
                        window.updateNetworkNodePositions();
                        console.log('✅ Network node positions updated for new canvas size');
                    }

                    // Force a redraw
                    if (ctx) {
                        drawEpanetNetwork();
                    }
                }
            }
        }, 250); // 250ms debounce delay
    }

    // Add resize event listener
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    console.log('✅ Responsive resize handling set up');
}

/**
 * Check if mouse is over a pipe
 */
function isMouseOverPipe(mouseX, mouseY, pipe) {
    const startNode = networkNodes[pipe.startNode];
    const endNode = networkNodes[pipe.endNode];

    if (!startNode || !endNode) return false;

    const dx = endNode.x - startNode.x;
    const dy = endNode.y - startNode.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return false;

    // Calculate distance from mouse to line
    const t = Math.max(0, Math.min(1, ((mouseX - startNode.x) * dx + (mouseY - startNode.y) * dy) / (length * length)));
    const closestX = startNode.x + t * dx;
    const closestY = startNode.y + t * dy;
    const distance = Math.sqrt((mouseX - closestX) ** 2 + (mouseY - closestY) ** 2);

    return distance < 12; // 12px tolerance for pipes
}

/**
 * Check if mouse is over a node
 */
function isMouseOverNode(mouseX, mouseY, node) {
    const dx = mouseX - node.x;
    const dy = mouseY - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Different sizes based on node type
    let radius = 20;
    if (node.nodeType === 'source') radius = 25;
    if (node.nodeType === 'tank') radius = 22;

    return distance < radius;
}

/**
 * Select a pipe for scenario injection
 */
function selectPipe(pipeId) {
    console.log('🚰 Pipe selected:', pipeId);
    epanetSelectedPipe = pipeId;

    // Update the global selectedPipe variable from app.js (if it exists)
    if (typeof window !== 'undefined' && window.selectedPipe !== undefined) {
        window.selectedPipe = pipeId;
    }

    // Update UI
    const pipeSelect = document.getElementById('simPipeSelect');
    if (pipeSelect) {
        pipeSelect.value = pipeId;
    }

    // Show tooltip with comprehensive pipe information
    showPipeTooltip(pipeId);

    // Update status
    updateSimulationStatus(`Selected pipe: ${pipeId} - Click node for sensor data`);

    console.log('✅ Pipe selection updated');
}

/**
 * Select a node and show sensor data
 */
function selectNode(nodeId) {
    console.log('🔗 Node selected:', nodeId);
    const node = networkNodes[nodeId];

    if (!node) return;

    // Show comprehensive sensor data popup
    showNodeSensorData(node);

    updateSimulationStatus(`Selected node: ${nodeId} - ${node.name}`);
}

/**
 * Show comprehensive sensor data for selected node
 */
function showNodeSensorData(node) {
    // Create or update popup with sensor data
    const popup = createSensorDataPopup(node);
    console.log('📊 Displaying sensor data for node:', node.id);

    // You could show this as a modal, tooltip, or side panel
    // For now, we'll log it and could extend to show in a dedicated panel
    console.log('🔍 Node Sensor Data:', {
        node: node.id,
        hydraulic: {
            pressure: node.pressure,
            flow: node.flow,
            elevation: node.elevation
        },
        acoustic: {
            spectralFreq: 240 + Math.random() * 20,
            rmsPower: 0.8 + Math.random() * 0.2,
            kurtosis: 2.8 + Math.random() * 0.8,
            skewness: 0.4 + Math.random() * 0.4
        },
        aiMetrics: {
            leakConfidence: Math.floor(45 + Math.random() * 40),
            accuracy: 90 + Math.random() * 8,
            precision: 88 + Math.random() * 10,
            recall: 85 + Math.random() * 12,
            auc: 0.92 + Math.random() * 0.06
        }
    });
}

/**
 * Create sensor data popup content
 */
function createSensorDataPopup(node) {
    return {
        nodeId: node.id,
        name: node.name,
        type: node.nodeType,
        data: {
            hydraulic: {
                pressure: node.pressure,
                flow: node.flow,
                elevation: node.elevation
            },
            acoustic: {
                spectralFreq: 240 + Math.random() * 20,
                rmsPower: 0.8 + Math.random() * 0.2,
                kurtosis: 2.8 + Math.random() * 0.8,
                skewness: 0.4 + Math.random() * 0.4
            },
            aiMetrics: {
                leakConfidence: Math.floor(45 + Math.random() * 40),
                accuracy: 90 + Math.random() * 8,
                precision: 88 + Math.random() * 10,
                recall: 85 + Math.random() * 12,
                auc: 0.92 + Math.random() * 0.06
            }
        }
    };
}

/**
 * Show comprehensive pipe information tooltip
 */
function showPipeTooltip(pipeId) {
    const pipe = networkPipes[pipeId];
    if (!pipe) {
        console.error('❌ Pipe not found:', pipeId);
        return;
    }

    console.log('🔧 showPipeTooltip called for:', pipeId);
    console.log('🔍 Pipe data:', pipe);

    // Hide any existing tooltip first
    hidePipeTooltip();

    // Get tooltip element
    const tooltip = document.getElementById('pipeTooltip');
    if (!tooltip) {
        console.error('❌ Tooltip element not found');
        return;
    }

    console.log('✅ Tooltip element found, initial classes:', tooltip.className);
    console.log('✅ Tooltip initial display style:', tooltip.style.display);

    // Generate realistic acoustic and AI data based on pipe properties
    const acousticData = generateAcousticData(pipe);
    const aiData = generateAIData(pipe);

    console.log('📊 Generated data:', { acousticData, aiData });

    // Update tooltip content
    updateTooltipContent(pipe, acousticData, aiData);

    // Position tooltip intelligently
    positionTooltip(tooltip, pipe);

    // Show tooltip with animation
    setTimeout(() => {
        tooltip.classList.add('visible');
        console.log('✅ Visible class added. Final classes:', tooltip.className);
        console.log('✅ Tooltip should now be visible');
    }, 10);

    console.log('💬 Showing pipe tooltip for:', pipeId);
}

/**
 * Hide pipe tooltip
 */
function hidePipeTooltip() {
    const tooltip = document.getElementById('pipeTooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
        // Reset position classes
        tooltip.classList.remove('top', 'bottom', 'left', 'right');
    }
}

/**
 * Generate realistic acoustic data for pipe based on actual properties
 */
function generateAcousticData(pipe) {
    // Calculate realistic acoustic data based on pipe properties
    const baseFreq = calculateBaseFrequency(pipe);
    const rmsPower = calculateRMSPower(pipe);
    const signalQuality = getSignalQuality(pipe);

    // Add some realistic variation based on pipe condition
    const conditionVariation = getPipeConditionVariation(pipe);
    const finalFreq = Math.round((baseFreq + conditionVariation.freq) * 10) / 10;
    const finalRMS = Math.round((rmsPower + conditionVariation.rms) * 1000) / 1000;

    return {
        spectralFreq: Math.max(50, Math.min(800, finalFreq)), // Realistic frequency range
        rmsPower: Math.max(0.1, Math.min(2.0, finalRMS)), // Realistic power range
        signalQuality: signalQuality
    };
}

/**
 * Calculate base frequency based on pipe properties
 */
function calculateBaseFrequency(pipe) {
    // Base frequency calculation based on pipe diameter and material
    const diameterFactor = pipe.diameter / 100; // Normalize diameter
    const materialFactor = {
        'DI': 1.0,    // Ductile Iron - best signal transmission
        'CI': 0.9,    // Cast Iron - good transmission
        'PVC': 0.7,   // PVC - moderate transmission
        'PE': 0.6     // Polyethylene - poorer transmission
    };

    const material = materialFactor[pipe.material] || 0.8;
    const baseFreq = 300 - (diameterFactor * 50); // Larger pipes = lower frequency
    return baseFreq * material;
}

/**
 * Calculate RMS power based on flow and pipe properties
 */
function calculateRMSPower(pipe) {
    // RMS power based on flow rate and pipe characteristics
    const flowFactor = Math.min(1.5, pipe.flow / 30); // Normalize flow
    const diameterFactor = pipe.diameter / 200; // Normalize diameter
    const materialFactor = {
        'DI': 1.2,    // Metal pipes transmit better
        'CI': 1.1,
        'PVC': 0.8,
        'PE': 0.7
    };

    const material = materialFactor[pipe.material] || 0.9;
    const baseRMS = 0.5 + (flowFactor * 0.4) + (diameterFactor * 0.2);
    return baseRMS * material;
}

/**
 * Get pipe condition variation for realistic data
 */
function getPipeConditionVariation(pipe) {
    // Simulate pipe condition effects on signal
    const age = pipe.age || Math.random() * 20; // Assume pipe age
    const condition = pipe.condition || (Math.random() > 0.7 ? 'good' : 'fair');

    const variations = {
        'good': { freq: (Math.random() - 0.5) * 10, rms: (Math.random() - 0.5) * 0.1 },
        'fair': { freq: (Math.random() - 0.5) * 25, rms: (Math.random() - 0.5) * 0.2 },
        'poor': { freq: (Math.random() - 0.5) * 40, rms: (Math.random() - 0.5) * 0.3 }
    };

    return variations[condition] || variations['fair'];
}

/**
 * Generate realistic AI data for pipe
 */
function generateAIData(pipe) {
    // Base anomaly score influenced by pipe age, material, and current flow
    const materialRisk = { 'DI': 0.1, 'PVC': 0.2, 'PE': 0.3, 'CI': 0.4 };
    const baseAnomaly = materialRisk[pipe.material] || 0.2;

    // Higher flow velocity = higher leak probability
    const velocityFactor = Math.min(0.8, pipe.velocity / 2);
    const leakProbability = Math.round((baseAnomaly + velocityFactor + (Math.random() * 0.3)) * 100);

    return {
        leakProbability: Math.min(95, Math.max(5, leakProbability)),
        anomalyScore: Math.round((baseAnomaly + (Math.random() * 0.4)) * 100) / 100
    };
}

/**
 * Get signal quality based on pipe properties
 */
function getSignalQuality(pipe) {
    const noise = Math.random();
    const materialQuality = { 'DI': 0.9, 'PVC': 0.8, 'PE': 0.7, 'CI': 0.6 };
    const baseQuality = materialQuality[pipe.material] || 0.7;

    const quality = baseQuality - (noise * 0.3);
    if (quality > 0.8) return 'Excellent';
    if (quality > 0.6) return 'Good';
    if (quality > 0.4) return 'Fair';
    return 'Poor';
}

/**
 * Update tooltip content with pipe data
 */
function updateTooltipContent(pipe, acousticData, aiData) {
    // Update header
    document.getElementById('tooltipPipeName').textContent = pipe.name;

    // Update hydraulic data
    document.getElementById('tooltipLength').textContent = `${pipe.length}m`;
    document.getElementById('tooltipDiameter').textContent = `${pipe.diameter}mm`;
    document.getElementById('tooltipMaterial').textContent = getMaterialFullName(pipe.material);
    document.getElementById('tooltipFlow').textContent = `${pipe.flow.toFixed(1)} L/s`;
    document.getElementById('tooltipVelocity').textContent = `${pipe.velocity.toFixed(1)} m/s`;

    // Update acoustic data
    document.getElementById('tooltipSpectral').textContent = `${acousticData.spectralFreq} Hz`;
    document.getElementById('tooltipRMS').textContent = acousticData.rmsPower.toFixed(3);
    document.getElementById('tooltipSignalQuality').textContent = acousticData.signalQuality;

    // Update AI data
    document.getElementById('tooltipLeakProb').textContent = `${aiData.leakProbability}%`;
    document.getElementById('tooltipAnomaly').textContent = aiData.anomalyScore.toFixed(2);

    // Apply color coding based on values
    applyDataValueStyling(aiData.leakProbability, aiData.anomalyScore, acousticData);
}

/**
 * Get full material name from abbreviation
 */
function getMaterialFullName(abbrev) {
    const materials = {
        'DI': 'Ductile Iron',
        'PVC': 'PVC',
        'PE': 'Polyethylene',
        'CI': 'Cast Iron'
    };
    return materials[abbrev] || abbrev;
}

/**
 * Apply color coding to data values based on thresholds
 */
function applyDataValueStyling(leakProbability, anomalyScore, acousticData) {
    // Style leak probability
    const leakProbElement = document.getElementById('tooltipLeakProb');
    if (leakProbability > 70) {
        leakProbElement.className = 'data-value high';
    } else if (leakProbability > 40) {
        leakProbElement.className = 'data-value medium';
    } else {
        leakProbElement.className = 'data-value good';
    }

    // Style anomaly score
    const anomalyElement = document.getElementById('tooltipAnomaly');
    if (anomalyScore > 0.7) {
        anomalyElement.className = 'data-value high';
    } else if (anomalyScore > 0.4) {
        anomalyElement.className = 'data-value medium';
    } else {
        anomalyElement.className = 'data-value good';
    }

    // Style signal quality
    const signalElement = document.getElementById('tooltipSignalQuality');
    if (acousticData.signalQuality === 'Excellent' || acousticData.signalQuality === 'Good') {
        signalElement.className = 'data-value good';
    } else if (acousticData.signalQuality === 'Fair') {
        signalElement.className = 'data-value medium';
    } else {
        signalElement.className = 'data-value high';
    }
}

/**
 * Position tooltip intelligently to avoid UI blocking and viewport cutoff
 */
function positionTooltip(tooltip, pipe) {
    if (!epanetCanvas) return;

    const canvasRect = epanetCanvas.getBoundingClientRect();
    const startNode = networkNodes[pipe.startNode];
    const endNode = networkNodes[pipe.endNode];

    if (!startNode || !endNode) return;

    // Calculate pipe center position
    const pipeCenterX = (startNode.x + endNode.x) / 2;
    const pipeCenterY = (startNode.y + endNode.y) / 2;

    // Convert canvas coordinates to screen coordinates
    const screenX = canvasRect.left + pipeCenterX;
    const screenY = canvasRect.top + pipeCenterY;

    // Tooltip dimensions
    const tooltipWidth = 280;
    const tooltipHeight = 320; // Increased height for scrollable content

    // Calculate available space in each direction
    const spaceTop = screenY - canvasRect.top;
    const spaceBottom = canvasRect.bottom - screenY;
    const spaceLeft = screenX - canvasRect.left;
    const spaceRight = canvasRect.right - screenX;

    // Viewport boundaries
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Header height (approx)
    const headerHeight = 70;

    // Position tooltip with improved logic for lower nodes
    let tooltipX, tooltipY, positionClass;

    // Check if clicking on lower portion nodes (where tooltip would be cut off)
    if (screenY > viewportHeight * 0.6) {
        // For lower nodes, prioritize positioning above the click point
        if (spaceTop >= tooltipHeight + 40) {
            // Enough space above - position above pipe
            tooltipX = Math.max(canvasRect.left + 10, Math.min(canvasRect.right - tooltipWidth - 10, screenX - tooltipWidth / 2));
            tooltipY = Math.max(headerHeight + 10, screenY - tooltipHeight - 20);
            positionClass = 'bottom';
        } else if (spaceLeft >= tooltipWidth + 20) {
            // Position to the left
            tooltipX = Math.max(10, screenX - tooltipWidth - 20);
            tooltipY = Math.max(headerHeight + 10, Math.min(viewportHeight - tooltipHeight - 10, screenY - tooltipHeight / 2));
            positionClass = 'right';
        } else if (spaceRight >= tooltipWidth + 20) {
            // Position to the right
            tooltipX = screenX + 20;
            tooltipY = Math.max(headerHeight + 10, Math.min(viewportHeight - tooltipHeight - 10, screenY - tooltipHeight / 2));
            positionClass = 'left';
        } else {
            // Last resort: position in available space, may be partially cut off but scrollable
            tooltipX = Math.max(10, Math.min(viewportWidth - tooltipWidth - 10, screenX - tooltipWidth / 2));
            tooltipY = Math.max(headerHeight + 10, viewportHeight - tooltipHeight - 10);
            positionClass = 'top';
        }
    } else {
        // For upper/middle nodes, use original logic with priority for right side
        if (spaceRight >= tooltipWidth + 20 && (screenX + tooltipWidth + 20) <= viewportWidth) {
            // Position to the right of pipe
            tooltipX = screenX + 15;
            tooltipY = Math.max(headerHeight + 10, Math.min(viewportHeight - tooltipHeight - 10, screenY - tooltipHeight / 2));
            positionClass = 'left';
        } else if (spaceLeft >= tooltipWidth + 20) {
            // Position to the left of pipe
            tooltipX = screenX - tooltipWidth - 15;
            tooltipY = Math.max(headerHeight + 10, Math.min(viewportHeight - tooltipHeight - 10, screenY - tooltipHeight / 2));
            positionClass = 'right';
        } else if (spaceTop >= tooltipHeight + 20) {
            // Position above pipe
            tooltipX = Math.max(canvasRect.left + 10, Math.min(canvasRect.right - tooltipWidth - 10, screenX - tooltipWidth / 2));
            tooltipY = Math.max(headerHeight + 10, screenY - tooltipHeight - 15);
            positionClass = 'bottom';
        } else {
            // Position below pipe
            tooltipX = Math.max(canvasRect.left + 10, Math.min(canvasRect.right - tooltipWidth - 10, screenX - tooltipWidth / 2));
            tooltipY = screenY + 15;
            positionClass = 'top';
        }
    }

    // Final safety check against viewport bounds
    tooltipX = Math.max(10, Math.min(viewportWidth - tooltipWidth - 10, tooltipX));
    tooltipY = Math.max(headerHeight + 10, Math.min(viewportHeight - tooltipHeight - 10, tooltipY));

    // Apply position and class
    tooltip.style.left = `${tooltipX}px`;
    tooltip.style.top = `${tooltipY}px`;
    tooltip.classList.add(positionClass);

    console.log('📍 Tooltip positioned:', {
        x: tooltipX,
        y: tooltipY,
        position: positionClass,
        clickLocation: { x: screenX, y: screenY },
        viewport: { width: viewportWidth, height: viewportHeight },
        headerHeight: headerHeight
    });
}

/**
 * Auto-hide tooltip after delay or on next interaction
 */
function scheduleTooltipAutoHide() {
    // Clear any existing auto-hide timer
    if (window.tooltipAutoHideTimer) {
        clearTimeout(window.tooltipAutoHideTimer);
    }

    // Set new auto-hide timer (5 seconds)
    window.tooltipAutoHideTimer = setTimeout(() => {
        hidePipeTooltip();
        console.log('💬 Tooltip auto-hidden after 5 seconds');
    }, 5000);
}

/**
 * Enhanced click handler for canvas to hide tooltip on clicks outside pipes
 */
function setupTooltipClickHandler() {
    if (!epanetCanvas) return;

    const canvasClickHandler = (e) => {
        const rect = epanetCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let clickedOnPipe = false;

        // Check if click was on a pipe
        for (const pipe of Object.values(networkPipes)) {
            if (isMouseOverPipe(mouseX, mouseY, pipe)) {
                clickedOnPipe = true;
                break;
            }
        }

        // If not clicking on a pipe, hide tooltip
        if (!clickedOnPipe) {
            hidePipeTooltip();
        }
    };

    // Replace existing click handler
    epanetCanvas.removeEventListener('click', epanetCanvas._originalClickHandler);
    epanetCanvas._originalClickHandler = canvasClickHandler;
    epanetCanvas.addEventListener('click', canvasClickHandler);
}

/**
 * Start the animation loop
 */
function startAnimationLoop() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }

    function animate() {
        simulationTime += 0.016; // Simulate time progression
        drawEpanetNetwork();
        animationFrame = requestAnimationFrame(animate);
    }

    animate();
    console.log('✅ EPANET animation loop started');
}

/**
 * Draw the entire EPANET network
 */
function drawEpanetNetwork() {
    if (!ctx || !epanetCanvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, epanetCanvas.width, epanetCanvas.height);

    // Draw background
    drawEpanetBackground();

    // Draw pipes first (so nodes appear on top)
    drawEpanetPipes();

    // Draw nodes
    drawEpanetNodes();

    // Draw labels and titles
    drawEpanetLabels();

    // Draw flow animations
    drawEpanetFlowAnimations();

    // Update simulation time display
    updateSimulationTimeDisplay();
}

/**
 * Draw EPANET background
 */
function drawEpanetBackground() {
    // Create gradient background
    const gradient = ctx.createRadialGradient(
        epanetCanvas.width / 2, epanetCanvas.height / 2, 0,
        epanetCanvas.width / 2, epanetCanvas.height / 2, Math.max(epanetCanvas.width, epanetCanvas.height) / 2
    );
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
    gradient.addColorStop(1, 'rgba(30, 41, 59, 0.98)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, epanetCanvas.width, epanetCanvas.height);

    // Draw grid pattern - reduced opacity for better contrast
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
    ctx.lineWidth = 1;

    const gridSize = 50;
    for (let x = 0; x < epanetCanvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, epanetCanvas.height);
        ctx.stroke();
    }

    for (let y = 0; y < epanetCanvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(epanetCanvas.width, y);
        ctx.stroke();
    }
}

/**
 * Draw all EPANET pipes
 */
function drawEpanetPipes() {
    for (const pipe of Object.values(networkPipes)) {
        drawEpanetPipe(pipe);
    }
}

/**
 * Draw a single EPANET pipe
 */
function drawEpanetPipe(pipe) {
    const startNode = networkNodes[pipe.startNode];
    const endNode = networkNodes[pipe.endNode];

    if (!startNode || !endNode) return;

    // Determine pipe color and style based on status
    let pipeColor = '#96ceb4'; // Normal
    let lineWidth = Math.max(2, pipe.diameter / 100);

    if (activeScenarios[pipe.id]) {
        const severity = activeScenarios[pipe.id];
        pipeColor = `rgba(255, 107, 53, ${0.6 + severity * 0.4})`; // Leaking
        lineWidth = Math.max(4, pipe.diameter / 80);
    } else if (pipe.velocity > 1.5) {
        pipeColor = '#ffd93d'; // High velocity
        lineWidth = Math.max(3, pipe.diameter / 90);
    }

    // Draw pipe line
    ctx.strokeStyle = pipeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    // Draw main pipe
    ctx.beginPath();
    ctx.moveTo(startNode.x, startNode.y);
    ctx.lineTo(endNode.x, endNode.y);
    ctx.stroke();

    // Draw selection highlight
    if (epanetSelectedPipe === pipe.id) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = lineWidth + 4;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // Draw flow direction indicator
    const midX = (startNode.x + endNode.x) / 2;
    const midY = (startNode.y + endNode.y) / 2;
    const angle = Math.atan2(endNode.y - startNode.y, endNode.x - startNode.x);

    // Draw arrow for flow direction
    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);

    // Arrow shaft
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(15, 0);
    ctx.stroke();

    // Arrow head
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(10, -4);
    ctx.lineTo(10, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Draw pipe label
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(pipe.id, midX, midY - 8);
}

/**
 * Draw all EPANET nodes
 */
function drawEpanetNodes() {
    for (const node of Object.values(networkNodes)) {
        drawEpanetNode(node);
    }
}

/**
 * Draw a single EPANET node
 */
function drawEpanetNode(node) {
    // Determine node style based on type
    let nodeColor, nodeSize, nodeShape;

    switch (node.nodeType) {
        case 'source':
            nodeColor = '#ff6b35'; // Orange for sources
            nodeSize = 18;
            nodeShape = 'square';
            break;
        case 'tank':
            nodeColor = '#4ecdc4'; // Cyan for tanks
            nodeSize = 16;
            nodeShape = 'pentagon';
            break;
        case 'junction':
        default:
            nodeColor = '#96ceb4'; // Green for junctions
            nodeSize = 12;
            nodeShape = 'circle';
            break;
    }

    // Adjust color based on pressure
    if (node.pressure < 40) nodeColor = '#ef4444';
    if (node.pressure > 70) nodeColor = '#f59e0b';

    ctx.fillStyle = nodeColor;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Draw node based on shape
    ctx.beginPath();
    switch (nodeShape) {
        case 'square':
            ctx.rect(node.x - nodeSize, node.y - nodeSize, nodeSize * 2, nodeSize * 2);
            break;
        case 'pentagon':
            drawPentagon(node.x, node.y, nodeSize);
            break;
        case 'circle':
        default:
            ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
            break;
    }
    ctx.fill();
    ctx.stroke();

    // Draw node label with improved contrast
    ctx.fillStyle = '#E8EAF6'; // Lighter color for better contrast
    ctx.font = 'bold 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(node.id, node.x, node.y + nodeSize + 15);

    // Draw pressure value with improved contrast
    ctx.fillStyle = '#E8EAF6'; // Lighter color for better contrast
    ctx.font = '9px Inter';
    ctx.fillText(`${node.pressure.toFixed(1)}m`, node.x, node.y + nodeSize + 26);

    // Draw flow value for all nodes with improved contrast
    ctx.fillStyle = '#B0BEC5'; // Lighter color for better contrast
    ctx.font = '8px Inter';
    ctx.fillText(`${node.flow.toFixed(1)}L/s`, node.x, node.y + nodeSize + 35);
}

/**
 * Draw pentagon shape for tanks
 */
function drawPentagon(x, y, size) {
    const angle = (2 * Math.PI) / 5;
    ctx.moveTo(x + size * Math.cos(0), y + size * Math.sin(0));

    for (let i = 1; i <= 5; i++) {
        ctx.lineTo(
            x + size * Math.cos(i * angle),
            y + size * Math.sin(i * angle)
        );
    }
    ctx.closePath();
}

/**
 * Draw EPANET labels and titles
 */
function drawEpanetLabels() {
    // Legend temporarily hidden as requested
    // drawEpanetLegend();
}

/**
 * Draw EPANET legend below floating controls
 */
function drawEpanetLegend() {
    // Position legend below floating controls (search and live status)
    const margin = 20;
    const legendWidth = 200;
    const legendHeight = 100;

    // Position below floating controls (top: 100px + controls height + gap)
    const floatingControlsHeight = 100; // Approximate height of floating controls + gap
    const legendX = Math.max(margin, epanetCanvas.width - legendWidth - margin);
    const legendY = floatingControlsHeight + margin;

    // Ensure legend stays within canvas bounds
    const safeLegendX = Math.min(legendX, epanetCanvas.width - legendWidth - margin);
    const safeLegendY = Math.min(legendY, epanetCanvas.height - legendHeight - margin);

    // Legend background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(safeLegendX, safeLegendY, legendWidth, legendHeight);

    // Legend border
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(safeLegendX, safeLegendY, legendWidth, legendHeight);

    // Legend title
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 12px Inter';
    ctx.fillText('Network Legend', safeLegendX + 10, safeLegendY + 20);

    // Node types
    ctx.font = '10px Inter';

    // Source
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(safeLegendX + 10, safeLegendY + 30, 12, 12);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Water Source (Lake/River)', safeLegendX + 25, safeLegendY + 40);

    // Tank
    ctx.fillStyle = '#4ecdc4';
    drawPentagon(safeLegendX + 16, safeLegendY + 52, 6);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Storage Tank', safeLegendX + 25, safeLegendY + 57);

    // Junction
    ctx.fillStyle = '#96ceb4';
    ctx.beginPath();
    ctx.arc(safeLegendX + 16, safeLegendY + 70, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Junction Node', safeLegendX + 25, safeLegendY + 75);

    // Pipe states
    ctx.strokeStyle = '#96ceb4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(safeLegendX + 10, safeLegendY + 85);
    ctx.lineTo(safeLegendX + 20, safeLegendY + 85);
    ctx.stroke();
    ctx.fillText('Normal Pipe', safeLegendX + 25, safeLegendY + 90);

    console.log('📊 Legend positioned at:', { x: safeLegendX, y: safeLegendY, canvasSize: { width: epanetCanvas.width, height: epanetCanvas.height } });
}

/**
 * Draw EPANET flow animations
 */
function drawEpanetFlowAnimations() {
    const time = Date.now() * 0.002;

    for (const pipe of Object.values(networkPipes)) {
        if (activeScenarios[pipe.id]) continue; // Skip leaking pipes

        const startNode = networkNodes[pipe.startNode];
        const endNode = networkNodes[pipe.endNode];

        if (!startNode || !endNode) continue;

        // Draw animated flow particles
        const numParticles = Math.floor(pipe.flow / 10);
        for (let i = 0; i < numParticles; i++) {
            const t = ((time + i * 0.8) % 2) / 2;
            const x = startNode.x + t * (endNode.x - startNode.x);
            const y = startNode.y + t * (endNode.y - startNode.y);

            ctx.fillStyle = `rgba(34, 197, 94, ${0.9 - t * 0.5})`;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

/**
 * Update simulation time display
 */
function updateSimulationTimeDisplay() {
    const minutes = Math.floor(simulationTime / 60);
    const seconds = Math.floor(simulationTime % 60);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const timeElement = document.getElementById('simTime');
    if (timeElement) {
        timeElement.textContent = timeStr;
    }
}

/**
 * Update network with real-time sensor data
 */
function updateEpanetWithSensorData(data) {
    if (!data.node_pressures) return;

    // Update node pressures
    Object.entries(data.node_pressures).forEach(([nodeId, pressure]) => {
        if (networkNodes[nodeId]) {
            networkNodes[nodeId].pressure = pressure;
        }
    });

    // Update pipe flows based on connected nodes
    Object.values(networkPipes).forEach(pipe => {
        const startNode = networkNodes[pipe.startNode];
        const endNode = networkNodes[pipe.endNode];

        if (startNode && endNode) {
            pipe.flow = (startNode.flow + endNode.flow) / 2;
            pipe.velocity = pipe.flow / (Math.PI * Math.pow(pipe.diameter / 2000, 2));
        }
    });

    console.log('✅ EPANET network updated with sensor data');
}

/**
 * Inject leak scenario at selected pipe
 */
function injectEpanetLeak(pipeId, severity) {
    console.log('💧 DEBUG: injectEpanetLeak called with:', pipeId, severity);
    console.log('🔍 DEBUG: activeScenarios before:', JSON.stringify(activeScenarios));
    console.log('🔍 DEBUG: networkPipes exists:', !!networkPipes);
    console.log('🔍 DEBUG: networkNodes exists:', !!networkNodes);

    // Add to active scenarios
    activeScenarios[pipeId] = severity;
    console.log('✅ DEBUG: activeScenarios after update:', JSON.stringify(activeScenarios));

    // Update connected nodes
    const pipe = networkPipes[pipeId];
    console.log('🔍 DEBUG: pipe found:', !!pipe);

    if (pipe) {
        const startNode = networkNodes[pipe.startNode];
        const endNode = networkNodes[pipe.endNode];
        console.log('🔍 DEBUG: nodes found:', {
            startNode: !!startNode,
            endNode: !!endNode,
            startNodeId: pipe.startNode,
            endNodeId: pipe.endNode
        });

        if (startNode) {
            const oldPressure = startNode.pressure;
            startNode.pressure *= (1 - severity * 0.3);
            console.log('🔧 DEBUG: Updated startNode pressure:', oldPressure, '→', startNode.pressure);
        }
        if (endNode) {
            const oldPressure = endNode.pressure;
            endNode.pressure *= (1 - severity * 0.3);
            console.log('🔧 DEBUG: Updated endNode pressure:', oldPressure, '→', endNode.pressure);
        }
    }

    // Send to backend
    console.log('🌐 DEBUG: Sending to backend...');
    fetch(`${BASE_URL}/api/scenarios/leak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipe_id: pipeId, severity: severity })
    }).then(response => {
        console.log('🌐 DEBUG: Backend response status:', response.status);
        if (response.ok) {
            updateSimulationStatus(`💧 Injected ${severity.toFixed(1)} severity leak in ${pipeId}`);
            console.log('✅ DEBUG: Status updated, about to redraw');
            // ✅ Force immediate visual update
            console.log('🔍 DEBUG: ctx exists:', !!ctx, 'epanetCanvas exists:', !!epanetCanvas);
            if (ctx && epanetCanvas) {
                console.log('🎨 DEBUG: Calling drawEpanetNetwork()');
                drawEpanetNetwork();
                console.log('🎨 DEBUG: Forced immediate redraw after leak injection');
            } else {
                console.error('❌ DEBUG: Canvas or context not available for redraw!');
                console.log('🔍 DEBUG: Canvas elements:', {
                    epanetCanvas: !!document.getElementById('epanetCanvas'),
                    ctx: !!ctx
                });
            }
        } else {
            throw new Error(`Backend error: ${response.status}`);
        }
    }).catch(error => {
        console.error('❌ DEBUG: Error injecting leak:', error);
        updateSimulationStatus(`❌ Error injecting leak: ${error.message}`);
    });
}

/**
 * Apply demand spike scenario
 */
function applyEpanetDemandSpike(multiplier, duration) {
    console.log('⚡ Applying EPANET demand spike:', multiplier, duration);

    // Update all node flows
    Object.values(networkNodes).forEach(node => {
        if (node.nodeType === 'junction') {
            node.flow *= multiplier;
        }
    });

    // Send to backend
    fetch(`${BASE_URL}/api/scenarios/demand-spike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ multiplier: multiplier, duration_s: duration })
    }).then(response => {
        if (response.ok) {
            updateSimulationStatus(`⚡ Applied ${multiplier.toFixed(1)}x demand spike for ${duration}s`);
        } else {
            throw new Error('Backend error');
        }
    }).catch(error => {
        console.error('❌ Error applying demand spike:', error);
        updateSimulationStatus(`❌ Error applying demand spike: ${error.message}`);
    });
}

/**
 * Clear all active scenarios
 */
function clearEpanetScenarios() {
    console.log('🧹 Clearing all EPANET scenarios');

    // Clear active scenarios
    activeScenarios = {};

    // Reset node pressures and flows
    Object.values(networkNodes).forEach(node => {
        node.pressure = 50 + Math.random() * 20;
        node.flow = 10 + Math.random() * 15;
    });

    // Send clear command to backend
    fetch(`${BASE_URL}/api/scenarios/leak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipe_id: 'NONE', severity: 0 })
    }).then(() => {
        updateSimulationStatus('🧹 All scenarios cleared');
    }).catch(error => {
        console.error('❌ Error clearing scenarios:', error);
    });
}

/**
 * Update simulation status display
 */
function updateSimulationStatus(message) {
    const statusElement = document.getElementById('simStatus');
    if (statusElement) {
        statusElement.textContent = message;
    }
    console.log('📊 Simulation status:', message);
}

/**
 * Initialize EPANET simulation mode
 */
function initSimulationMode() {
    console.log('🚀 Initializing EPANET Simulation Mode');

    // Initialize network if not already done
    if (!isInitialized) {
        initEpanetVisualization();
    }

    // Set up control panel event handlers
    setupEpanetControlPanelHandlers();

    // Update status
    updateSimulationStatus('🏭 EPANET Network Ready - Click on nodes to view sensor data');

    console.log('✅ EPANET Simulation Mode initialized');
}

/**
 * Set up EPANET control panel event handlers
 */
function setupEpanetControlPanelHandlers() {
    // Leak injection button
    const leakBtn = document.getElementById('simLeakBtn');
    if (leakBtn) {
        leakBtn.onclick = () => {
            const pipeSelect = document.getElementById('simPipeSelect');
            const severityInput = document.getElementById('simLeakSev');
            if (pipeSelect && severityInput) {
                injectEpanetLeak(pipeSelect.value, parseFloat(severityInput.value));
            }
        };
    }

    // Clear leaks button
    const clearBtn = document.getElementById('simClearLeakBtn');
    if (clearBtn) {
        clearBtn.onclick = clearEpanetScenarios;
    }

    // Demand spike button
    const demandBtn = document.getElementById('simDemandBtn');
    if (demandBtn) {
        demandBtn.onclick = () => {
            const multiplierInput = document.getElementById('simDemandMul');
            const durationInput = document.getElementById('simDemandDur');
            if (multiplierInput && durationInput) {
                applyEpanetDemandSpike(
                    parseFloat(multiplierInput.value),
                    parseInt(durationInput.value)
                );
            }
        };
    }

    // Quick leak injection
    const quickLeakBtn = document.getElementById('quickLeakBtn');
    if (quickLeakBtn) {
        quickLeakBtn.onclick = () => {
            const pipeInput = document.getElementById('quickLeakPipe');
            const severityInput = document.getElementById('quickLeakSev');
            if (pipeInput && severityInput) {
                injectEpanetLeak(pipeInput.value, parseFloat(severityInput.value));
            }
        };
    }

    // Quick demand spike
    const quickDemandBtn = document.getElementById('quickDemandBtn');
    if (quickDemandBtn) {
        quickDemandBtn.onclick = () => {
            const multiplierInput = document.getElementById('quickDemandMul');
            const durationInput = document.getElementById('quickDemandDur');
            if (multiplierInput && durationInput) {
                applyEpanetDemandSpike(
                    parseFloat(multiplierInput.value),
                    parseInt(durationInput.value)
                );
            }
        };
    }

    // Pause/Resume button
    const pauseBtn = document.getElementById('simPauseBtn');
    if (pauseBtn) {
        pauseBtn.onclick = () => {
            updateSimulationStatus('⏸️ Simulation paused');
        };
    }

    // Reset button
    const resetBtn = document.getElementById('simResetBtn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            clearEpanetScenarios();
            updateSimulationStatus('🔄 Network reset complete');
        };
    }

    console.log('✅ EPANET control panel handlers set up');
}

// 🌟 UPDATE MAP WITH SENSOR DATA - This is the missing function!
function updateMapWithSensorData(data) {
    console.log('🗺️ Updating map with sensor data:', data);

    if (data.node_pressures) {
        console.log('📊 Updating node pressures:', data.node_pressures);

        // Update node pressures from hydraulic model data
        Object.entries(data.node_pressures).forEach(([nodeId, pressure]) => {
            if (networkNodes[nodeId]) {
                console.log(`  🔧 Node ${nodeId}: ${networkNodes[nodeId].pressure.toFixed(1)} → ${pressure.toFixed(1)} psi`);
                networkNodes[nodeId].pressure = pressure;
            }
        });

        // Update pipe flows based on connected nodes
        Object.values(networkPipes).forEach(pipe => {
            const startNode = networkNodes[pipe.startNode];
            const endNode = networkNodes[pipe.endNode];

            if (startNode && endNode) {
                // Calculate flow based on pressure difference and hydraulic model
                const avgPressure = (startNode.pressure + endNode.pressure) / 2;
                const baselinePressure = 52.0; // Baseline pressure

                // Flow reduction due to pressure drops
                const pressureFactor = Math.max(0.3, avgPressure / baselinePressure);
                const oldFlow = pipe.flow;
                pipe.flow = pipe.flow * pressureFactor;

                console.log(`  🌊 Pipe ${pipe.id}: flow ${oldFlow.toFixed(1)} → ${pipe.flow.toFixed(1)} L/s`);
            }
        });

        // Force immediate visual update
        console.log('🎨 Forcing network redraw with updated data');
        drawEpanetNetwork();
    }

    // Update anomaly location if present
    if (data.anomaly && data.anomaly.location) {
        console.log('🚨 Anomaly detected at:', data.anomaly.location);
        // Could add visual anomaly indicators here
    }
}

// Export functions for use in main app.js
window.initSimulationMode = initSimulationMode;
window.updateEpanetWithSensorData = updateEpanetWithSensorData;
window.updateMapWithSensorData = updateMapWithSensorData; // ✅ ADD THIS MISSING FUNCTION
window.injectEpanetLeak = injectEpanetLeak;
window.applyEpanetDemandSpike = applyEpanetDemandSpike;
window.clearEpanetScenarios = clearEpanetScenarios;
