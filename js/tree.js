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
        this.drawBezierCable(parent.x, parent.y, node.x, node.y, node.status);
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

  // Draw recursive circle nodes with custom highlights
  drawNode(node, isFocused) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.className.baseVal = 'node-group';
    g.style.cursor = 'pointer';

    // Map status colors
    let fill = '#0f172a';
    let stroke = 'var(--border-dim)';
    let glowFilter = '';
    let statusClass = 'idle';

    if (node.status === 'thinking') {
      stroke = 'var(--state-thinking)';
      glowFilter = 'url(#glow)';
      statusClass = 'thinking';
    } else if (node.status === 'executing') {
      stroke = 'var(--state-executing)';
      glowFilter = 'url(#glow)';
      statusClass = 'executing';
    } else if (node.status === 'success') {
      stroke = 'var(--state-success)';
      statusClass = 'success';
    } else if (node.status === 'failure') {
      stroke = 'var(--state-failure)';
      statusClass = 'failure';
    } else if (node.status === 'planning') {
      stroke = 'var(--state-planning)';
      statusClass = 'planning';
    }

    // Create Main Node Outer Ring
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', isFocused ? '14' : '11');
    circle.setAttribute('fill', fill);
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-dasharray', node.status === 'planning' ? '3,3' : 'none');
    circle.className.baseVal = 'node-circle';
    
    if (glowFilter) {
      circle.setAttribute('filter', glowFilter);
    }
    
    g.appendChild(circle);

    // Inner core node point
    const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    core.setAttribute('cx', node.x);
    core.setAttribute('cy', node.y);
    core.setAttribute('r', '4');
    core.setAttribute('fill', stroke);
    g.appendChild(core);

    // Status beacon dot
    const beacon = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    beacon.setAttribute('cx', node.x + 8);
    beacon.setAttribute('cy', node.y - 8);
    beacon.setAttribute('r', '3');
    beacon.setAttribute('fill', stroke);
    beacon.className.baseVal = 'node-status-dot';
    g.appendChild(beacon);

    // Primary Label (Task Title)
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', node.x);
    label.setAttribute('y', node.y + 24);
    label.className.baseVal = 'node-label';
    label.textContent = node.label;
    g.appendChild(label);

    // Sublabel (Agent assigned / Status info)
    const sublabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sublabel.setAttribute('x', node.x);
    sublabel.setAttribute('y', node.y + 33);
    sublabel.className.baseVal = 'node-sublabel';
    sublabel.textContent = node.sublabel;
    g.appendChild(sublabel);

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
