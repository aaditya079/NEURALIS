/**
 * NEURALIS // Orchestrator UI Bootstrapper
 * Wireframes state events, tabs, sidebars, SVG tree nodes, and play controls.
 */

import { stateStore } from './state.js';
import { getScenarioEvents } from './simulation.js';
import { renderVfsTree } from './fs.js';
import { initTerminalShell } from './terminal.js';
import { initTaskTree } from './tree.js';
import { renderDiffView } from './diff.js';

// Setup global controllers
let terminalShell;
let taskTreeRenderer;

// Capture DOM references
const btnPlayPause = document.getElementById('btn-play-pause');
const btnRewind = document.getElementById('btn-rewind');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
const replayScrub = document.getElementById('replay-scrub');
const scrubLabel = document.getElementById('scrub-label');
const scenarioSelect = document.getElementById('scenario-select');

// Metrics DOM
const metricCost = document.getElementById('metric-cost');
const metricTokens = document.getElementById('metric-tokens');
const metricTime = document.getElementById('metric-time');
const metricStatus = document.getElementById('metric-status');

// Sidebar/Tab DOM
const agentsList = document.getElementById('agents-list');
const agentCount = document.getElementById('agent-count');
const vfsTree = document.getElementById('vfs-tree');
const timelineEventsContainer = document.getElementById('timeline-events');
const thoughtContainer = document.getElementById('thought-markdown-container');
const focusedAgentName = document.getElementById('focused-agent-name');
const focusedAgentStatus = document.getElementById('focused-agent-status');

// Memory DOM
const memoryQuery = document.getElementById('memory-search-query');
const memoryResults = document.getElementById('memory-vector-results');
const memoryKV = document.getElementById('memory-kv-log');

// Prompt Versions DOM
const promptV1 = document.getElementById('prompt-v1');
const promptV2 = document.getElementById('prompt-v2');
const promptCorrectionReason = document.getElementById('prompt-correction-reason');

// Diff DOM
const diffContainer = document.getElementById('diff-container');

// Tab toggles
function initTabSystem() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(tabId)?.classList.add('active');
    });
  });
}

// Format simulated elapsed time clock
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(4, '0')}`;
}

// Render dynamic agent inventory listing
function renderAgents(agentsMap, activeAgentId) {
  if (!agentsList) return;
  const agents = Object.values(agentsMap);
  
  if (agents.length === 0) {
    agentsList.innerHTML = '<div class="empty-state">No active agents spawned.</div>';
    if (agentCount) agentCount.textContent = '0';
    return;
  }

  if (agentCount) agentCount.textContent = agents.length;
  agentsList.innerHTML = '';

  agents.forEach(agent => {
    const card = document.createElement('div');
    card.className = `agent-card ${agent.id === activeAgentId ? 'focused' : ''}`;
    
    card.innerHTML = `
      <div class="agent-card-header">
        <span class="agent-name">${agent.name}</span>
        <span class="agent-status-tag ${agent.status}">${agent.status}</span>
      </div>
      <div class="agent-role">${agent.role}</div>
      <div class="agent-metrics-row">
        <span>TOKENS: ${agent.tokens}</span>
        <span class="text-accent">$${agent.cost.toFixed(4)}</span>
      </div>
    `;

    // Click agent to focus inspection tabs on them
    card.addEventListener('click', () => {
      stateStore.state.activeAgentId = agent.id;
      stateStore.notify();
    });

    agentsList.appendChild(card);
  });
}

// Render horizontal events timeline blocks at the footer
function renderTimeline(timelineArray, currentIndex) {
  if (!timelineEventsContainer) return;

  if (timelineArray.length === 0) {
    timelineEventsContainer.innerHTML = '<div class="timeline-loading-indicator">Waiting for orchestration boot...</div>';
    return;
  }

  timelineEventsContainer.innerHTML = '';
  
  timelineArray.forEach(ev => {
    const block = document.createElement('div');
    // Highlight if this block represents the active replayed step
    const isActive = currentIndex >= ev.index;
    block.className = `timeline-block ${isActive ? 'active' : ''}`;
    
    block.innerHTML = `
      <span class="timeline-time">${ev.time}</span>
      <span class="timeline-agent">${ev.agent.toUpperCase()}</span>
      <span class="timeline-desc">${ev.desc}</span>
    `;

    // Click timeline block to jump back/forward to that specific step! (Interactive Replay)
    block.addEventListener('click', () => {
      stateStore.seekTo(ev.index);
    });

    timelineEventsContainer.appendChild(block);
  });

  // Auto scroll timeline container to the end
  const scroller = timelineEventsContainer.parentElement;
  if (scroller) {
    scroller.scrollLeft = scroller.scrollWidth;
  }
}

// Parse simple markdown block styling
function parseMarkdown(text) {
  if (!text) return '<p class="markdown-stream-placeholder">Awaiting token stream...</p>';
  
  // Custom rapid regex compiler for simple formatting
  let html = text;
  
  // Headers
  html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
  
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html.replace(/\n/g, '<br>')}</p>`;
  
  return html;
}

