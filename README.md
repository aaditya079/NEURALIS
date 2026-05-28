# AgentFlow // Multi-Agent Developer Console

An immersive, premium client-side developer console that visualizes autonomous AI agents communicating, scheduling subtasks, modifying files, and executing shell commands in real-time. Built entirely with a browser-native modular ES6 architecture, complete with an interactive terminal, a virtual filesystem, a real line-by-line diff compiler, and an event-sourced playback scrubber.

➔ **Live Demo: [https://aaditya079.github.io/agentflow/](https://aaditya079.github.io/agentflow/)**

---

## 🛠️ The Core Engineering Challenges (How It's Built)

This dashboard avoids generic drag-and-drop frameworks, off-the-shelf terminal widgets, or basic mockups. Instead, it solves several core client-side engineering challenges from scratch:

### 1. Event-Sourced State Architecture (`js/state.js`)
To enable the **Phase 3 Replay Engine**, the application operates on an immutable, event-sourced transaction log. 
* Every single activity (an agent spawning, a word streaming in thoughts, a file mutation, a console line log) is treated as a discrete, immutable event object.
* The playback controller operates a time-scrubbing slider. When you seek or scrub, the state store triggers `seekTo(index)`, wipes the current application state, and replays all events from index `-1` up to the target index. 
* This design ensures that all elements—the file tree, terminal window, SVG canvas, active agents, and line diffs—sync together at any exact millisecond in the simulation timeline.

### 2. Real Line-by-Line LCS Diffing Engine (`js/diff.js`)
Instead of displaying pre-baked file comparisons, the right inspector panel computes real text differences between file snapshots using a custom client-side **Dynamic Programming Longest Common Subsequence (LCS)** algorithm:
$$\text{LCS}(i, j) = \begin{cases} \text{LCS}(i-1, j-1) + 1 & \text{if } X[i] == Y[j] \\ \max(\text{LCS}(i-1, j), \text{LCS}(i, j-1)) & \text{otherwise} \end{cases}$$
* The system splits the pre- and post-mutation contents of the Virtual Filesystem files into array lines.
* It dynamically builds an LCS weight table and backtracks through the coordinate grid to output unchanged, added (green), or deleted (red) lines, complete with line numbers and absolute formatting.

### 3. Dynamic Custom SVG Task Tree (`js/tree.js`)
* Renders hierarchical goal decompositions dynamically using pure SVG nodes (`<g>`, `<circle>`, `<text>`) and smooth, mathematically computed cubic-bezier connection cables:
  $$M(x_1, y_1) \rightarrow C\left(x_1, y_1 + \frac{dy}{2}, x_2, y_2 - \frac{dy}{2}, x_2, y_2\right)$$
* Visualizes real-time token traffic / message passing by duplicating connection paths, overlaying a custom `stroke-dasharray` filter, and driving an active CSS offset shift to simulate flowing photons.
* Offers dynamic mouse-drag canvas panning and zoom scale matrix translations.

### 4. Tab-Completing UNIX Shell Interpreter (`js/terminal.js`)
* Built a custom terminal window linked directly to the reactively updating Virtual Filesystem (VFS).
* Standard commands (`ls`, `cd`, `cat`, `mkdir`, `touch`, `rm`, `tree`) read and mutate the real in-memory VFS JSON, which immediately redraws the sidebar file explorer.
* Implements standard command line shell history (up/down arrow keys) and **Tab autocompletion** that matches command names as well as files and subdirectories in your active path.

---

## 📁 Repository Directory Structure

```
agentflow/
├── index.html            # Main UI layout grid, glass panels, and header widgets
├── styles.css            # Obsidian design variables, glass gradients, and animations
├── js/
│   ├── main.js           # Core bootstrapper and reactive DOM synchronizer
│   ├── state.js          # Event-sourced transaction state store & clock ticks
│   ├── simulation.js     # Scenario event-log streams (Auth, DB Explains, Kanban)
│   ├── fs.js             # Nested VFS traversal, resolve paths, and ASCII compiler
│   ├── terminal.js       # Shell input logging, tab-completion, and command router
│   ├── tree.js           # custom SVG rendering canvas & pan adjustments
│   └── diff.js           # Dynamic Programming line diff calculator
└── .gitignore            # OS metadata and workspace logs filters
```

---

## 🚀 GitHub Pages & Local Deployment Guide

Because the application is built using standard, zero-config HTML5 and vanilla JavaScript ES Modules, it requires **zero compilation steps** or heavy bundlers. It is immediately ready to be hosted statically:

### 1. Local Dev Server
Serve the workspace directory using any simple static HTTP server. For example, using Python:
```bash
python -m http.server 8000
```
Then load `http://localhost:8000` in your web browser.

### 2. GitHub Pages Deployment (Zero-Config)
To publish this repository live on GitHub Pages:
1. Push this branch (`main`) to your GitHub repository.
2. Navigate to your repository settings on GitHub: **Settings ➔ Pages**.
3. Under **Build and deployment ➔ Source**, select **Deploy from a branch**.
4. Set the branch to **`main`** and the folder to **`/ (root)`**, then click **Save**.
5. Your live URL will be active at `https://<your-username>.github.io/agentflow/` within a few seconds!

---

## 🤖 AI Agent Context & Modding Guide (AI-Proof Instructions)

> [!NOTE]
> *This section is optimized for future AI Coding Assistants (Copilots, Claude, Gemini, Cursor) scanning or extending this codebase.*

When modifying or expanding the capabilities of **AgentFlow**, adhere to the following architectural design contracts:

* **State Mutations must be Event-Sourced**: Never modify the active VFS, agent states, or metrics directly outside of `js/state.js`. To add new features or steps, append a new event dictionary to the scenario lists in `js/simulation.js`.
* **Event Structure Contract**: All events in the queue must conform to the following schema structure:
  ```typescript
  interface AgentEvent {
    type: 'SPAWN_AGENT' | 'UPDATE_AGENT_STATUS' | 'STREAM_THOUGHT' | 'SPAWN_NODE' | 'UPDATE_NODE_STATUS' | 'TERMINAL_COMMAND' | 'TERMINAL_OUTPUT' | 'VFS_WRITE' | 'MEMORY_QUERY' | 'MEMORY_WRITE' | 'PROMPT_REVISION' | 'TIMELINE_LOG' | 'SIMULATION_COMPLETE';
    agentId?: string;
    nodeId?: string;
    text?: string;
    path?: string;
    content?: string;
    before?: string;
    tokens?: number;
    cost?: number;
    runtime?: number;
    // ...event-specific properties
  }
  ```
* **Separation of Concerns**: Keep DOM manipulations and event listeners strictly inside `js/main.js` and `js/terminal.js`. Mathematical calculations for VFS nodes or SVG vectors belong inside `js/fs.js` and `js/tree.js` respectively.
