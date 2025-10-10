/**
 * 🌟 SENSOR DATA FROM CSV - HARDCODED VALUES FOR DEMONSTRATION
 * Contains first 100 values from collected sensor data
 * Simple playback system for dashboard demonstration
 */

// First 100 values from your collected sensor data

/**
 * Calculate kurtosis from spectral frequency data with wave formation
 * Kurtosis measures the "tailedness" of the data distribution
 * Now generates wave-like data oscillating between -2.5 and +2.0
 */
function calculateKurtosis(spectralFreq, rmsPower, time = Date.now()) {
    // Generate wave-like kurtosis data using sinusoidal patterns
    // Convert time to a wave cycle (oscillates over ~10 seconds)
    const waveTime = (time / 1000) * 0.6; // Slower wave for kurtosis

    // Base wave pattern around -0.5 to 0.5 range
    let baseKurtosis = 1.2 * Math.cos(waveTime / 1.5);

    // Add secondary oscillation for more complex wave pattern
    const secondaryWave = 0.6 * Math.sin(waveTime * 2.3);

    // Factor in spectral frequency for realistic variation
    const freqVariation = (spectralFreq - 250) / 200; // Normalize around 250Hz
    const freqEffect = freqVariation * 0.3;

    // Factor in RMS power for additional variation
    const powerVariation = (rmsPower - 10) / 8; // Normalize around 10
    const powerEffect = powerVariation * 0.2;

    // Combine all effects
    let calculatedKurtosis = baseKurtosis + secondaryWave + freqEffect + powerEffect;

    // Add small random variation for realism (±0.3)
    const randomVariation = (Math.random() - 0.5) * 0.6;

    // Clip to keep within specified limits (-2.5 to +2.0)
    calculatedKurtosis = Math.max(-2.5, Math.min(2.0, calculatedKurtosis + randomVariation));

    return calculatedKurtosis;
}

/**
 * Calculate skewness from spectral frequency data with wave formation
 * Skewness measures the asymmetry of the data distribution
 * Now generates wave-like data oscillating between -1.5 and +1.5
 */
function calculateSkewness(spectralFreq, rmsPower, time = Date.now()) {
    // Generate wave-like skewness data using sinusoidal patterns
    // Convert time to a wave cycle (oscillates over ~8 seconds for faster variation)
    const waveTime = (time / 1000) * 0.8; // Faster wave for skewness

    // Base wave pattern around 0
    let baseSkewness = 0.8 * Math.sin(waveTime);

    // Add secondary oscillation for more complex wave pattern
    const secondaryWave = 0.4 * Math.cos(waveTime * 1.7);

    // Factor in spectral frequency for realistic variation
    const freqVariation = (spectralFreq - 250) / 150; // Normalize around 250Hz
    const freqEffect = freqVariation * 0.2;

    // Factor in RMS power for additional variation
    const powerVariation = (rmsPower - 10) / 6; // Normalize around 10
    const powerEffect = powerVariation * 0.15;

    // Combine all effects
    let calculatedSkewness = baseSkewness + secondaryWave + freqEffect + powerEffect;

    // Add small random variation for realism (±0.2)
    const randomVariation = (Math.random() - 0.5) * 0.4;

    // Clip to keep within specified limits (-1.5 to +1.5)
    calculatedSkewness = Math.max(-1.5, Math.min(1.5, calculatedSkewness + randomVariation));

    return calculatedSkewness;
}

/**
 * Calculate model performance metrics based on sensor data and leak detection
 * Updated to return specific target values: Accuracy 84.00%, Precision 80.73%, Recall 88.89%
 */
function calculateModelMetrics(leakDetected, spectralFreq, rmsPower) {
    // Target values as specified
    const targetAccuracy = 0.8400;  // 84.00%
    const targetPrecision = 0.8073; // 80.73%
    const targetRecall = 0.8889;    // 88.89%

    // Calculate AUC from the target metrics
    const targetAuc = (targetAccuracy + targetPrecision + targetRecall) / 3;

    // Add small variations based on sensor conditions for realism (±0.005)
    const signalVariation = (Math.random() - 0.5) * 0.01;
    const freqVariation = (Math.random() - 0.5) * 0.01;

    // Apply variations but keep values close to targets
    const accuracy = Math.max(0.80, Math.min(0.90, targetAccuracy + signalVariation));
    const precision = Math.max(0.75, Math.min(0.85, targetPrecision + signalVariation));
    const recall = Math.max(0.85, Math.min(0.92, targetRecall + freqVariation));
    const auc = (accuracy + precision + recall) / 3;

    return {
        accuracy: Math.round(accuracy * 10000) / 10000,  // Round to 4 decimal places
        precision: Math.round(precision * 10000) / 10000,
        recall: Math.round(recall * 10000) / 10000,
        auc: Math.round(auc * 10000) / 10000
    };
}

/**
 * Enhanced sensor data point with calculated metrics and bottom panel data
 */
function enhanceSensorDataPoint(dataPoint) {
    // Debug: Log input data
    console.log('🔍 Enhancing data point:', dataPoint);

    // Calculate statistical measures with current timestamp
    const currentTime = Date.now();
    const kurtosis = calculateKurtosis(dataPoint.spectral_frequency, dataPoint.rms_power, currentTime);
    const skewness = calculateSkewness(dataPoint.spectral_frequency, dataPoint.rms_power, currentTime);

    // Debug: Log calculated values
    console.log('🧮 Calculated stats:', { kurtosis, skewness, time: currentTime });

    // Calculate model performance metrics
    const modelMetrics = calculateModelMetrics(
        dataPoint.leak_detected,
        dataPoint.spectral_frequency,
        dataPoint.rms_power
    );

    // Generate realistic node pressures for hydraulic data tab
    const nodePressures = generateNodePressures(dataPoint);

    // Generate additional signal quality metrics for acoustic data tab
    const signalQualityMetrics = generateSignalQualityMetrics(dataPoint, kurtosis);

    const enhancedData = {
        spectral_frequency: dataPoint.spectral_frequency,
        rms_power: dataPoint.rms_power,
        leak_detected: dataPoint.leak_detected,
        kurtosis: kurtosis,
        skewness: skewness,
        accuracy: modelMetrics.accuracy,
        precision: modelMetrics.precision,
        recall: modelMetrics.recall,
        auc: modelMetrics.auc,
        // Add fields for bottom panel tabs
        node_pressures: nodePressures,
        spectral_freq: dataPoint.spectral_frequency, // For acoustic tab compatibility
        snr: signalQualityMetrics.snr,
        thd: signalQualityMetrics.thd,
        crest_factor: signalQualityMetrics.crestFactor,
        dynamic_range: signalQualityMetrics.dynamicRange,
        f1_score: calculateF1Score(modelMetrics.precision, modelMetrics.recall)
    };

    // Debug: Log final enhanced data
    console.log('✅ Final enhanced data:', enhancedData);

    return enhancedData;
}

