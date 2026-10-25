(function () {
  "use strict";
  if (globalThis.AutoFillContent?.version === "0.3.0") return;
  const C = globalThis.AutoFillCore, A = globalThis.AutoFillAdapter;
  const documentToken = crypto.randomUUID();
  let lastScan = null, undo = null, busy = false;
  function scan() {
    const page = A.inspect();
    // Multiple open panels may request the same snapshot at nearly the same time.
    // Reuse its token only while both structure and field values remain unchanged.
    const unchanged = lastScan && lastScan.fingerprint === page.fingerprint
      && lastScan.questions.length === page.questions.length
      && page.questions.every((q, i) => C.sameState(q.current, lastScan.questions[i].current));
    lastScan = { ...page, scanToken: unchanged ? lastScan.scanToken : crypto.randomUUID() };
    return { title: page.title, formId: page.formId, url: page.url, questions: page.questions, fingerprint: page.fingerprint, documentToken, scanToken: lastScan.scanToken, undoAvailable: Boolean(undo?.entries.length), demo: page.demo };
  }
  function verifyDocument(payload) {
    if (payload.documentToken !== documentToken) throw new Error("Trang đã tải lại. Hãy quét form mới.");
  }
  async function fill(payload) {
    verifyDocument(payload);
    if (!lastScan || payload.scanToken !== lastScan.scanToken) throw new Error("Bản xem trước đã cũ. Hãy quét lại form.");
    if (!Array.isArray(payload.actions) || !payload.actions.length || payload.actions.length > 500) throw new Error("Chưa chọn câu có đáp án.");
    if (new Set(payload.actions.map((action) => action.id)).size !== payload.actions.length) throw new Error("Tác vụ chứa câu hỏi trùng.");
    const initial = A.inspect();
    if (initial.fingerprint !== lastScan.fingerprint) throw new Error("Cấu trúc form đã thay đổi. Hãy quét lại trước khi điền.");
    for (const action of payload.actions) {
      const ref = initial.refs.find((item) => item.data.id === action.id);
      if (!ref || action.signature !== ref.data.signature) throw new Error("Ánh xạ câu hỏi không hợp lệ. Hãy quét lại.");
      C.desiredAnswer(ref.data, action.answer);
    }
    const previousScan = lastScan;
    // Consume the plan once so a stale panel or a double click cannot replay it.
    lastScan = null;
    undo = { documentToken, entries: [] };
    const results = [];
    let changed = false;
    for (const action of payload.actions) {
      let now;
      try { now = A.inspect(); } catch { changed = true; }
      if (changed || now?.fingerprint !== previousScan.fingerprint) {
        changed = true;
        results.push({ id: action.id, status: "skipped", message: "Form đổi cấu trúc; quét lại để tiếp tục." }); continue;
      }
      const ref = now.refs.find((item) => item.data.id === action.id);
      const original = previousScan.questions.find((q) => q.id === action.id);
      if (!ref || !original || !ref.data.supported || action.signature !== ref.data.signature) {
        changed = true; results.push({ id: action.id, status: "skipped", message: "Ánh xạ câu hỏi đã thay đổi; quét lại để tiếp tục." }); continue;
      }
      const before = A.valueOf(ref);
      if (!C.sameState(before, original.current)) { results.push({ id: action.id, status: "skipped", message: "Câu đã được sửa sau khi quét; giữ nguyên." }); continue; }
      if (!C.isEmpty(before) && !action.overwrite) { results.push({ id: action.id, status: "skipped", message: "Câu đã có đáp án; chưa bật ghi đè." }); continue; }
      let entry;
      try {
        const answer = C.desiredAnswer(ref.data, action.answer);
        if (C.sameState(before, answer)) { results.push({ id: action.id, status: "skipped", message: "Câu đã có đúng giá trị này." }); continue; }
        entry = { id: ref.data.id, platformQuestionId: ref.data.platformQuestionId, signature: ref.data.signature, before, after: before };
        undo.entries.push(entry);
        await A.setValue(ref, answer);
        entry.after = A.valueOf(ref);
        results.push({ id: action.id, status: "filled", message: "Đã điền và kiểm tra lại." });
      } catch (error) {
        if (entry) entry.after = A.valueOf(ref);
        results.push({ id: action.id, status: "failed", message: error.message });
      }
    }
    undo.entries = undo.entries.filter((entry) => !C.sameState(entry.before, entry.after));
    return { results, undoAvailable: undo.entries.length > 0 };
  }
  async function undoFill(payload) {
    verifyDocument(payload);
    if (!undo?.entries.length) throw new Error("Không có lần điền để hoàn tác trong trang này.");
    const results = [], remaining = [];
    for (const entry of [...undo.entries].reverse()) {
      try {
        const now = A.inspect();
        const refs = now.refs.filter((item) => item.data.signature === entry.signature && (entry.platformQuestionId ? item.data.platformQuestionId === entry.platformQuestionId : item.data.id === entry.id));
        if (refs.length !== 1) throw new Error("Không tìm được đúng trường cũ; bỏ qua.");
        const ref = refs[0];
        if (!C.sameState(A.valueOf(ref), entry.after)) throw new Error("Bạn đã sửa câu này sau khi điền; giữ nguyên thay đổi mới.");
        await A.setValue(ref, entry.before);
        results.push({ id: entry.id, status: "undone", message: "Đã khôi phục giá trị trước khi điền." });
      } catch (error) {
        remaining.push(entry);
        results.push({ id: entry.id, status: "skipped", message: error.message });
      }
    }
    undo.entries = remaining.reverse(); lastScan = null;
    return { results, undoAvailable: undo.entries.length > 0 };
  }
  async function handle(command, payload = {}) {
    if (busy) throw new Error("Đang xử lý lần điền khác. Vui lòng đợi.");
    busy = true;
    try {
      if (command === "scan") return scan();
      if (command === "fill") return await fill(payload);
      if (command === "undo") return await undoFill(payload);
      throw new Error("Lệnh không được hỗ trợ.");
    } finally { busy = false; }
  }
  let demoTabId = null;
  if (A.isDemo()) chrome.tabs.getCurrent().then((tab) => { demoTabId = tab.id; });
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== chrome.runtime.id) return false;
    if (message.channel === "aff-demo") {
      if (!A.isDemo() || message.tabId !== demoTabId) return false;
    } else if (message.channel !== "aff-content" || A.isDemo()) return false;
    handle(message.command, message.payload).then((data) => respond({ ok: true, data }), (error) => respond({ ok: false, error: error.message }));
    return true;
  });
  globalThis.AutoFillContent = { version: "0.3.0", handle };
})();
