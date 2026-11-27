import { chat } from './llm';

async function main() {
 const result = await chat([
  {
    role: 'system',
    content:
      'You are a banking assistant for a bank in Lebanon. ' +
      'Answer in at most 2 short sentences. ' +
      'If the question is not about banking, reply exactly: "I can only help with banking questions."',
  },
  { role: 'user', content: 'In two sentences, what is a debit card?' },
]);

  console.log('Answer:', result.text);
  console.log('Tokens:', result.usage);
}

main().catch(console.error);