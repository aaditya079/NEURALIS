# Contributing to NEURALIS

Thank you for your interest in contributing to NEURALIS! We welcome contributions from developers of all skill levels to help make this agentic developer console even better.

---

## Code of Conduct

Please be respectful, collaborative, and constructive in all communication and interactions within this project.

## How Can I Contribute?

### 1. Reporting Bugs
- Search existing issues to see if the bug has already been reported.
- If not, open a new issue using the **Bug Report** template.
- Include detailed steps to reproduce, actual vs. expected behavior, and browser console logs.

### 2. Suggesting Enhancements
- Open an issue using the **Feature Request** template.
- Provide a clear description of the feature, use cases, and how it aligns with the project's visual-first, browser-native goals.

### 3. Submitting Pull Requests
- Fork the repository and create a new branch from `main` (e.g. `feat/amazing-new-feature` or `fix/annoying-bug`).
- Make your changes with clean, atomic commits.
- Ensure the unit tests pass locally before pushing:
  ```bash
  npm test
  ```
- Open a Pull Request detailing the changes, visual screenshots (if applicable), and verification steps.

---

## Codebase Architecture

NEURALIS is designed with **zero build steps** and **zero runtime dependencies** for the client:
- **`index.html`**: Core grid panel, tabs, and modals.
- **`styles.css`**: Premium glassmorphic styling system and responsive queries.
- **`js/state.js`**: Central event-sourced state store.
- **`js/fs.js`**: Virtual Filesystem utilities and folders generator.
- **`js/terminal.js`**: Monospace UNIX-like tab-completing terminal.
- **`js/tree.js`**: Dynamic SVG task tree calculations.
- **`js/diff.js`**: Dynamic Programming LCS diffing engine.
- **`js/memory.js`**: Client-side TF-IDF similarity vector space search.
- **`js/simulation.js`**: Prebuilt scenario event databases.
- **`server.js`**: Optional local server relay for live AI endpoints.

## Adding Custom Scenarios

If you want to contribute a new agent orchestration scenario, you can append your events inside `js/simulation.js` and add the target key inside `getScenarioEvents(scenarioId)`. Ensure your scenario uses standard event models (`SPAWN_AGENT`, `STREAM_THOUGHT`, `VFS_WRITE`, etc.) to sync properly with the scrubber.
