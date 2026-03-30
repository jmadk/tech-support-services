# Tech Support Services

This project uses a Node API backed by SQLite. The fastest hosted setup is:

- backend on Render using [`server.mjs`](./server.mjs)
- frontend on any static host using `VITE_API_URL`
- SQLite stored on the Render disk

## Run locally

1. Start the SQLite API:

```bash
npm run api
```

2. In another terminal, start the frontend:

```bash
npm run dev
```

The API runs on `http://localhost:3001` and creates the SQLite database at `data/app.db`.

## Recommended Hosted Setup: Cloudflare Pages + Render API + SQLite

This avoids Cloudflare D1 entirely and uses the existing SQLite backend already in the repo.

- deploy the backend with [`render.yaml`](./render.yaml)
- keep the SQLite database on the Render persistent disk
- deploy the frontend on Cloudflare Pages
- set `VITE_API_URL` to your Render API origin

Example:

```env
VITE_API_URL=https://your-api-service.onrender.com
```

The frontend automatically appends `/api`, so you can use the plain Render origin above.

### Render backend

The backend service in [`render.yaml`](./render.yaml) already includes:

- `node server.mjs`
- persistent disk mounted at `/opt/render/project/src/data`
- health check at `/api/health`

Set these environment variables on the Render API service:

- `OWNER_EMAIL=chegekeith4@gmail.com`
- `OWNER_USERNAME=owner`
- `OWNER_FULL_NAME=KCJ Tech Owner`
- `OWNER_INITIAL_PASSWORD=choose-a-strong-password`
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `SMTP_FROM=...`
- optional: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`

### Cloudflare Pages frontend

Create a Cloudflare Pages project from this repo with:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`

Set this environment variable in the Pages project:

- `VITE_API_URL=https://your-api-service.onrender.com`

This repo includes [`public/_redirects`](./public/_redirects) so client-side routes fall back to `index.html` on Cloudflare Pages.

### First deploy behavior

On first boot, the API will automatically create the owner account if:

- `OWNER_INITIAL_PASSWORD` is set
- no user already exists with `OWNER_EMAIL`
- no user already uses `OWNER_USERNAME`

After the owner account is created once, you can keep the value, rotate it, or remove `OWNER_INITIAL_PASSWORD`. It is only used when the owner account does not already exist.

## Email setup for local development

To receive consultation alerts and password reset OTP emails locally, create a `.env` file in the project root based on `.env.example`:

```env
OWNER_EMAIL=chegekeith4@gmail.com
OWNER_USERNAME=owner
OWNER_FULL_NAME=KCJ Tech Owner
OWNER_INITIAL_PASSWORD=change-me-before-deploy
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=chegekeith4@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=chegekeith4@gmail.com
RESEND_API_KEY=
RESEND_FROM_EMAIL=KCJ Tech <noreply@yourdomain.com>
RESEND_REPLY_TO=chegekeith4@gmail.com
PASSWORD_RESET_CODE_TTL_MINUTES=10
PASSWORD_RESET_MAX_ATTEMPTS=5
PASSWORD_RESET_COOLDOWN_SECONDS=60
```

Local email sending can work in either of these ways:

1. SMTP:
   - use Gmail SMTP with an App Password
2. Resend:
   - add `RESEND_API_KEY`
   - add a valid `RESEND_FROM_EMAIL`

For Gmail SMTP, use an App Password instead of your normal account password:

1. Turn on 2-Step Verification for `chegekeith4@gmail.com`.
2. Create a Gmail App Password.
3. Put that value into `SMTP_PASS`.
4. Restart `npm run api`.

When this is configured:

- Every consultation is stored in SQLite.
- The owner account (`chegekeith4@gmail.com`) can open the dashboard inbox and see all consultations.
- New consultations also send an email notification to the owner inbox.
- Users can request a 6-digit password reset OTP and set a new password.

## Notes

- Auth, profiles, consultations, and saved services are stored in SQLite.
- The frontend talks to the backend through `/api` requests.
- If `VITE_API_URL` is set to a host such as `https://your-api.onrender.com`, the frontend will use `https://your-api.onrender.com/api`.
- The backend uses Node's built-in `node:sqlite`, so use a recent Node 22+ release.
