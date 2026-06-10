// server.js - Express server for hosting NEURALIS locally
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const generateHandler = require('./api/generate');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files from current directory
app.use(express.static('.'));

// Local mapping for the Vercel serverless generate endpoint
app.post('/api/generate', generateHandler);

app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`    NEURALIS // MULTI-AGENT CONSOLE RELAY RUNNING       `);
  console.log(`    Local Server: http://localhost:${PORT}             `);
  console.log(`========================================================`);
  console.log(`Ready for live goal orchestration.`);
});
