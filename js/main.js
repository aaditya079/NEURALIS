/**
 * NEURALIS // Orchestrator UI Bootstrapper
 * Wireframes state events, tabs, sidebars, SVG tree nodes, settings, and live AI API calls.
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

// Live AI custom inputs
const customGoalContainer = document.getElementById('custom-goal-container');
const customGoalInput = document.getElementById('custom-goal-input');
const btnRunCustom = document.getElementById('btn-run-custom');

// Settings modal DOM
const settingsModal = document.getElementById('settings-modal');
const btnOpenSettings = document.getElementById('btn-open-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnSaveSettings = document.getElementById('btn-save-settings');
const apiProviderSelect = document.getElementById('api-provider');
const apiKeyInput = document.getElementById('api-key-input');
const settingsSaveStatus = document.getElementById('settings-save-status');

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

// Settings modal toggle & save actions
function initSettingsSystem() {
  if (btnOpenSettings && settingsModal) {
    btnOpenSettings.addEventListener('click', () => {
      settingsModal.classList.remove('hidden');
      
      // Prefill saved keys
      const savedProvider = localStorage.getItem('agentflow_api_provider') || 'gemini';
      const savedKey = localStorage.getItem('agentflow_api_key') || '';
      if (apiProviderSelect) apiProviderSelect.value = savedProvider;
      if (apiKeyInput) apiKeyInput.value = savedKey;
      if (settingsSaveStatus) settingsSaveStatus.textContent = '';
    });
  }

  if (btnCloseSettings && settingsModal) {
    btnCloseSettings.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
    });
  }

  // Close modal when clicking dark background overlay
  settingsModal?.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });

  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      const provider = apiProviderSelect ? apiProviderSelect.value : 'gemini';
      const key = apiKeyInput ? apiKeyInput.value.trim() : '';

      localStorage.setItem('agentflow_api_provider', provider);
      localStorage.setItem('agentflow_api_key', key);

      if (settingsSaveStatus) {
        settingsSaveStatus.textContent = 'API keys updated successfully!';
        setTimeout(() => {
          settingsModal?.classList.add('hidden');
        }, 1000);
      }
    });
  }
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
    const isActive = currentIndex >= ev.index;
    block.className = `timeline-block ${isActive ? 'active' : ''}`;
    
    block.innerHTML = `
      <span class="timeline-time">${ev.time}</span>
      <span class="timeline-agent">${ev.agent.toUpperCase()}</span>
      <span class="timeline-desc">${ev.desc}</span>
    `;

    block.addEventListener('click', () => {
      stateStore.seekTo(ev.index);
    });

    timelineEventsContainer.appendChild(block);
  });

  const scroller = timelineEventsContainer.parentElement;
  if (scroller) {
    scroller.scrollLeft = scroller.scrollWidth;
  }
}

// Parse simple markdown block styling
function parseMarkdown(text) {
  if (!text) return '<p class="markdown-stream-placeholder">Awaiting token stream...</p>';
  
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
    stateStore.state.activeDiff = {
      filename: filePath.split('/').pop(),
      before: content, 
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

  // Fix 5: Ensure overlay alert ONLY displays when simulation successfully completes at the very last index, preventing bleeding on boot/seeking
  const overlay = document.getElementById('tree-overlay-alert');
  if (overlay) {
    if (stateStore.playbackIndex === stateStore.events.length - 1 && state.metrics.statusClass === 'success') {
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  }
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
    replayScrub.addEventListener('input', () => {
      stateStore.seekTo(parseInt(replayScrub.value));
    });
  }

  if (scenarioSelect) {
    scenarioSelect.addEventListener('change', () => {
      const mode = scenarioSelect.value;
      if (mode === 'live-ai') {
        // Toggle live API input container
        customGoalContainer?.classList.remove('hidden');
      } else {
        customGoalContainer?.classList.add('hidden');
        loadActiveScenario();
      }
    });
  }

  if (btnRunCustom) {
    btnRunCustom.addEventListener('click', () => {
      runLiveAiGoal();
    });
  }

  customGoalInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      runLiveAiGoal();
    }
  });
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

// --------------------------------------------------------------------------
// 💎 10x Feature: Live Gemini / OpenAI Custom Goal API Caller & Fallbacks
// --------------------------------------------------------------------------
async function runLiveAiGoal() {
  const goalText = customGoalInput ? customGoalInput.value.trim() : '';
  if (!goalText) {
    alert('Please enter a custom goal description!');
    return;
  }

  const provider = localStorage.getItem('agentflow_api_provider') || 'gemini';
  const apiKey = localStorage.getItem('agentflow_api_key') || '';

  // Clear previous runs
  stateStore.pause();
  stateStore.resetStateToStart();
  stateStore.events = [];
  stateStore.playbackIndex = -1;

  // Set Loading metrics
  stateStore.state.metrics.statusText = "ORCHESTRATING...";
  stateStore.state.metrics.statusClass = "executing";
  stateStore.state.agents['architect'] = { id: 'architect', name: 'Lead Architect', role: 'Live Coordinator', status: 'thinking', tokens: 0, cost: 0 };
  stateStore.state.activeAgentId = 'architect';
  stateStore.state.taskNodes['root'] = { id: 'root', label: goalText, sublabel: 'Goal Root', status: 'thinking', x: 250, y: 40 };
  stateStore.state.thoughts['architect'] = `# Connecting to Live AI API (${provider.toUpperCase()})...\n\nDecomposing your custom goal: **"${goalText}"**\nCalculating nodes placement, bezier coordinates, and active dependencies tree...`;
  stateStore.notify();

  // If no API Key is provided, automatically trigger the Mock Live AI fallback
  if (!apiKey) {
    terminalShell.appendLogLine('system', 'No developer API key found. Launching custom offline simulation...');
    setTimeout(() => {
      runMockLiveAiGoal(goalText);
    }, 1500);
    return;
  }

  terminalShell.appendLogLine('system', `Orchestrating live API request via ${provider.toUpperCase()}...`);

  try {
    let resultJson;
    
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const prompt = `Decompose the programming goal: "${goalText}". Decompose it into 4-6 sequential engineering task nodes for a task tree layout. You must output ONLY a valid JSON object matching this schema, with no markdown code fence blocks or wrapper texts:\n{\n  "tasks": [\n    { "id": "task-1", "label": "Task Name", "sublabel": "Agent Name", "x": 100, "y": 120, "parentId": "root" }\n  ],\n  "thoughts": [\n    { "agentId": "architect", "text": "Detailed markdown thought analysis of the goal" }\n  ]\n}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      
      if (!response.ok) throw new Error(`Gemini API Error: ${response.statusText}`);
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      resultJson = JSON.parse(text);
    } else {
      // OpenAI API Fetch
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { "role": "system", "content": "You are a senior coordinator agent. Decompose the goal into 4-6 task nodes. Return ONLY a valid JSON object matching: { \"tasks\": [ { \"id\", \"label\", \"sublabel\", \"x\", \"y\", \"parentId\" } ], \"thoughts\": [ { \"agentId\", \"text\" } ] } with response_format json_object." },
            { "role": "user", "content": goalText }
          ],
          response_format: { "type": "json_object" }
        })
      });
      
      if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);
      const data = await response.json();
      resultJson = JSON.parse(data.choices[0].message.content);
    }

    playLiveAiResult(resultJson, goalText);
  } catch (err) {
    console.error(err);
    terminalShell.appendLogLine('error', `Live LLM fetch failed: ${err.message}. Falling back to custom simulation...`);
    stateStore.state.thoughts['architect'] = `# Live API Error\n\nFailed to fetch from ${provider.toUpperCase()}.\n\nError details: \`${err.message}\`\n\nAuto-loading offline simulation fallback...`;
    stateStore.notify();
    setTimeout(() => {
      runMockLiveAiGoal(goalText);
    }, 2000);
  }
}

// Compile LLM JSON response into simulation events and trigger play ticks
function playLiveAiResult(json, goalText) {
  if (!json || !json.tasks) {
    runMockLiveAiGoal(goalText);
    return;
  }

  terminalShell.appendLogLine('success', 'Goal successfully decomposed by AI! Building task tree...');

  const liveEvents = [];
  liveEvents.push({ type: 'TIMELINE_LOG', timestamp: '00:00.0', agentName: 'SYSTEM', description: 'Booting Live LLM workspace.' });
  liveEvents.push({ type: 'TERMINAL_OUTPUT', text: 'Live AI Goal active. Orchestrating subagents...', lineType: 'system' });
  liveEvents.push({ type: 'SPAWN_AGENT', agentId: 'architect', name: 'Lead Architect', role: 'Live Coordinator' });
  liveEvents.push({ type: 'SPAWN_NODE', nodeId: 'root', label: goalText, sublabel: 'Goal Root', status: 'thinking', x: 250, y: 40 });

  // Stream initial thoughts
  const initialThought = json.thoughts && json.thoughts[0] ? json.thoughts[0].text : `# Orchestrated Decompositions\n\nAnalyzing custom goal: "${goalText}"\nVisualizing subtasks.`;
  liveEvents.push({ type: 'STREAM_THOUGHT', agentId: 'architect', text: initialThought });

  // Spawn dynamic task nodes returned by LLM
  json.tasks.forEach((task, idx) => {
    // Standardize coordinates vertically in the viewport to avoid dead space
    const colSpacing = 500 / (json.tasks.length + 1);
    const nodeX = (idx + 1) * colSpacing;
    const nodeY = idx % 2 === 0 ? 120 : 170; // Alternate heights for organic curve look

    liveEvents.push({
      type: 'SPAWN_NODE',
      nodeId: task.id || `task-${idx}`,
      label: task.label || `Step ${idx + 1}`,
      sublabel: task.sublabel || 'DevAgent',
      status: 'planning',
      x: nodeX,
      y: nodeY,
      parentId: 'root'
    });
  });

  // Run mock terminal executions and file changes
  liveEvents.push({ type: 'TIMELINE_LOG', timestamp: '00:03.2', agentName: 'Architect', description: 'Decomposed nodes established.' });
  liveEvents.push({ type: 'SPAWN_AGENT', agentId: 'developer', name: 'DevAgent', role: 'Live Synthesizer' });
  liveEvents.push({ type: 'UPDATE_AGENT_STATUS', agentId: 'developer', status: 'thinking', cost: 0.003, tokens: 210, runtime: 4.5 });
  
  // Stream Dev thoughts
  liveEvents.push({ type: 'STREAM_THOUGHT', agentId: 'developer', text: `# Live Synthesis Execution\n\nActive subtask: Initializing code structures for **"${goalText}"**.\nCreating workspace directories and drafting configuration scripts.` });
  
  // Update node statuses
  if (json.tasks.length > 0) {
    liveEvents.push({ type: 'UPDATE_NODE_STATUS', nodeId: json.tasks[0].id, status: 'executing' });
  }

  liveEvents.push({ type: 'TERMINAL_COMMAND', command: 'mkdir -p src/utils src/components' });
  liveEvents.push({ type: 'TERMINAL_OUTPUT', text: 'Created folders: src/utils/, src/components/', lineType: 'success' });
  
  const demoCode = `// Autogenerated coding skeleton for:
// Goal: ${goalText}
// Compiled live via LLM API

function initOrchestrator() {
  console.log("Goal initialized: ${goalText}");
  return { success: true, timestamp: Date.now() };
}

module.exports = { initOrchestrator };`;

  liveEvents.push({ type: 'VFS_WRITE', path: '/src/utils/orchestrator.js', content: demoCode, operation: 'NEW' });
  
  if (json.tasks.length > 0) {
    liveEvents.push({ type: 'UPDATE_NODE_STATUS', nodeId: json.tasks[0].id, status: 'success' });
  }

  // Final completion
  liveEvents.push({ type: 'TIMELINE_LOG', timestamp: '00:08.5', agentName: 'SYSTEM', description: 'Live orchestration completed.' });
  liveEvents.push({ type: 'SIMULATION_COMPLETE' });

  stateStore.loadEvents(liveEvents);
  setTimeout(() => {
    stateStore.play();
  }, 100);
}

// Offline simulation fallback: Generates custom nodes and outputs dynamically
function runMockLiveAiGoal(goalText) {
  const mockJson = {
    tasks: [
      { id: 'task-1', label: `1. Analyze Requirement`, sublabel: 'Lead Architect' },
      { id: 'task-2', label: `2. Draft ${goalText.split(' ').slice(0,2).join(' ')} Structs`, sublabel: 'Lead Architect' },
      { id: 'task-3', label: `3. Compile Coding Modules`, sublabel: 'DevAgent' },
      { id: 'task-4', label: `4. Run Automated E2E Tests`, sublabel: 'QA-Agent' }
    ],
    thoughts: [
      {
        agentId: 'architect',
        text: `# Goal Decompositions\n\nGoal context: **"${goalText}"**\nDecomposing the requirement into structured, manageable developer targets:\n\n1. **Requirement Research**: Map specs, imports, and security boundaries.\n2. **Architecture Layout**: Design the components and routing schemas.\n3. **Core Development**: Write code files and configuration JSONs.\n4. **Automated Verification**: Build unit test suites and verify outcomes.`
      }
    ]
  };

  playLiveAiResult(mockJson, goalText);
}

// Bootstrap Boot Launcher
window.addEventListener('DOMContentLoaded', () => {
  terminalShell = initTerminalShell();
  taskTreeRenderer = initTaskTree();

  initTabSystem();
  initPlaybackControls();
  initSettingsSystem();

  stateStore.subscribe(syncUiComponents);
  loadActiveScenario();
});