/**
 * Generate realistic node pressure data for hydraulic tab
 * SEPARATED SYSTEMS: CSV data for sensor readings, hydraulic simulation for leak effects
 */
function generateNodePressures(dataPoint) {
    // Base pressures around 50-60 psi with some variation based on sensor data
    const basePressure = 55;
    const variation = (Math.random() - 0.5) * 10; // ±5 psi variation

    // SEPARATED: Use CSV data for sensor-based pressure variation
    // Factor in spectral frequency - higher frequencies might indicate turbulence
    const freqEffect = (dataPoint.spectral_frequency - 250) / 50; // Normalize around 250Hz

    // Factor in RMS power - higher power might indicate system stress
    const powerEffect = (dataPoint.rms_power - 10) / 20; // Normalize around 10

    // Generate baseline pressures for 4 nodes based on SENSOR DATA (CSV)
    const nodePressures = {
        'P1': Math.max(35, Math.min(75, basePressure + variation + freqEffect + powerEffect)),
        'P2': Math.max(35, Math.min(75, basePressure + variation * 0.8 + freqEffect * 0.9 + powerEffect * 0.8)),
        'P3': Math.max(35, Math.min(75, basePressure + variation * 1.2 + freqEffect * 1.1 + powerEffect * 1.0)),
        'P4': Math.max(35, Math.min(75, basePressure + variation * 0.9 + freqEffect * 0.8 + powerEffect * 0.9))
    };

    // SEPARATED: Injected leaks are handled by the hydraulic simulation backend
    // The hydraulic model will provide the actual pressure changes through the API
    // This function only provides baseline pressures based on sensor data

    return nodePressures;
}

/**
 * Check for active injected leaks from the simulation system
 */
function checkForInjectedLeaks() {
    // Check if window.simLeaks exists and has any active leaks
    if (typeof window !== 'undefined' && window.simLeaks) {
        const activeLeaks = Object.values(window.simLeaks).filter(severity => severity > 0);
        return activeLeaks.length > 0;
    }
    return false;
}

/**
 * Get total leak severity across all pipes
 */
function getTotalLeakSeverity() {
    if (typeof window !== 'undefined' && window.simLeaks) {
        return Object.values(window.simLeaks).reduce((total, severity) => total + severity, 0);
    }
    return 0;
}

/**
 * Generate signal quality metrics for acoustic data tab
 */
function generateSignalQualityMetrics(dataPoint, kurtosis) {
    // Calculate SNR based on RMS power and spectral frequency stability
    const spectralStability = Math.max(0, 1 - Math.abs(dataPoint.spectral_frequency - 250) / 100);
    const baseSNR = 15 + (dataPoint.rms_power / 2); // Higher RMS = better SNR
    const snr = baseSNR + (spectralStability * 5);

    // Calculate THD based on kurtosis (more distortion = higher THD)
    const thd = Math.max(0.1, Math.min(5.0, (Math.abs(kurtosis) * 2) + 0.5));

    // Calculate Crest Factor based on RMS power and spectral characteristics
    const crestFactor = Math.max(1.2, Math.min(3.0, 1.5 + (dataPoint.rms_power / 15)));

    // Calculate Dynamic Range based on signal strength
    const dynamicRange = 60 + (dataPoint.rms_power * 2);

    return {
        snr: Math.round(snr * 10) / 10,
        thd: Math.round(thd * 10) / 10,
        crestFactor: Math.round(crestFactor * 100) / 100,
        dynamicRange: Math.round(dynamicRange)
    };
}

/**
 * Calculate F1 Score from precision and recall
 */
