const { logger } = require('@librechat/data-schemas');

const OPTIMIZATION_SYSTEM_PROMPTS = {
  rewrite: `You are a prompt engineering expert. Rewrite the following prompt to be more clear, effective, and well-structured. Improve specificity, add necessary context, and ensure the instruction is unambiguous. Return ONLY the rewritten prompt without any explanation, formatting, or meta-commentary.`,
  compress: `You are a prompt compression expert. Compress the following prompt to the minimum possible length while preserving ALL key information, intent, and constraints. Remove redundancy, use concise language, and eliminate filler words. Return ONLY the compressed prompt without any explanation.`,
  expand: `You are a prompt expansion expert. Expand the following prompt by adding more detail, context, examples, edge cases, and structured guidance. Make it comprehensive while maintaining clarity. Return ONLY the expanded prompt without any explanation.`,
  seo: `You are an SEO content optimization expert. Rewrite the following prompt or content to maximize search engine visibility. Improve keyword placement, add structured headings, optimize meta-description style phrasing, and ensure semantic relevance. Return ONLY the SEO-optimized version without any explanation.`,
  code: `You are a code-focused prompt optimization expert. Rewrite the following prompt to be optimized for code generation tasks. Add explicit language constraints, output format specifications, error handling expectations, performance considerations, and testing requirements as applicable. Return ONLY the optimized prompt without any explanation.`,
  marketing: `You are a marketing copy optimization expert. Rewrite the following prompt or content to maximize conversion and engagement. Apply proven copywriting frameworks (AIDA, PAS, etc.), add emotional triggers, strengthen calls-to-action, and improve persuasive elements. Return ONLY the marketing-optimized version without any explanation.`,
};

const OPTIMIZATION_MODEL = process.env.PROMPT_OPTIMIZER_MODEL || 'gpt-4o-mini';

function initOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  const OpenAI = require('openai');
  const config = { apiKey };
  if (process.env.OPENAI_API_URL) {
    config.baseURL = process.env.OPENAI_API_URL;
  }
  return new OpenAI(config);
}

async function optimize({ prompt, mode = 'rewrite', additionalContext = '' }) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return { error: 'Prompt is required and must be a non-empty string' };
  }

  const systemPrompt = OPTIMIZATION_SYSTEM_PROMPTS[mode];
  if (!systemPrompt) {
    return { error: `Unknown optimization mode: ${mode}. Supported modes: ${Object.keys(OPTIMIZATION_SYSTEM_PROMPTS).join(', ')}` };
  }

  const openai = initOpenAI();
  if (!openai) {
    return { error: 'OPENAI_API_KEY not configured. Set OPENAI_API_KEY in your .env file.' };
  }

  try {
    const messages = [{ role: 'system', content: systemPrompt }];

    let userContent = prompt;
    if (additionalContext) {
      userContent = `Prompt: ${prompt}\n\nAdditional Context: ${additionalContext}`;
    }
    messages.push({ role: 'user', content: userContent });

    const completion = await openai.chat.completions.create({
      model: OPTIMIZATION_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    });

    const optimized = completion.choices[0]?.message?.content || '';

    const originalTokens = prompt.length;
    const optimizedTokens = optimized.length;
    const compressionRatio = originalTokens > 0
      ? Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100)
      : 0;

    return {
      original: prompt,
      optimized,
      mode,
      model: OPTIMIZATION_MODEL,
      stats: {
        originalLength: originalTokens,
        optimizedLength: optimizedTokens,
        compressionRatio,
      },
    };
  } catch (err) {
    logger.error('[PromptOptimizer] OpenAI call failed:', err.message);
    return { error: `Optimization failed: ${err.message}` };
  }
}

const modes = Object.keys(OPTIMIZATION_SYSTEM_PROMPTS);

async function optimizeBatch({ prompts, mode = 'rewrite' }) {
  if (!Array.isArray(prompts) || prompts.length === 0) {
    return { error: 'Prompts array is required and must be non-empty' };
  }

  const results = [];
  for (const prompt of prompts) {
    const result = await optimize({ prompt, mode });
    results.push(result);
  }

  return { results };
}

module.exports = {
  optimize,
  optimizeBatch,
  modes,
};
