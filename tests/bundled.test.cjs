const { test } = require("node:test");
const assert = require("node:assert/strict");
const raw = require("../extension/data/quy-che-2026.1.json");
const C = require("../extension/core.js");
const audit = require("../data/answer-source-audit.json");
const bank = C.validateBank(raw);
const copy = (value) => JSON.parse(JSON.stringify(value));
const sourceAnswer = (stableNumber) => bank.answers.find((a) => a.questionId === `quy-che-${String(stableNumber).padStart(3,"0")}`);
const question = (number) => ({ ...copy(sourceAnswer(number)), id: `dom-${number}`, supported: true, current: [] });
const scan = (questions) => ({ formId: bank.sourceForm.formId, questions });

test("bundled bank contains all 200 unique source questions and valid selected options", () => {
  assert.equal(bank.answers.length, 200);
  assert.deepEqual(bank.answers.map((a) => a.sourceNumber), Array.from({ length: 200 }, (_, i) => i + 1));
  assert.ok(bank.answers.every((a) => a.options.length === 4 && a.options.includes(a.answer[0]) && a.sourcePage >= 1 && a.sourcePage <= audit.pages));
  assert.equal(audit.pages,89);
  assert.equal(bank.matching, "document_ocr");
  assert.equal(bank.sourceForm.formId, "n7jxBugHT0a0COwbRXA_MYHyGUaEfhNNu2j97QvQaYlUOUxLS1VGWEJOVURPM0pUWTRJWks3S0pBRy4u");
});
test("reviewed decimal, inequality and course-load answers preserve source pixels", () => {
  for (const [number, answer] of [[1,"8,0 đến cận 9,0"],[7,"1,5 TCHP"],[28,"3(3-0-0-6)"],[38,"CPA ≥ 3,2"],[56,"GPA ≥ 2,5 và ĐRL ≥ 65"],[79,"GPA ≥ 3,6 và ĐRL ≥ 90"],[94,"4(2-4-0-8)"],[103,"80%"],[124,"CPA ≥ 2,00"],[164,"ĐRL ≥ 70 điểm"],[197,"5 đợt"],[200,"CPA ≥ 2,5 (từ loại khá trở lên) và không bị cảnh báo học tập"]]) {
    assert.equal(sourceAnswer(number).answer[0], answer, `Stable question ID ${number}`);
  }
});
test("new PDF selection replaces the previous summer-course fee answer", () => {
  const current=sourceAnswer(134);
  assert.equal(current.sourceNumber,73);
  assert.equal(current.sourcePage,33);
  assert.deepEqual(current.answer,["Bằng 1,5 lần mức học phí kỳ chính"]);
  const result=C.matchQuestions(scan([question(134)]),bank)[0];
  assert.equal(result.status,"matched");
  assert.deepEqual(result.answer,["Bằng 1,5 lần mức học phí kỳ chính"]);
  assert.ok(audit.answerChanges.some((change)=>change.questionId==="quy-che-134"&&change.before[0]==="Bằng 1,0 lần mức học phí kỳ chính"));
});
test("200 questions still match after question/option shuffle and presentation punctuation changes", () => {
  const questions = bank.answers.map((item, index) => ({ ...copy(item), id: `random-${200-index}`, question: item.question + " *", options: [...item.options.slice(2), ...item.options.slice(0,2)], current: [], supported: true })).reverse();
  const result = C.matchQuestions(scan(questions), bank);
  assert.equal(result.filter((r) => r.status === "matched").length, 200);
  for (let i=0;i<questions.length;i++) assert.deepEqual(result[i].answer, questions[i].answer);
});
test("OCR matching tolerates accent/spacing presentation but returns actual form labels", () => {
  const q = question(17);
  q.question += " *";
  q.options = q.options.map((s) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gu,"d").toUpperCase().replace(/ /gu,"  "));
  const result = C.matchQuestions(scan([q]), bank)[0];
  assert.equal(result.status,"matched");
  assert.deepEqual(result.answer, ["BAC  3"]);
});
test("numeric prefixes, decimal values, operators and negation are not discarded", () => {
  for (const [a,b] of [["3,20","4,20"],["8,0 đến cận 9,0","7,0 đến cận 8,0"],["CPA ≥ 2,5","CPA > 2,5"],["3(3-0-0-6)","3(3/0/0/6)"],["không được phép", "được phép"]]) assert.equal(C.similarity(a,b),0);
});
test("a changed number or comparison cannot inherit the PDF answer", () => {
  const q = question(17); q.question = q.question.replace("B1", "B2");
  assert.notEqual(C.matchQuestions(scan([q]),bank)[0].status,"matched");
  const comparative=question(124); comparative.options=comparative.options.map((s)=>s.replace(/≥/gu,">"));
  assert.notEqual(C.matchQuestions(scan([comparative]),bank)[0].status,"matched");
});
test("a changed negative/comparative qualifier requires manual review", () => {
  const q=question(101);q.question=q.question.replace("dưới 5,0","trên 5,0");
  assert.notEqual(C.matchQuestions(scan([q]),bank)[0].status,"matched");
});
test("bundled answers do not match an unrelated form or guess identity fields", () => {
  assert.equal(C.matchQuestions({formId:"unrelated",questions:[question(1)]},bank)[0].status,"missing");
  const identity={id:"name",question:"Họ và tên",type:"short_text",options:[],supported:true,current:""};
  assert.equal(C.matchQuestions(scan([identity]),bank)[0].status,"missing");
});
