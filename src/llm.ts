import 'dotenv/config';
import OpenAI from 'openai';

type Provider = 'gemini' | 'ollama';

const providers: Record<Provider, { baseURL: string; apiKey?: string; model?: string }> = {
  gemini: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
  },
  ollama: {
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama', // Ollama ignores the key, but the SDK requires one
    model: process.env.OLLAMA_MODEL,
  },
};

const providerName = (process.env.AI_PROVIDER ?? 'gemini') as Provider;
const config = providers[providerName];

if (!config) throw new Error(`Unknown AI_PROVIDER "${providerName}". Use gemini or ollama.`);
if (!config.apiKey) throw new Error(`Missing API key for ${providerName} in .env`);
if (!config.model) throw new Error(`Missing model name for ${providerName} in .env`);

const client = new OpenAI({
  baseURL: config.baseURL,
  apiKey: config.apiKey,
  timeout: 30_000, // give up after 30 seconds
  maxRetries: 0,   // we write our own retry, so we can see how it works
});

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

async function callModel(messages: Message[]) {
  const response = await client.chat.completions.create({
    model: config.model!,
    messages,
     temperature: 0,
  });
  return {
    text: response.choices[0].message.content ?? '',
    usage: response.usage,
    provider: providerName,
  };
}

export async function chat(messages: Message[]) {
  try {
    return await callModel(messages);
  } catch (err) {
    if (!(err instanceof OpenAI.RateLimitError)) throw toFriendlyError(err);
  }

  // Only reached on a 429 (rate limit): wait, then try once more
  console.warn(`Rate limited by ${providerName}. Waiting 10 seconds, then retrying once...`);
  await new Promise((resolve) => setTimeout(resolve, 10_000));

  try {
    return await callModel(messages);
  } catch (err) {
    throw toFriendlyError(err);
  }
}

function toFriendlyError(err: unknown): Error {
  if (err instanceof OpenAI.APIConnectionTimeoutError) {
    return new Error(`${providerName} took longer than 30 seconds to answer. Try again.`);
  }
  if (err instanceof OpenAI.APIConnectionError) {
    return new Error(`Could not reach ${providerName}. Check your internet, or that Ollama is running.`);
  }
  if (err instanceof OpenAI.APIError) {
    if (err.status === 400 || err.status === 401 || err.status === 403) {
      return new Error(`${providerName} rejected the request (${err.status}). Check the API key and model name in .env.`);
    }
    if (err.status === 429) {
      return new Error(`Still rate limited by ${providerName}. Wait a minute, or set AI_PROVIDER=ollama.`);
    }
    return new Error(`${providerName} error ${err.status}: ${err.message}`);
  }
  return err instanceof Error ? err : new Error(String(err));
}