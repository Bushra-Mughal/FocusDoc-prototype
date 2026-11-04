const assert = require("node:assert/strict");
const test = require("node:test");
const { flattenRecord, toCsv } = require("./_feedback-csv");

test("flattens case fields and serializes arrays and the AI response", () => {
  assert.deepEqual(flattenRecord({
    type: "answer",
    input: { specialty: "Cardiology", findings: ["pain", "fever"] },
    output: { question_restated: "Review" },
  }), {
    type: "answer",
    case_specialty: "Cardiology",
    case_findings: "pain; fever",
    ai_answer_json: '{"question_restated":"Review"}',
  });
});

test("quotes CSV values and neutralizes spreadsheet formulas", () => {
  assert.equal(
    toCsv([{ type: "answer", comment: '=SUM(A1, "quoted")' }]),
    '\uFEFF"type","comment"\r\n"answer","\'=SUM(A1, ""quoted"")"',
  );
});

test("returns a usable header row when there are no records", () => {
  assert.equal(
    toCsv([]),
    '\uFEFF"type","server_ts","ts","tester"',
  );
});
