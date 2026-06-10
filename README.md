# NEURALIS // Multi-Agent Developer Console

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=github)](https://aaditya079.github.io/NEURALIS/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![CI Pipeline](https://img.shields.io/github/actions/workflow/status/aaditya079/NEURALIS/CI%20Pipeline?branch=main&style=for-the-badge&logo=github-actions)](https://github.com/aaditya079/NEURALIS/actions)

Browser-native multi-agent AI console with event-sourced state, real LCS diffing, custom SVG task trees, and live LLM API integration. Zero dependencies, zero build step.

---

## 🎯 The Primary Experience: High-Fidelity Simulation

NEURALIS is designed primarily as a high-fidelity **Multi-Agent Simulation Console**. It showcases how autonomous software engineering agents (Architects, Developers, and Auditors) coordinate to build projects. 

Instead of showing pre-recorded static animations, the dashboard uses a **fully reactive timeline playback engine** that runs event-sourced transactions in real-time. 

### ⚙️ The Extension: Live AI Mode
As an advanced extension, the console features a **Live AI Mode** (Gemini, OpenAI, Claude). If you host this project with the included Express server (or deploy to Vercel with serverless functions), visitors can input a custom goal and watch a real LLM decompose it into a task tree and stream markdown thoughts in real-time.

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
* The simulation's `MEMORY_QUERY` events run this search engine *live* on the filesystem state, replacing mock text with real mathematical similarity scans.

### 4. Dynamic Custom SVG Task Tree (`js/tree.js`)
* Renders hierarchical goal decompositions dynamically using pure SVG nodes and smooth, mathematically computed cubic-bezier connection cables:
  `M(x1, y1) -> C(x1, y1 + dy/2, x2, y2 - dy/2, x2, y2)`
* Visualizes real-time token traffic by overlaying a custom `stroke-dasharray` filter and driving active CSS offset transitions to animate flowing photons.
* Offers dynamic mouse-drag canvas panning and zoom scale translations.

### 5. Tab-Completing UNIX Shell Interpreter (`js/terminal.js`)
* Built a custom terminal window linked directly to the reactively updating Virtual Filesystem (VFS).
* Standard commands (`ls`, `cd`, `cat`, `mkdir`, `touch`, `rm`, `tree`) read and mutate the real in-memory VFS JSON, which immediately redraws the sidebar file explorer.
* Implements standard shell command history (up/down arrow keys) and **Tab autocompletion** matching command names and VFS paths.

---

## 📁 Repository Directory Structure

```
neuralis/
├── index.html            # Main UI layout grid, glass panels, and header widgets
├── styles.css            # Obsidian design variables, glass gradients, and responsive layouts
├── server.js             # Express server for local hosting and LLM API routing
├── package.json          # Script commands and backend relay dependencies
├── api/
│   └── generate.js       # Vercel Serverless Function relaying LLM calls
├── js/
│   ├── main.js           # Core bootstrapper, reactive DOM synchronizer & live AI calls
│   ├── state.js          # Event-sourced transaction state store & clock ticks
│   ├── simulation.js     # Prebuilt scenario event-log streams (Auth, DB Explains, Kanban, CI/CD)
│   ├── fs.js             # Nested VFS traversal, resolve paths, and ASCII compiler
│   ├── terminal.js       # Shell input logging, tab-completion, and command router
│   ├── tree.js           # Custom SVG rendering canvas & pan adjustments
│   ├── diff.js           # Dynamic Programming line diff calculator
│   └── memory.js         # Client-side TF-IDF similarity vector search
└── tests/
    └── diff.test.mjs     # Native Node.js unit tests for LCS diff engine
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
Validate the LCS diff algorithm locally:
```bash
npm test
```

### 3. Continuous Integration
This project runs tests automatically on every push and pull request to the `main` branch via GitHub Actions (`.github/workflows/test.yml`).

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
