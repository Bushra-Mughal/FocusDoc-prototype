const { guard, send } = require("./_lib");
const { randomUUID } = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  if (!guard(req, res, "feedback", 60)) return;
  const rec = req.body;
  if (!rec || typeof rec !== "object" || Array.isArray(rec) || !["answer", "survey"].includes(rec.type)) return send(res, 400, { code: "bad_input", error: "Invalid feedback." });
  const hasBlobCredentials = process.env.BLOB_READ_WRITE_TOKEN || (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);
  if (!hasBlobCredentials) return send(res, 500, { code: "server_config", error: "Vercel Blob storage is not configured." });
  const payload = JSON.stringify({ ...rec, server_ts: new Date().toISOString() });
  if (payload.length > 200000) return send(res, 413, { code: "too_large", error: "Feedback too large." });

  try {
    const { put } = require("@vercel/blob");
    const pathname = `feedback/records/${rec.type}/${Date.now()}-${randomUUID()}.json`;
    await put(pathname, payload, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
    });
  } catch (e) {
    console.error("Could not save feedback to Vercel Blob:", e);
    return send(res, 502, { code: "storage", error: "Could not save feedback to Vercel Blob storage." });
  }
  return res.status(200).json({ ok: true });
};
