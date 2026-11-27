import 'dotenv/config';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function chat(messages: Message[]) {
  const response = await client.chat.completions.create({
    model: process.env.GEMINI_MODEL!,
    messages,
  });

  return {
    text: response.choices[0].message.content ?? '',
    usage: response.usage,
  };
}