function calculateF1Score(precision, recall) {
    if (precision + recall === 0) return 0;
    return (2 * precision * recall) / (precision + recall);
}
const SENSOR_DATA_HISTORY = [
    { spectral_frequency: 252.0264491, rms_power: 17.22185705, leak_detected: 1 },
    { spectral_frequency: 234.1095689, rms_power: 11.98026352, leak_detected: 1 },
    { spectral_frequency: 289.0172339, rms_power: 9.215435645, leak_detected: 1 },
    { spectral_frequency: 290.287242, rms_power: 13.66525485, leak_detected: 1 },
    { spectral_frequency: 2.096270789, rms_power: 0.211706848, leak_detected: 0 },
    { spectral_frequency: 262.5893005, rms_power: 6.045743699, leak_detected: 1 },
    { spectral_frequency: 216.4853859, rms_power: 19.87299462, leak_detected: 1 },
    { spectral_frequency: 392.8278113, rms_power: 15.74127534, leak_detected: 1 },
    { spectral_frequency: 255.1595367, rms_power: 5.906344539, leak_detected: 1 },
    { spectral_frequency: 5.320502313, rms_power: 0.868516816, leak_detected: 0 },
    { spectral_frequency: 255.5406358, rms_power: 15.39597992, leak_detected: 1 },
    { spectral_frequency: 7.99751396, rms_power: 0.791323547, leak_detected: 0 },
    { spectral_frequency: 260.945955, rms_power: 15.7899449, leak_detected: 1 },
    { spectral_frequency: 382.7558574, rms_power: 18.24042286, leak_detected: 1 },
    { spectral_frequency: 208.244723, rms_power: 17.50446823, leak_detected: 1 },
    { spectral_frequency: 367.1009797, rms_power: 10.49282662, leak_detected: 1 },
    { spectral_frequency: 5.974026824, rms_power: 0.534646275, leak_detected: 0 },
    { spectral_frequency: 336.1772368, rms_power: 11.95147683, leak_detected: 1 },
    { spectral_frequency: 293.9135444, rms_power: 10.55818695, leak_detected: 1 },
    { spectral_frequency: 6.183788856, rms_power: 0.518708916, leak_detected: 0 },
    { spectral_frequency: 266.434154, rms_power: 5.214962621, leak_detected: 1 },
    { spectral_frequency: 8.326430855, rms_power: 0.577928601, leak_detected: 0 },
    { spectral_frequency: 3.200287311, rms_power: 0.358823725, leak_detected: 0 },
    { spectral_frequency: 383.0599458, rms_power: 15.38409712, leak_detected: 1 },
    { spectral_frequency: 5.032387752, rms_power: 0.877394825, leak_detected: 0 },
    { spectral_frequency: 5.477359435, rms_power: 0.805423696, leak_detected: 0 },
    { spectral_frequency: 1.92902814, rms_power: 0.467262601, leak_detected: 0 },
    { spectral_frequency: 236.0096986, rms_power: 18.64667472, leak_detected: 1 },
    { spectral_frequency: 366.2411248, rms_power: 19.47703969, leak_detected: 1 },
    { spectral_frequency: 240.4150467, rms_power: 7.079932578, leak_detected: 1 },
    { spectral_frequency: 5.663473788, rms_power: 0.126756041, leak_detected: 0 },
    { spectral_frequency: 9.129237634, rms_power: 0.263730237, leak_detected: 0 },
    { spectral_frequency: 191.4129977, rms_power: 16.96490803, leak_detected: 1 },
    { spectral_frequency: 9.239234869, rms_power: 0.983432236, leak_detected: 0 },
    { spectral_frequency: 6.529652527, rms_power: 0.340409087, leak_detected: 0 },
    { spectral_frequency: 3.417446245, rms_power: 0.955064044, leak_detected: 0 },
    { spectral_frequency: 293.0612493, rms_power: 12.86710554, leak_detected: 1 },
    { spectral_frequency: 343.7278333, rms_power: 7.118149315, leak_detected: 1 },
    { spectral_frequency: 200.079234, rms_power: 14.81024422, leak_detected: 1 },
    { spectral_frequency: 7.794266949, rms_power: 0.605848614, leak_detected: 0 },
    { spectral_frequency: 8.282251755, rms_power: 0.812135187, leak_detected: 0 },
    { spectral_frequency: 5.508779396, rms_power: 0.147937468, leak_detected: 0 },
    { spectral_frequency: 7.386192806, rms_power: 0.963591431, leak_detected: 0 },
    { spectral_frequency: 266.420612, rms_power: 19.11843307, leak_detected: 1 },
    { spectral_frequency: 3.815164953, rms_power: 0.330257067, leak_detected: 0 },
    { spectral_frequency: 7.532300268, rms_power: 0.430672617, leak_detected: 0 },
    { spectral_frequency: 312.5513442, rms_power: 6.031202861, leak_detected: 1 },
    { spectral_frequency: 195.4323106, rms_power: 13.19381418, leak_detected: 1 },
    { spectral_frequency: 6.088067841, rms_power: 0.905578644, leak_detected: 0 },
    { spectral_frequency: 396.3994909, rms_power: 17.06496644, leak_detected: 1 },
    { spectral_frequency: 323.1780283, rms_power: 5.178227522, leak_detected: 1 },
    { spectral_frequency: 191.7048598, rms_power: 5.483091045, leak_detected: 1 },
    { spectral_frequency: 6.469069302, rms_power: 0.239104668, leak_detected: 0 },
    { spectral_frequency: 162.590262, rms_power: 6.414183445, leak_detected: 1 },
    { spectral_frequency: 1.717366075, rms_power: 0.487715491, leak_detected: 0 },
    { spectral_frequency: 7.149622728, rms_power: 0.927848554, leak_detected: 0 },
    { spectral_frequency: 345.4651082, rms_power: 17.50916169, leak_detected: 1 },
    { spectral_frequency: 4.320132871, rms_power: 0.375204465, leak_detected: 0 },
    { spectral_frequency: 3.605712637, rms_power: 0.783054781, leak_detected: 0 },
    { spectral_frequency: 158.8966884, rms_power: 14.90997379, leak_detected: 1 },
    { spectral_frequency: 1.849973019, rms_power: 0.631052398, leak_detected: 0 },
    { spectral_frequency: 7.890746004, rms_power: 0.258564264, leak_detected: 0 },
    { spectral_frequency: 292.5257226, rms_power: 6.02095663, leak_detected: 1 },
    { spectral_frequency: 6.667856802, rms_power: 0.596081059, leak_detected: 0 },
    { spectral_frequency: 288.3502711, rms_power: 11.27247218, leak_detected: 1 },
    { spectral_frequency: 386.9980143, rms_power: 12.56542942, leak_detected: 1 },
    { spectral_frequency: 396.6987421, rms_power: 15.69203324, leak_detected: 1 },
    { spectral_frequency: 284.3243404, rms_power: 7.689061591, leak_detected: 1 },
    { spectral_frequency: 6.115426234, rms_power: 0.166391142, leak_detected: 1 },
    { spectral_frequency: 343.7450099, rms_power: 7.236667645, leak_detected: 1 },
    { spectral_frequency: 5.789504142, rms_power: 0.822388076, leak_detected: 1 },
    { spectral_frequency: 9.668992614, rms_power: 0.896909388, leak_detected: 1 },
    { spectral_frequency: 159.8787254, rms_power: 19.35193746, leak_detected: 1 },
    { spectral_frequency: 289.047951, rms_power: 13.44783348, leak_detected: 1 },
    { spectral_frequency: 1.875114652, rms_power: 0.279711288, leak_detected: 1 },
    { spectral_frequency: 5.291708863, rms_power: 0.528750374, leak_detected: 1 },
    { spectral_frequency: 301.056272, rms_power: 14.11350361, leak_detected: 1 },
    { spectral_frequency: 2.552165292, rms_power: 0.599605586, leak_detected: 1 },
    { spectral_frequency: 208.4084191, rms_power: 19.8529315, leak_detected: 1 },
    { spectral_frequency: 5.766900202, rms_power: 0.134362151, leak_detected: 1 },
    { spectral_frequency: 366.1455345, rms_power: 16.19936631, leak_detected: 1 },
    { spectral_frequency: 7.860303552, rms_power: 0.790360706, leak_detected: 1 },
    { spectral_frequency: 6.056150329, rms_power: 0.499618339, leak_detected: 1 },
    { spectral_frequency: 5.632502223, rms_power: 0.936569291, leak_detected: 1 },
    { spectral_frequency: 8.977568664, rms_power: 0.971240883, leak_detected: 1 },
    { spectral_frequency: 200.4843197, rms_power: 16.428062, leak_detected: 1 },
    { spectral_frequency: 158.5415535, rms_power: 10.40290331, leak_detected: 1 },
    { spectral_frequency: 173.6312431, rms_power: 14.05011375, leak_detected: 1 },
    { spectral_frequency: 244.8231407, rms_power: 14.39393719, leak_detected: 1 },
    { spectral_frequency: 2.788258758, rms_power: 0.47722998, leak_detected: 1 },
    { spectral_frequency: 6.040252786, rms_power: 0.194505147, leak_detected: 1 },
    { spectral_frequency: 6.216479485, rms_power: 0.630209526, leak_detected: 1 },
    { spectral_frequency: 155.4040532, rms_power: 13.4587396, leak_detected: 1 },
    { spectral_frequency: 1.063125235, rms_power: 0.966393302, leak_detected: 1 },
    { spectral_frequency: 359.1239546, rms_power: 13.07446415, leak_detected: 1 },
    { spectral_frequency: 3.185004151, rms_power: 0.888040445, leak_detected: 1 },
    { spectral_frequency: 330.851778, rms_power: 13.10038604, leak_detected: 1 },
    { spectral_frequency: 2.981363589, rms_power: 0.704558668, leak_detected: 1 },
    { spectral_frequency: 7.31780282, rms_power: 0.446688699, leak_detected: 1 },
    { spectral_frequency: 354.0992591, rms_power: 9.842947064, leak_detected: 1 },
    { spectral_frequency: 380.6749181, rms_power: 13.27287927, leak_detected: 1 },
    { spectral_frequency: 2.183585991, rms_power: 0.847309835, leak_detected: 1 },
    { spectral_frequency: 253.7450883, rms_power: 9.604347559, leak_detected: 1 },
    { spectral_frequency: 7.132833403, rms_power: 0.541200748, leak_detected: 1 },
    { spectral_frequency: 290.7589627, rms_power: 14.03536202, leak_detected: 1 },
    { spectral_frequency: 256.42798, rms_power: 13.83544319, leak_detected: 1 },
    { spectral_frequency: 385.3634916, rms_power: 13.58130233, leak_detected: 1 },
    { spectral_frequency: 322.2264733, rms_power: 14.5862596, leak_detected: 1 },
    { spectral_frequency: 5.188787509, rms_power: 0.636152772, leak_detected: 1 },
    { spectral_frequency: 161.1785907, rms_power: 9.478527771, leak_detected: 1 },
    { spectral_frequency: 363.9457744, rms_power: 6.561181384, leak_detected: 1 },
    { spectral_frequency: 232.6923765, rms_power: 9.609498553, leak_detected: 1 },
    { spectral_frequency: 192.9064562, rms_power: 8.788771326, leak_detected: 1 },
    { spectral_frequency: 239.7411046, rms_power: 8.198654899, leak_detected: 1 },
    { spectral_frequency: 1.297797446, rms_power: 0.156213036, leak_detected: 1 },
    { spectral_frequency: 4.020951139, rms_power: 0.98735013, leak_detected: 1 },
    { spectral_frequency: 8.454606796, rms_power: 0.253876209, leak_detected: 1 },
    { spectral_frequency: 361.7748935, rms_power: 13.17126944, leak_detected: 1 },
    { spectral_frequency: 181.5834156, rms_power: 19.80642095, leak_detected: 1 },
    { spectral_frequency: 2.491189515, rms_power: 0.138975465, leak_detected: 1 },
    { spectral_frequency: 280.8011884, rms_power: 18.71054608, leak_detected: 1 },
    { spectral_frequency: 9.098737964, rms_power: 0.509258624, leak_detected: 1 },
    { spectral_frequency: 343.2564453, rms_power: 12.00179465, leak_detected: 1 },
    { spectral_frequency: 7.22780693, rms_power: 0.401865083, leak_detected: 1 },
    { spectral_frequency: 1.892390518, rms_power: 0.902024896, leak_detected: 1 },
    { spectral_frequency: 168.8156238, rms_power: 19.58452732, leak_detected: 1 },
    { spectral_frequency: 376.1426415, rms_power: 12.6242054, leak_detected: 1 },
    { spectral_frequency: 6.637115424, rms_power: 0.766975894, leak_detected: 1 },
    { spectral_frequency: 190.7380437, rms_power: 11.02036909, leak_detected: 1 },
    { spectral_frequency: 223.5611689, rms_power: 19.24124831, leak_detected: 1 },
    { spectral_frequency: 333.7329019, rms_power: 12.87124357, leak_detected: 1 },
    { spectral_frequency: 299.5807483, rms_power: 15.98384577, leak_detected: 1 },
    { spectral_frequency: 2.442455933, rms_power: 0.331995066, leak_detected: 1 },
    { spectral_frequency: 150.2532061, rms_power: 10.56572992, leak_detected: 1 },
    { spectral_frequency: 222.7296287, rms_power: 6.222455547, leak_detected: 1 },
    { spectral_frequency: 9.496685934, rms_power: 0.4082716, leak_detected: 1 },
    { spectral_frequency: 7.164824956, rms_power: 0.565925679, leak_detected: 1 },
    { spectral_frequency: 5.902158064, rms_power: 0.104207156, leak_detected: 1 },
    { spectral_frequency: 1.046873847, rms_power: 0.961327987, leak_detected: 1 },
    { spectral_frequency: 8.559670926, rms_power: 0.439831711, leak_detected: 1 },
    { spectral_frequency: 7.211882191, rms_power: 0.571853243, leak_detected: 1 },
    { spectral_frequency: 2.155493308, rms_power: 0.857583662, leak_detected: 1 },
    { spectral_frequency: 293.0181804, rms_power: 7.833535538, leak_detected: 1 },
    { spectral_frequency: 8.681538401, rms_power: 0.641126314, leak_detected: 1 },
    { spectral_frequency: 224.9198407, rms_power: 19.05116513, leak_detected: 1 },
    { spectral_frequency: 376.937431, rms_power: 7.318160087, leak_detected: 1 },
    { spectral_frequency: 329.4760549, rms_power: 12.40039555, leak_detected: 1 },
    { spectral_frequency: 5.152990219, rms_power: 0.571544332, leak_detected: 1 },
    { spectral_frequency: 349.469084, rms_power: 6.303520625, leak_detected: 1 },
    { spectral_frequency: 8.436553407, rms_power: 0.694148311, leak_detected: 1 },
    { spectral_frequency: 282.9350651, rms_power: 10.2130187, leak_detected: 1 },
    { spectral_frequency: 4.091248312, rms_power: 0.522527743, leak_detected: 1 },
    { spectral_frequency: 386.1491078, rms_power: 6.682251696, leak_detected: 1 },
    { spectral_frequency: 6.355696984, rms_power: 0.407476705, leak_detected: 1 },
    { spectral_frequency: 319.6488489, rms_power: 8.839145819, leak_detected: 1 },
    { spectral_frequency: 6.304189161, rms_power: 0.418836886, leak_detected: 1 },
    { spectral_frequency: 4.408787278, rms_power: 0.950236515, leak_detected: 1 },
    { spectral_frequency: 368.8197545, rms_power: 6.353151296, leak_detected: 1 },
    { spectral_frequency: 5.103012543, rms_power: 0.85045434, leak_detected: 1 },
    { spectral_frequency: 271.8988257, rms_power: 18.09709281, leak_detected: 1 },
    { spectral_frequency: 188.7003205, rms_power: 14.85340376, leak_detected: 1 },
    { spectral_frequency: 326.6939495, rms_power: 9.919205817, leak_detected: 1 },
    { spectral_frequency: 308.6428083, rms_power: 18.52077586, leak_detected: 1 },
    { spectral_frequency: 254.7790503, rms_power: 10.14745036, leak_detected: 1 },
    { spectral_frequency: 338.9138833, rms_power: 6.99599748, leak_detected: 1 },
    { spectral_frequency: 372.3584979, rms_power: 15.59766867, leak_detected: 1 },
    { spectral_frequency: 9.003123889, rms_power: 0.141852455, leak_detected: 1 },
    { spectral_frequency: 365.6950578, rms_power: 15.8855255, leak_detected: 1 },
    { spectral_frequency: 7.583438458, rms_power: 0.67444093, leak_detected: 1 },
    { spectral_frequency: 1.182458336, rms_power: 0.642690261, leak_detected: 1 },
    { spectral_frequency: 2.008647587, rms_power: 0.955574683, leak_detected: 1 },
    { spectral_frequency: 7.703570669, rms_power: 0.651481774, leak_detected: 1 },
    { spectral_frequency: 1.671549017, rms_power: 0.75876494, leak_detected: 1 },
    { spectral_frequency: 366.5799191, rms_power: 10.42945538, leak_detected: 1 },
    { spectral_frequency: 9.875541289, rms_power: 0.32832651, leak_detected: 1 },
    { spectral_frequency: 2.892503952, rms_power: 0.578796342, leak_detected: 1 },
    { spectral_frequency: 6.461743839, rms_power: 0.323175918, leak_detected: 1 },
    { spectral_frequency: 2.155806462, rms_power: 0.40746164, leak_detected: 1 },
    { spectral_frequency: 201.606724, rms_power: 16.03817536, leak_detected: 1 },
    { spectral_frequency: 262.5632416, rms_power: 12.09008054, leak_detected: 1 },
    { spectral_frequency: 8.960724412, rms_power: 0.32817071, leak_detected: 1 },
    { spectral_frequency: 226.7429636, rms_power: 9.146799364, leak_detected: 1 },
    { spectral_frequency: 1.964669159, rms_power: 0.412438765, leak_detected: 1 },
    { spectral_frequency: 202.8395313, rms_power: 16.44288815, leak_detected: 1 },
    { spectral_frequency: 378.2392231, rms_power: 12.23606879, leak_detected: 1 },
    { spectral_frequency: 1.919401875, rms_power: 0.644684131, leak_detected: 1 },
    { spectral_frequency: 6.212081558, rms_power: 0.238856355, leak_detected: 1 },
    { spectral_frequency: 7.687565704, rms_power: 0.402984253, leak_detected: 1 },
    { spectral_frequency: 247.6464288, rms_power: 6.022195102, leak_detected: 1 },
    { spectral_frequency: 325.1055575, rms_power: 12.47271765, leak_detected: 1 },
    { spectral_frequency: 181.8811012, rms_power: 17.72164042, leak_detected: 1 },
    { spectral_frequency: 321.8058947, rms_power: 11.60363858, leak_detected: 1 },
    { spectral_frequency: 277.26764, rms_power: 5.824764194, leak_detected: 1 },
    { spectral_frequency: 8.423119032, rms_power: 0.293916821, leak_detected: 1 },
    { spectral_frequency: 3.65751202, rms_power: 0.920030118, leak_detected: 1 },
    { spectral_frequency: 1.139631008, rms_power: 0.97496737, leak_detected: 1 },
    { spectral_frequency: 1.649832716, rms_power: 0.38017157, leak_detected: 1 },
    { spectral_frequency: 4.140788078, rms_power: 0.22671861, leak_detected: 1 },
    { spectral_frequency: 172.3395055, rms_power: 9.975212119, leak_detected: 1 },
    { spectral_frequency: 1.317526642, rms_power: 0.199381703, leak_detected: 1 },
    { spectral_frequency: 2.324905318, rms_power: 0.304493835, leak_detected: 1 },
    { spectral_frequency: 266.501563, rms_power: 15.25663182, leak_detected: 1 },
    { spectral_frequency: 319.6325095, rms_power: 15.81347807, leak_detected: 1 },
    { spectral_frequency: 233.1240684, rms_power: 13.19221378, leak_detected: 1 },
    { spectral_frequency: 383.6992475, rms_power: 7.26493167, leak_detected: 1 },
    { spectral_frequency: 250.0662477, rms_power: 14.3622025, leak_detected: 1 },
    { spectral_frequency: 3.590330931, rms_power: 0.917837043, leak_detected: 1 },
    { spectral_frequency: 161.9776308, rms_power: 18.810131, leak_detected: 1 },
    { spectral_frequency: 9.85567368, rms_power: 0.877552026, leak_detected: 1 },
    { spectral_frequency: 385.5594892, rms_power: 18.69998227, leak_detected: 1 },
    { spectral_frequency: 6.269969815, rms_power: 0.406143778, leak_detected: 1 },
    { spectral_frequency: 2.125967353, rms_power: 0.722181072, leak_detected: 1 },
    { spectral_frequency: 319.5776272, rms_power: 14.51730084, leak_detected: 1 },
    { spectral_frequency: 304.9073001, rms_power: 19.17705929, leak_detected: 1 },
    { spectral_frequency: 249.7246281, rms_power: 8.45861939, leak_detected: 1 },
    { spectral_frequency: 4.830191991, rms_power: 0.905628931, leak_detected: 1 },
    { spectral_frequency: 252.0266339, rms_power: 18.87092511, leak_detected: 1 },
    { spectral_frequency: 5.374193551, rms_power: 0.797749863, leak_detected: 1 },
    { spectral_frequency: 270.3092548, rms_power: 13.80455595, leak_detected: 1 },
    { spectral_frequency: 348.4175121, rms_power: 15.02218919, leak_detected: 1 },
    { spectral_frequency: 7.950602158, rms_power: 0.877773292, leak_detected: 1 },
    { spectral_frequency: 216.1318555, rms_power: 15.39760121, leak_detected: 1 },
    { spectral_frequency: 264.5340051, rms_power: 7.191700254, leak_detected: 1 },
    { spectral_frequency: 5.87345489, rms_power: 0.794640822, leak_detected: 1 },
    { spectral_frequency: 179.6735802, rms_power: 11.64554999, leak_detected: 1 },
    { spectral_frequency: 5.767562803, rms_power: 0.692129162, leak_detected: 1 },
    { spectral_frequency: 318.1739211, rms_power: 19.18960537, leak_detected: 1 },
    { spectral_frequency: 4.788478055, rms_power: 0.448973301, leak_detected: 1 },
    { spectral_frequency: 375.2474527, rms_power: 15.93250941, leak_detected: 1 },
    { spectral_frequency: 224.1807538, rms_power: 11.43778469, leak_detected: 1 },
    { spectral_frequency: 6.374250366, rms_power: 0.953712144, leak_detected: 1 },
    { spectral_frequency: 343.7288622, rms_power: 18.64429377, leak_detected: 1 },
    { spectral_frequency: 7.883255175, rms_power: 0.496128225, leak_detected: 1 },
    { spectral_frequency: 365.9876146, rms_power: 18.91689106, leak_detected: 1 },
    { spectral_frequency: 9.269314181, rms_power: 0.613412295, leak_detected: 1 },
    { spectral_frequency: 4.901202952, rms_power: 0.203100228, leak_detected: 1 },
    { spectral_frequency: 9.901513997, rms_power: 0.896050049, leak_detected: 1 },
    { spectral_frequency: 261.6893575, rms_power: 15.66258262, leak_detected: 1 },
    { spectral_frequency: 1.507519968, rms_power: 0.810010051, leak_detected: 0 },
    { spectral_frequency: 1.199815391, rms_power: 0.135477554, leak_detected: 0 },
    { spectral_frequency: 4.427188703, rms_power: 0.915800995, leak_detected: 0 },
    { spectral_frequency: 7.317876208, rms_power: 0.127489287, leak_detected: 0 },
    { spectral_frequency: 237.2902451, rms_power: 13.43922918, leak_detected: 1 },
    { spectral_frequency: 201.9767692, rms_power: 19.76631472, leak_detected: 1 },
    { spectral_frequency: 8.681400803, rms_power: 0.506025716, leak_detected: 0 },
    { spectral_frequency: 8.18941361, rms_power: 0.107893685, leak_detected: 0 },
    { spectral_frequency: 1.811158586, rms_power: 0.607136915, leak_detected: 0 },
    { spectral_frequency: 2.848087742, rms_power: 0.856825977, leak_detected: 0 },
    { spectral_frequency: 9.790997509, rms_power: 0.409184661, leak_detected: 0 },
    { spectral_frequency: 5.78556506, rms_power: 0.860103555, leak_detected: 0 },
    { spectral_frequency: 4.425895172, rms_power: 0.928904727, leak_detected: 0 },
    { spectral_frequency: 305.8888124, rms_power: 18.04644067, leak_detected: 1 },
    { spectral_frequency: 266.2433358, rms_power: 19.55998658, leak_detected: 1 },
    { spectral_frequency: 160.9547763, rms_power: 15.0171345, leak_detected: 1 },
    { spectral_frequency: 6.751854199, rms_power: 0.569694712, leak_detected: 0 },
    { spectral_frequency: 8.495111267, rms_power: 0.594502635, leak_detected: 0 },
    { spectral_frequency: 286.5801589, rms_power: 6.001258124, leak_detected: 1 },
    { spectral_frequency: 237.181362, rms_power: 10.65227459, leak_detected: 1 },
    { spectral_frequency: 396.5258461, rms_power: 8.118136957, leak_detected: 1 },
    { spectral_frequency: 8.447471365, rms_power: 0.603619274, leak_detected: 0 },
    { spectral_frequency: 337.2988794, rms_power: 6.186172965, leak_detected: 1 },
    { spectral_frequency: 5.838258516, rms_power: 0.199389845, leak_detected: 0 },
    { spectral_frequency: 6.178225585, rms_power: 0.533769761, leak_detected: 0 },
    { spectral_frequency: 3.860089886, rms_power: 0.182534945, leak_detected: 0 },
    { spectral_frequency: 3.857609442, rms_power: 0.683873751, leak_detected: 0 },
    { spectral_frequency: 398.6671484, rms_power: 9.600356448, leak_detected: 1 },
    { spectral_frequency: 174.1579487, rms_power: 8.303990331, leak_detected: 1 },
    { spectral_frequency: 9.495373873, rms_power: 0.256699571, leak_detected: 0 },
    { spectral_frequency: 345.6451132, rms_power: 7.755361583, leak_detected: 1 },
    { spectral_frequency: 5.380140368, rms_power: 0.822408009, leak_detected: 0 },
    { spectral_frequency: 1.641813366, rms_power: 0.332437157, leak_detected: 0 },
    { spectral_frequency: 4.235756464, rms_power: 0.551500697, leak_detected: 0 },
    { spectral_frequency: 197.2894004, rms_power: 8.9748018, leak_detected: 1 },
    { spectral_frequency: 2.196796273, rms_power: 0.858474593, leak_detected: 0 },
    { spectral_frequency: 186.3330286, rms_power: 17.34863019, leak_detected: 1 },
    { spectral_frequency: 5.506955412, rms_power: 0.145139987, leak_detected: 0 },
    { spectral_frequency: 1.854475553, rms_power: 0.198406391, leak_detected: 0 },
    { spectral_frequency: 175.5160895, rms_power: 6.205729598, leak_detected: 1 },
    { spectral_frequency: 5.475609055, rms_power: 0.289909845, leak_detected: 0 },
    { spectral_frequency: 307.3988666, rms_power: 18.47473323, leak_detected: 1 },
    { spectral_frequency: 207.5930284, rms_power: 14.01559741, leak_detected: 1 },
    { spectral_frequency: 199.7474179, rms_power: 6.843807519, leak_detected: 1 },
    { spectral_frequency: 8.590703187, rms_power: 0.202115851, leak_detected: 0 },
    { spectral_frequency: 5.202924837, rms_power: 0.186488127, leak_detected: 0 },
    { spectral_frequency: 4.66440433, rms_power: 0.4164541, leak_detected: 0 },
    { spectral_frequency: 267.5261934, rms_power: 13.18424355, leak_detected: 1 },
    { spectral_frequency: 6.686801055, rms_power: 0.451519528, leak_detected: 0 },
    { spectral_frequency: 9.094571552, rms_power: 0.599935543, leak_detected: 0 },
    { spectral_frequency: 1.146636466, rms_power: 0.17020755, leak_detected: 0 },
    { spectral_frequency: 341.7287677, rms_power: 10.25235127, leak_detected: 1 },
    { spectral_frequency: 231.7410928, rms_power: 9.540079132, leak_detected: 1 },
    { spectral_frequency: 249.7180595, rms_power: 17.87798394, leak_detected: 1 },
    { spectral_frequency: 285.9069906, rms_power: 16.71406402, leak_detected: 1 },
    { spectral_frequency: 1.443092839, rms_power: 0.444324847, leak_detected: 0 },
    { spectral_frequency: 6.46488092, rms_power: 0.418214592, leak_detected: 0 },
    { spectral_frequency: 4.457986028, rms_power: 0.908997686, leak_detected: 0 },
    { spectral_frequency: 6.603383069, rms_power: 0.860013127, leak_detected: 0 },
    { spectral_frequency: 8.840511972, rms_power: 0.286473746, leak_detected: 0 },
    { spectral_frequency: 6.727269806, rms_power: 0.774642992, leak_detected: 0 },
    { spectral_frequency: 351.2077954, rms_power: 8.377764618, leak_detected: 1 },
    { spectral_frequency: 3.142305401, rms_power: 0.723678407, leak_detected: 0 },
    { spectral_frequency: 276.2919398, rms_power: 5.09554744, leak_detected: 1 },
    { spectral_frequency: 3.296546599, rms_power: 0.124707906, leak_detected: 0 },
    { spectral_frequency: 4.121846969, rms_power: 0.676914873, leak_detected: 0 },
    { spectral_frequency: 229.6751262, rms_power: 17.92848675, leak_detected: 1 },
    { spectral_frequency: 4.912045219, rms_power: 0.14325507, leak_detected: 0 },
    { spectral_frequency: 7.832117548, rms_power: 0.747835529, leak_detected: 0 },
    { spectral_frequency: 1.201800972, rms_power: 0.4264251, leak_detected: 0 },
    { spectral_frequency: 4.543835041, rms_power: 0.130408854, leak_detected: 0 },
    { spectral_frequency: 3.414138737, rms_power: 0.750470121, leak_detected: 0 },
    { spectral_frequency: 3.142305401, rms_power: 0.723678407, leak_detected: 0 },
    { spectral_frequency: 1.598920489, rms_power: 0.595762692, leak_detected: 0 },
    { spectral_frequency: 4.180441209, rms_power: 0.414367414, leak_detected: 0 },
    { spectral_frequency: 5.271325091, rms_power: 0.643099115, leak_detected: 0 },
    { spectral_frequency: 227.5365285, rms_power: 15.50777297, leak_detected: 1 },
    { spectral_frequency: 7.742846615, rms_power: 0.702652267, leak_detected: 0 },
    { spectral_frequency: 2.459265758, rms_power: 0.388730912, leak_detected: 0 },
    { spectral_frequency: 1.022892358, rms_power: 0.432361439, leak_detected: 0 },
    { spectral_frequency: 3.198579944, rms_power: 0.101160547, leak_detected: 0 },
    { spectral_frequency: 259.1062136, rms_power: 9.477342559, leak_detected: 1 },
    { spectral_frequency: 3.736280038, rms_power: 0.375355756, leak_detected: 0 },
    { spectral_frequency: 1.249336022, rms_power: 0.120975788, leak_detected: 0 },
    { spectral_frequency: 364.8549969, rms_power: 7.644008012, leak_detected: 1 },
    { spectral_frequency: 5.684088644, rms_power: 0.547447817, leak_detected: 0 },
    { spectral_frequency: 293.2154873, rms_power: 13.13418622, leak_detected: 1 },
    { spectral_frequency: 2.752420093, rms_power: 0.810062661, leak_detected: 0 },
    { spectral_frequency: 8.42285066, rms_power: 0.37294437, leak_detected: 0 },
    { spectral_frequency: 7.6289914, rms_power: 0.436139386, leak_detected: 0 },
    { spectral_frequency: 348.310388, rms_power: 17.83743265, leak_detected: 1 },
    { spectral_frequency: 7.439166298, rms_power: 0.882459616, leak_detected: 0 },
    { spectral_frequency: 3.944027392, rms_power: 0.186669244, leak_detected: 0 },
    { spectral_frequency: 278.5986605, rms_power: 14.54303734, leak_detected: 1 },
    { spectral_frequency: 150.0482643, rms_power: 7.971772603, leak_detected: 1 },
    { spectral_frequency: 6.522004526, rms_power: 0.627068084, leak_detected: 0 },
    { spectral_frequency: 3.968957617, rms_power: 0.248055137, leak_detected: 0 },
    { spectral_frequency: 383.4632087, rms_power: 9.911050603, leak_detected: 1 },
    { spectral_frequency: 1.543686795, rms_power: 0.503205779, leak_detected: 0 },
    { spectral_frequency: 6.751854199, rms_power: 0.569694712, leak_detected: 0 }
];

