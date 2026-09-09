# Google Docs export — one-time setup (≈10 minutes)

The Factory's "Export to Google Docs" button creates the three-tab creator brief (Creator Brief · Script · Strategy) directly in the Google Drive of whoever clicks it. Google requires every app that does this to have an **OAuth Client ID**. Creating one is a one-time job for someone with access to the Viasox Google Workspace. No code, no billing, no Google review — the app only asks for permission to create its own files (`drive.file`), which is a non-sensitive scope.

Do these steps signed in with your **@viasox.com** Google account.

1. Open <https://console.cloud.google.com/> and accept the terms if asked.
2. **Create a project:** click the project picker at the top (next to the Google Cloud logo) → **New project** → Name: `Viasox Factory` → Location: the `viasox.com` organization → **Create**. Wait for the notification, then make sure this project is selected in the picker.
3. **Enable the Google Docs API:** left menu → **APIs & Services → Library** → search `Google Docs API` → open it → **Enable**.
4. **Enable the Google Drive API:** back in **Library** → search `Google Drive API` → open it → **Enable**.
5. **Consent screen:** left menu → **APIs & Services → OAuth consent screen** (newer consoles call this page **Google Auth Platform**; if it shows a **Get started** button, click it).
   - App name: `Viasox Factory` · User support email: your address.
   - **Audience / User type: Internal.** This limits sign-in to viasox.com accounts and means Google never needs to verify the app.
   - Developer contact email: your address → **Save / Create**. Leave every other page (Data access, scopes, branding) at its defaults.
6. **Create the client:** left menu → **APIs & Services → Credentials** → **+ Create credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Viasox Factory (browser)`.
   - **Authorized JavaScript origins → + Add URI**, twice, exactly as written:
     - `https://kiavashmoh-dev.github.io`
     - `http://localhost:5173`
   - Leave **Authorized redirect URIs** empty (the app uses Google's popup token flow, which needs none).
   - Click **Create**.
7. A dialog shows **Your Client ID** — a long string ending in `.apps.googleusercontent.com`. Click the copy icon. (No client secret is needed; if one is shown, ignore it — never paste it anywhere.)
8. **Paste it into the app once:** open The Factory → a UGC brief → **Export to Google Docs**. The dialog asks for the Client ID the first time; paste it and save. The app remembers it in this browser (localStorage key `viasox_google_client_id`), so each person only pastes it once per browser — share the Client ID with the team by message; it is not secret.
9. Click **Export**. A Google popup asks you to pick your viasox.com account and allow "See, edit, create and delete only the specific Google Drive files that you use with this app" → **Allow**. The document opens in a new tab; it lives in **My Drive** of the person who exported. Later exports in the same session skip the popup.

## If something goes wrong

| What you see | Fix |
|---|---|
| "The Google sign-in popup was blocked" | Click the popup-blocked icon in the address bar → *Always allow popups* for this site → Export again. |
| Popup shows **Error 400: origin_mismatch** / **redirect_uri_mismatch** | Step 6: the site's origin is missing or mistyped. Edit the client → add the exact origin (no trailing slash, no path). Changes take a few minutes. |
| Popup shows **Error 403: org_internal** or "not available to this account" | You are signed in with a non-viasox.com Google account. Pick the viasox.com account in the popup. |
| "Google Docs API has not been used in project … or it is disabled" | Step 3 was skipped, or the client was created in a different project. Enable the API in the same project as the Client ID. |
| "Your Google Workspace admin policy blocks this app" | Ask the Workspace admin: Admin console → Security → API controls → App access control → allow `Viasox Factory` (the Client ID from step 7). |
| "Missing Google OAuth Client ID" | Step 8: the Client ID was never pasted in this browser. |
