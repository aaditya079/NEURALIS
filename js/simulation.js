/**
 * NEURALIS // Predefined Scenario Event logs
 * Exports structured event logs for 3 complex agent-based engineering workflows.
 */

// SCENARIO 1: JWT Authentication & Route Guards
const jwtAuthEvents = [
  // --- BOOTSTRAP & PLANNING ---
  { type: 'TIMELINE_LOG', timestamp: '00:00.0', agentName: 'SYSTEM', description: 'Initializing multi-agent goal workspace.' },
  { type: 'TERMINAL_OUTPUT', text: 'Initializing neuralis orchestration hub...', lineType: 'system' },
  { type: 'SPAWN_AGENT', agentId: 'architect', name: 'Lead Architect', role: 'System Designer & Planner' },
  { type: 'UPDATE_AGENT_STATUS', agentId: 'architect', status: 'thinking', cost: 0.002, tokens: 120, runtime: 0.5 },
  
  { type: 'STREAM_THOUGHT', agentId: 'architect', text: '# Goal Analysis: Secure JWT Authentication Setup\n\nTo build a highly robust, secure JWT authentication system, I need to decompose the goal into highly defined subtasks:\n\n1. **Research & Design**: Define access/refresh token rotation schema, CORS settings, and token storage vector (httpOnly cookies).\n2. **Database & Models**: Set up user schema with password encryption (bcrypt).\n3. **Auth Core**: Implement login, register, and token refresh endpoints.\n4. **Middleware Route Guards**: Create verified middleware to intercept JWTs and inject user context.\n5. **Integration QA Testing**: Conduct endpoint sweeps.\n\nLet\'s spin up specialized agents to handle core coding and security validation.' },
  
  { type: 'SPAWN_NODE', nodeId: 'root', label: 'Setup JWT Authentication', sublabel: 'Root Goal', status: 'thinking', x: 250, y: 40 },
  { type: 'TIMELINE_LOG', timestamp: '00:01.2', agentName: 'Architect', description: 'Decomposed goal into 4 core visual subtasks.' },
  
  { type: 'SPAWN_NODE', nodeId: 'task-research', label: '1. Auth Architecture Research', sublabel: 'Architect', status: 'executing', x: 80, y: 120, parentId: 'root' },
  { type: 'SPAWN_NODE', nodeId: 'task-core', label: '2. Express Auth Endpoints', sublabel: 'DevAgent', status: 'planning', x: 190, y: 120, parentId: 'root' },
  { type: 'SPAWN_NODE', nodeId: 'task-middleware', label: '3. JWT Route Middleware', sublabel: 'DevAgent', status: 'planning', x: 310, y: 120, parentId: 'root' },
  { type: 'SPAWN_NODE', nodeId: 'task-audit', label: '4. Security Audit & QA', sublabel: 'SecAudit', status: 'planning', x: 420, y: 120, parentId: 'root' },
  
  { type: 'TERMINAL_COMMAND', command: 'mkdir -p src/middleware src/config src/routes' },
  { type: 'TERMINAL_OUTPUT', text: 'Created subdirectories: src/middleware/, src/config/, src/routes/', lineType: 'success' },
  
  { type: 'MEMORY_QUERY', query: 'JWT security vulnerabilities + httpOnly cookies', results: [
    { text: 'Cross-Site Scripting (XSS) Token Theft Mitigation', score: 0.94 },
    { text: 'CSRF Protection via Custom Headers and Double Submit Cookies', score: 0.82 },
    { text: 'Token Rotation & Expiry Lifespan Best Practices', score: 0.79 }
  ]},
  { type: 'MEMORY_WRITE', key: 'auth_storage_method', value: 'httpOnly Secure Cookies' },
  { type: 'MEMORY_WRITE', key: 'token_expiry', value: 'Access: 15m, Refresh: 7d' },
  
  { type: 'VFS_WRITE', path: '/src/config/jwt.json', content: '{\n  "accessTokenExpiry": "15m",\n  "refreshTokenExpiry": "7d",\n  "cookieName": "neuralis_session"\n}', operation: 'NEW' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-research', status: 'success' },
  
  // --- CODING ENDPOINTS ---
  { type: 'SPAWN_AGENT', agentId: 'developer', name: 'DevAgent-1', role: 'Principal JavaScript Engineer' },
  { type: 'UPDATE_AGENT_STATUS', agentId: 'developer', status: 'thinking', cost: 0.005, tokens: 420, runtime: 2.2 },
  { type: 'TIMELINE_LOG', timestamp: '00:03.5', agentName: 'DevAgent-1', description: 'Writing user controller authentication endpoints.' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-core', status: 'executing' },
  
  { type: 'STREAM_THOUGHT', agentId: 'developer', text: 'Implementing Express.js endpoints for password hashing and authentication token issuance. We will use `bcrypt` for secure hashing.\n\nLet\'s write the `/register` and `/login` handlers in `src/routes/auth.js`.' },
  
  { type: 'VFS_WRITE', path: '/src/routes/auth.js', before: '', content: `const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const usersDb = []; // Mock in-memory database

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), email, password: hashedPassword };
    usersDb.push(newUser);
    res.status(210).json({ success: true, message: 'User registered.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = usersDb.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

  // Core JWT Signing
  const token = jwt.sign({ userId: user.id }, 'NEURALIS_SECRET'); // Warning: No expiration set!
  res.cookie('token', token, { httpOnly: true, secure: true });
  res.json({ success: true, token });
});

module.exports = router;`, operation: 'NEW' },

  { type: 'TERMINAL_COMMAND', command: 'cat src/routes/auth.js' },
  { type: 'TERMINAL_OUTPUT', text: 'Displayed routes file content. Hashing verified using bcrypt.', lineType: 'output' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-core', status: 'success' },

  // --- CODING MIDDLEWARE ---
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-middleware', status: 'executing' },
  { type: 'UPDATE_AGENT_STATUS', agentId: 'developer', status: 'executing', cost: 0.003, tokens: 280, runtime: 4.8 },
  { type: 'STREAM_THOUGHT', agentId: 'developer', text: 'Now writing Route guard middleware `src/middleware/guard.js` to protect confidential API endpoints.\n\nThe middleware intercepts cookie payloads, verifies token status, and attaches request contextual metadata.' },
  
  { type: 'VFS_WRITE', path: '/src/middleware/guard.js', before: '', content: `const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token, 'NEURALIS_SECRET');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token session.' });
  }
};`, operation: 'NEW' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-middleware', status: 'success' },

  // --- SECURITY AUDIT FAILURE & RETRIES ---
  { type: 'SPAWN_AGENT', agentId: 'auditor', name: 'Security-Audit', role: 'Security & Penetration Validator' },
  { type: 'UPDATE_AGENT_STATUS', agentId: 'auditor', status: 'thinking', cost: 0.004, tokens: 350, runtime: 6.2 },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-audit', status: 'executing' },
  { type: 'TIMELINE_LOG', timestamp: '00:06.5', agentName: 'Security-Audit', description: 'Reviewing routes and middleware files for credential leaks.' },
  
  { type: 'STREAM_THOUGHT', agentId: 'auditor', text: '# Security Scan: Warning Triggered!\n\nI have parsed `src/routes/auth.js` and discovered two severe vulnerabilities:\n\n1. **Infinite Session Lifecycle**: `jwt.sign` does not pass an expiration option (`expiresIn`). The session lasts forever!\n2. **Hardcoded Secrets**: The JWT signing key uses a literal string `"NEURALIS_SECRET"`. This violates compliance frameworks.\n\nLet\'s trigger a **Self-Correction loop** and push a revised system prompt instructing the DevAgent to load credentials from configuration variables and set expiry flags.' },

  { type: 'PROMPT_REVISION', content: `You are a software engineer agent. Write requested code structures.
CRITICAL ENHANCEMENT:
- Never hardcode secrets. Always read keys from process.env.
- Always apply strict short-lived expirations on security payloads (e.g. expiresIn: '15m').`, reason: 'EXPIRED TOKEN LIFECYCLE & HARDCODED CREDENTIAL RISK' },
  
  { type: 'TIMELINE_LOG', timestamp: '00:07.8', agentName: 'Security-Audit', description: 'Failed build verification. Self-correcting DevAgent instructions.' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-audit', status: 'failure' },
  { type: 'TERMINAL_OUTPUT', text: 'VERIFICATION FAILURE: Static analyzer flagged hardcoded secret and zero-expiry signing at src/routes/auth.js:33.', lineType: 'error' },

  // --- RE-CODING / RE-AUDIT (SUCCESS PATH) ---
  { type: 'UPDATE_AGENT_STATUS', agentId: 'developer', status: 'thinking', cost: 0.004, tokens: 320, runtime: 8.5 },
  { type: 'STREAM_THOUGHT', agentId: 'developer', text: 'Addressing security auditor feedback:\n1. Pulling secret from `process.env.JWT_SECRET`.\n2. Appending `expiresIn: "15m"` duration metadata to `jwt.sign`.\n\nRewriting `src/routes/auth.js`.' },
  
  { type: 'VFS_WRITE', path: '/src/routes/auth.js', before: `const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const usersDb = []; // Mock in-memory database

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), email, password: hashedPassword };
    usersDb.push(newUser);
    res.status(210).json({ success: true, message: 'User registered.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = usersDb.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

  // Core JWT Signing
  const token = jwt.sign({ userId: user.id }, 'NEURALIS_SECRET'); // Warning: No expiration set!
  res.cookie('token', token, { httpOnly: true, secure: true });
  res.json({ success: true, token });
});

module.exports = router;`, content: `const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const usersDb = []; // Mock in-memory database
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-safe-dev-secret-key-32-chars';

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), email, password: hashedPassword };
    usersDb.push(newUser);
    res.status(201).json({ success: true, message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = usersDb.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

  // Enhanced Security Sign
  const token = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.cookie('token', token, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 mins
  });
  res.json({ success: true, token });
});

module.exports = router;`, operation: 'MODIFIED' },

  { type: 'UPDATE_AGENT_STATUS', agentId: 'auditor', status: 'thinking', cost: 0.002, tokens: 190, runtime: 10.2 },
  { type: 'STREAM_THOUGHT', agentId: 'auditor', text: 'Re-auditing `src/routes/auth.js`...\n- JWT Expiration is successfully enforced (`expiresIn: "15m"`).\n- Secret parameters are read dynamically from server environment variables.\n- httpOnly sameSite settings are added.\n\nAll security scans passed!' },
  
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-audit', status: 'success' },
  { type: 'TIMELINE_LOG', timestamp: '00:11.4', agentName: 'Security-Audit', description: 'Re-audit passed user authentication system.' },
  { type: 'TERMINAL_COMMAND', command: 'npm run test:auth' },
  { type: 'TERMINAL_OUTPUT', text: 'PASS  tests/auth.test.js\n  ✓ User registration succeeds (34ms)\n  ✓ Secure Login issues httpOnly cookie (48ms)\n  ✓ Guard blocks unauthorized API access (12ms)\n  ✓ Guard allows verified JWT sessions (19ms)', lineType: 'success' },
  { type: 'TERMINAL_OUTPUT', text: 'Test Suite: 1 passed, 1 total\nSnapshots: 0 total\nTime: 1.12s, estimated 2s', lineType: 'output' },
  
  { type: 'UPDATE_NODE_STATUS', nodeId: 'root', status: 'success' },
  { type: 'TIMELINE_LOG', timestamp: '00:12.5', agentName: 'SYSTEM', description: 'Goals successfully achieved. Shutting down active agents.' },
  { type: 'SIMULATION_COMPLETE' }
];

// SCENARIO 2: SQL DB Query Optimizer
const sqlOptEvents = [
  { type: 'TIMELINE_LOG', timestamp: '00:00.0', agentName: 'SYSTEM', description: 'Booting profiling workspace.' },
  { type: 'TERMINAL_OUTPUT', text: 'Opening high-traffic database performance dashboard...', lineType: 'system' },
  { type: 'SPAWN_AGENT', agentId: 'profiler', name: 'ProfilerAgent', role: 'Database Profiling & Execution Analyst' },
  { type: 'SPAWN_NODE', nodeId: 'root', label: 'Optimize Database Queries', sublabel: 'Performance Goal', status: 'thinking', x: 250, y: 40 },
  
  { type: 'SPAWN_NODE', nodeId: 'task-profile', label: '1. EXPLAIN Log Analysis', sublabel: 'Profiler', status: 'executing', x: 100, y: 120, parentId: 'root' },
  { type: 'SPAWN_NODE', nodeId: 'task-index', label: '2. Index Schema Patching', sublabel: 'Profiler', status: 'planning', x: 250, y: 120, parentId: 'root' },
  { type: 'SPAWN_NODE', nodeId: 'task-rewrite', label: '3. SQL Query Restructuring', sublabel: 'DBExpert', status: 'planning', x: 400, y: 120, parentId: 'root' },
  
  { type: 'UPDATE_AGENT_STATUS', agentId: 'profiler', status: 'thinking', cost: 0.003, tokens: 210, runtime: 1.2 },
  { type: 'STREAM_THOUGHT', agentId: 'profiler', text: 'Analyzing database telemetry. The production log reports an expensive lookup taking **840ms** on users with complex inner joins.\n\nLet\'s view the schema definition first using `cat db/schema.sql`.' },
  
  { type: 'TERMINAL_COMMAND', command: 'cat db/schema.sql' },
  { type: 'VFS_WRITE', path: '/db/schema.sql', content: `CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50),
  email VARCHAR(100),
  status VARCHAR(20),
  created_at TIMESTAMP
);

CREATE TABLE user_transactions (
  id INT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(10, 2),
  transaction_date TIMESTAMP
);`, operation: 'NEW' },
  { type: 'TERMINAL_OUTPUT', text: 'Mounted /db/schema.sql inside VFS. Primary keys established.', lineType: 'success' },
  
  { type: 'TERMINAL_COMMAND', command: 'db-shell "EXPLAIN ANALYZE SELECT users.username, SUM(amount) FROM users JOIN user_transactions ON users.id = user_transactions.user_id WHERE users.status = \'active\' GROUP BY users.username;"' },
  { type: 'TERMINAL_OUTPUT', text: '-> GroupAggregate (cost=14522.45..15244.10 rows=48000 width=132) (actual time=792.12..834.45 rows=12000)\n    -> Sort (cost=14522.45..14620.25 rows=48000 width=132) (actual time=791.45..802.12)\n        -> Hash Join (cost=401.50..12450.00 rows=48000 width=132) (actual time=45.22..712.18)\n            -> Seq Scan on user_transactions (actual time=0.012..480.12 rows=250000)\n            -> Hash (cost=350.00..350.00 rows=5000 width=64) (actual time=44.12..44.12)\n                -> Seq Scan on users (actual time=0.015..38.12 rows=15000) Filter: (status = \'active\')', lineType: 'error' },
  
  { type: 'TIMELINE_LOG', timestamp: '00:04.2', agentName: 'ProfilerAgent', description: 'Flagged redundant Seq Scan on users & transactions.' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-profile', status: 'success' },
  
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-index', status: 'executing' },
  { type: 'STREAM_THOUGHT', agentId: 'profiler', text: 'The explain log highlights a **Sequential Scan** (Seq Scan) across 250,000 transaction rows and 15,000 users!\n\nThis is because:\n1. There is no index on `user_transactions.user_id`.\n2. There is no index on `users.status`.\n\nLet\'s create a database index migration script: `db/migrations/index_users_status.sql`.' },
  
  { type: 'VFS_WRITE', path: '/db/migrations/index_users_status.sql', content: `CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_transactions_user_id ON user_transactions(user_id);`, operation: 'NEW' },
  { type: 'TERMINAL_COMMAND', command: 'db-shell "RUN MIGRATION db/migrations/index_users_status.sql"' },
  { type: 'TERMINAL_OUTPUT', text: 'Migration completed. Indices created:\n- idx_users_status ON users(status)\n- idx_transactions_user_id ON user_transactions(user_id)', lineType: 'success' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-index', status: 'success' },
  
  // --- QUERY RESTRUCTURING ---
  { type: 'SPAWN_AGENT', agentId: 'dbexpert', name: 'DBExpert', role: 'Senior Database Architect' },
  { type: 'UPDATE_AGENT_STATUS', agentId: 'dbexpert', status: 'thinking', cost: 0.004, tokens: 380, runtime: 7.2 },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-rewrite', status: 'executing' },
  { type: 'TIMELINE_LOG', timestamp: '00:07.5', agentName: 'DBExpert', description: 'Restructuring raw aggregation queries.' },
  
  { type: 'STREAM_THOUGHT', agentId: 'dbexpert', text: 'Creating indexes optimizes joins, but we can speed this up further by rewriting the raw SQL to leverage a subquery CTE, aggregating the user transactions *before* joining onto the main user profile strings. This minimizes memory overhead during string sorting.\n\nLet\'s write `src/queries/revenue.js`.' },
  
  { type: 'VFS_WRITE', path: '/src/queries/revenue.js', content: `// Old query joined before summing
// New query aggregates inside a subquery, then joins user profiles
const db = require('../db');

async function getActiveUserRevenue() {
  const query = \`
    WITH aggregated_tx AS (
      SELECT user_id, SUM(amount) as total_amount
      FROM user_transactions
      GROUP BY user_id
    )
    SELECT u.username, tx.total_amount
    FROM users u
    INNER JOIN aggregated_tx tx ON u.id = tx.user_id
    WHERE u.status = 'active'
  \`;
  return db.query(query);
}

module.exports = { getActiveUserRevenue };`, operation: 'NEW' },

  { type: 'TERMINAL_COMMAND', command: 'db-shell "EXPLAIN ANALYZE WITH aggregated_tx AS (SELECT user_id, SUM(amount) FROM user_transactions GROUP BY user_id) SELECT u.username, tx.SUM FROM users u INNER JOIN aggregated_tx tx ON u.id = tx.user_id WHERE u.status = \'active\';"' },
  { type: 'TERMINAL_OUTPUT', text: '-> Nested Loop (cost=4.22..124.50 rows=1500 width=132) (actual time=0.082..11.45 rows=12000)\n    -> Index Scan using idx_users_status on users u (cost=0.15..32.12 rows=1500) (actual time=0.015..3.45)\n    -> Index Scan using idx_transactions_user_id on user_transactions (actual time=0.002..0.005 rows=16)', lineType: 'success' },
  { type: 'TERMINAL_OUTPUT', text: 'Execution runtime optimized: **11.45ms** (from 834.45ms) - 98.6% speedup!', lineType: 'success' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-rewrite', status: 'success' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'root', status: 'success' },
  { type: 'TIMELINE_LOG', timestamp: '00:10.8', agentName: 'SYSTEM', description: 'Database scan optimizations verified. Exiting.' },
  { type: 'SIMULATION_COMPLETE' }
];

// SCENARIO 3: Drag-and-Drop Kanban Board
const kanbanEvents = [
  { type: 'TIMELINE_LOG', timestamp: '00:00.0', agentName: 'SYSTEM', description: 'Booting Kanban Frontend workspace.' },
  { type: 'TERMINAL_OUTPUT', text: 'Configuring standard HTML/JS Canvas layout...', lineType: 'system' },
  { type: 'SPAWN_AGENT', agentId: 'uxer', name: 'UXAgent', role: 'CSS Grid & Interface Architect' },
  { type: 'SPAWN_NODE', nodeId: 'root', label: 'Build Kanban Board', sublabel: 'UI Goal', status: 'thinking', x: 250, y: 40 },
  
  { type: 'SPAWN_NODE', nodeId: 'task-layout', label: '1. Column CSS Layout', sublabel: 'UXAgent', status: 'executing', x: 100, y: 120, parentId: 'root' },
  { type: 'SPAWN_NODE', nodeId: 'task-drag', label: '2. Drag-and-Drop Handler', sublabel: 'ReactAgent', status: 'planning', x: 250, y: 120, parentId: 'root' },
  { type: 'SPAWN_NODE', nodeId: 'task-cypress', label: '3. QA Component Testing', sublabel: 'QA-Agent', status: 'planning', x: 400, y: 120, parentId: 'root' },
  
  { type: 'UPDATE_AGENT_STATUS', agentId: 'uxer', status: 'thinking', cost: 0.002, tokens: 180, runtime: 1.5 },
  { type: 'STREAM_THOUGHT', agentId: 'uxer', text: 'Designing a premium glassmorphic Kanban Board UI. The board needs three horizontal columns (Todo, In-Progress, Done).\n\nLet\'s lay down the base stylesheet in `src/styles.css` with sleek animations.' },
  
  { type: 'VFS_WRITE', path: '/src/styles.css', content: `/* Kanban Layout */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 20px;
}
.kanban-column {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 12px;
}
.kanban-card {
  background: rgba(16, 26, 50, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
  cursor: grab;
}`, operation: 'NEW' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-layout', status: 'success' },
  
  // --- JAVASCRIPT DRAGGING ---
  { type: 'SPAWN_AGENT', agentId: 'coder', name: 'ReactAgent', role: 'Interactive Frontend Engineer' },
  { type: 'UPDATE_AGENT_STATUS', agentId: 'coder', status: 'thinking', cost: 0.005, tokens: 410, runtime: 3.8 },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-drag', status: 'executing' },
  { type: 'TIMELINE_LOG', timestamp: '00:04.2', agentName: 'ReactAgent', description: 'Coding standard HTML5 DragEvent handlers.' },
  
  { type: 'STREAM_THOUGHT', agentId: 'coder', text: 'Writing JavaScript controller `src/kanban.js` mapping user drag mechanics (dragstart, dragover, drop) to update lists.\n\nWarning: In initial implementation, I forgot to intercept `event.preventDefault()` inside `dragover`, which blocks the drop event from firing!' },
  
  { type: 'VFS_WRITE', path: '/src/kanban.js', content: `// HTML5 Drag Event Controller
function initKanban() {
  const cards = document.querySelectorAll('.kanban-card');
  const columns = document.querySelectorAll('.kanban-column');
  let draggedCard = null;

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedCard = card;
      card.style.opacity = '0.5';
    });
    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
    });
  });

  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      // Missing: e.preventDefault()
    });
    col.addEventListener('drop', () => {
      if (draggedCard) {
        col.appendChild(draggedCard);
      }
    });
  });
}

module.exports = { initKanban };`, operation: 'NEW' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-drag', status: 'success' },
  
  // --- INTEGRATION TESTS FAILURE ---
  { type: 'SPAWN_AGENT', agentId: 'qa', name: 'QA-Agent', role: 'Automation QA Inspector' },
  { type: 'UPDATE_AGENT_STATUS', agentId: 'qa', status: 'thinking', cost: 0.003, tokens: 250, runtime: 6.8 },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-cypress', status: 'executing' },
  { type: 'TIMELINE_LOG', timestamp: '00:07.1', agentName: 'QA-Agent', description: 'Running end-to-end user drag triggers.' },
  
  { type: 'TERMINAL_COMMAND', command: 'npm run test:e2e' },
  { type: 'TERMINAL_OUTPUT', text: 'Running Kanban drag-drop automation...\n[FAIL] Cards drag, but drop handler never triggers!', lineType: 'error' },
  
  { type: 'STREAM_THOUGHT', agentId: 'qa', text: '# Test Failure Report\n\nCypress logged drop failures. By default, the browser prevents drop events unless `event.preventDefault()` is explicitly called on `dragover`!\n\nRe-triggering DevAgent instructions to fix dragover interception.' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-cypress', status: 'failure' },
  
  // --- SELF CORRECTION ---
  { type: 'UPDATE_AGENT_STATUS', agentId: 'coder', status: 'thinking', cost: 0.003, tokens: 190, runtime: 8.9 },
  { type: 'STREAM_THOUGHT', agentId: 'coder', text: 'Ah! That is a standard HTML5 quirk. I will update `src/kanban.js` to call `event.preventDefault()` in the `dragover` callback.' },
  
  { type: 'VFS_WRITE', path: '/src/kanban.js', before: `// HTML5 Drag Event Controller
function initKanban() {
  const cards = document.querySelectorAll('.kanban-card');
  const columns = document.querySelectorAll('.kanban-column');
  let draggedCard = null;

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedCard = card;
      card.style.opacity = '0.5';
    });
    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
    });
  });

  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      // Missing: e.preventDefault()
    });
    col.addEventListener('drop', () => {
      if (draggedCard) {
        col.appendChild(draggedCard);
      }
    });
  });
}

module.exports = { initKanban };`, content: `// HTML5 Drag Event Controller
function initKanban() {
  const cards = document.querySelectorAll('.kanban-card');
  const columns = document.querySelectorAll('.kanban-column');
  let draggedCard = null;

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedCard = card;
      card.style.opacity = '0.5';
      e.dataTransfer.setData('text/plain', card.id);
    });
    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
    });
  });

  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault(); // Fixed: Crucial to enable dropping!
    });
    col.addEventListener('drop', () => {
      if (draggedCard) {
        col.querySelector('.cards-container').appendChild(draggedCard);
      }
    });
  });
}

module.exports = { initKanban };`, operation: 'MODIFIED' },
  
  { type: 'UPDATE_AGENT_STATUS', agentId: 'qa', status: 'executing', cost: 0.002, tokens: 150, runtime: 10.5 },
  { type: 'TERMINAL_COMMAND', command: 'npm run test:e2e' },
  { type: 'TERMINAL_OUTPUT', text: 'Running Kanban drag-drop automation...\n[PASS] Task cards moved between columns reactively.\nAll tests passed successfully!', lineType: 'success' },
  
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-cypress', status: 'success' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'root', status: 'success' },
  { type: 'TIMELINE_LOG', timestamp: '00:11.8', agentName: 'SYSTEM', description: 'Interactive frontend validation completed.' },
  { type: 'SIMULATION_COMPLETE' }
];

// SCENARIO 4: Dockerize Application & Setup CI/CD Workflow
const cicdDevopsEvents = [
  { type: 'TIMELINE_LOG', timestamp: '00:00.0', agentName: 'SYSTEM', description: 'Booting DevOps runner workspace.' },
  { type: 'TERMINAL_OUTPUT', text: 'Initializing Docker Engine and CI pipeline checks...', lineType: 'system' },
  { type: 'SPAWN_AGENT', agentId: 'devops', name: 'DevOpsAgent', role: 'Infrastructure & CI/CD Specialist' },
  { type: 'UPDATE_AGENT_STATUS', agentId: 'devops', status: 'thinking', cost: 0.002, tokens: 150, runtime: 0.8 },
  
  { type: 'SPAWN_NODE', nodeId: 'root', label: 'Dockerize & Setup CI/CD', sublabel: 'DevOps Goal', status: 'thinking', x: 250, y: 40 },
  { type: 'SPAWN_NODE', nodeId: 'task-docker', label: '1. Draft Dockerfile Config', sublabel: 'DevOpsAgent', status: 'executing', x: 90, y: 120, parentId: 'root' },
  { type: 'SPAWN_NODE', nodeId: 'task-ci', label: '2. GitHub Actions YAML', sublabel: 'DevOpsAgent', status: 'planning', x: 250, y: 120, parentId: 'root' },
  { type: 'SPAWN_NODE', nodeId: 'task-verify', label: '3. Pipeline Runner QA', sublabel: 'QA-Agent', status: 'planning', x: 410, y: 120, parentId: 'root' },
  
  { type: 'STREAM_THOUGHT', agentId: 'devops', text: '# Infrastructure Plan: Dockerization & Deployment Actions\n\nI need to containerize the Node application and establish a secure, automated build/test pipeline on GitHub Actions:\n\n1. **Dockerfile Specification**: Use a multi-stage node build structure to minimize image layers.\n2. **GitHub Workflow Configuration**: Write `.github/workflows/deploy.yml` with dependency caching.\n3. **Validation**: Test the build script locally, resolve dependencies, and verify lint stages.\n\nLet\'s start by writing the initial Dockerfile.' },
  
  // Draft Dockerfile
  { type: 'VFS_WRITE', path: '/Dockerfile', content: `FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]`, operation: 'NEW' },

  { type: 'TERMINAL_COMMAND', command: 'docker build -t neuralis-app .' },
  { type: 'TERMINAL_OUTPUT', text: 'Sending build context to Docker daemon  2.34MB\nStep 1/5 : FROM node:20-alpine\n20-alpine: Pulling from library/node\nDigest: sha256:4f00db1a86\nStep 2/5 : WORKDIR /app\nStep 3/5 : COPY . .\nStep 4/5 : RUN npm install\nnpm ERR! code ENOENT\nnpm ERR! syscall open\nnpm ERR! path /app/package.json\nnpm ERR! errno -2\nnpm ERR! enoent ENOENT: no such file or directory, open \'/app/package.json\'\nThe command \'/bin/sh -c npm install\' returned a non-zero code: 254', lineType: 'error' },
  
  { type: 'TIMELINE_LOG', timestamp: '00:03.8', agentName: 'DevOpsAgent', description: 'Failed Docker build compilation. Triggering self-correction.' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-docker', status: 'failure' },
  
  { type: 'STREAM_THOUGHT', agentId: 'devops', text: '# Docker Build Failure: Missing package.json\n\nAh, the directory layout inside our simulation workspace does not contain a root `package.json`! Without a package configuration, `npm install` fails inside the container.\n\nI will:\n1. Generate a root `package.json` for the project.\n2. Optimize the Dockerfile to copy package configuration first, run install to preserve caching layers, then copy the rest of the application files.' },
  
  { type: 'VFS_WRITE', path: '/package.json', content: `{\n  "name": "neuralis-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "express": "^4.19.2",\n    "cors": "^2.8.5"\n  }\n}`, operation: 'NEW' },
  
  { type: 'VFS_WRITE', path: '/Dockerfile', before: `FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]`, content: `FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["node", "server.js"]`, operation: 'MODIFIED' },

  { type: 'TERMINAL_COMMAND', command: 'docker build -t neuralis-app .' },
  { type: 'TERMINAL_OUTPUT', text: 'Step 1/9 : FROM node:20-alpine as builder\n ---> ca6f3b20\nStep 2/9 : WORKDIR /app\n ---> Using cache\nStep 3/9 : COPY package*.json ./\n ---> 8b1f3c2d\nStep 4/9 : RUN npm ci --only=production\nadded 56 packages in 1.84s\nStep 5/9 : COPY . .\n ---> 3a1f8c2e\nStep 6/9 : FROM node:20-alpine\nStep 7/9 : WORKDIR /app\nStep 8/9 : COPY --from=builder /app ./\nStep 9/9 : EXPOSE 3000\nSuccessfully built image neuralis-app:latest', lineType: 'success' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-docker', status: 'success' },
  
  // --- WRITE WORKFLOW ---
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-ci', status: 'executing' },
  { type: 'TIMELINE_LOG', timestamp: '00:07.5', agentName: 'DevOpsAgent', description: 'Writing GitHub Actions CI configuration.' },
  { type: 'STREAM_THOUGHT', agentId: 'devops', text: 'Creating GitHub Actions workflow pipeline `.github/workflows/deploy.yml`. This yaml builds the container, runs checks, and enforces dependency caching.' },
  
  { type: 'VFS_WRITE', path: '/.github/workflows/deploy.yml', content: `name: Integration Pipeline
on:
  push:
    branches: [ main ]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run Linter check
        run: npm run lint
      - name: Verify Docker Build
        run: docker build -t neuralis-app .`, operation: 'NEW' },
  
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-ci', status: 'success' },
  
  // --- QA VERIFICATION ---
  { type: 'SPAWN_AGENT', agentId: 'qa', name: 'QA-Agent', role: 'Automation QA Inspector' },
  { type: 'UPDATE_AGENT_STATUS', agentId: 'qa', status: 'thinking', cost: 0.003, tokens: 280, runtime: 9.8 },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-verify', status: 'executing' },
  { type: 'TIMELINE_LOG', timestamp: '00:10.2', agentName: 'QA-Agent', description: 'Simulating pipeline runner lint and dependency tests.' },
  
  { type: 'TERMINAL_COMMAND', command: 'npm run lint' },
  { type: 'TERMINAL_OUTPUT', text: 'Linting codebase...\n✓ src/routes/auth.js: Clean\n✓ src/middleware/guard.js: Clean\n✓ server.js: Clean\nLinter completed. 0 warnings.', lineType: 'success' },
  
  { type: 'UPDATE_NODE_STATUS', nodeId: 'task-verify', status: 'success' },
  { type: 'UPDATE_NODE_STATUS', nodeId: 'root', status: 'success' },
  { type: 'TIMELINE_LOG', timestamp: '00:11.8', agentName: 'SYSTEM', description: 'CI/CD pipeline verified. Sandbox runner completed.' },
  { type: 'SIMULATION_COMPLETE' }
];

// Map scenarios
export function getScenarioEvents(scenarioId) {
  switch (scenarioId) {
    case 'jwt-auth':
      return jwtAuthEvents;
    case 'sql-opt':
      return sqlOptEvents;
    case 'kanban':
      return kanbanEvents;
    case 'cicd-devops':
      return cicdDevopsEvents;
    default:
      return jwtAuthEvents;
  }
}
