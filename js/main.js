import { stateStore } from './state.js';
import { getScenarioEvents } from './simulation.js';
import { renderVfsTree, getAllFiles } from './fs.js';
import { initTerminalShell } from './terminal.js';
import { initTaskTree } from './tree.js';
import { renderDiffView } from './diff.js';
import { TfIdfEngine } from './memory.js';

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
const btnClearSettings = document.getElementById('btn-clear-settings');
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
const memorySearchInput = document.getElementById('memory-search-input');
const btnMemorySearch = document.getElementById('btn-memory-search');

const tfIdfEngine = new TfIdfEngine();

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

  if (btnClearSettings) {
    btnClearSettings.addEventListener('click', () => {
      localStorage.removeItem('agentflow_api_key');
      localStorage.removeItem('agentflow_api_provider');
      if (apiKeyInput) apiKeyInput.value = '';
      if (apiProviderSelect) apiProviderSelect.value = 'gemini';

      if (settingsSaveStatus) {
        settingsSaveStatus.textContent = 'API keys cleared!';
        setTimeout(() => {
          settingsSaveStatus.textContent = '';
        }, 1500);
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

  // Index VFS files dynamically for TF-IDF Cosine Similarity Search
  try {
    const files = getAllFiles(state.vfs);
    tfIdfEngine.documents = {};
    files.forEach(f => tfIdfEngine.addDocument(f.path, f.content));
  } catch (e) {
    console.error('Failed to index VFS:', e);
  }

  // Memory Panel
  if (memoryQuery) memoryQuery.textContent = state.memoryQuery || 'None';
  if (memoryResults) {
    if (state.memoryQuery && state.memoryQuery !== 'None') {
      const results = tfIdfEngine.search(state.memoryQuery);
      if (results.length > 0) {
        memoryResults.innerHTML = '';
        results.forEach(res => {
          const node = document.createElement('div');
          node.className = 'vector-node';
          node.innerHTML = `
            <span class="vector-text">${res.path}</span>
            <span class="vector-distance">SCORE: ${res.score.toFixed(3)}</span>
          `;
          node.style.cursor = 'pointer';
          node.addEventListener('click', () => {
            const doc = tfIdfEngine.documents[res.path];
            if (doc) {
              stateStore.state.activeDiff = {
                filename: res.path.split('/').pop(),
                before: doc.content,
                after: doc.content,
                operation: 'RETRIEVED'
              };
              stateStore.notify();
            }
          });
          memoryResults.appendChild(node);
        });
      } else {
        memoryResults.innerHTML = '<div class="empty-state">No matching document vectors found.</div>';
      }
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

  // TF-IDF manual search trigger
  if (btnMemorySearch) {
    btnMemorySearch.addEventListener('click', () => {
      const qVal = memorySearchInput ? memorySearchInput.value.trim() : '';
      if (qVal) {
        stateStore.state.memoryQuery = qVal;
        stateStore.notify();
      }
    });
  }

  memorySearchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const qVal = memorySearchInput.value.trim();
      if (qVal) {
        stateStore.state.memoryQuery = qVal;
        stateStore.notify();
      }
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
// 💎 10x Feature: Live Gemini / OpenAI / Claude Relay Caller & Failures
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

  terminalShell.appendLogLine('system', `Attempting live API request via backend relay (/api/generate) using ${provider.toUpperCase()}...`);

  try {
    // Attempt request to backend relay
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        goal: goalText,
        provider: provider,
        clientKey: apiKey
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error || `Server returned status ${response.status}`;
      throw new Error(errMsg);
    }

    const resultJson = await response.json();
    playLiveAiResult(resultJson, goalText);
  } catch (err) {
    console.warn('Backend relay failed, checking client-side fallback:', err.message);
    
    // If backend is unavailable or fails, try direct browser-native client-side fallback for Gemini/OpenAI if key is supplied
    if (apiKey && (provider === 'gemini' || provider === 'openai')) {
      terminalShell.appendLogLine('system', `Relay unavailable. Attempting direct browser-to-LLM client request...`);
      try {
        let resultJson;
        if (provider === 'gemini') {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
          const prompt = `Decompose the programming goal: "${goalText}". Decompose it into 4-6 sequential engineering task nodes for a task tree layout. You must output ONLY a valid JSON object matching this schema, with no markdown code fence blocks or wrapper texts:\n{\n  "tasks": [\n    { "id": "task-1", "label": "Task Name", "sublabel": "Agent Name", "parentId": "root" }\n  ],\n  "thoughts": [\n    { "agentId": "architect", "text": "Detailed markdown thought analysis of the goal" }\n  ]\n}`;
          
          const clientRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            })
          });
          if (!clientRes.ok) throw new Error(`Gemini client API failed: ${clientRes.statusText}`);
          const data = await clientRes.json();
          const text = data.candidates[0].content.parts[0].text;
          resultJson = JSON.parse(text);
        } else {
          const clientRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { "role": "system", "content": "You are a senior coordinator agent. Decompose the goal into 4-6 task nodes. Return ONLY a valid JSON object matching: { \"tasks\": [ { \"id\", \"label\", \"sublabel\", \"parentId\" } ], \"thoughts\": [ { \"agentId\", \"text\" } ] } with response_format json_object." },
                { "role": "user", "content": goalText }
              ],
              response_format: { "type": "json_object" }
            })
          });
          if (!clientRes.ok) throw new Error(`OpenAI client API failed: ${clientRes.statusText}`);
          const data = await clientRes.json();
          resultJson = JSON.parse(data.choices[0].message.content);
        }
        playLiveAiResult(resultJson, goalText);
        return;
      } catch (clientErr) {
        console.error('Client-side fallback error:', clientErr);
        terminalShell.appendLogLine('error', `Direct client fallback request failed: ${clientErr.message}`);
      }
    }

    // Trigger visual error boundary UI
    showLiveAiError(err.message, goalText);
  }
}

