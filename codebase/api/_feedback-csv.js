function flattenRecord(record) {
  const row = {};
  Object.keys(record).forEach((key) => {
    const value = record[key];
    if (key === "input" && value && typeof value === "object" && !Array.isArray(value)) {
      Object.keys(value).forEach((field) => {
        row[`case_${field}`] = csvValue(value[field]);
      });
    } else if (key === "output") {
      row.ai_answer_json = JSON.stringify(value);
    } else {
      row[key] = csvValue(value);
    }
  });
  return row;
}

function csvValue(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(csvValue).join("; ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function csvCell(value) {
  let text = csvValue(value);
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(records) {
  const rows = records.map(flattenRecord);
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  if (headers.length === 0) headers.push("type", "server_ts", "ts", "tester");
  return "\uFEFF" + [
    headers.map(csvCell).join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\r\n");
}

module.exports = { flattenRecord, toCsv };