// Central UI Synchronization Subscription callback (Fires when state shifts)
function syncUiComponents(state) {
  // 1. Sync Scrubber sliders
  if (replayScrub) {
    replayScrub.max = stateStore.events.length - 1;
    replayScrub.value = stateStore.playbackIndex;
  }
  if (scrubLabel) {
    scrubLabel.textContent = `STEP ${stateStore.playbackIndex + 1} / ${stateStore.events.length}`;
  }

  // Play/Pause icon toggling
  if (btnPlayPause) {
    const playIcon = btnPlayPause.querySelector('.play-icon');
    const pauseIcon = btnPlayPause.querySelector('.pause-icon');
    
    if (stateStore.isPlaying) {
      playIcon?.classList.add('hidden');
      pauseIcon?.classList.remove('hidden');
    } else {
      playIcon?.classList.remove('hidden');
      pauseIcon?.classList.add('hidden');
    }
  }

  // 2. Metrics Refresh
  if (metricCost) metricCost.textContent = `$${state.metrics.cost.toFixed(3)}`;
  if (metricTokens) metricTokens.textContent = state.metrics.tokens.toLocaleString();
  if (metricTime) metricTime.textContent = formatTime(state.metrics.runtime);
  
  if (metricStatus) {
    metricStatus.className = `status-badge ${state.metrics.statusClass}`;
    const statusTextEl = metricStatus.querySelector('.status-text');
    if (statusTextEl) statusTextEl.textContent = state.metrics.statusText;
  }

  // 3. Right panel Inspector tabs
  // Thoughts stream
  if (state.activeAgentId && state.agents[state.activeAgentId]) {
    const activeAgent = state.agents[state.activeAgentId];
    if (focusedAgentName) focusedAgentName.textContent = activeAgent.name.toUpperCase();
    if (focusedAgentStatus) {
      focusedAgentStatus.textContent = activeAgent.status;
      focusedAgentStatus.className = `focus-status text-${activeAgent.status}`;
    }
    
    if (thoughtContainer) {
      thoughtContainer.innerHTML = parseMarkdown(state.thoughts[state.activeAgentId]);
    }
  } else {
    if (focusedAgentName) focusedAgentName.textContent = 'NO ACTIVE AGENT';
    if (focusedAgentStatus) focusedAgentStatus.textContent = 'idle';
    if (thoughtContainer) {
      thoughtContainer.innerHTML = '<p class="markdown-stream-placeholder">Click any task node or running agent to inspect live token streams.</p>';
    }
  }

  // Memory Panel
  if (memoryQuery) memoryQuery.textContent = state.memoryQuery || 'None';
  if (memoryResults) {
    if (state.memoryResults && state.memoryResults.length > 0) {
      memoryResults.innerHTML = '';
      state.memoryResults.forEach(res => {
        const node = document.createElement('div');
        node.className = 'vector-node';
        node.innerHTML = `
          <span class="vector-text">${res.text}</span>
          <span class="vector-distance">SCORE: ${res.score.toFixed(2)}</span>
        `;
        memoryResults.appendChild(node);
      });
    } else {
      memoryResults.innerHTML = '<div class="empty-state">No semantic index queried yet.</div>';
    }
  }
  
  if (memoryKV) {
    const keys = Object.keys(state.memoryKV);
    if (keys.length > 0) {
      memoryKV.innerHTML = '';
      keys.forEach(k => {
        const row = document.createElement('div');
        row.className = 'kv-row';
        row.innerHTML = `
          <span class="kv-key">${k}</span>
          <span class="kv-val">${state.memoryKV[k]}</span>
        `;
        memoryKV.appendChild(row);
      });
    } else {
      memoryKV.innerHTML = '<div class="kv-row empty">Empty database.</div>';
    }
  }

  // Prompts version panel
  if (promptV2) {
    promptV2.textContent = state.prompts.v2;
  }
  if (promptCorrectionReason) {
    if (state.prompts.reason) {
      promptCorrectionReason.classList.remove('hidden');
      promptCorrectionReason.textContent = state.prompts.reason.toUpperCase();
    } else {
      promptCorrectionReason.classList.add('hidden');
    }
  }

  // 4. Code Diffs Panel
  if (state.activeDiff) {
    renderDiffView(
      diffContainer,
      state.activeDiff.before,
      state.activeDiff.after,
      state.activeDiff.filename
    );
    const badge = document.getElementById('diff-operation-badge');
    if (badge) {
      badge.textContent = state.activeDiff.operation;
      badge.className = `diff-mode-badge ${state.activeDiff.operation.toLowerCase()}`;
    }
  } else {
    if (diffContainer) {
      diffContainer.innerHTML = '<div class="empty-state">No file edits queued.</div>';
    }
    const badge = document.getElementById('diff-operation-badge');
    if (badge) {
      badge.textContent = 'UNMODIFIED';
      badge.className = 'diff-mode-badge';
    }
    const fileNameLabel = document.getElementById('diff-file-name');
    if (fileNameLabel) fileNameLabel.textContent = 'no_file.js';
  }

  // 5. Sidebar Agents inventory & VFS Tree
  renderAgents(state.agents, state.activeAgentId);
  renderVfsTree(state.vfs, vfsTree, (filePath, content) => {
    // Custom File explorer sidebar click handles: Shows code in the diff viewer!
    stateStore.state.activeDiff = {
      filename: filePath.split('/').pop(),
      before: content, // Unchanged comparison view
      after: content,
      operation: 'VIEWING'
    };
    stateStore.notify();
  });

  // 6. Draw custom SVG Task tree nodes
  taskTreeRenderer.syncTree(state.taskNodes, state.focusedNodeId);

  // 7. Push streamed events to monospace shell console
  terminalShell.syncLogs(state.terminalLogs, state.currentDir);

  // 8. Re-paint Timeline logs
  renderTimeline(state.timelineEvents, stateStore.playbackIndex);
}

