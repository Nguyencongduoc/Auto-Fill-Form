/* A tab-scoped workflow. All durable transitions precede navigation. */
(function () {
  "use strict";
  const F = AutoFillLmsFlow, C = AutoFillCore, L = AutoFillLibrary;
  const prefix = "lms-run:", jobs = new Map(), timers = new Map();
  let writes = Promise.resolve();
  const key = tabId => prefix + tabId;
  const read = async tabId => (await chrome.storage.session.get(key(tabId)))[key(tabId)] || null;
  function write(tabId, runId, edit, replace = false, allowInactive = false) {
    const job = writes.then(async () => {
      const current = await read(tabId);
      if (!replace && (!current || current.runId !== runId || ["stopped", "complete"].includes(current.phase) || (!allowInactive && !F.active(current.phase)))) return current;
      const next = edit(current);
      if (next) { next.updatedAt = Date.now(); next.revision = (current?.revision || 0) + 1; await chrome.storage.session.set({ [key(tabId)]: next }); }
      return next;
    });
    writes = job.catch(() => {}); return job;
  }
  async function live(run) { const now = await read(run.tabId); return now?.runId === run.runId && F.active(now.phase); }
  async function send(tabId, command, payload = {}) {
    const tab = await chrome.tabs.get(tabId); F.context(tab.url);
    await chrome.scripting.executeScript({ target: { tabId }, files: ["core.js", "platform.js", "lms-flow.js", "moodle-adapter.js", "lms-navigation.js", "content.js"] });
    const response = await chrome.tabs.sendMessage(tabId, { channel: "aff-content", command, payload });
    if (!response?.ok) throw new Error(response?.error || "Không kết nối được với câu hỏi LMS.");
    return response.data;
  }
  async function selectedBank(id, formId, expectedVersion) {
    if (!id || id === L.NONE) return { bank: null, version: 0 };
    const saved = await chrome.storage.local.get(["answerLibrary", "answerBank"]);
    const library = L.initialize(saved.answerLibrary, saved.answerBank).library;
    const entry = library.banks.find(item => item.id === id);
    if (!entry) throw new Error("Bộ JSON đã bị xóa hoặc chưa được lưu. Chọn bộ trong thư viện rồi tiếp tục.");
    if (expectedVersion != null && entry.version !== expectedVersion) throw new Error("Bộ JSON đã được sửa trong lúc chạy. Kiểm tra bộ mới rồi bấm Tiếp tục.");
    if (!L.compatible(entry.bank, formId)) throw new Error("Bộ JSON đang liên kết quiz khác. Chọn đúng bộ trước khi tự chạy.");
    return { bank: entry.bank, version: entry.version };
  }
  async function pause(run, message, scan) {
    return write(run.tabId, run.runId, now => ({ ...now, phase: "paused", message, ...(scan ? { scan } : {}) }));
  }
  function schedule(tabId, delay = 450) {
    clearTimeout(timers.get(tabId));
    timers.set(tabId, setTimeout(() => { timers.delete(tabId); enqueue(tabId); }, delay));
  }
  function enqueue(tabId) {
    const previous = jobs.get(tabId) || Promise.resolve();
    const job = previous.catch(() => {}).then(() => drive(tabId)).catch(async error => {
      const run = await read(tabId);
      if (run && F.active(run.phase)) await pause(run, error.message);
    });
    jobs.set(tabId, job);
    job.finally(() => { if (jobs.get(tabId) === job) jobs.delete(tabId); }).catch(() => {});
    return job;
  }
  async function drive(tabId) {
    let run = await read(tabId);
    if (!run || !F.active(run.phase)) return;
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === "loading" || !tab.url) {
      if (run.phase === "navigating" && Date.now() - run.pending.startedAt >= 15000) await pause(run, "Trang tiếp theo chưa tải xong sau 15 giây. Kiểm tra kết nối rồi bấm Tiếp tục.");
      else schedule(tabId);
      return;
    }
    const currentUrl = new URL(tab.url);
    if (run.phase === "navigating" && currentUrl.origin === "https://lms.hust.edu.vn" && currentUrl.pathname === "/mod/quiz/processattempt.php" && Date.now() - run.pending.startedAt < 15000) { schedule(tabId); return; }
    let scope;
    try { scope = F.context(tab.url); } catch { await pause(run, "Trang đã rời lượt làm bài hoặc cần đăng nhập lại. Tự chạy đã tạm dừng."); return; }
    if (scope.attempt !== run.attempt) { await pause(run, "Đã đổi sang lượt làm bài khác. Dừng phiên này và bắt đầu lại trên lượt bạn muốn."); return; }
    let scan;
    try { scan = await send(tabId, "scan"); } catch (error) {
      if (run.phase === "navigating" && Date.now() - run.pending.startedAt < 15000) { schedule(tabId); return; }
      throw error;
    }
    if (!(await live(run))) return;
    if (scan.formId !== run.formId) { await pause(run, "Quiz đã thay đổi. Chưa điền hoặc chuyển thêm trang.", scan); return; }
    const nav = scan.navigation;
    if (!nav || nav.attempt !== run.attempt) throw new Error("Không xác định được trang của lượt làm bài.");
    if (run.phase === "navigating") {
      if (nav.pageKey === run.pending.pageKey) {
        if (Date.now() - run.pending.startedAt >= 15000) await pause(run, "Next page chưa chuyển trang sau 15 giây. Kiểm tra kết nối/nút trên LMS rồi bấm Tiếp tục; không tự bấm lặp.", scan);
        else schedule(tabId);
        return;
      }
      if (nav.page !== run.pending.nextPage) { await pause(run, "Trang đích khác trang Next dự kiến. Kiểm tra lại trước khi tiếp tục.", scan); return; }
      run = await write(tabId, run.runId, now => ({ ...now, phase: "running", completedPages: now.completedPages + 1, visited: [...now.visited, now.pending.pageKey], pending: null, answers: [], acknowledged: [], documentToken: scan.documentToken, scan, message: `Đang xử lý trang ${nav.page + 1}…` }));
      if (!run || !F.active(run.phase)) return;
    }
    if (run.visited.includes(nav.pageKey)) { await pause(run, "Đã quay lại trang từng xử lý. Tự chạy dừng để tránh lặp trang.", scan); return; }
    if (run.visited.length >= 500) { await pause(run, "Đã xử lý 500 trang trong phiên. Hãy kiểm tra trước khi bắt đầu phiên mới.", scan); return; }
    const { bank } = await selectedBank(run.bankId, scan.formId, run.bankVersion);
    if (run.answers.length && run.documentToken !== scan.documentToken) { await pause(run, "Trang đã tải lại; đáp án bổ sung cần được kiểm tra và nhập lại.", scan); return; }
    let planned = F.plan(scan, bank, run);
    // Keep each command short, responsive to Stop and below worker idle limits.
    while (planned.actions.length) {
      if (!(await live(run))) return;
      const result = await send(tabId, "fill", { documentToken: scan.documentToken, scanToken: scan.scanToken, runId: run.runId, actions: planned.actions.slice(0, 20) });
      if (!(await live(run))) return;
      run = await write(tabId, run.runId, now => ({ ...now, filled: now.filled + result.results.filter(item => item.status === "filled").length }));
      if (!run || !F.active(run.phase)) return;
      scan = await send(tabId, "scan");
      if (result.results.some(item => item.status !== "filled")) { await pause(run, "Có câu chưa điền được hoặc vừa được sửa. Kiểm tra trên LMS rồi bấm Tiếp tục.", scan); return; }
      planned = F.plan(scan, bank, run);
    }
    if (!(await live(run))) return;
    if (planned.blockers.length) {
      await write(tabId, run.runId, now => ({ ...now, phase: "waiting", scan, documentToken: scan.documentToken, blockers: planned.blockers, message: `Trang ${nav.page + 1}: ${planned.blockers.length} câu cần bổ sung. Nhập đáp án trong bảng bên rồi bấm Tiếp tục.` }));
      return;
    }
    // A final fresh scan guards user edits immediately before the Next click.
    const checked = await send(tabId, "scan");
    if (checked.documentToken !== scan.documentToken || checked.fingerprint !== scan.fingerprint || checked.questions.some((q, i) => !C.sameState(q.current, scan.questions[i].current))) { await pause(run, "Câu hỏi/đáp án vừa đổi trước khi chuyển trang. Kiểm tra rồi tiếp tục.", checked); return; }
    if (checked.navigation.kind === "last") {
      await write(tabId, run.runId, now => ({ ...now, phase: "complete", scan: checked, blockers: [], completedPages: now.completedPages + 1, message: "Đã xử lý trang cuối. Bạn tự kiểm tra, kết thúc và nộp bài trên LMS." })); return;
    }
    if (checked.navigation.kind !== "next") { await pause(run, checked.navigation.reason, checked); return; }
    const nextPage = checked.navigation.nextPage;
    await write(tabId, run.runId, now => ({ ...now, phase: "navigating", scan: checked, blockers: [], pending: { pageKey: checked.navigation.pageKey, nextPage, startedAt: Date.now() }, message: `Đã kiểm tra đáp án, đang chuyển sang trang ${nextPage + 1}…` }));
    if (!(await live(run))) return;
    try {
      const result = await send(tabId, "lms-next", { runId: run.runId, documentToken: checked.documentToken, scanToken: checked.scanToken, acknowledged: run.acknowledged });
      if (result.kind !== "next") { await pause(run, result.reason, checked); return; }
    } catch (error) {
      // Native form navigation can destroy the messaging port after the click.
      if (!/message port|message channel|frame was removed|No frame|Receiving end|tab was closed/iu.test(error.message)) { await pause(run, error.message, checked); return; }
    }
    schedule(tabId);
  }
  async function launch(message, resume) {
    const tab = await chrome.tabs.get(message.tabId), scope = F.context(tab.url);
    const previous = await read(message.tabId);
    if (previous && F.active(previous.phase)) throw new Error("Phiên tự chạy đang hoạt động. Tạm dừng hoặc dừng trước khi bắt đầu lại.");
    if (resume && (!previous || !["waiting", "paused"].includes(previous.phase) || previous.attempt !== scope.attempt)) throw new Error("Không có phiên đang chờ trên lượt làm bài này.");
    const scan = await send(message.tabId, "scan"), chosen = await selectedBank(message.bankId, scan.formId);
    const answers = resume ? message.answers || [] : [];
    if (answers.length && message.documentToken !== scan.documentToken) throw new Error("Trang đã đổi. Quét lại và nhập đáp án bổ sung trên trang hiện tại.");
    const acknowledged = message.acknowledgeUnsupported && resume && previous.scan?.documentToken === scan.documentToken ? scan.questions.filter(q => !q.supported).map(q => q.id) : [];
    F.plan(scan, chosen.bank, { answers, overwrite: Boolean(message.overwrite), acknowledged });
    const keep = resume ? previous : { visited: [], completedPages: 0, filled: 0 };
    const run = { ...keep, runId: crypto.randomUUID(), tabId: message.tabId, attempt: scope.attempt, formId: scan.formId, phase: "running", message: "Đang quét và điền câu hỏi LMS…", scan, documentToken: scan.documentToken, answers, overwrite: Boolean(message.overwrite), acknowledged, bankId: message.bankId || L.NONE, bankVersion: chosen.version, blockers: [], pending: null };
    // If paused during an in-flight Next, account for its completed transition.
    if (resume && previous.pending && scan.navigation.page === previous.pending.nextPage) { run.visited = [...run.visited, previous.pending.pageKey]; run.completedPages++; }
    await write(message.tabId, run.runId, () => run, true);
    enqueue(message.tabId);
    return run;
  }
  async function interrupt(tabId, phase) {
    clearTimeout(timers.get(tabId)); timers.delete(tabId);
    const run = await read(tabId);
    if (!run || ["stopped", "complete"].includes(run.phase)) return run;
    const result = await write(tabId, run.runId, now => ({ ...now, phase, message: phase === "stopped" ? "Đã dừng tự chạy. Bạn có thể bắt đầu phiên mới." : "Đã tạm dừng. Kiểm tra hoặc sửa đáp án rồi bấm Tiếp tục." }), false, true);
    chrome.tabs.sendMessage(tabId, { channel: "aff-lms-cancel", runId: run.runId }).catch(() => {});
    return result;
  }
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== chrome.runtime.id || message.channel !== "aff-lms-run" || !sender.url?.startsWith(chrome.runtime.getURL("panel.html"))) return false;
    const job = (async () => {
      if (!Number.isInteger(message.tabId)) throw new Error("Chưa chọn tab LMS.");
      if (message.op === "get") { const run = await read(message.tabId); if (run && F.active(run.phase)) enqueue(message.tabId); return run; }
      if (message.op === "start") return launch(message, false);
      if (message.op === "resume") return launch(message, true);
      if (message.op === "pause") return interrupt(message.tabId, "paused");
      if (message.op === "stop") return interrupt(message.tabId, "stopped");
      throw new Error("Lệnh tự chạy không hợp lệ.");
    })();
    job.then(run => respond({ ok: true, run }), error => respond({ ok: false, error: error.message })); return true;
  });
  chrome.tabs.onUpdated.addListener((tabId, info) => { if (info.status === "complete" || info.url) enqueue(tabId); });
  chrome.tabs.onRemoved.addListener(tabId => { clearTimeout(timers.get(tabId)); timers.delete(tabId); chrome.storage.session.remove(key(tabId)).catch(() => {}); });
  // Restore active transitions when an event wakes a previously suspended worker.
  chrome.storage.session.get(null).then(saved => Object.entries(saved).forEach(([name, run]) => { if (name.startsWith(prefix) && F.active(run.phase)) enqueue(run.tabId); })).catch(() => {});
})();