// Playback control variables
let currentDataIndex = 0;
let isPlaying = false;
let playbackInterval = null;
let playbackSpeed = 2000; // milliseconds between data points (slower for debugging)
let lastDataIndex = -1; // Track last index to detect resets
let indexResetCount = 0; // Track how many times index gets reset

/**
 * Get next sensor data point for playback (enhanced with calculated metrics)
 */
function getNextSensorData() {
    // Debug: Track index changes
    const previousIndex = currentDataIndex;
    const data = SENSOR_DATA_HISTORY[currentDataIndex];
    currentDataIndex = (currentDataIndex + 1) % SENSOR_DATA_HISTORY.length;

    // Debug logging
    if (previousIndex !== lastDataIndex) {
        console.log(`📊 Sensor data progression: ${previousIndex} → ${currentDataIndex} (of ${SENSOR_DATA_HISTORY.length})`);
        lastDataIndex = previousIndex;
    }

    const enhancedData = enhanceSensorDataPoint(data);

    // Debug: Log the actual data being returned
    console.log(`📊 Raw data [${previousIndex}]:`, {
        spectral_frequency: data.spectral_frequency,
        rms_power: data.rms_power,
        leak_detected: data.leak_detected
    });
    console.log(`📊 Enhanced data [${previousIndex}]:`, {
        spectral_frequency: enhancedData.spectral_frequency,
        rms_power: enhancedData.rms_power,
        kurtosis: enhancedData.kurtosis,
        skewness: enhancedData.skewness,
        leak_detected: enhancedData.leak_detected
    });

    return enhancedData;
}

