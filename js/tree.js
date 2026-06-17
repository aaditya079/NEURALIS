/**
 * NEURALIS // Dynamic SVG Task Tree Visualizer
 * Renders custom task trees, status glow indications, bezier curves, and pulse flows.
 */

import { stateStore } from './state.js';

class TaskTreeRenderer {
  constructor() {
    this.svgElement = document.getElementById('task-tree-svg');
    this.zoomGroup = document.getElementById('svg-zoom-group');
    this.connGroup = document.getElementById('svg-connections');
    this.nodeGroup = document.getElementById('svg-nodes');
    
    // Zoom/Pan State
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    this.initCanvasControls();
  }

  // Set up zoom, pan, and dragging events
  initCanvasControls() {
    if (!this.svgElement) return;

    // Zoom Buttons
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.adjustZoom(0.1));
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.adjustZoom(-0.1));
    document.getElementById('btn-zoom-fit')?.addEventListener('click', () => this.resetZoom());

    // Mouse drag-panning on SVG Canvas background
    this.svgElement.addEventListener('mousedown', (e) => {
      if (e.target === this.svgElement || e.target.id === 'svg-connections' || e.target.id === 'svg-zoom-group') {
        this.isDragging = true;
        this.startX = e.clientX - this.panX;
        this.startY = e.clientY - this.panY;
        this.svgElement.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.panX = e.clientX - this.startX;
        this.panY = e.clientY - this.startY;
        this.updateTransform();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        if (this.svgElement) {
          this.svgElement.style.cursor = 'default';
        }
      }
    });
  }

  adjustZoom(amount) {
    this.zoom = Math.max(0.4, Math.min(3.0, this.zoom + amount));
    this.updateTransform();
  }

  resetZoom() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.updateTransform();
  }

  updateTransform() {
    if (this.zoomGroup) {
      this.zoomGroup.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    }
  }

  // Core Render Method: Re-draw all SVG nodes and links based on current state
  syncTree(nodesMap, focusedNodeId) {
    if (!this.svgElement || !this.connGroup || !this.nodeGroup) return;

    // Clear previous elements
    this.connGroup.innerHTML = '';
    this.nodeGroup.innerHTML = '';

    const nodesList = Object.values(nodesMap);
    if (nodesList.length === 0) return;

    // 1. Draw Connections (Bezier Paths)
    for (const node of nodesList) {
      if (node.parentId && nodesMap[node.parentId]) {
        const parent = nodesMap[node.parentId];
        this.drawBezierCable(parent.x, parent.y + 19, node.x, node.y - 19, node.status);
      }
    }

    // 2. Draw Nodes
    for (const node of nodesList) {
      this.drawNode(node, node.id === focusedNodeId);
    }
  }

  // Draw smooth cubic-bezier curve from parent to child
  drawBezierCable(x1, y1, x2, y2, childStatus) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Calculate bezier handle offset based on distance
    const dy = Math.abs(y2 - y1);
    const controlOffset = dy * 0.5;

    // Curve layout: vertical flows (Parent above, child below)
    const pathStr = `M ${x1} ${y1} C ${x1} ${y1 + controlOffset}, ${x2} ${y2 - controlOffset}, ${x2} ${y2}`;
    path.setAttribute('d', pathStr);

    // Color and glow animations based on target child node status
    let strokeColor = 'var(--border-dim)';
    let isFlowing = false;
    let flowSpeed = '1s';

    if (childStatus === 'thinking') {
      strokeColor = 'var(--state-thinking)';
      isFlowing = true;
      flowSpeed = '1.5s';
    } else if (childStatus === 'executing') {
      strokeColor = 'var(--state-executing)';
      isFlowing = true;
      flowSpeed = '0.8s';
    } else if (childStatus === 'success') {
      strokeColor = 'var(--state-success)';
    } else if (childStatus === 'failure') {
      strokeColor = 'var(--state-failure)';
    } else if (childStatus === 'planning') {
      strokeColor = 'var(--state-planning)';
      isFlowing = true;
      flowSpeed = '2s';
    }

    path.setAttribute('stroke', strokeColor);
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('fill', 'none');
    path.className.baseVal = 'connection-line';
    
    this.connGroup.appendChild(path);

    // Add overlay glowing packet pulse animation if active/working
    if (isFlowing) {
      const flowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      flowPath.setAttribute('d', pathStr);
      flowPath.setAttribute('stroke', strokeColor);
      flowPath.setAttribute('stroke-width', '2.5');
      flowPath.setAttribute('fill', 'none');
      flowPath.className.baseVal = 'connection-line glow';
      flowPath.style.animationDuration = flowSpeed;
      flowPath.style.filter = 'url(#glow)';
      
      this.connGroup.appendChild(flowPath);
    }
  }

  // Draw recursive rectangular cards for task nodes (DAG layout style)
  drawNode(node, isFocused) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.className.baseVal = 'node-group';
    g.style.cursor = 'pointer';

    // Map status colors
    let statusColor = 'var(--state-idle)';
    let isExecuting = false;

    if (node.status === 'thinking') {
      statusColor = 'var(--state-thinking)';
    } else if (node.status === 'executing') {
      statusColor = 'var(--state-executing)';
      isExecuting = true;
    } else if (node.status === 'success') {
      statusColor = 'var(--state-success)';
    } else if (node.status === 'failure') {
      statusColor = 'var(--state-failure)';
    } else if (node.status === 'planning') {
      statusColor = 'var(--state-planning)';
    }

    // Card Dimensions (Sleek horizontal compact layout)
    const cardWidth = 154;
    const cardHeight = 38;
    const cardX = node.x - cardWidth / 2;
    const cardY = node.y - cardHeight / 2;

    // 1. Main Card Background Rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', cardX);
    rect.setAttribute('y', cardY);
    rect.setAttribute('width', cardWidth);
    rect.setAttribute('height', cardHeight);
    rect.setAttribute('rx', '6');
    rect.setAttribute('ry', '6');
    rect.setAttribute('fill', 'var(--bg-card)'); // Theme-responsive card background
    rect.setAttribute('stroke', isFocused ? 'var(--accent-color)' : 'var(--border-dim)'); // Theme-responsive border
    rect.setAttribute('stroke-width', isFocused ? '1.5' : '1');
    rect.className.baseVal = 'node-card-rect';
    g.appendChild(rect);

    // 2. Status Indicator Strip (Left Edge of Card)
    const statusStrip = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    statusStrip.setAttribute('x', cardX);
    statusStrip.setAttribute('y', cardY);
    statusStrip.setAttribute('width', '3');
    statusStrip.setAttribute('height', cardHeight);
    statusStrip.setAttribute('rx', '1');
    statusStrip.setAttribute('fill', statusColor);
    g.appendChild(statusStrip);

    // 3. Task Title (Primary Label) - Left Aligned
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', cardX + 10);
    label.setAttribute('y', cardY + 16);
    label.className.baseVal = 'node-card-title';
    let cleanLabel = node.label;
    if (cleanLabel.length > 25) cleanLabel = cleanLabel.substring(0, 23) + '...';
    label.textContent = cleanLabel;
    g.appendChild(label);

    // 4. Assigned Agent (Sublabel) - Left Aligned
    const sublabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sublabel.setAttribute('x', cardX + 10);
    sublabel.setAttribute('y', cardY + 28);
    sublabel.className.baseVal = 'node-card-agent';
    sublabel.textContent = node.sublabel;
    g.appendChild(sublabel);

    // 5. Small Status Indicator Dot on Right Edge
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', cardX + cardWidth - 12);
    dot.setAttribute('cy', node.y);
    dot.setAttribute('r', '3.5');
    dot.setAttribute('fill', statusColor);
    if (isExecuting || node.status === 'thinking') {
      dot.className.baseVal = 'node-status-dot-pulse';
    }
    g.appendChild(dot);

    // Node Interaction: Click node to focus on that subtask
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      stateStore.state.focusedNodeId = node.id;
      
      // Auto focus the respective agent of this node
      const matchingAgent = Object.values(stateStore.state.agents).find(
        a => a.name.toLowerCase() === node.sublabel.toLowerCase() ||
             node.sublabel.toLowerCase().includes(a.name.toLowerCase())
      );
      if (matchingAgent) {
        stateStore.state.activeAgentId = matchingAgent.id;
      }
      
      stateStore.notify();
    });

    this.nodeGroup.appendChild(g);
  }
}

let treeInstance = null;
export function initTaskTree() {
  if (!treeInstance) {
    treeInstance = new TaskTreeRenderer();
  }
  return treeInstance;
}
