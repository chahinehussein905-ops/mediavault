# MediaVault

Premium private image/video library hosted on Render, using Supabase Auth and Storage.

## 1. Create the Supabase bucket
In Supabase → Storage → New bucket:
- Name: `mediavault-files`
- Public: OFF (private)
- File size limit: 50 MB
- Allowed MIME types: `image/*,video/*`

## 2. Add Storage policies
Open Supabase → SQL Editor and run `supabase-policies.sql`. This limits each signed-in user to their own folder (`<user-id>/...`).

## 3. Configure authentication
Supabase → Authentication → URL Configuration:
- Site URL: your Render URL (after first deploy)
- Add the same URL to Redirect URLs, plus `http://localhost:10000/**` for local testing.

Supabase → Authentication → Providers:
- Enable Google and Apple and enter credentials from their respective developer consoles.
- OAuth providers require provider-issued client/service credentials. Apple sign-in requires an Apple Developer account and configuration. Do not share secret keys publicly.

## 4. Deploy to Render
Create a GitHub repository and upload the *contents* of this folder (not the ZIP itself).
In Render choose New → Web Service → connect the repository.
Render detects `render.yaml`; deploy.
In Render → Environment add:
- `SUPABASE_URL` = Supabase Project URL
- `SUPABASE_ANON_KEY` = Supabase publishable/anon key

These two values are intended for browser use. Never put a Supabase `service_role` key in this app.

## Notes
- Uploads are private and use the signed-in user's folder.
- This starter has working email/password auth and OAuth button flows once providers are configured.
- Google/Apple buttons cannot complete provider sign-in until credentials are configured in Supabase.
- Render free services may sleep when idle. Supabase free storage/limits apply.
