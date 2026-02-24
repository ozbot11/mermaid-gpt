# MermaidGPT

A production-ready web IDE for engineers to write, edit, render, and AI-assist Mermaid diagrams.

## Features

- **Mermaid code editor** (Monaco) with dark theme and syntax highlighting
- **Live Mermaid renderer** with 300ms debounce and error overlay
- **GPT Assistant sidebar** (collapsible): fix syntax, improve structure, generate from description
- Export as SVG, download as PNG, copy code, reset diagram
- Example templates: Flowchart, Sequence, Class, State
- **Sign in with Google** (NextAuth.js). Set `ALLOWED_EMAILS=*` (or leave empty) for public access; or list specific emails to restrict.
- **Rate limiting**: 20 GPT requests per minute per user. **Input limits**: message max 4000 chars, diagram max 20000 chars.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- TailwindCSS
- @monaco-editor/react
- Mermaid.js v10+
- OpenAI API (server-side only)

## Setup

1. Clone the repo and install dependencies:

```bash
cd mermaid-gpt
npm install
```

2. Create a `.env.local` file (see `.env.example`):

```bash
cp .env.example .env.local
```

3. Set environment variables in `.env.local` (see `.env.example`):

- **OpenAI** (required for GPT assistant): `OPENAI_API_KEY=sk-...`
- **Google OAuth** (optional, for Sign in with Google):
  - Create OAuth 2.0 credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
  - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- **NextAuth**: `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`) and `NEXTAUTH_URL=http://localhost:3000`
- **Access control**: `ALLOWED_EMAILS=your@email.com,other@email.com` (comma-separated). Only these accounts can access the app after sign-in. If unset, no one gets in.

4. Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push the project to GitHub (or connect your Git provider in Vercel).
2. In [Vercel](https://vercel.com), import the repository.
3. Add environment variables: `OPENAI_API_KEY`, and for Google sign-in: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (e.g. `https://your-app.vercel.app`).
4. Deploy. The build uses `next build`; no extra config needed.

## Project Structure

```
app/
  page.tsx            # Home: project list, new diagram
  diagram/page.tsx     # Diagram editor (Monaco + preview + GPT)
  layout.tsx
  api/auth/[...nextauth]/route.ts
  api/gpt/route.ts     # Server-side OpenAI proxy (rate-limited)
  api/health/route.ts  # Health check for monitoring
components/
  AuthButton.tsx     # Sign in with Google / Sign out
  Editor.tsx         # Monaco editor
  GPTPanel.tsx       # GPT chat + quick actions
  Providers.tsx      # NextAuth SessionProvider
  Renderer.tsx       # Mermaid live renderer
lib/
  auth.ts            # NextAuth config; isEmailAllowed (allowlist or public)
  openai.ts          # OpenAI client (server-only, 60s timeout)
  rateLimit.ts       # In-memory rate limiter for /api/gpt
  templates.ts       # Example Mermaid templates
types/
  index.ts
```

## Security

- The OpenAI API key is only used server-side in `app/api/gpt/route.ts` and never sent to the client.
- GPT requests are rate-limited (20/minute/user) and input lengths are capped to control cost and abuse.

## Health

- `GET /api/health` returns `{ ok: true, openaiConfigured: boolean }` for monitoring (e.g. uptime checks).
