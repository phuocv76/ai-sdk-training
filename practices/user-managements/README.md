# user-management-app

Next.js user-management app backed by Cloudflare D1 (via [@opennextjs/cloudflare](https://github.com/opennextjs/opennextjs-cloudflare)). In development, `next dev` runs with local Miniflare bindings and a persisted local D1 database.

## Prerequisites

- **Node.js** 20 or newer (recommended for Next.js 16)
- **pnpm** (recommended; this repo includes `pnpm-lock.yaml`) or **npm**

## Run locally

### 1. Install dependencies

```bash
pnpm install
```

Using npm instead:

```bash
npm install
```

### 2. Apply D1 migrations (local database)

The API expects a D1 binding named `DB`. For local development, apply migrations once (and again whenever new migration files are added):

```bash
pnpm db:apply:local
```

```bash
npm run db:apply:local
```

### 3. Optional: OpenAI API key (chat assistant)

Chat routes use `OPENAI_API_KEY`. For local dev you can either:

- Create a **`.dev.vars`** file in the project root (Wrangler-style; already gitignored):

  ```bash
  OPENAI_API_KEY=sk-...
  ```

- Or set **`OPENAI_API_KEY`** in your shell environment before starting the dev server.

You can also supply a key from the app UI for requests (sent as `x-openai-api-key`).

### 4. Start the development server

```bash
pnpm dev
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (default Next.js port).

---

## Other scripts (from `package.json`)

| Script | Purpose |
| --- | --- |
| `pnpm build` | Production Next.js build |
| `pnpm start` | Run production server after `build` |
| `pnpm lint` | ESLint |
| `pnpm preview` | OpenNext Cloudflare build + local Workers preview |
| `pnpm deploy` | Build and deploy to Cloudflare Workers |
| `pnpm cf-typegen` | Generate `cloudflare-env.d.ts` from Wrangler |
| `pnpm db:apply:remote` | Apply D1 migrations to the remote database |

For day-to-day UI and API work on your machine, **`pnpm dev`** plus **`pnpm db:apply:local`** is usually enough.
