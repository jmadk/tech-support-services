# Tech Support Services

This project now uses a local SQLite database instead of Supabase.

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

## Go Live With GitHub + Render

This app now deploys best as two services from the same GitHub repo:

- `tech-support-web`: static frontend
- `tech-support-api`: Node API with SQLite

Use the included [render.yaml](./render.yaml) Blueprint on Render.

Important deployment note:

- GitHub Pages cannot host this full app because the project needs a Node API and SQLite.
- SQLite persistence on Render requires a paid web service with a persistent disk.

High-level deployment flow:

1. Push this project to a GitHub repository.
2. In Render, create a new Blueprint from that GitHub repo.
3. For the API service, set:
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
4. For the frontend service, set:
   - `VITE_API_URL`
   - Example: `https://your-api-service.onrender.com/api`
5. Deploy both services.
6. Open the frontend Render URL on any device.

The API health check is available at `/api/health`.

## Email notifications for consultations

To receive consultation alerts in your official inbox, create a `.env` file in the project root based on `.env.example`:

```env
OWNER_EMAIL=chegekeith4@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=chegekeith4@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=chegekeith4@gmail.com
```

For Gmail, use an App Password instead of your normal account password:

1. Turn on 2-Step Verification for `chegekeith4@gmail.com`.
2. Create a Gmail App Password.
3. Put that value into `SMTP_PASS`.
4. Restart `npm run api`.

When this is configured:

- Every consultation is stored in SQLite.
- The owner account (`chegekeith4@gmail.com`) can open the dashboard inbox and see all consultations.
- New consultations also send an email notification to the owner inbox.

## Notes

- Auth, profiles, consultations, and saved services are now stored in SQLite.
- The frontend talks to the backend through `/api` requests.
- If you want a different API URL, set `VITE_API_URL`.
- The backend uses Node's built-in `node:sqlite`, so use a recent Node 22+ release.
