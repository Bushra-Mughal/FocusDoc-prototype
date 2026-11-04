const { list, get } = require("@vercel/blob");
const { same, send } = require("./_lib");
const { toCsv } = require("./_feedback-csv");

async function loadFeedback() {
  const records = [];
  let cursor;
  let hasMore = true;

  do {
    const page = await list({
      access: "private",
      prefix: "feedback/records/",
      limit: 100,
      ...(cursor ? { cursor } : {}),
    });

    for (let i = 0; i < page.blobs.length; i += 20) {
      const batch = page.blobs.slice(i, i + 20);
      const saved = await Promise.all(batch.map(async (blob) => {
        const result = await get(blob.pathname, { access: "private" });
        if (!result || result.statusCode !== 200 || !result.stream) {
          throw new Error(`Could not read feedback record ${blob.pathname}.`);
        }
        return JSON.parse(await new Response(result.stream).text());
      }));
      records.push(...saved);
    }

    cursor = page.cursor;
    hasMore = page.hasMore;
    if (hasMore && !cursor) throw new Error("Vercel Blob indicated more records without a pagination cursor.");
  } while (hasMore && cursor);

  records.sort((a, b) => String(a.server_ts || a.ts || "").localeCompare(String(b.server_ts || b.ts || "")));
  return records;
}

module.exports = async (req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "GET only" });
  const exportToken = process.env.FEEDBACK_EXPORT_TOKEN;
  if (!exportToken) return send(res, 500, { code: "server_config", error: "FEEDBACK_EXPORT_TOKEN is not set." });
  if (!same(req.headers["x-feedback-export-token"] || "", exportToken)) {
    return send(res, 401, { code: "unauthorized", error: "Invalid export token." });
  }

  const hasBlobCredentials = process.env.BLOB_READ_WRITE_TOKEN || (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);
  if (!hasBlobCredentials) return send(res, 500, { code: "server_config", error: "Vercel Blob storage is not configured." });

  try {
    const csv = toCsv(await loadFeedback());
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="focusdoc-feedback-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(200).send(csv);
  } catch (e) {
    console.error("Could not export feedback from Vercel Blob:", e);
    return send(res, 502, { code: "storage", error: "Could not export feedback from Vercel Blob storage." });
  }
};

module.exports.loadFeedback = loadFeedback;
