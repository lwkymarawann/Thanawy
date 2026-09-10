# Thanaweya Tracker

A shared class calendar and grade tracker built with Next.js.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Default fallback PINs are:
- Me: `1111`
- Girlfriend: `2222`
- Mom: `3333`

For production, set the PIN/name environment variables in Vercel.

## Deploy to Vercel

1. Upload this folder to GitHub.
2. Import the GitHub repository into Vercel.
3. Add the environment variables from `.env.example`.
4. For persistent production data, configure a compatible Vercel KV/Redis REST store and provide `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
5. Deploy.

The local `.data/store.json` fallback is intended for local development and is not persistent storage for Vercel serverless deployments.
