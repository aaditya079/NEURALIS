/**
 * NEURALIS // Event-Sourced Central State Store
 * Manages the immutable event log, replay timeline index, and reactive UI hooks.
 */

class StateStore {
  constructor() {
    this.events = [];          // Master log of all events
    this.playbackIndex = -1;   // Current index in the events stream
    this.isPlaying = false;    // Replay play/pause state
    this.speed = 1.0;          // Playback speed multiplier (seconds per tick)
    this.playTimer = null;     // Interval timer reference
    
    // Core Application State derived from events up to playbackIndex
    this.state = {
      agents: {},             // id -> { name, role, status, tokens, cost }
      taskNodes: {},          // id -> { label, sublabel, status, x, y, parentId }
      vfs: {                  // Virtual File System JSON
        type: 'directory',
        name: 'root',
        children: {}
      },
      currentDir: '/',        // Current directory path in terminal
      terminalLogs: [],       // Array of terminal line items { type, text }
      activeAgentId: null,    // Currently focused agent ID
      focusedNodeId: null,    // Currently focused task tree node ID
      thoughts: {},           // agentId -> streamed thought markdown
      memoryQuery: '',        // Vector DB active query
      memoryResults: [],      // Vector DB semantic matches
      memoryKV: {},           // Long-term Key-Value pairs
      activeDiff: null,       // { filename, before, after, operation }
      prompts: {
        v1: "You are a software engineer agent. Write the requested code structure...",
        v2: "No self-correction applied yet.",
        reason: ""
      },
      timelineEvents: [],     // Logs displayed on bottom timeline
      metrics: {
        cost: 0,
        tokens: 0,
        runtime: 0,
        statusText: "INITIALIZING",
        statusClass: "paused"
      }
    };

    // Reactive Listeners
    this.listeners = [];
  }

  // Register UI components to listen for state changes
  subscribe(callback) {
    this.listeners.push(callback);
    // Initial trigger
    callback(this.state);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // Load a new list of events and reset playback
  loadEvents(eventsList) {
    this.pause();
    this.events = eventsList;
    this.playbackIndex = -1;
    this.resetStateToStart();
    this.notify();
  }

  // Set playback speed
  setSpeed(speedVal) {
    this.speed = speedVal;
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  // Event Sourcing Core: Reset internal state to blank
  resetStateToStart() {
    this.state.agents = {};
    this.state.taskNodes = {};
    this.state.vfs = {
      type: 'directory',
      name: 'root',
      children: {
        'README.md': {
          type: 'file',
          name: 'README.md',
          content: '# NEURALIS DEVELOPER CONSOLE\n\nActive goal simulation system initialized.\nSelect a target goal to begin autonomous coding visualizer.'
        }
      }
    };
    this.state.currentDir = '/';
    this.state.terminalLogs = [
      { type: 'system', text: 'NEURALIS Shell Kernel v1.0.4 Loaded.' },
      { type: 'system', text: "Type 'help' to view simulated filesystem and agent controls." },
      { type: 'system', text: 'Ready.' }
    ];
    this.state.activeAgentId = null;
    this.state.focusedNodeId = null;
    this.state.thoughts = {};
    this.state.memoryQuery = 'None';
    this.state.memoryResults = [];
    this.state.memoryKV = {};
    this.state.activeDiff = null;
    this.state.prompts = {
      v1: "You are a software engineer agent. Write the requested code structure...",
      v2: "No self-correction applied yet.",
      reason: ""
    };
    this.state.timelineEvents = [];
    this.state.metrics = {
      cost: 0,
      tokens: 0,
      runtime: 0,
      statusText: "PAUSED",
      statusClass: "paused"
    };
  }

  // Apply a single event to the state (Mutator)
  applyEvent(event) {
    if (!event) return;

    // Accumulate basic metrics
    if (event.tokens) this.state.metrics.tokens += event.tokens;
    if (event.cost) this.state.metrics.cost += event.cost;
    if (event.runtime) this.state.metrics.runtime = event.runtime;

    switch (event.type) {
      case 'SPAWN_AGENT':
        this.state.agents[event.agentId] = {
          id: event.agentId,
          name: event.name,
          role: event.role,
          status: 'idle',
          tokens: 0,
          cost: 0
        };
        // Auto focus the newly spawned agent
        this.state.activeAgentId = event.agentId;
        break;

      case 'UPDATE_AGENT_STATUS':
        if (this.state.agents[event.agentId]) {
          this.state.agents[event.agentId].status = event.status;
          if (event.tokens) this.state.agents[event.agentId].tokens += event.tokens;
          if (event.cost) this.state.agents[event.agentId].cost += event.cost;
          
          // Sync master running status text
          if (event.status === 'thinking') {
            this.state.metrics.statusText = `${this.state.agents[event.agentId].name.toUpperCase()} THINKING`;
            this.state.metrics.statusClass = 'thinking';
          } else if (event.status === 'executing') {
            this.state.metrics.statusText = `${this.state.agents[event.agentId].name.toUpperCase()} EXECUTING`;
            this.state.metrics.statusClass = 'executing';
          }
        }
        break;

      case 'STREAM_THOUGHT':
        if (!this.state.thoughts[event.agentId]) {
          this.state.thoughts[event.agentId] = '';
        }
        if (event.replace) {
          this.state.thoughts[event.agentId] = event.text;
        } else {
          this.state.thoughts[event.agentId] += event.text;
        }
        this.state.activeAgentId = event.agentId;
        break;

      case 'SPAWN_NODE':
        this.state.taskNodes[event.nodeId] = {
          id: event.nodeId,
          label: event.label,
          sublabel: event.sublabel,
          status: event.status || 'planning',
          x: event.x,
          y: event.y,
          parentId: event.parentId
        };
        this.state.focusedNodeId = event.nodeId;
        break;

      case 'UPDATE_NODE_STATUS':
        if (this.state.taskNodes[event.nodeId]) {
          this.state.taskNodes[event.nodeId].status = event.status;
          this.state.focusedNodeId = event.nodeId;
        }
        break;

      case 'TERMINAL_COMMAND':
        this.state.terminalLogs.push({
          type: 'command',
          text: event.command
        });
        break;

      case 'TERMINAL_OUTPUT':
        this.state.terminalLogs.push({
          type: event.lineType || 'output',
          text: event.text
        });
        // Limit logs to last 150 entries to keep memory smooth
        if (this.state.terminalLogs.length > 150) {
          this.state.terminalLogs.shift();
        }
        break;

      case 'VFS_WRITE':
        this.writeToVfs(event.path, event.content);
        this.state.activeDiff = {
          filename: event.path.split('/').pop(),
          before: event.before || '',
          after: event.content || '',
          operation: event.operation || 'MODIFIED'
        };
        break;

      case 'MEMORY_QUERY':
        this.state.memoryQuery = event.query;
        this.state.memoryResults = event.results || [];
        break;

      case 'MEMORY_WRITE':
        this.state.memoryKV[event.key] = event.value;
        break;

      case 'PROMPT_REVISION':
        this.state.prompts.v2 = event.content;
        this.state.prompts.reason = event.reason;
        break;

      case 'TIMELINE_LOG':
        // Add to chronological log list
        this.state.timelineEvents.push({
          id: event.eventId || Math.random().toString(36),
          time: event.timestamp || '00:00.0',
          agent: event.agentName || 'SYSTEM',
          desc: event.description || '',
          index: this.playbackIndex
        });
        break;
      
      case 'SIMULATION_COMPLETE':
        this.state.metrics.statusText = "SIMULATION COMPLETED";
        this.state.metrics.statusClass = "success";
        break;
      
      case 'SIMULATION_FAILURE':
        this.state.metrics.statusText = "SIMULATION FAILED";
        this.state.metrics.statusClass = "failure";
        break;
    }
  }

  // Helper: Write a file path to the nested in-memory virtual filesystem
  writeToVfs(filePath, content) {
    const parts = filePath.split('/').filter(p => p !== '');
    let current = this.state.vfs;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        current.children[part] = {
          type: 'file',
          name: part,
          content: content
        };
      } else {
        if (!current.children[part] || current.children[part].type !== 'directory') {
          current.children[part] = {
            type: 'directory',
            name: part,
            children: {}
          };
        }
        current = current.children[part];
      }
    }
  }

