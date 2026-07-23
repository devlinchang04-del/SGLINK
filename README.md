# SGLINK

Minimal link shortener. Two pieces:

- **`docs/`** — static dashboard (create/list/delete links). Deployed on GitHub Pages.
- **`worker/`** — Cloudflare Worker that actually redirects slugs and counts clicks, backed by Workers KV.

GitHub Pages only serves static files, it cannot run a redirect server or a database.
So short links do **not** resolve under your `github.io` domain — they resolve under
your Worker's domain (`https://sglink.<you>.workers.dev/<slug>`, or a custom domain
if you attach one to the Worker later). The `github.io` page is just the dashboard
for managing links.

## 1. Deploy the Worker

Requires a free [Cloudflare](https://dash.cloudflare.com/sign-up) account. Run from `worker/`:

```bash
cd worker
npx wrangler login

# Create the KV namespace that stores links, then copy the printed id
# into wrangler.toml (replace REPLACE_WITH_KV_NAMESPACE_ID).
npx wrangler kv namespace create LINKS

# Set the API key the dashboard will use to authenticate write requests.
# Pick your own secret value when prompted.
npx wrangler secret put API_KEY

npx wrangler deploy
```

`wrangler deploy` prints your Worker URL, e.g. `https://sglink.yourname.workers.dev`.

## 2. Point the dashboard at the Worker

Edit `docs/config.js`:

```js
window.SGLINK_CONFIG = {
  WORKER_URL: 'https://sglink.yourname.workers.dev',
};
```

Commit and push this change.

## 3. Enable GitHub Pages

Push this repo to GitHub, then in the repo: **Settings → Pages → Source: Deploy from a
branch → Branch: `main`, folder: `/docs`**. Your dashboard will be live at
`https://<username>.github.io/<repo>/`.

## 4. Use it

Open the dashboard, paste the API key you set in step 1 (saved only in your browser's
local storage), then create links. Short links resolve at `<WORKER_URL>/<slug>`.

## Local test

Pure-function logic (slug generation/validation, URL validation, auth compare) has a
Node built-in test, no framework:

```bash
node --test worker/src/utils.test.js
```
