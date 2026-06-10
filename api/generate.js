// api/generate.js - Vercel Serverless Function relaying requests to LLMs
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { goal, provider, clientKey } = req.body;

  if (!goal) {
    return res.status(400).json({ error: 'Goal description is required' });
  }

  const targetProvider = provider || 'gemini';

  // Determine key: prioritize server-side environment variables, fallback to client-supplied key
  let apiKey = '';
  if (targetProvider === 'gemini') {
    apiKey = process.env.GEMINI_API_KEY || clientKey;
  } else if (targetProvider === 'openai') {
    apiKey = process.env.OPENAI_API_KEY || clientKey;
  } else if (targetProvider === 'claude') {
    apiKey = process.env.CLAUDE_API_KEY || clientKey;
  }

  if (!apiKey) {
    return res.status(400).json({
      error: `No API key configured for ${targetProvider.toUpperCase()}. Please configure environment variables in your deployment dashboard, or set your developer key in the console settings modal.`
    });
  }

  try {
    if (targetProvider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const prompt = `Decompose the programming goal: "${goal}". Decompose it into 4-6 sequential engineering task nodes for a task tree layout. You must output ONLY a valid JSON object matching this schema, with no markdown code fence blocks or wrapper texts:\n{\n  "tasks": [\n    { "id": "task-1", "label": "Task Name", "sublabel": "Agent Name", "parentId": "root" }\n  ],\n  "thoughts": [\n    { "agentId": "architect", "text": "Detailed markdown thought analysis of the goal" }\n  ]\n}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Malformed Gemini response payload structure.');
      }
      
      const text = data.candidates[0].content.parts[0].text.trim();
      const cleanJson = extractJson(text);
      return res.status(200).json(cleanJson);
    } 
    
    if (targetProvider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { "role": "system", "content": "You are a senior coordinator agent. Decompose the goal into 4-6 sequential task nodes. Return ONLY a valid JSON object matching: { \"tasks\": [ { \"id\", \"label\", \"sublabel\", \"parentId\" } ], \"thoughts\": [ { \"agentId\", \"text\" } ] } with response_format json_object." },
            { "role": "user", "content": goal }
          ],
          response_format: { "type": "json_object" }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content.trim();
      return res.status(200).json(JSON.parse(text));
    }

    if (targetProvider === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1200,
          system: "You are a senior coordinator agent. Decompose the goal into 4-6 sequential task nodes. You must respond ONLY with a valid JSON object matching this schema: { \"tasks\": [ { \"id\", \"label\", \"sublabel\", \"parentId\" } ], \"thoughts\": [ { \"agentId\", \"text\" } ] }. Do not wrap your response in markdown code blocks or write explanations.",
          messages: [
            { "role": "user", "content": `Decompose the programming goal: "${goal}"` }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Claude API returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text = data.content[0].text.trim();
      const cleanJson = extractJson(text);
      return res.status(200).json(cleanJson);
    }

    return res.status(400).json({ error: 'Unsupported LLM provider selection.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Helper function to extract JSON from markdown wrappers if models include them
function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerErr) {
        throw new Error("Unable to parse extracted JSON block: " + innerErr.message);
      }
    }
    throw new Error("Failed to parse JSON response from LLM.");
  }
}
