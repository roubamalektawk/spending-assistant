# Spending Assistant

A small terminal assistant that answers questions about a list of (fake) card transactions using an LLM.
It's a learning project: each step adds one core concept of building with AI.

## Status

- [x] Step 1: Project setup (TypeScript, `.env` config, sample data)
- [x] Step 2: First LLM call, system prompt, token usage, provider switch (Gemini / Ollama), error handling
- [ ] Step 3: Structured output (JSON validated with zod)
- [ ] Step 4: Tool calling
- [ ] Step 5: Agent loop
- [ ] Step 6: Evals

## Tech

- Node.js + TypeScript (`tsx`)
- `openai` SDK pointed at OpenAI-compatible endpoints, so the provider is one setting in `.env`
- Gemini API (free tier) by default, Ollama locally as a fallback
- All data in `data/transactions.csv` is fake (60 transactions, Jan–Apr 2026)

## Run it

```bash
npm install
cp .env.example .env   # then add your own GEMINI_API_KEY and GEMINI_MODEL
npm run dev            # first LLM call
npm run experiment     # CSV-in-the-prompt experiment
```

## What I learned

### LLMs don't calculate, so totals must come from code

I pasted all 60 transactions into the prompt and asked: "What is the total I spent on Restaurants?"

| Run | AI answer | Real total (computed in code) |
| --- | --- | --- |
| 1 (temperature 0) | 389 | 323.30 |
| 2 (temperature 0) | 434 | 323.30 |
| 3 (temperature 0) | 528 | 323.30 |

At the default temperature, the AI also gave a different number on each of 3 runs.

- The AI's answer changed on every run and was never correct. The code's answer was identical and exact every time.
- Setting `temperature: 0` did not fix it. It reduces randomness, but the model still isn't adding the rows: it predicts a plausible-looking number.
- **Lesson:** the AI should decide *what* to calculate, and code should do the calculation. That's what tool calling (Step 4) is for.

### Prompts guide the model, they don't guarantee anything

A system prompt ("only answer banking questions") made the model refuse off-topic questions without any `if` statement in my code. But prompts are instructions, not rules the code enforces, so behaviour still needs to be tested (Step 6).

### Tokens

Every call reports `prompt_tokens` (what I sent, including the system prompt) and `completion_tokens` (the reply). The system prompt costs tokens on every call, and the full CSV makes the prompt much bigger.
