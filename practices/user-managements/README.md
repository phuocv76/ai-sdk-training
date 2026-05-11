# user-management-app

Next.js user-management app backed by Cloudflare D1 (via [@opennextjs/cloudflare](https://github.com/opennextjs/opennextjs-cloudflare)). In development, `next dev` runs with local Miniflare bindings and a persisted local D1 database.

## Prerequisites

1. **Node.js** 20 or newer (recommended for Next.js 16)
2. **pnpm** (recommended; this repo includes `pnpm-lock.yaml`) or **npm**

---

## Steps: run locally

Follow these steps in order.

### Step 1 — Install dependencies

```bash
pnpm install
```

Using npm instead:

```bash
npm install
```

### Step 2 — Apply D1 migrations (local database)

The API expects a D1 binding named `DB`. Run migrations once locally, and again whenever new migration files are added:

```bash
pnpm db:apply:local
```

Equivalent with npm:

```bash
npm run db:apply:local
```

### Step 3 — (Optional) OpenAI API key for the chat assistant

Chat routes use `OPENAI_API_KEY`. For local dev you can:

- Create a **`.dev.vars`** file in the project root (Wrangler-style; gitignored):

  ```bash
  OPENAI_API_KEY=sk-...
  ```

- Or export **`OPENAI_API_KEY`** in your shell before starting the dev server.

You can also pass a key from the app UI (sent as `x-openai-api-key`).

### Step 4 — Start the development server

```bash
pnpm dev
```

Equivalent with npm:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (default Next.js port).

---

## Scripts

All scripts are defined in `package.json`. Use `pnpm <script>` or `npm run <script>`.

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `pnpm dev` | Next.js development server |
| `build` | `pnpm build` | Production Next.js build (`prebuild` clears `.next/dev` first) |
| `prebuild` | *(automatic)* | Runs before `build`; removes `.next/dev` |
| `start` | `pnpm start` | Production server (run after `build`) |
| `lint` | `pnpm lint` | ESLint |
| `preview` | `pnpm preview` | OpenNext Cloudflare build + local Workers preview |
| `deploy` | `pnpm deploy` | Build and deploy to Cloudflare Workers |
| `cf-typegen` | `pnpm cf-typegen` | Generate `cloudflare-env.d.ts` from Wrangler |
| `db:migrate:create` | `pnpm db:migrate:create` | Create a new D1 migration (Wrangler `migrations create`) |
| `db:apply:local` | `pnpm db:apply:local` | Apply D1 migrations to the **local** database |
| `db:apply:remote` | `pnpm db:apply:remote` | Apply D1 migrations to the **remote** database |

Typical daily work on your machine: **`pnpm dev`** plus **`pnpm db:apply:local`** when migrations change.