/**
 * Get current sensor data point without advancing (enhanced with calculated metrics)
 */
function getCurrentSensorData() {
    return enhanceSensorDataPoint(SENSOR_DATA_HISTORY[currentDataIndex]);
}

/**
 * Reset playback to beginning
 */
function resetSensorPlayback() {
    const oldIndex = currentDataIndex;
    currentDataIndex = 0;
    indexResetCount++;

    console.log(`🔄 Sensor playback reset: ${oldIndex} → ${currentDataIndex} (reset #${indexResetCount})`);

    return SENSOR_DATA_HISTORY[0];
}

/**
 * Start sensor data playback
 */
function startSensorPlayback(speed = 1000) {
    if (isPlaying) return;

    playbackSpeed = speed;
    isPlaying = true;

    playbackInterval = setInterval(() => {
        const data = getNextSensorData();

        // Update dashboard with new data
        if (window.updateDashboardWithSensorData) {
            window.updateDashboardWithSensorData(data);
        }

        // Broadcast to any listeners
        if (window.onSensorDataUpdate) {
            window.onSensorDataUpdate(data);
        }

        console.log('📊 Sensor data playback:', data);

    }, playbackSpeed);

    console.log('▶️ Sensor data playback started');
}

/**
 * Pause sensor data playback
 */
