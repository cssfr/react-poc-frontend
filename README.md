# React Supabase-FastAPI POC

## Setup Locally

1. Copy `.env.example` to `.env` and fill in your values:
   ```
   VITE_SUPABASE_URL=https://your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_FASTAPI_URL=https://your-fastapi-url
   ```
2. Install dependencies:
   ```
   python -m venv venv
   source venv/bin/activate

   npm install
   ```
3. Run in development mode:
   ```
   npm run dev
   ```
4. Open http://localhost:5173 in your browser.

## Setup on Coolify

1. Create a new Coolify app, pointing to this repo.
2. Environment Variables (mark as Build Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_FASTAPI_URL`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Ports Exposes: `80`
6. Deploy.
