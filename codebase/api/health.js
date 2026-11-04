// Open this in the browser after deploying: /api/health  (shows only yes/no, never secrets)
module.exports = (req, res) => {
  const e = process.env;
  res.status(200).json({
    gemini_key_set: !!e.GEMINI_API_KEY, access_code_set: !!e.ACCESS_CODE,
    blob_storage_configured: !!(e.BLOB_READ_WRITE_TOKEN || (e.VERCEL_OIDC_TOKEN && e.BLOB_STORE_ID)),
    feedback_export_token_set: !!e.FEEDBACK_EXPORT_TOKEN,
    primary_model: e.GEMINI_MODEL || "gemini-3.8-flash",
  });
};
