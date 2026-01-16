// AI Prompt Templates for Article Analysis

export const SUMMARIZE_PROMPT = `
You are a news analyst. Summarize the following article into exactly 3 key points.
Each point must be under 30 characters in Japanese or 50 characters in English.
Focus on the most important facts and implications.

Article Title: {title}
Article Content: {content}

Respond in JSON format:
{
  "summary": ["Point 1", "Point 2", "Point 3"]
}
`;

export const SENTIMENT_PROMPT = `
Analyze the tone and sentiment of the following article about Donald Trump.
Rate it on a scale from -1.0 (extremely negative) to +1.0 (extremely positive).

Guidelines:
- -1.0 to -0.6: Strongly negative (criticism, accusations, legal troubles)
- -0.6 to -0.2: Moderately negative (concerns, skepticism)
- -0.2 to +0.2: Neutral (factual reporting, balanced coverage)
- +0.2 to +0.6: Moderately positive (achievements, support)
- +0.6 to +1.0: Strongly positive (praise, endorsements)

Article: {content}

Respond in JSON format:
{
  "sentiment": 0.5
}
`;

export const BIAS_PROMPT = `
Determine the political bias of the following news article.
Consider the language used, framing, and source tendencies.

Categories:
- "Left": Left-leaning, progressive, Democratic-aligned
- "Center": Neutral, balanced, fact-focused
- "Right": Right-leaning, conservative, Republican-aligned

Article: {content}
Source: {source}

Respond in JSON format:
{
  "bias": "Center"
}
`;

export const IMPACT_PROMPT = `
Rate the importance/impact level of this Trump-related news article.

Impact Levels:
- S: Extremely important (election results, arrest, major policy, violent events)
- A: Important (trial developments, major polls, international impact, key appointments)
- B: Moderately important (speeches, rallies, media appearances, poll fluctuations)
- C: Reference information (routine statements, old article references, personal activities)

Article Title: {title}
Article Summary: {summary}

Respond in JSON format:
{
  "impactLevel": "A"
}
`;

export const TRANSLATE_PROMPT = `
Translate the following English text to natural Japanese.
Maintain the original tone and nuance.
Do not add explanations or notes.

Text: {text}

Respond in JSON format:
{
  "translation": "翻訳されたテキスト"
}
`;

// Helper function to fill prompt templates
export function fillPrompt(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}
