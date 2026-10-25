(function (root) {
  "use strict";
  const TYPES = ["single_choice", "multiple_choice", "short_text"];
  const normalize = (value) => String(value ?? "").normalize("NFC").replace(/\s+/gu, " ").trim().toLocaleLowerCase("vi");
  const optionKey = (options = []) => JSON.stringify(options.map(normalize).sort());
  const signature = (q) => JSON.stringify([normalize(q.question), q.type, optionKey(q.options)]);
  const sameState = (a, b) => Array.isArray(a) && Array.isArray(b)
    ? JSON.stringify([...a].sort()) === JSON.stringify([...b].sort()) : a === b;
  const isEmpty = (value) => Array.isArray(value) ? value.length === 0 : !String(value ?? "").trim();

  function fail(message) { throw new Error(message); }
  function text(value, label, max = 20000) {
    if (typeof value !== "string" || !value.trim() || value.length > max) fail(`${label}: cần chuỗi không trống, tối đa ${max} ký tự.`);
    return value.trim();
  }
  function validateBank(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("Bộ đáp án phải là một đối tượng JSON.");
    if (raw.schemaVersion !== 1) fail("schemaVersion phải bằng 1.");
    const name = text(raw.name, "name", 200);
    if (!Array.isArray(raw.answers) || !raw.answers.length || raw.answers.length > 500) fail("answers phải chứa từ 1 đến 500 câu.");
    const ids = new Set();
    const answers = raw.answers.map((item, index) => {
      const label = `Câu ${index + 1}`;
      if (!item || typeof item !== "object") fail(`${label}: bản ghi không hợp lệ.`);
      const questionId = text(item.questionId, `${label}.questionId`, 300);
      if (ids.has(questionId)) fail(`${label}: questionId bị trùng (${questionId}).`);
      ids.add(questionId);
      const question = text(item.question, `${label}.question`);
      if (!TYPES.includes(item.type)) fail(`${label}: type chưa được hỗ trợ.`);
      const record = { questionId, question, type: item.type };
      if (item.platformQuestionId != null) record.platformQuestionId = text(item.platformQuestionId, `${label}.platformQuestionId`, 300);
      if (item.type === "short_text") {
        text(item.answer, `${label}.answer`);
        record.answer = item.answer;
      } else {
        if (!Array.isArray(item.options) || item.options.length < 2 || item.options.length > 200) fail(`${label}: options cần từ 2 đến 200 lựa chọn.`);
        record.options = item.options.map((value) => text(value, `${label}.options`, 10000));
        const keys = record.options.map(normalize);
        if (new Set(keys).size !== keys.length) fail(`${label}: nội dung lựa chọn bị trùng hoặc mơ hồ.`);
        if (!Array.isArray(item.answer) || !item.answer.length || (item.type === "single_choice" && item.answer.length !== 1)) fail(`${label}: điền answer hợp lệ (mảng đáp án; một phần tử cho single_choice).`);
        const desired = item.answer.map((value) => normalize(text(value, `${label}.answer`, 10000)));
        if (new Set(desired).size !== desired.length || desired.some((key) => !keys.includes(key))) fail(`${label}: đáp án trùng hoặc không nằm trong options.`);
        record.answer = desired.map((key) => record.options[keys.indexOf(key)]);
      }
      return record;
    });
    const bank = { schemaVersion: 1, name, answers };
    if (raw.matching != null) {
      if (raw.matching !== "document_ocr") fail("matching không được hỗ trợ.");
      bank.matching = raw.matching;
    }
    for (let i = 0; i < answers.length; i++) {
      for (const key of ["sourceNumber", "sourcePage"]) {
        if (raw.answers[i][key] != null) {
          if (!Number.isInteger(raw.answers[i][key]) || raw.answers[i][key] < 1 || raw.answers[i][key] > 1000) fail(`${key} không hợp lệ.`);
          answers[i][key] = raw.answers[i][key];
        }
      }
    }
    if (raw.formKey != null) bank.formKey = text(raw.formKey, "formKey", 500);
    if (raw.sourceForm != null) {
      if (typeof raw.sourceForm !== "object" || raw.sourceForm.platform !== "microsoft_forms") fail("sourceForm.platform phải là microsoft_forms.");
      bank.sourceForm = { platform: "microsoft_forms", formId: text(raw.sourceForm.formId, "sourceForm.formId", 1000) };
    }
    return bank;
  }

  function desiredAnswer(q, answer, allowEmpty = false) {
    if (!TYPES.includes(q.type) || !q.supported) fail("Loại câu hỏi chưa được hỗ trợ.");
    if (q.type === "short_text") {
      if (typeof answer !== "string" || answer.length > 20000 || (!allowEmpty && !answer.trim())) fail("Chưa có đáp án văn bản.");
      return answer;
    }
    if (!Array.isArray(answer) || (!allowEmpty && !answer.length) || (q.type === "single_choice" && answer.length > 1)) fail("Chọn đáp án hợp lệ.");
    const keys = q.options.map(normalize);
    if (keys.some((key) => !key) || new Set(keys).size !== keys.length) fail("Các lựa chọn bị trùng hoặc không có nhãn.");
    const selected = answer.map(normalize);
    if (new Set(selected).size !== selected.length || selected.some((key) => !keys.includes(key))) fail("Đáp án không nằm trong lựa chọn hiện tại.");
    return selected.map((key) => q.options[keys.indexOf(key)]);
  }

  function matchQuestions(scan, bank) {
    const questions = scan.questions;
    const wrongForm = Boolean(bank?.sourceForm && bank.sourceForm.formId !== scan.formId);
    const indexed = bank ? bank.answers.map((item) => ({ item, signature: signature(item) })) : [];
    const counts = new Map();
    questions.forEach((q) => { const key=signature(q);counts.set(key,(counts.get(key)||0)+1); });
    return questions.map((q) => {
      if (!q.supported) return { id: q.id, status: "unsupported", reason: q.reason, answer: null };
      if (wrongForm) return { id: q.id, status: "missing", reason: "Bộ đáp án thuộc form khác. Hãy nhập đúng bộ đáp án.", answer: null };
      if (!bank) return { id: q.id, status: "missing", reason: "Nhập đáp án trực tiếp hoặc nạp bộ JSON.", answer: null };
      const key=signature(q);
      let candidates = indexed.filter((entry) => entry.signature === key).map((entry) => entry.item);
      if (!candidates.length && bank.matching === "document_ocr") return matchDocument(q, questions, bank);
      const byId = candidates.filter((item) => item.platformQuestionId && item.platformQuestionId === q.platformQuestionId);
      if (byId.length === 1) candidates = byId;
      if (candidates.length > 1 || (candidates.length === 1 && counts.get(key) > 1 && byId.length !== 1)) return { id: q.id, status: "ambiguous", reason: "Câu hỏi hoặc bản ghi trùng nội dung. Hãy chọn đáp án thủ công.", answer: null };
      if (!candidates.length) return { id: q.id, status: "missing", reason: "Chưa tìm thấy câu khớp chính xác trong bộ đáp án.", answer: null };
      const source = candidates[0];
      return { id: q.id, status: "matched", reason: `Nguồn: ${bank.name}${source.sourceNumber ? ` · Câu PDF ${source.sourceNumber}, trang ${source.sourcePage}` : ""}`, answer: desiredAnswer(q, source.answer) };
    });
  }

  // PDF screenshots can differ in accents, spacing and punctuation after OCR.
  // Numbers, comparisons and negation remain hard constraints; ordinal is never a key.
  const documentKeyCache = new Map(), anchorCache = new Map();
  function documentKey(value) {
    const raw=String(value ?? "");
    if (documentKeyCache.has(raw)) return documentKeyCache.get(raw);
    const result=normalize(raw)
      .replace(/≥/gu, ">=").replace(/≤/gu, "<=").replace(/[−–—]/gu, "-")
      .normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gu, "d")
      .replace(/[\p{L}\p{N}]+/gu, (part) => part.replace(/([a-z])(\d)/gu, "$1 $2").replace(/(\d)([a-z])/gu, "$1 $2"))
      .replace(/[^a-z0-9<>=+%]+/gu, " ").replace(/\s+/gu, " ").trim();
    if (documentKeyCache.size>10000) documentKeyCache.clear();
    documentKeyCache.set(raw,result);return result;
  }
  function anchors(value) {
    const raw=String(value ?? "");
    if (anchorCache.has(raw)) return anchorCache.get(raw);
    const text = normalize(value).replace(/≥/gu, ">=").replace(/≤/gu, "<=");
    const numbers = (text.match(/\d+(?:[.,]\d+)*/gu) || []).map((s) => s.replace(/,/gu, "."));
    const operators = (text.match(/(?:>=|<=|>|<|=|\+|(?<=\d)\s*[-/]\s*(?=\d))/gu) || []).map((s) => s.replace(/\s+/gu, ""));
    const words = documentKey(text).split(" ");
    const negative = words.filter((s) => ["khong", "chua", "tru", "ngoai", "duoi", "tren", "nhat", "toi", "thieu", "da", "it", "nhieu", "chi"].includes(s));
    const result=JSON.stringify([numbers, operators, negative]);
    if (anchorCache.size>10000) anchorCache.clear();
    anchorCache.set(raw,result);return result;
  }
  function similarity(a, b, threshold = 0.96) {
    const aa = documentKey(a), bb = documentKey(b);
    if (anchors(a) !== anchors(b)) return 0;
    if (aa === bb) return 1;
    const max = Math.max(aa.length, bb.length), limit = Math.floor(max * (1 - threshold) + 1e-8);
    if (Math.min(aa.length, bb.length) < 24 || Math.abs(aa.length - bb.length) > limit) return 0;
    let previous = Array.from({ length: bb.length + 1 }, (_, i) => i);
    for (let i = 1; i <= aa.length; i++) {
      const row = new Array(bb.length + 1).fill(limit + 1); row[0] = i;
      let minimum = limit + 1;
      for (let j = Math.max(1, i - limit); j <= Math.min(bb.length, i + limit); j++) {
        row[j] = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + (aa[i - 1] === bb[j - 1] ? 0 : 1));
        minimum = Math.min(minimum, row[j]);
      }
      if (minimum > limit) return 0;
      previous = row;
    }
    return previous[bb.length] <= limit ? 1 - previous[bb.length] / max : 0;
  }
  function matchDocument(q, questions, bank) {
    const missing = (reason) => ({ id: q.id, status: "missing", reason, answer: null });
    if (questions.filter((other) => other.type === q.type && documentKey(other.question) === documentKey(q.question)).length > 1) return { id: q.id, status: "ambiguous", reason: "Có nhiều câu cùng nội dung; hãy chọn thủ công.", answer: null };
    const candidates = [];
    for (const source of bank.answers) {
      if (source.type !== q.type) continue;
      const score = similarity(source.question, q.question);
      if (score < 0.96) continue;
      if (q.type === "short_text") continue; // OCR fallback is limited to choices.
      if (source.options.length !== q.options.length) continue;
      const mappings = source.options.map((option) => {
        const matches = q.options.map((value, index) => ({ index, score: similarity(option, value) })).filter((item) => item.score >= 0.96).sort((a, b) => b.score - a.score);
        return matches.length && (matches.length === 1 || matches[0].score - matches[1].score >= 0.03) ? matches[0].index : -1;
      });
      const supporting = mappings.filter((i) => i >= 0);
      if (new Set(supporting).size !== supporting.length || supporting.length < Math.max(2, source.options.length - 1)) continue;
      const answerIndices = source.answer.map((answer) => mappings[source.options.indexOf(answer)]);
      if (answerIndices.some((i) => i == null || i < 0)) continue;
      candidates.push({ source, score, answer: answerIndices.map((i) => q.options[i]) });
    }
    candidates.sort((a, b) => b.score - a.score);
    if (!candidates.length) return missing("Chưa đủ dữ liệu để ghép chắc chắn với đáp án PDF; có thể chọn thủ công.");
    if (candidates.length > 1 && candidates[0].score - candidates[1].score < 0.03) return { id: q.id, status: "ambiguous", reason: "Nhiều câu PDF gần giống nhau; cần duyệt thủ công.", answer: null };
    const chosen = candidates[0];
    return { id: q.id, status: "matched", reason: `Nguồn: ${bank.name} · Câu PDF ${chosen.source.sourceNumber}, trang ${chosen.source.sourcePage} · Đối chiếu nội dung`, answer: desiredAnswer(q, chosen.answer) };
  }

  function makeTemplate(scan) {
    const bank = {
      schemaVersion: 1,
      name: scan.title || "Bộ đáp án Microsoft Forms",
      _instructions: "Điền answer cho từng câu, xóa câu chưa có đáp án. Không dùng nhãn A/B/C/D thay cho nội dung lựa chọn.",
      answers: scan.questions.filter((q) => q.supported).map((q, i) => ({
        questionId: `q${i + 1}`,
        ...(q.platformQuestionId ? { platformQuestionId: q.platformQuestionId } : {}),
        question: q.question, type: q.type,
        ...(q.type !== "short_text" ? { options: q.options } : {}),
        answer: q.type === "short_text" ? "" : []
      }))
    };
    if (scan.formId) bank.sourceForm = { platform: "microsoft_forms", formId: scan.formId };
    return bank;
  }
  const api = { TYPES, normalize, signature, optionKey, sameState, isEmpty, validateBank, desiredAnswer, matchQuestions, makeTemplate, documentKey, similarity };
  root.AutoFillCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