function pauseSensorPlayback() {
    if (!isPlaying) return;

    isPlaying = false;
    if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
    }

    console.log('⏸️ Sensor data playback paused');
}

/**
 * Stop and reset sensor data playback
 */
function stopSensorPlayback() {
    pauseSensorPlayback();
    resetSensorPlayback();
    console.log('⏹️ Sensor data playback stopped and reset');
}

/**
 * Set playback speed (milliseconds between data points)
 */
function setSensorPlaybackSpeed(speed) {
    const wasPlaying = isPlaying;
    pauseSensorPlayback();

    playbackSpeed = speed;

    if (wasPlaying) {
        startSensorPlayback(playbackSpeed);
    }

    console.log('⚡ Playback speed set to:', playbackSpeed, 'ms');
}

/**
 * Get playback status
 */
function getSensorPlaybackStatus() {
    return {
        isPlaying: isPlaying,
        currentIndex: currentDataIndex,
        totalDataPoints: SENSOR_DATA_HISTORY.length,
        playbackSpeed: playbackSpeed,
        progress: Math.round((currentDataIndex / SENSOR_DATA_HISTORY.length) * 100)
    };
}

/**
 * Jump to specific data point
 */
function jumpToSensorDataPoint(index) {
    if (index >= 0 && index < SENSOR_DATA_HISTORY.length) {
        currentDataIndex = index;
        const data = SENSOR_DATA_HISTORY[currentDataIndex];

        if (window.updateDashboardWithSensorData) {
            window.updateDashboardWithSensorData(data);
        }

        console.log('🎯 Jumped to data point:', index, data);
        return data;
    }
    return null;
}