// Wire up core button controllers
function initPlaybackControls() {
  if (btnPlayPause) {
    btnPlayPause.addEventListener('click', () => {
      if (stateStore.isPlaying) {
        stateStore.pause();
      } else {
        stateStore.play();
      }
    });
  }

  if (btnRewind) {
    btnRewind.addEventListener('click', () => {
      stateStore.seekTo(-1);
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      stateStore.stepBackward();
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      stateStore.stepForward();
    });
  }

  if (speedSlider) {
    speedSlider.addEventListener('input', () => {
      const val = parseFloat(speedSlider.value);
      if (speedVal) speedVal.textContent = `${val.toFixed(1)}x`;
      stateStore.setSpeed(val);
    });
  }

  if (replayScrub) {
    // Seeking using the scrubber timeline
    replayScrub.addEventListener('input', () => {
      stateStore.seekTo(parseInt(replayScrub.value));
    });
  }

  // Scenario loading trigger
  if (scenarioSelect) {
    scenarioSelect.addEventListener('change', () => {
      loadActiveScenario();
    });
  }
}

// Load a specific scenario by target key
function loadActiveScenario() {
  const scenarioKey = scenarioSelect ? scenarioSelect.value : 'jwt-auth';
  const events = getScenarioEvents(scenarioKey);
  stateStore.loadEvents(events);
  
  // Auto play on change
  setTimeout(() => {
    stateStore.play();
  }, 100);
}

// Bootstrap Boot Launcher
window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize modular terminal and SVG canvas components
  terminalShell = initTerminalShell();
  taskTreeRenderer = initTaskTree();

  // 2. Initialize secondary UI subsystems
  initTabSystem();
  initPlaybackControls();

  // 3. Register central listener hook
  stateStore.subscribe(syncUiComponents);

  // 4. Default Scenario boot
  loadActiveScenario();
});
