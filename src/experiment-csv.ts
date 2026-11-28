import { readFileSync } from 'node:fs';
import { chat } from './llm';

const csv = readFileSync('data/transactions.csv', 'utf8');

// The correct answer, calculated by normal code
const rows = csv.trim().split(/\r?\n/).slice(1).map((line) => line.split(','));
const realTotal = rows
  .filter((r) => r[2].trim() === 'Restaurants')
  .reduce((sum, r) => sum + Number(r[3]), 0);

async function main() {
  const result = await chat([
    { role: 'system', content: 'You are a banking assistant. Answer using only the transactions provided.' },
    {
      role: 'user',
      content: `Here are my transactions:\n\n${csv}\n\nWhat is the total I spent on Restaurants? Reply with just the number.`,
    },
  ]);

  console.log('AI says:   ', result.text.trim());
  console.log('Real total:', realTotal.toFixed(2));
  console.log('Tokens:    ', result.usage?.prompt_tokens, 'in');
}

main().catch((err) => console.error('Error:', err.message));