(function (root) {
  "use strict";
  const C = root.AutoFillCore || require("./core.js");
  const active = phase => ["running", "navigating"].includes(phase);
  function context(value) {
    let url;
    try { url = new URL(value); } catch { throw new Error("Chưa có quyền đọc tab hoặc tab không phải lượt làm quiz LMS HUST. Mở tab LMS rồi bấm biểu tượng extension."); }
    const attempt = url.searchParams.get("attempt");
    if (url.protocol !== "https:" || url.hostname !== "lms.hust.edu.vn" || url.pathname !== "/mod/quiz/attempt.php" || !/^\d+$/u.test(attempt || "")) throw new Error("Tự chạy chỉ áp dụng cho lượt làm quiz LMS HUST (attempt.php có ID lượt làm).");
    return { attempt, url };
  }
  function plan(scan, bank, { answers = [], overwrite = false, acknowledged = [] } = {}) {
    if (scan.platform !== "moodle") throw new Error("Chế độ tự chạy chỉ dành cho LMS HUST.");
    if (!Array.isArray(answers) || answers.length > 500) throw new Error("Danh sách đáp án bổ sung không hợp lệ.");
    const manual = new Map(), actions = [], blockers = [];
    for (const entry of answers) {
      const q = scan.questions.find(q => q.id === entry.id && q.signature === entry.signature);
      if (!q || manual.has(q.id)) throw new Error("Câu bổ sung đã thay đổi hoặc bị trùng. Quét lại câu hỏi trước khi tiếp tục.");
      manual.set(q.id, C.desiredAnswer(q, entry.answer));
    }
    const matches = C.matchQuestions(scan, bank);
    for (let i = 0; i < scan.questions.length; i++) {
      const q = scan.questions[i], match = matches[i];
      if (!q.supported) {
        if (!acknowledged.includes(q.id)) blockers.push({ id: q.id, supported: false, reason: q.reason });
        continue;
      }
      let currentValid = false;
      try { C.desiredAnswer(q, q.current); currentValid = true; } catch { /* Unanswered. */ }
      if (currentValid && !overwrite && !manual.has(q.id)) continue;
      const desired = manual.get(q.id) ?? (match.status === "matched" ? match.answer : null);
      if (desired == null) {
        if (!currentValid) blockers.push({ id: q.id, supported: true, reason: match.reason });
        continue;
      }
      if (!C.sameState(q.current, desired)) actions.push({ id: q.id, signature: q.signature, answer: desired, overwrite: currentValid && (overwrite || manual.has(q.id)) });
    }
    return { actions, blockers };
  }
  const api = { active, context, plan };
  root.AutoFillLmsFlow = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
