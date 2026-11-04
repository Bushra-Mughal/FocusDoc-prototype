# FocusDoc: Vercel + Gemini + private feedback storage

Doctors open one link, enter an access code, and use the app. Feedback is saved as individual JSON records in your private Vercel Blob store and can be downloaded as a CSV for Excel.

## Step 1: Gemini API key
1. Create an API key in Google AI Studio.
2. The app uses `gemini-3.8-flash` first and falls back to other free Flash models if one is at its limit.
3. On the free tier, Google may use inputs to improve its products. Use synthetic cases only; do not enter patient identifiers.

## Step 2: Private feedback storage
1. In your Vercel project, open **Storage** and create a **private Blob** store.
2. Connect the store to the project and enable the environments you use (Production, Preview, and Development as needed). Vercel supplies the Blob credentials to the app.
3. Feedback records are stored privately under `feedback/records/`. They are not exposed through public Blob URLs.
4. Create a long, random `FEEDBACK_EXPORT_TOKEN`. This protects the CSV download endpoint; do not share it with testers.

## Step 3: Deploy on Vercel
1. Import this folder as a Vercel project. Framework: **Other**.
2. Configure these environment variables:

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | Your Google AI Studio key |
| `ACCESS_CODE` | Code you give only to testers |
| `FEEDBACK_EXPORT_TOKEN` | Private token for downloading the feedback CSV |
| `GEMINI_MODEL` | Optional model override |
| `RATE_LIMIT_PER_HOUR` | Optional; defaults to 30 answers per person per hour |

3. Redeploy after changing environment variables.
4. Open `/api/health` and confirm `gemini_key_set`, `access_code_set`, `blob_storage_configured`, and `feedback_export_token_set` are all `true`.

## Step 4: Download feedback
After submitting feedback, download all stored records as an Excel-compatible CSV:

```powershell
curl.exe -H "x-feedback-export-token: YOUR_EXPORT_TOKEN" `
  -o focusdoc-feedback.csv `
  https://YOUR-SITE.vercel.app/api/feedback-export
```

Keep the export token private. The export endpoint returns `401` without the correct token. The CSV includes both answer ratings and survey responses; nested case fields are expanded into columns and the AI answer is kept as JSON in one cell.

## Local development
Use the Vercel CLI to run the API routes locally. Link the project and pull its development environment variables, including the private Blob credentials, then run:

```powershell
npm install
npx vercel dev
```

Run the CSV formatting tests with:

```powershell
npm test
```

## Limits and privacy
- Answers take 15 to 40 seconds. The analysis function allows 60 seconds.
- Free-tier request limits are per Google Cloud project.
- The per-person rate limit is best effort; the access code is the main protection.
- Vercel Blob pricing and Vercel's plan terms can change; check them before sharing the app broadly.
- The app is a prototype, not a clinical tool. Avoid patient names, identifiers, and sensitive case details.
