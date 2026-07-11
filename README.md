<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/40107566-f90e-4132-b72e-c61488c0f29a

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and fill in:
   - `GEMINI_API_KEY` — your Gemini API key
   - `CLOUDINARY_*` — from Cloudinary dashboard (used server-side for image uploads)
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from Supabase Project Settings > API
3. Run the Supabase schema once against your project (Supabase Dashboard > SQL Editor):
   [supabase/schema.sql](supabase/schema.sql)
4. Run the app:
   `npm run dev`
