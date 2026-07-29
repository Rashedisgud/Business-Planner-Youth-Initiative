import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    'Missing OPENAI_API_KEY. Copy backend/.env.example to backend/.env and add your OpenAI API key.'
  );
}

// The SDK defaults to a 10 minute timeout, which would leave someone staring at
// a spinner long past the point they'd give up. Fail fast instead and let the
// callers decide how to degrade, but allow a couple of retries first so a single
// transient blip doesn't surface as an error at all.
export const openai = new OpenAI({
  apiKey,
  timeout: 30_000,
  maxRetries: 2,
});

export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