// Renders the API orchestration error card in the thoughts panel
function showLiveAiError(errorMessage, goalText) {
  stateStore.state.metrics.statusText = "API ERROR";
  stateStore.state.metrics.statusClass = "api-error";
  stateStore.state.taskNodes['root'] = { id: 'root', label: goalText, sublabel: 'Goal Root', status: 'failure', x: 250, y: 40 };
  
  terminalShell.appendLogLine('error', `LIVE API ERROR: ${errorMessage}`);
  terminalShell.appendLogLine('system', `Orchestrator failed. Options rendered inside Thought Stream.`);

  stateStore.state.thoughts['architect'] = `
# ⚠️ Live API Orchestration Failed

We encountered a connection error while trying to reach the LLM coordinator.

**Diagnostics:**
\`\`\`text
${errorMessage}
\`\`\`

---

### 💡 Possible Resolutions:
1. **Host Backend Deployment**: Ensure your Express backend or Vercel Serverless Function `/api/generate` is deployed and environment API keys are active.
2. **Missing Client Key**: Click the **⚙️ API KEY** button in the header and input your developer key.
3. **CORS Blockers**: Direct client requests to Claude or OpenAI are prevented by browser CORS security. Use a backend relay.

---

<div class="api-error-card">
  <h3>API ORCHESTRATION ERROR</h3>
  <p>You can launch a dynamic offline simulation of your goal immediately, configure developer keys, or retry the connection.</p>
  <div class="api-error-actions">
    <button id="btn-err-offline" class="btn-error-action primary">Run Offline Simulator</button>
    <button id="btn-err-settings" class="btn-error-action">Configure Keys</button>
    <button id="btn-err-retry" class="btn-error-action">Retry Connection</button>
  </div>
</div>
`;
  stateStore.notify();

  // Attach event handlers to dynamic cards
  setTimeout(() => {
    document.getElementById('btn-err-offline')?.addEventListener('click', () => {
      terminalShell.appendLogLine('system', 'Running offline goal compiler...');
      runMockLiveAiGoal(goalText);
    });
    document.getElementById('btn-err-settings')?.addEventListener('click', () => {
      settingsModal?.classList.remove('hidden');
    });
    document.getElementById('btn-err-retry')?.addEventListener('click', () => {
      runLiveAiGoal();
    });
  }, 100);
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

  const initialThought = json.thoughts && json.thoughts[0] ? json.thoughts[0].text : `# Orchestrated Decompositions\n\nAnalyzing custom goal: "${goalText}"\nVisualizing subtasks.`;
  liveEvents.push({ type: 'STREAM_THOUGHT', agentId: 'architect', text: initialThought });

  // Spawn dynamic task nodes returned by LLM
  json.tasks.forEach((task, idx) => {
    const colSpacing = 500 / (json.tasks.length + 1);
    const nodeX = (idx + 1) * colSpacing;
    const nodeY = idx % 2 === 0 ? 120 : 170;

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

  liveEvents.push({ type: 'TIMELINE_LOG', timestamp: '00:03.2', agentName: 'Architect', description: 'Decomposed nodes established.' });
  liveEvents.push({ type: 'SPAWN_AGENT', agentId: 'developer', name: 'DevAgent', role: 'Live Synthesizer' });
  liveEvents.push({ type: 'UPDATE_AGENT_STATUS', agentId: 'developer', status: 'thinking', cost: 0.003, tokens: 210, runtime: 4.5 });
  liveEvents.push({ type: 'STREAM_THOUGHT', agentId: 'developer', text: `# Live Synthesis Execution\n\nActive subtask: Initializing code structures for **"${goalText}"**.\nCreating workspace directories and drafting configuration scripts.` });
  
  if (json.tasks.length > 0) {
    liveEvents.push({ type: 'UPDATE_NODE_STATUS', nodeId: json.tasks[0].id, status: 'executing' });
  }

  liveEvents.push({ type: 'TERMINAL_COMMAND', command: 'mkdir -p src/utils src/components' });
  liveEvents.push({ type: 'TERMINAL_OUTPUT', text: 'Created folders: src/utils/, src/components/', lineType: 'success' });
  
  const demoCode = `// Autogenerated coding skeleton for:\n// Goal: ${goalText}\n// Compiled live via LLM API\n\nfunction initOrchestrator() {\n  console.log("Goal initialized: ${goalText}");\n  return { success: true, timestamp: Date.now() };\n}\n\nmodule.exports = { initOrchestrator };`;

  liveEvents.push({ type: 'VFS_WRITE', path: '/src/utils/orchestrator.js', content: demoCode, operation: 'NEW' });
  
  if (json.tasks.length > 0) {
    liveEvents.push({ type: 'UPDATE_NODE_STATUS', nodeId: json.tasks[0].id, status: 'success' });
  }

  liveEvents.push({ type: 'TIMELINE_LOG', timestamp: '00:08.5', agentName: 'SYSTEM', description: 'Live orchestration completed.' });
  liveEvents.push({ type: 'SIMULATION_COMPLETE' });

  stateStore.loadEvents(liveEvents);
  setTimeout(() => {
    stateStore.play();
  }, 100);
}

// Smart offline scenario planner mapping user query terms to dynamic mock structures
function runMockLiveAiGoal(goalText) {
  const goal = goalText.toLowerCase();
  
  let fileToCreate = '/src/utils/orchestrator.js';
  let demoCode = '';
  let nodeType = 'DevAgent';
  let agentThought = '';
  let command = 'npm run test';
  let commandOutput = '';
  
  if (goal.includes('stripe') || goal.includes('pay') || goal.includes('billing')) {
    fileToCreate = '/src/routes/payments.js';
    demoCode = `const express = require('express');\nconst router = express.Router();\nconst stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);\n\nrouter.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {\n  const sig = req.headers['stripe-signature'];\n  let event;\n  try {\n    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);\n  } catch (err) {\n    return res.status(400).send(\`Webhook Error: \${err.message}\`);\n  }\n  \n  if (event.type === 'checkout.session.completed') {\n    const session = event.data.object;\n    // Fulfill checkout...\n  }\n  res.json({received: true});\n});\n\nmodule.exports = router;`;
    nodeType = 'StripeAgent';
    agentThought = `# Stripe Webhook Decompositions\n\nGoal context: **"${goalText}"**\nImplementing secure Stripe webhook endpoint:\n\n1. Verify signatures to prevent replay attacks.\n2. Ingest events and filter for checkout completions.\n3. Run local webhook proxy for validation.`;
    command = 'stripe trigger checkout.session.completed';
    commandOutput = '✓ Webhook event checkout.session.completed triggered successfully. HTTP 200 OK.';
  } else if (goal.includes('docker') || goal.includes('container') || goal.includes('kube') || goal.includes('ci')) {
    fileToCreate = '/Dockerfile';
    demoCode = `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nEXPOSE 3000\nCMD ["node", "server.js"]`;
    nodeType = 'DevOpsAgent';
    agentThought = `# Docker Deployment Decompositions\n\nGoal context: **"${goalText}"**\nBuilding Node docker container:\n\n1. Separate dependency installation from file copying to leverage layer caching.\n2. Use multi-stage build structure for minimal size.`;
    command = 'docker build -t app-image .';
    commandOutput = 'Successfully built image app-image:latest (124MB)';
  } else if (goal.includes('python') || goal.includes('django') || goal.includes('flask') || goal.includes('fastapi')) {
    fileToCreate = '/app/main.py';
    demoCode = `from fastapi import FastAPI\napp = FastAPI()\n\n@app.get("/")\ndef read_root():\n    return {"status": "online", "framework": "FastAPI"}`;
    nodeType = 'PythonAgent';
    agentThought = `# Python API Decompositions\n\nGoal context: **"${goalText}"**\nSetting up FastAPI framework:\n\n1. Define endpoints with type validation.\n2. Configure uvicorn runner for local testing.`;
    command = 'uvicorn app.main:app --reload';
    commandOutput = 'INFO:     Uvicorn server running on http://127.0.0.1:8000 (Press CTRL+C to quit)';
  } else {
    fileToCreate = '/src/utils/orchestrator.js';
    demoCode = `// Autogenerated skeleton module\nfunction initModule() {\n  console.log("Initializing module for: ${goalText}");\n  return { success: true };\n}\nmodule.exports = { initModule };`;
    nodeType = 'DevAgent';
    agentThought = `# Goal Decompositions\n\nGoal context: **"${goalText}"**\nDecomposing user requirements into core subtasks:\n\n1. Define specs and architecture.\n2. Code core modules and dependencies.\n3. Conduct E2E validation.`;
    command = 'npm run test:unit';
    commandOutput = '✓ Unit tests completed. 100% assertions passed.';
  }

  const dynamicJson = {
    tasks: [
      { id: 'task-1', label: `1. Define Design Specs`, sublabel: 'Lead Architect' },
      { id: 'task-2', label: `2. Initialize Project Modules`, sublabel: nodeType },
      { id: 'task-3', label: `3. Run Automation Suite`, sublabel: 'QA-Agent' }
    ],
    thoughts: [
      { agentId: 'architect', text: agentThought }
    ]
  };

  terminalShell.appendLogLine('success', 'Goal parsed offline successfully! Generating dynamic simulation events...');

  const liveEvents = [];
  liveEvents.push({ type: 'TIMELINE_LOG', timestamp: '00:00.0', agentName: 'SYSTEM', description: 'Booting custom offline simulation.' });
  liveEvents.push({ type: 'SPAWN_AGENT', agentId: 'architect', name: 'Lead Architect', role: 'Live Coordinator' });
  liveEvents.push({ type: 'SPAWN_NODE', nodeId: 'root', label: goalText, sublabel: 'Goal Root', status: 'thinking', x: 250, y: 40 });
  liveEvents.push({ type: 'STREAM_THOUGHT', agentId: 'architect', text: dynamicJson.thoughts[0].text });

  dynamicJson.tasks.forEach((task, idx) => {
    const colSpacing = 500 / (dynamicJson.tasks.length + 1);
    const nodeX = (idx + 1) * colSpacing;
    const nodeY = idx % 2 === 0 ? 120 : 170;

    liveEvents.push({
      type: 'SPAWN_NODE',
      nodeId: task.id,
      label: task.label,
      sublabel: task.sublabel,
      status: 'planning',
      x: nodeX,
      y: nodeY,
      parentId: 'root'
    });
  });

  liveEvents.push({ type: 'TIMELINE_LOG', timestamp: '00:02.5', agentName: 'Architect', description: 'Tasks mapped and scheduled.' });
  liveEvents.push({ type: 'SPAWN_AGENT', agentId: 'developer', name: nodeType, role: 'Task Implementer' });
  liveEvents.push({ type: 'UPDATE_AGENT_STATUS', agentId: 'developer', status: 'thinking', cost: 0.002, tokens: 180, runtime: 3.5 });
  liveEvents.push({ type: 'UPDATE_NODE_STATUS', nodeId: 'task-1', status: 'success' });
  liveEvents.push({ type: 'UPDATE_NODE_STATUS', nodeId: 'task-2', status: 'executing' });
  
  liveEvents.push({
    type: 'STREAM_THOUGHT',
    agentId: 'developer',
    text: `# Writing Module Files\n\nCreating module file: \`${fileToCreate}\` to address requirement.\n\nCode Draft:\n\`\`\`javascript\n${demoCode}\n\`\`\``
  });

  liveEvents.push({ type: 'VFS_WRITE', path: fileToCreate, content: demoCode, operation: 'NEW' });
  liveEvents.push({ type: 'UPDATE_NODE_STATUS', nodeId: 'task-2', status: 'success' });

  liveEvents.push({ type: 'SPAWN_AGENT', agentId: 'qa', name: 'QA-Agent', role: 'Verification Analyst' });
  liveEvents.push({ type: 'UPDATE_NODE_STATUS', nodeId: 'task-3', status: 'executing' });
  liveEvents.push({ type: 'TERMINAL_COMMAND', command: command });
  liveEvents.push({ type: 'TERMINAL_OUTPUT', text: commandOutput, lineType: 'success' });
  
  liveEvents.push({ type: 'UPDATE_NODE_STATUS', nodeId: 'task-3', status: 'success' });
  liveEvents.push({ type: 'UPDATE_NODE_STATUS', nodeId: 'root', status: 'success' });
  liveEvents.push({ type: 'TIMELINE_LOG', timestamp: '00:07.4', agentName: 'SYSTEM', description: 'Offline simulation successfully completed.' });
  liveEvents.push({ type: 'SIMULATION_COMPLETE' });

  stateStore.loadEvents(liveEvents);
  setTimeout(() => {
    stateStore.play();
  }, 100);
}

// Setup mobile navigation tab bindings
function initMobileNavSystem() {
  const mobileTabBtns = document.querySelectorAll('.mobile-tab-btn');
  const dashboardContainer = document.querySelector('.dashboard-container');
  
  if (mobileTabBtns && dashboardContainer) {
    // Default show workspace on mobile viewports
    dashboardContainer.classList.add('mobile-show-workspace');
    
    mobileTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.dataset.panel;
        
        mobileTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        dashboardContainer.classList.remove(
          'mobile-show-workspace',
          'mobile-show-tree',
          'mobile-show-terminal',
          'mobile-show-inspector'
        );
        
        if (panel === 'workspace') dashboardContainer.classList.add('mobile-show-workspace');
        else if (panel === 'tree') dashboardContainer.classList.add('mobile-show-tree');
        else if (panel === 'terminal') dashboardContainer.classList.add('mobile-show-terminal');
        else if (panel === 'inspector') dashboardContainer.classList.add('mobile-show-inspector');
      });
    });
  }
}

// Bootstrap Boot Launcher
window.addEventListener('DOMContentLoaded', () => {
  terminalShell = initTerminalShell();
  taskTreeRenderer = initTaskTree();

  initTabSystem();
  initPlaybackControls();
  initSettingsSystem();
  initMobileNavSystem();

  stateStore.subscribe(syncUiComponents);
  loadActiveScenario();
});
