/**
 * AUC Graph Component for Water Distribution Monitoring
 * Displays ROC curve with AUC=0.84 based on reference image
 */

class AUCGraph {
    constructor(containerId) {
        this.containerId = containerId;
        this.canvas = null;
        this.ctx = null;
        this.width = 400;
        this.height = 300;
        this.margin = { top: 20, right: 20, bottom: 40, left: 50 };

        this.rocData = this.generateROCData();
        this.aucValue = 0.84;

        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.border = '1px solid #334155';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.background = 'linear-gradient(135deg, #0f172a, #1e293b)';

        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.draw();
    }

    generateROCData() {
        // Generate ROC curve data points similar to reference image
        // Curve should be above the diagonal (random classifier line)
        const points = [
            { fpr: 0.0, tpr: 0.0, label: 'A' },
            { fpr: 0.1, tpr: 0.3, label: 'B' },
            { fpr: 0.2, tpr: 0.6, label: 'C' },
            { fpr: 0.3, tpr: 0.75, label: '' },
            { fpr: 0.4, tpr: 0.85, label: '' },
            { fpr: 0.5, tpr: 0.90, label: '' },
            { fpr: 0.6, tpr: 0.93, label: '' },
            { fpr: 0.7, tpr: 0.95, label: '' },
            { fpr: 0.8, tpr: 0.97, label: '' },
            { fpr: 0.9, tpr: 0.98, label: '' },
            { fpr: 1.0, tpr: 1.0, label: '' }
        ];

        return points;
    }

    draw() {
        if (!this.ctx) return;

        this.clear();
        this.drawGrid();
        this.drawAxes();
        this.drawROCCurve();
        this.drawDiagonal();
        this.drawLabels();
        this.drawAUCValue();
    }

