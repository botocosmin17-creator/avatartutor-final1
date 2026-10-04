export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content } = req.body;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  if (!content) {
    return res.status(400).json({ error: 'Content required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Create 5 multiple choice questions from this content. Format ONLY as valid JSON array with objects containing: {question, options: [], correct: 0, explanation}. Do NOT include markdown or any text before/after the JSON. Content: ${content}`
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API Error');
    }

    const text = data.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const questions = JSON.parse(jsonMatch[0]);
        return res.status(200).json({ questions });
      } catch (parseError) {
        return res.status(500).json({ error: 'Failed to parse questions', raw: text });
      }
    }

    return res.status(500).json({ error: 'No valid JSON in response', raw: text });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
