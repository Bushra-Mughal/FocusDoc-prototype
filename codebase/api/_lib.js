// Shared helpers. Files starting with "_" are not exposed as public routes.
const crypto = require("crypto");
const hits = new Map(); // best-effort per-instance rate limiter (serverless instances do not share memory)

function send(res, status, body) {
  res.status(status).json(body);
  return false;
}

function same(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Checks the access code and applies a simple per-IP hourly limit.
// Returns true when the request may continue; otherwise it has already replied.
function guard(req, res, bucket, limit) {
  const code = process.env.ACCESS_CODE;
  if (!code) return send(res, 500, { code: "server_config", error: "ACCESS_CODE is not set on the server." });
  if (!same(req.headers["x-access-code"] || "", code)) return send(res, 401, { code: "bad_code", error: "Wrong or missing access code." });
  const hour = new Date().toISOString().slice(0, 13);
  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const key = `${bucket}:${ip}:${hour}`;
  const n = (hits.get(key) || 0) + 1;
  hits.set(key, n);
  if (hits.size > 5000) for (const k of hits.keys()) if (!k.endsWith(hour)) hits.delete(k);
  if (n > limit) return send(res, 429, { code: "rate_limited", error: "Too many requests." });
  return true;
}

module.exports = { guard, same, send };