    clear() {
        this.ctx.fillStyle = 'transparent';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        const gridColor = 'rgba(59, 130, 246, 0.1)';

        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 0.5;

        // Vertical grid lines
        for (let i = 0; i <= 10; i++) {
            const x = this.margin.left + (i / 10) * (this.width - this.margin.left - this.margin.right);

            this.ctx.beginPath();
            this.ctx.moveTo(x, this.margin.top);
            this.ctx.lineTo(x, this.height - this.margin.bottom);
            this.ctx.stroke();
        }

        // Horizontal grid lines
        for (let i = 0; i <= 10; i++) {
            const y = this.margin.top + (i / 10) * (this.height - this.margin.top - this.margin.bottom);

            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left, y);
            this.ctx.lineTo(this.width - this.margin.right, y);
            this.ctx.stroke();
        }
    }

    drawAxes() {
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
        this.ctx.lineWidth = 2;

        // Y-axis (TPR)
        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, this.margin.top);
        this.ctx.lineTo(this.margin.left, this.height - this.margin.bottom);
        this.ctx.stroke();

        // X-axis (FPR)
        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, this.height - this.margin.bottom);
        this.ctx.lineTo(this.width - this.margin.right, this.height - this.margin.bottom);
        this.ctx.stroke();

        // Draw axis labels
        this.ctx.fillStyle = '#cbd5e1';
        this.ctx.font = '12px Inter';
        this.ctx.textAlign = 'center';

        // Y-axis label (rotated)
        this.ctx.save();
        this.ctx.translate(15, this.height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('TPR (True Positive Rate)', 0, 0);
        this.ctx.restore();

        // X-axis label
        this.ctx.fillText('FPR (False Positive Rate)', this.width / 2, this.height - 5);
    }

    drawROCCurve() {
        if (this.rocData.length === 0) return;

        // Draw shaded area under curve
        this.drawShadedArea();

        // Draw the ROC curve line
        this.ctx.strokeStyle = '#a855f7'; // Purple color matching reference
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();

        // Move to first point
        const firstPoint = this.rocData[0];
        this.ctx.moveTo(
            this.margin.left + (firstPoint.fpr * (this.width - this.margin.left - this.margin.right)),
            this.height - this.margin.bottom - (firstPoint.tpr * (this.height - this.margin.top - this.margin.bottom))
        );

        // Draw lines to subsequent points
        for (let i = 1; i < this.rocData.length; i++) {
            const point = this.rocData[i];
            const x = this.margin.left + (point.fpr * (this.width - this.margin.left - this.margin.right));
            const y = this.height - this.margin.bottom - (point.tpr * (this.height - this.margin.top - this.margin.bottom));

            this.ctx.lineTo(x, y);
        }

        this.ctx.stroke();

        // Draw points A, B, C
        this.drawROCPoints();
    }

    drawShadedArea() {
        if (this.rocData.length === 0) return;

        // Create gradient for shaded area
        const gradient = this.ctx.createLinearGradient(0, this.margin.top, 0, this.height - this.margin.bottom);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0.1)');

        this.ctx.fillStyle = gradient;

        this.ctx.beginPath();

        // Start from (0,0)
        this.ctx.moveTo(this.margin.left, this.height - this.margin.bottom);

        // Draw curve
        for (let i = 0; i < this.rocData.length; i++) {
            const point = this.rocData[i];
            const x = this.margin.left + (point.fpr * (this.width - this.margin.left - this.margin.right));
            const y = this.height - this.margin.bottom - (point.tpr * (this.height - this.margin.top - this.margin.bottom));
            this.ctx.lineTo(x, y);
        }

        // Close path back to x-axis
        this.ctx.lineTo(this.width - this.margin.right, this.height - this.margin.bottom);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawROCPoints() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = '#a855f7';
        this.ctx.lineWidth = 2;

        this.rocData.forEach((point, index) => {
            if (point.label) {
                const x = this.margin.left + (point.fpr * (this.width - this.margin.left - this.margin.right));
                const y = this.height - this.margin.bottom - (point.tpr * (this.height - this.margin.top - this.margin.bottom));

                // Draw point circle
                this.ctx.beginPath();
                this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.stroke();

                // Draw label
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 14px Inter';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(point.label, x, y - 15);
            }
        });
    }

    drawDiagonal() {
        // Draw diagonal line (random classifier)
        this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // Red color
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, this.height - this.margin.bottom);
        this.ctx.lineTo(this.width - this.margin.right, this.margin.top);
        this.ctx.stroke();

        // Reset line dash
        this.ctx.setLineDash([]);
    }

    drawLabels() {
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '10px Inter';
        this.ctx.textAlign = 'center';

        // X-axis ticks
        for (let i = 0; i <= 10; i++) {
            const x = this.margin.left + (i / 10) * (this.width - this.margin.left - this.margin.right);
            const y = this.height - this.margin.bottom + 15;

            this.ctx.fillText(i / 10, x, y);
        }

        // Y-axis ticks
        for (let i = 0; i <= 10; i++) {
            const x = this.margin.left - 15;
            const y = this.height - this.margin.bottom - (i / 10) * (this.height - this.margin.top - this.margin.bottom);

            this.ctx.fillText(i / 10, x, y + 3);
        }
    }

    drawAUCValue() {
        // Draw AUC value box
        const aucBoxWidth = 80;
        const aucBoxHeight = 30;
        const aucBoxX = this.width - this.margin.right - aucBoxWidth;
        const aucBoxY = this.margin.top;

        // Background
        this.ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
        this.ctx.fillRect(aucBoxX, aucBoxY, aucBoxWidth, aucBoxHeight);

        // Border
        this.ctx.strokeStyle = '#a855f7';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(aucBoxX, aucBoxY, aucBoxWidth, aucBoxHeight);

        // Text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`AUC = ${this.aucValue}`, aucBoxX + aucBoxWidth / 2, aucBoxY + 20);
    }

    updateAUC(newAUC) {
        this.aucValue = newAUC;
        this.draw();
    }

    resize(newWidth, newHeight) {
        this.width = newWidth;
        this.height = newHeight;
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.draw();
    }
}

/**
 * Initialize AUC Graph in monitoring interface
 */
function initAUCMonitoring() {
    console.log('📊 Initializing AUC monitoring graph...');

    // Create container if it doesn't exist
    let container = document.getElementById('auc-graph-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'auc-graph-container';
        container.style.cssText = `
            background: linear-gradient(135deg, #0f172a, #1e293b);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #334155;
        `;

        // Insert after network visualization or create standalone
        const networkViz = document.querySelector('.network-visualization');
        if (networkViz) {
            networkViz.parentNode.insertBefore(container, networkViz.nextSibling);
        } else {
            document.body.appendChild(container);
        }
    }

    // Create title
    const title = document.createElement('h3');
    title.textContent = '📈 ROC Curve - Model Performance';
    title.style.cssText = `
        color: #f1f5f9;
        margin-bottom: 20px;
        font-size: 18px;
        font-weight: 700;
        text-align: center;
    `;
    container.appendChild(title);

    // Initialize AUC graph
    window.aucGraph = new AUCGraph('auc-graph-container');

    console.log('✅ AUC monitoring graph initialized');
}

/**
 * Update AUC graph with new data
 */
function updateAUCGraph(aucValue) {
    if (window.aucGraph) {
        window.aucGraph.updateAUC(aucValue);
        console.log(`📊 AUC graph updated to ${aucValue}`);
    }
}

// Export for use in main app
window.AUCGraph = AUCGraph;
window.initAUCMonitoring = initAUCMonitoring;
window.updateAUCGraph = updateAUCGraph;