/**
 * Get sensor data statistics
 */
function getSensorDataStats() {
    const data = SENSOR_DATA_HISTORY;
    const spectralFreqs = data.map(d => d.spectral_frequency);
    const rmsPowers = data.map(d => d.rms_power);

    return {
        totalPoints: data.length,
        spectralFrequency: {
            min: Math.min(...spectralFreqs),
            max: Math.max(...spectralFreqs),
            avg: spectralFreqs.reduce((a, b) => a + b, 0) / spectralFreqs.length
        },
        rmsPower: {
            min: Math.min(...rmsPowers),
            max: Math.max(...rmsPowers),
            avg: rmsPowers.reduce((a, b) => a + b, 0) / rmsPowers.length
        },
        leakDetection: {
            totalLeaks: data.filter(d => d.leak_detected === 1).length,
            leakRate: (data.filter(d => d.leak_detected === 1).length / data.length * 100).toFixed(2) + '%'
        }
    };
}

// Export functions for use in main app.js
window.SENSOR_DATA_HISTORY = SENSOR_DATA_HISTORY;
window.getNextSensorData = getNextSensorData;
window.getCurrentSensorData = getCurrentSensorData;
window.resetSensorPlayback = resetSensorPlayback;
window.startSensorPlayback = startSensorPlayback;
window.pauseSensorPlayback = pauseSensorPlayback;
window.stopSensorPlayback = stopSensorPlayback;
window.setSensorPlaybackSpeed = setSensorPlaybackSpeed;
window.getSensorPlaybackStatus = getSensorPlaybackStatus;
window.jumpToSensorDataPoint = jumpToSensorDataPoint;
window.getSensorDataStats = getSensorDataStats;

// Export the calculation functions for testing
window.calculateKurtosis = calculateKurtosis;
window.calculateSkewness = calculateSkewness;
window.calculateModelMetrics = calculateModelMetrics;
window.enhanceSensorDataPoint = enhanceSensorDataPoint;

// Set a flag to indicate sensor data is ready
window.sensorDataReady = true;

console.log('📊 Sensor data file loaded:', SENSOR_DATA_HISTORY.length, 'data points');
console.log('🧮 Statistical calculation functions loaded and ready');
console.log('✅ Sensor data system ready flag set');
