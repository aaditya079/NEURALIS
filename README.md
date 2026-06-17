# NEURALIS // Multi-Agent Developer Console

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=github)](https://aaditya079.github.io/NEURALIS/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![CI Pipeline](https://img.shields.io/github/actions/workflow/status/aaditya079/NEURALIS/CI%20Pipeline?branch=main&style=for-the-badge&logo=github-actions)](https://github.com/aaditya079/NEURALIS/actions)

Browser-native multi-agent AI console with event-sourced state, real LCS diffing, custom SVG task trees, and local Ollama & cloud LLM API integration. Zero dependencies, zero build step.

---

## 💡 What is NEURALIS?

**NEURALIS** is an interactive, browser-native developer workspace designed to simulate and execute multi-agent software engineering workflows. It provides a visual, real-time representation of how multiple AI agents (Architect, Coder, and Auditor) collaborate to solve complex programming goals.

---

## 🎯 What Does It Do & What is Its Purpose?

NEURALIS serves two core purposes:

### 1. High-Fidelity Workflow Simulation (Default Mode)
* **What it does**: Runs complex, event-sourced scenario replays (e.g., designing authentication routes, refactoring databases, running security audits). Every token streamed, file created, terminal command executed, and task node expanded is synchronized down to the millisecond.
* **Purpose**: Demonstrates how autonomous agent architectures operate under the hood in a sandboxed developer environment, without requiring active LLM API keys.

### 2. Live Multi-Agent Development Workspace (Live AI Mode)
* **What it does**: Connects to **local Ollama instances** (running multiple local LLMs simultaneously) or cloud providers (Gemini, OpenAI, Claude). When you input a prompt/goal, the system orchestrates a real-time agent pipeline:
  1. **Coordinator (Architect)**: Decomposes the goal into a visual task dependency tree.
  2. **Developer (Coder)**: Automatically writes the actual code blocks and saves them to a virtual filesystem (VFS).
  3. **QA (Auditor)**: Performs a security audit and code-review on the generated code.
* **Purpose**: Serves as a local, visual playground for multi-agent code generation.

### 🛡️ Why Use This?
* **Local multi-agent testing**: Connect multiple local models (like `qwen2.5-coder` for coding and `llama3` for planning) to run multi-agent development loops locally for free, bypassing API costs and data privacy concerns.
* **Visualizing AI reasoning**: Move beyond simple terminal outputs. Watch the agent's thought streams, task decompositions (via reactive DAG trees), virtual filesystem changes, and line diffs in a unified, modern dashboard.
* **Deterministic event playback**: The entire UI is built on top of an event store. You can scrub back and forth in time, replay events, and pause execution without losing state or desynchronizing components.

---

## 🚀 How to Use NEURALIS

NEURALIS is designed to be zero-config. You can run it either directly in the browser (static simulation) or host it locally for the full Live AI experience.

### 1. Interactive Simulation (No Setup Required)
You can play, pause, and inspect preloaded agent sessions immediately:
* **Select a Scenario**: Choose a preset scenario (like *Auth Integration* or *CodeRabbit Security Review*) from the dropdown at the top.
* **Control Timeline**: Use the playback controls (Play, Pause, Speed Slider) or click and drag the **Scrubber bar** at the bottom to rewind/fast-forward the workspace.
* **Inspect the Workspace**: 
  * Select files in the sidebar file explorer.
  * Use the **Diff Tab** to see the Longest Common Subsequence (LCS) changes.
  * Search the workspace files using the **Memory Tab** (powered by client-side TF-IDF vector similarity scoring).
  * Interact with the virtual filesystem directly by typing commands in the **Terminal Panel** (e.g., `ls`, `cat src/auth.js`, `cd ..`).

### 2. Live AI Mode (Local Multi-LLM via Ollama)
To connect your own AI models and execute custom tasks:
1. **Start the local server**:
   ```bash
   npm install
   npm start
   ```
2. **Access Settings**: Click the **⚙️ API KEY** button in the header.
3. **Configure Ollama**:
   * Set the API Provider to **Ollama (Local Multi-LLM)**.
   * Input your host URL (default is `http://localhost:11434`).
   * Click **FETCH** to retrieve your active local models.
4. **Assign Agent Roles**: Map your local models to specific roles:
   * **Coordinator Model**: Best suited for reasoning/planning (e.g., `llama3`, `mistral`).
   * **Developer Model**: Best suited for code generation (e.g., `qwen2.5-coder`, `codegemma`).
   * **QA Model**: Best suited for review and auditing (e.g., `mistral`, `llama3`).
5. **Run a Goal**: Select **Run Custom AI Goal** from the target dropdown, type your prompt (e.g., *“Create a light-weight JSON parser in JS with test suites”*), and press **RUN GOAL**. Watch the agents plan, code, and audit in real-time.

---

## 🛠️ The Core Engineering Challenges (How It's Built)

This console avoids off-the-shelf widgets, heavy frameworks, or simple mockup animations. It implements several core client-side systems from scratch:

### 1. Event-Sourced State Architecture (`js/state.js`)
To enable the **Replay Control Scrubber**, the application operates on an immutable, event-sourced transaction log.
* Every single activity (an agent spawning, a word streaming in thoughts, a VFS mutation, a console line log) is treated as a discrete, immutable event.
* The timeline scrubbing bar triggers `seekTo(index)`, wipes the current application state, and replays all events from index `-1` up to the target index.
* This ensures that all components—the virtual file tree, terminal logs, SVG task tree, active agents, and line diffs—sync together at any exact millisecond in history.

### 2. Real Line-by-Line LCS Diffing Engine (`js/diff.js`)
Instead of displaying pre-baked text diffs, the inspector panel computes real line differences between VFS snapshots using a custom client-side **Dynamic Programming Longest Common Subsequence (LCS)** algorithm:

```text
If X[i] == Y[j]:
    LCS(i, j) = LCS(i-1, j-1) + 1
Else:
    LCS(i, j) = max(LCS(i-1, j), LCS(i, j-1))
```

* The engine splits the before and after files into arrays of lines, builds the LCS weight table, and backtracks to output unchanged, added (green), or deleted (red) rows.

### 3. Real-Time Client-Side TF-IDF Search Engine (`js/memory.js`)
To simulate agent vector databases, we built a **functioning Information Retrieval engine** in pure vanilla JavaScript:
* Indexes the virtual files dynamically as they are created or modified in the workspace.
* Tokenizes queries and documents, filters English stop words, and calculates **TF-IDF vectors**.
* Computes the **Cosine Similarity** between query and VFS documents, ranking results with actual decimal scores (e.g. `Score: 0.816` for `/src/routes/auth.js` when searching "cookie expiry").

### 4. Dynamic Custom SVG Task Tree (`js/tree.js`)
* Renders hierarchical goal decompositions dynamically using pure rectangular DAG workflow nodes and smooth, mathematically computed cubic-bezier connection cables:
  `M(x1, y1) -> C(x1, y1 + dy/2, x2, y2 - dy/2, x2, y2)`
* Renders dynamically using theme-responsive variables (`var(--bg-card)` and `var(--border-dim)`) so graph structures adapt beautifully to light and dark modes.
* Offers dynamic mouse-drag canvas panning and zoom scale translations.

### 5. Tab-Completing UNIX Shell Interpreter (`js/terminal.js`)
* Built a custom terminal window linked directly to the reactively updating Virtual Filesystem (VFS).
* Standard commands (`ls`, `cd`, `cat`, `mkdir`, `touch`, `rm`, `tree`) read and mutate the real in-memory VFS JSON, which immediately redraws the sidebar file explorer.
* Implements standard shell command history (up/down arrow keys) and **Tab autocompletion** matching command names and VFS paths.

---

## 🎨 Premium UI/UX & Developer Themes

The console features a de-glowed, clean, systems-engineering user interface utilizing the **Inter** typeface and **Geist Mono** for developer aesthetics. 
It supports four built-in developer-grade themes:
1. **SLATE (Default Dark)**: True Deep OLED Black (`#030303`) with deep slate panels (`#090A0F`), subtle indigo accents (`#6366F1`), and hairline borders.
2. **OCEANIC (Midnight Navy)**: Rich dark navy-blue base with teal/cyan accent highlights.
3. **AMBER (Warm Gold)**: Stone-charcoal dark theme with premium warm gold/amber highlights.
4. **LIGHT (Opal Light Mode)**: A clean light mode featuring an off-white background (`#fafafa`), bright white panels, clean dark grey text, and rich indigo accents.

---

## 📁 Repository Directory Structure

```
neuralis/
├── index.html            # Main UI layout grid, settings modal, and header widgets
├── styles.css            # Responsive themes, clean layouts, and variable design tokens
├── server.js             # Express server for local hosting and LLM API/Ollama routing
├── package.json          # Script commands and backend relay dependencies
├── api/
│   └── generate.js       # Vercel Serverless Function relaying LLM calls & Ollama tags
├── js/
│   ├── main.js           # Core bootstrapper, settings modal handlers & live API callers
│   ├── state.js          # Event-sourced transaction state store & clock ticks
│   ├── simulation.js     # Prebuilt scenario event-log streams (Auth, DB Explains, Kanban, CI/CD, CodeRabbit)
│   ├── fs.js             # Nested VFS traversal, resolve paths, and ASCII compiler
│   ├── terminal.js       # Shell input logging, tab-completion, and command router
│   ├── tree.js           # Custom SVG rendering canvas & pan adjustments
│   ├── diff.js           # Dynamic Programming line diff calculator
│   └── memory.js         # Client-side TF-IDF similarity vector search
└── tests/
    ├── diff.test.mjs     # Native Node.js unit tests for LCS diff engine
    └── math.test.mjs     # Math helpers unit verification test suite
```

---

## 🚀 Local Deployment & CI Testing

Because the frontend is built using standard, zero-config HTML5 and vanilla JavaScript ES Modules, it requires **zero compilation steps**.

### 1. Running Locally
Install dependencies and run the server:
```bash
npm install
npm start
```
Then load `http://localhost:3000` in your web browser.

### 2. Running Unit Tests
Validate the LCS diff algorithm and math helpers locally:
```bash
npm test
```

### 3. Continuous Integration
This project runs tests automatically on every push and pull request to the `main` branch via GitHub Actions (`.github/workflows/test.yml`).

## 🔌 Multi-LLM & Ollama Configuration Guide

NEURALIS allows you to mix and match different LLM providers (Google Gemini, OpenAI, Anthropic Claude, and local Ollama) for different agent roles within a single goal.

To configure your multi-agent routing:
1. Open the settings modal in the header via the **⚙️ API KEY** button.
2. Under **API KEYS & CREDENTIALS**, input the API keys for the cloud providers you plan to use (Gemini, OpenAI, and/or Claude).
3. If using local models, ensure Ollama is running on your machine (default: `http://localhost:11434`), enter your host URL, and click **FETCH**. The console will dynamically query your local Ollama tags.
4. Under **ROLE ROUTING CONFIGURATION**, assign a provider and model for each role individually:
   * **Coordinator Model (Architect)**: Select the provider and model best suited for task planning and dependency decomposition (e.g. `claude-3-5-sonnet`, `gemini-2.5-pro`, `llama3.2`).
   * **Developer Model (Coder)**: Select the provider and model best suited for generating clean JavaScript modules (e.g. `qwen2.5-coder`, `gpt-4o-mini`).
   * **QA / Security Model (Auditor)**: Select the provider and model best suited for bug checking, review, and auditing (e.g. `mistral`, `gemini-2.5-flash`, `gpt-4o-mini`).
5. Click **SAVE KEYS** to persist configurations client-side.
6. Select **✨ 6. Run Custom AI Goal** in the active targets dropdown, enter your goal description, and click **RUN GOAL**. The subagents will invoke the specified models sequentially in the execution pipeline.

---

## 🤖 Modding Guide: Adding Custom Scenarios

The `js/simulation.js` file handles the heavy lifting of pre-loaded workspace animations. If you want to add a custom scenario:

1. Open `js/simulation.js` and define a new event-log array:
   ```javascript
   const myCustomEvents = [
     { type: 'TIMELINE_LOG', timestamp: '00:00.0', agentName: 'SYSTEM', description: 'Start' },
     { type: 'SPAWN_AGENT', agentId: 'my-agent', name: 'AgentName', role: 'Developer' }
     // ...
   ];
   ```
2. Supported event types:
   - `SPAWN_AGENT`: Spawns a new coordinator/developer agent card.
   - `UPDATE_AGENT_STATUS`: Changes active agent status (thinking, executing, success, failure).
   - `STREAM_THOUGHT`: Streams token thoughts in markdown to the active agent card.
   - `SPAWN_NODE` / `UPDATE_NODE_STATUS`: Creates or modifies task tree nodes.
   - `VFS_WRITE`: Creates or modifies files in the Virtual Workspace.
   - `TERMINAL_COMMAND` / `TERMINAL_OUTPUT`: Logs input and outputs in the shell prompt.
   - `MEMORY_QUERY`: Triggers a TF-IDF cosine similarity search on the VFS.
   - `SIMULATION_COMPLETE`: Completes simulation playback.
3. Register your scenario inside the `getScenarioEvents(scenarioId)` switch statement:
   ```javascript
   case 'my-scenario':
     return myCustomEvents;
   ```
4. Add the select option to the `#scenario-select` dropdown in `index.html`:
   ```html
   <option value="my-scenario">X. My Awesome Custom Scenario</option>
   ```