  // Playback seeking: Re-compute state from step -1 up to requested targetIndex
  seekTo(targetIndex) {
    if (targetIndex < -1) targetIndex = -1;
    if (targetIndex >= this.events.length) targetIndex = this.events.length - 1;

    this.resetStateToStart();
    this.playbackIndex = -1;

    for (let i = 0; i <= targetIndex; i++) {
      this.playbackIndex = i;
      this.applyEvent(this.events[i]);
    }

    if (this.playbackIndex === this.events.length - 1) {
      if (this.state.metrics.statusClass !== 'failure') {
        this.state.metrics.statusText = "SIMULATION COMPLETED";
        this.state.metrics.statusClass = "success";
      }
    } else if (this.playbackIndex === -1) {
      this.state.metrics.statusText = "PAUSED";
      this.state.metrics.statusClass = "paused";
    } else {
      if (!this.isPlaying) {
        this.state.metrics.statusText = "PAUSED";
        this.state.metrics.statusClass = "paused";
      }
    }

    this.notify();
  }

  // Step forward one event tick
  stepForward() {
    if (this.playbackIndex < this.events.length - 1) {
      this.playbackIndex++;
      this.applyEvent(this.events[this.playbackIndex]);
      
      // Update completion stats
      if (this.playbackIndex === this.events.length - 1) {
        this.pause();
        if (this.state.metrics.statusClass !== 'failure') {
          this.state.metrics.statusText = "SIMULATION COMPLETED";
          this.state.metrics.statusClass = "success";
        }
      }
      this.notify();
    }
  }

  // Step backward one event tick
  stepBackward() {
    if (this.playbackIndex >= 0) {
      this.seekTo(this.playbackIndex - 1);
    }
  }

  // Start automatic clock ticks
  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    // Core game tick timer
    const runTick = () => {
      if (this.playbackIndex < this.events.length - 1) {
        this.stepForward();
        // Dynamic interval speed mapping
        const nextTickDelay = (1000 / this.speed);
        this.playTimer = setTimeout(runTick, nextTickDelay);
      } else {
        this.pause();
      }
    };
    
    const nextTickDelay = (1000 / this.speed);
    this.playTimer = setTimeout(runTick, nextTickDelay);
    this.notify();
  }

  // Pause clock ticks
  pause() {
    this.isPlaying = false;
    if (this.playTimer) {
      clearTimeout(this.playTimer);
      this.playTimer = null;
    }
    if (this.playbackIndex < this.events.length - 1 && this.playbackIndex > -1) {
      this.state.metrics.statusText = "PAUSED";
      this.state.metrics.statusClass = "paused";
    }
    this.notify();
  }
}

// Instantiate single shared instance
export const stateStore = new StateStore();
