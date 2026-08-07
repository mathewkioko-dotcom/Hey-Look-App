# HeyLook

All-in-one social platform combining real-time WhatsApp, Facebook, and Instagram experiences into a single unified nautical-themed workspace.

## Features

- Real-time messaging with delivery status tracking
- AI assistant (Hymli AI) powered by Google Gemini and/or local Ollama
- Interactive social feed with reactions and polls
- WebRTC voice/video calls
- Multiple AI plugin widgets (invoice, meal planner, travel planner, and more)
- Subscription-based model upgrades via Paystack

## Prerequisites

- **Node.js** (v18 or later)
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
- (Optional) A **Supabase** project for backend persistence
- (Optional) [Ollama](https://ollama.com) for local LLM inference

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy the example file to `.env.local` and fill in your keys:

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local`:

   ```
   # Gemini API key (required for Hymli AI)
   VITE_GEMINI_API_KEY="your_real_api_key_here"

   # Optional: override the default Gemini model
   VITE_GEMINI_MODEL="gemini-2.5-flash"

   # Supabase credentials (optional)
   VITE_SUPABASE_URL="your_supabase_url_here"
   VITE_SUPABASE_ANON_KEY="your_supabase_anon_key_here"

   # Paystack public key (for payments)
   VITE_PAYSTACK_PUBLIC_KEY="pk_test_your_public_key_here"
   ```

   > **Note:** Vite only exposes environment variables prefixed with `VITE_` to the browser. The Gemini key must be set as `VITE_GEMINI_API_KEY`.

3. **Run the local dev server**

   ```bash
   npm run dev
   ```

   The app will be available at **http://localhost:3000**.

## Available Scripts

| Script            | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Start the local dev server on `http://localhost:3000` |
| `npm run build`   | Build the production bundle                           |
| `npm run preview` | Preview the production build locally                  |
| `npm run lint`    | Type-check the codebase with `tsc --noEmit`           |

## AI Integration

Hymli AI uses the official [@google/genai](https://www.npmjs.com/package/@google/genai) SDK, authenticated with a standard `VITE_GEMINI_API_KEY`. The app runs fully standalone without any external AI Studio preview wrappers or session tokens.

You can also use a local **Ollama** instance for the "Hymli Speed (Llama 3.1 8B)" model by running:

```bash
OLLAMA_ORIGINS='*' ollama serve
```

## License

Private project.
