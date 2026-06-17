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

  const { goal, provider, clientKey, action, ollamaHost, ollamaModel, model, code } = req.body;
  const targetModel = model || ollamaModel;

  // Handle Ollama model listing action
  if (action === 'list-models') {
    const host = ollamaHost || 'http://localhost:11434';
    try {
      const response = await fetch(`${host}/api/tags`, {
        method: 'GET',
        timeout: 3000 // Short timeout to fail fast if Ollama isn't running
      });
      if (!response.ok) {
        throw new Error(`Ollama tags returned status ${response.status}`);
      }
      const data = await response.json();
      const models = data.models ? data.models.map(m => m.name) : [];
      return res.status(200).json({ models });
    } catch (err) {
      return res.status(500).json({ error: `Could not connect to Ollama: ${err.message}`, models: [] });
    }
  }

  if (!goal && action !== 'generate-qa') {
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

  if (targetProvider !== 'ollama' && !apiKey) {
    return res.status(400).json({
      error: `No API key configured for ${targetProvider.toUpperCase()}. Please configure environment variables in your deployment dashboard, or set your developer key in the console settings modal.`
    });
  }

  try {
    // ----------------------------------------------------------------------
    // OLLAMA PROVIDER (LOCAL)
    // ----------------------------------------------------------------------
    if (targetProvider === 'ollama') {
      const host = ollamaHost || 'http://localhost:11434';
      const modelName = targetModel || 'llama3';
      
      let prompt = '';
      if (action === 'generate-code') {
        prompt = `You are a senior software developer agent. Write a clean, functioning, complete JavaScript module for the goal: "${goal}". Respond ONLY with the clean javascript code. Do NOT wrap your response in markdown code blocks (\`\`\`javascript ... \`\`\`), do NOT write descriptions, explanations or introduction text. Return only the raw javascript code.`;
      } else if (action === 'generate-qa') {
        prompt = `You are a security and QA auditing agent. Review this JavaScript code for bugs, logic errors, and security vulnerabilities:\n\n${code}\n\nRespond with a clear, concise markdown report summarizing your findings, potential issues, and validation checks.`;
      } else {
        prompt = `Decompose the programming goal: "${goal}". Decompose it into 4-6 sequential engineering task nodes for a task tree layout. You must output ONLY a valid JSON object matching this schema, with no markdown code fence blocks or wrapper texts:\n{\n  "tasks": [\n    { "id": "task-1", "label": "Task Name", "sublabel": "Agent Name", "parentId": "root" }\n  ],\n  "thoughts": [\n    { "agentId": "architect", "text": "Detailed markdown thought analysis of the goal" }\n  ]\n}`;
      }

      const response = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false,
          options: { temperature: 0.2 }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text = data.response.trim();

      if (action === 'generate-code' || action === 'generate-qa') {
        return res.status(200).json({ response: text });
      } else {
        const cleanJson = extractJson(text);
        return res.status(200).json(cleanJson);
      }
    }

    // ----------------------------------------------------------------------
    // GOOGLE GEMINI PROVIDER
    // ----------------------------------------------------------------------
    if (targetProvider === 'gemini') {
      const modelName = targetModel || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      
      let prompt = '';
      let isJson = true;
      if (action === 'generate-code') {
        prompt = `You are a senior software developer agent. Write a clean, functioning, complete JavaScript module for the goal: "${goal}". Respond ONLY with the clean javascript code. Do NOT wrap your response in markdown code blocks (\`\`\`javascript ... \`\`\`), do NOT write descriptions, explanations or introduction text. Return only the raw javascript code.`;
        isJson = false;
      } else if (action === 'generate-qa') {
        prompt = `You are a security and QA auditing agent. Review this JavaScript code for bugs, logic errors, and security vulnerabilities:\n\n${code}\n\nRespond with a clear, concise markdown report summarizing your findings, potential issues, and validation checks.`;
        isJson = false;
      } else {
        prompt = `Decompose the programming goal: "${goal}". Decompose it into 4-6 sequential engineering task nodes for a task tree layout. You must output ONLY a valid JSON object matching this schema, with no markdown code fence blocks or wrapper texts:\n{\n  "tasks": [\n    { "id": "task-1", "label": "Task Name", "sublabel": "Agent Name", "parentId": "root" }\n  ],\n  "thoughts": [\n    { "agentId": "architect", "text": "Detailed markdown thought analysis of the goal" }\n  ]\n}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: isJson ? { responseMimeType: "application/json" } : undefined
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
      if (isJson) {
        const cleanJson = extractJson(text);
        return res.status(200).json(cleanJson);
      } else {
        return res.status(200).json({ response: text });
      }
    } 
    
    // ----------------------------------------------------------------------
    // OPENAI PROVIDER
    // ----------------------------------------------------------------------
    if (targetProvider === 'openai') {
      const modelName = targetModel || 'gpt-4o-mini';
      let systemContent = '';
      let userContent = goal;
      let responseFormat = undefined;

      if (action === 'generate-code') {
        systemContent = "You are a senior developer agent. Write a clean, functioning, complete JavaScript module. Return ONLY raw javascript code. Do NOT wrap it in markdown code fence blocks or write any descriptions or text.";
      } else if (action === 'generate-qa') {
        systemContent = "You are a senior QA agent. Review the provided code and return a clear markdown report of bugs and vulnerabilities.";
        userContent = code;
      } else {
        systemContent = "You are a senior coordinator agent. Decompose the goal into 4-6 sequential task nodes. Return ONLY a valid JSON object matching: { \"tasks\": [ { \"id\", \"label\", \"sublabel\", \"parentId\" } ], \"thoughts\": [ { \"agentId\", \"text\" } ] }.";
        responseFormat = { "type": "json_object" };
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { "role": "system", "content": systemContent },
            { "role": "user", "content": userContent }
          ],
          response_format: responseFormat
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content.trim();
      if (!responseFormat) {
        return res.status(200).json({ response: text });
      } else {
        return res.status(200).json(JSON.parse(text));
      }
    }

    // ----------------------------------------------------------------------
    // ANTHROPIC CLAUDE PROVIDER
    // ----------------------------------------------------------------------
    if (targetProvider === 'claude') {
      const modelName = targetModel || 'claude-3-5-sonnet-20241022';
      let systemContent = '';
      let userContent = `Decompose the programming goal: "${goal}"`;

      if (action === 'generate-code') {
        systemContent = "You are a senior developer agent. Write a clean, functioning, complete JavaScript module. Return ONLY raw javascript code. Do NOT wrap it in markdown code blocks or write explanations.";
        userContent = `Write code for goal: "${goal}"`;
      } else if (action === 'generate-qa') {
        systemContent = "You are a senior QA agent. Review the provided code and return a clear markdown report of bugs and vulnerabilities.";
        userContent = `Review code:\n\n${code}`;
      } else {
        systemContent = "You are a senior coordinator agent. Decompose the goal into 4-6 sequential task nodes. You must respond ONLY with a valid JSON object matching this schema: { \"tasks\": [ { \"id\", \"label\", \"sublabel\", \"parentId\" } ], \"thoughts\": [ { \"agentId\", \"text\" } ] }. Do not wrap your response in markdown code blocks or write explanations.";
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 1200,
          system: systemContent,
          messages: [
            { "role": "user", "content": userContent }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Claude API returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text = data.content[0].text.trim();
      if (action === 'generate-code' || action === 'generate-qa') {
        return res.status(200).json({ response: text });
      } else {
        const cleanJson = extractJson(text);
        return res.status(200).json(cleanJson);
      }
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
