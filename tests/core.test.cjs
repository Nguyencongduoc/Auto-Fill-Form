const { test } = require("node:test");
const assert = require("node:assert/strict");
const C = require("../extension/core.js");
const demo = require("../examples/demo-answers.json");
const clone = (value) => JSON.parse(JSON.stringify(value));
function question(item, extra = {}) { return { id: item.questionId, supported: true, current: item.type === "short_text" ? "" : [], ...item, ...extra }; }
function scan(questions) { return { formId: "local-demo", questions }; }

test("validates demo and maps reordered options by content", () => {
  const bank = C.validateBank(demo);
  const questions = bank.answers.map((item) => question(item, { options: item.options ? [...item.options].reverse() : [] }));
  assert.deepEqual(C.matchQuestions(scan(questions), bank).map((r) => r.status), ["matched", "matched", "matched"]);
  assert.deepEqual(C.matchQuestions(scan(questions), bank)[0].answer, ["Hà Nội"]);
});
test("normalizes Unicode NFC and whitespace, retains Vietnamese and mathematical distinctions", () => {
  assert.equal(C.normalize("  HÀ   NỘI ".normalize("NFD")), C.normalize("Hà Nội"));
  assert.notEqual(C.normalize("có"), C.normalize("co"));
  assert.notEqual(C.normalize("2 + 2"), C.normalize("2 - 2"));
  assert.notEqual(C.normalize("Chọn số nguyên tố"), C.normalize("Chọn số không nguyên tố"));
});
test("rejects malformed, empty, duplicate and out-of-options answers", () => {
  const cases = [null, [], { schemaVersion: 2 }, { ...clone(demo), answers: [] }];
  const duplicate = clone(demo); duplicate.answers[1].questionId = "q1"; cases.push(duplicate);
  const invalid = clone(demo); invalid.answers[0].answer = ["A"]; cases.push(invalid);
  const ambiguous = clone(demo); ambiguous.answers[0].options.push("HÀ NỘI"); cases.push(ambiguous);
  const repeated = clone(demo); repeated.answers[1].answer = ["2", "2"]; cases.push(repeated);
  const empty = clone(demo); empty.answers[2].answer = ""; cases.push(empty);
  cases.forEach((value) => assert.throws(() => C.validateBank(value)));
});
test("skips answer banks linked to a different form", () => {
  const bank = C.validateBank(demo);
  const matches = C.matchQuestions({ formId: "other", questions: bank.answers.map((q) => question(q)) }, bank);
  assert.ok(matches.every((m) => m.status === "missing" && m.answer === null));
});
test("duplicate questions require unambiguous platform ID mapping", () => {
  const bank = C.validateBank(demo), q = question(bank.answers[0]);
  const duplicateScan = scan([q, { ...q, id: "other", platformQuestionId: "ms2" }]);
  assert.equal(C.matchQuestions(duplicateScan, bank)[0].status, "ambiguous");
  bank.answers[0].platformQuestionId = "ms1";
  q.platformQuestionId = "ms1";
  assert.equal(C.matchQuestions(duplicateScan, bank)[0].status, "matched");
  assert.equal(C.matchQuestions(duplicateScan, bank)[1].status, "ambiguous");
});
test("duplicate bank entries do not silently choose the first answer", () => {
  const bank = C.validateBank(demo);
  bank.answers.push({ ...bank.answers[0], questionId: "q4", answer: ["Đà Nẵng"] });
  assert.equal(C.matchQuestions(scan([question(bank.answers[0])]), bank)[0].status, "ambiguous");
});
test("unknown question types are always unsupported", () => {
  assert.equal(C.matchQuestions(scan([{ id: "q", supported: false, reason: "Dropdown" }]), null)[0].status, "unsupported");
});
test("template is linked to form, contains empty placeholders and stable platform IDs", () => {
  const value = { title: "Demo", formId: "abc", questions: [question(demo.answers[0], { platformQuestionId: "QuestionId_a" }), question(demo.answers[2])] };
  const template = C.makeTemplate(value);
  assert.equal(template.sourceForm.formId, "abc");
  assert.equal(template.answers[0].platformQuestionId, "QuestionId_a");
  assert.deepEqual(template.answers[0].answer, []);
  assert.equal(template.answers[1].answer, "");
  assert.throws(() => C.validateBank(template));
});
test("answer validation rejects unsupported, duplicate or unexpected values", () => {
  const q = question(demo.answers[1]);
  assert.throws(() => C.desiredAnswer(q, ["5"]));
  assert.throws(() => C.desiredAnswer(q, ["2", "2"]));
  assert.throws(() => C.desiredAnswer(q, []));
  assert.deepEqual(C.desiredAnswer(q, [], true), []);
  assert.throws(() => C.desiredAnswer({ ...q, supported: false }, ["2"]));
});
test("state comparison ignores choice order but preserves text edits", () => {
  assert.ok(C.sameState(["2", "3"], ["3", "2"]));
  assert.ok(!C.sameState("Hello", "hello"));
  assert.ok(C.isEmpty([]));
  assert.ok(!C.isEmpty(["0"]));
});
