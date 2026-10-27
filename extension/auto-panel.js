(function () {
  "use strict";
  let run = null, tabId = null, pending = false, lastSnapshot = "";
  const running = () => Boolean(run && AutoFillLmsFlow.active(run.phase));
  function syncAuto() {
    const onLms = P.identify(state.tabUrl).platform === "moodle";
    $("lmsAuto").hidden = !onLms;
    const phase = run?.phase || "idle", active = running();
    $("autoStart").hidden = ["waiting", "paused"].includes(phase);
    $("autoStart").disabled = pending || state.busy || active || !P.identify(state.tabUrl).supported;
    $("autoResume").hidden = !["waiting", "paused"].includes(phase);
    $("autoResume").disabled = pending || state.busy;
    $("autoPause").hidden = !active; $("autoPause").disabled = pending;
    $("autoStop").hidden = !run || ["stopped", "complete"].includes(phase); $("autoStop").disabled = pending;
    $("autoStatus").textContent = run?.message || "Chọn bộ JSON rồi bắt đầu: tự quét, điền và Next page; thiếu đáp án sẽ dừng chờ bạn.";
    $("autoProgress").textContent = run ? `${run.completedPages} trang xong · ${run.filled} câu đã điền` : "Chỉ áp dụng LMS";
    const unsupported = run?.phase === "waiting" && run.blockers?.some(item => !item.supported);
    $("autoUnsupportedLabel").hidden = !unsupported;
    if (run?.phase === "waiting" && state.scan?.documentToken === run.scan?.documentToken) {
      const unresolved = run.blockers.filter(item => {
        const row = state.rows.find(row => row.q.id === item.id);
        let answered = false;
        try { C.desiredAnswer(row.q, row.q.current); answered = true; } catch { /* Missing response. */ }
        return item.supported ? !row || (!ready(row) && !answered) : !$("autoUnsupported").checked;
      });
      $("autoResume").disabled ||= unresolved.length > 0;
    }
    if (active) {
      for (const id of ["fill", "scan", "undo", "bankSelect", "bankFile", "bankText", "importText", "loadCnpm", "newBank", "editBank", "clearBank", "deleteBank", "savePreview", "overwrite", "selectReady", "deselect", "template"]) $(id).disabled = true;
      editor.setBusy(true);
      $("questions").querySelectorAll("input,select").forEach(el => { el.disabled = true; });
    }
  }
  function apply(value) {
    if (value && run && value.tabId === run.tabId && value.revision < run.revision) return;
    const before = run; run = value;
    if (before?.runId !== run?.runId || before?.scan?.documentToken !== run?.scan?.documentToken) $("autoUnsupported").checked = false;
    const snapshotKey = run?.scan ? `${run.runId}:${run.phase}:${run.scan.documentToken}:${run.scan.scanToken}` : "";
    const target = P.identify(state.tabUrl);
    const sameAttempt = run?.scan && target.platform === "moodle" && target.supported && new URL(run.scan.url).searchParams.get("attempt") === new URL(state.tabUrl).searchParams.get("attempt");
    if (sameAttempt && run.tabId === state.tabId && !running() && !["stopped"].includes(run.phase) && lastSnapshot !== snapshotKey) {
      lastSnapshot = snapshotKey;
      state.scan = run.scan; state.consumed = false; state.undoAvailable = run.scan.undoAvailable;
      $("targetTitle").textContent = run.scan.title; applyBank(); renderRows();
      if (run.phase === "waiting") {
        $("filter").value = "all"; $("search").value = ""; applyFilter();
        const first = run.blockers.find(item => item.supported);
        const card = state.rows.find(row => row.q.id === first?.id)?.card;
        card?.scrollIntoView({ block: "center" });
        card?.querySelector('.editor input, .editor select')?.focus({ preventScroll: true });
      }
    }
    sync();
  }
  async function rpc(op, extra = {}) {
    const response = await chrome.runtime.sendMessage({ channel: "aff-lms-run", op, tabId: state.tabId, ...extra });
    if (!response?.ok) throw new Error(response?.error || "Không kết nối được với chế độ tự chạy.");
    return response.run;
  }
  async function targetAuto(id) {
    if (id === tabId) return;
    tabId = id; lastSnapshot = ""; run = null; syncAuto();
    const value = await rpc("get");
    if (tabId === id) apply(value);
  }
  async function action(op) {
    if (pending) return;
    pending = true; syncAuto();
    try {
      const answers = op === "resume" ? state.rows.filter(row => row.status === "manual" && ready(row)).map(row => ({ id: row.q.id, signature: row.q.signature, answer: L.copy(row.answer) })) : [];
      const value = await rpc(op, { bankId: state.bankId, overwrite: $("overwrite").checked, answers, documentToken: state.scan?.documentToken, acknowledgeUnsupported: $("autoUnsupported").checked });
      apply(value);
    } catch (error) { notice(error.message, "error"); }
    finally { pending = false; sync(); }
  }
  globalThis.AutoFillAutoUI = { sync: syncAuto, target: targetAuto, running, refresh: () => apply(run) };
  $("autoStart").addEventListener("click", () => action("start"));
  $("autoResume").addEventListener("click", () => action("resume"));
  $("autoPause").addEventListener("click", () => action("pause"));
  $("autoStop").addEventListener("click", () => action("stop"));
  $("autoUnsupported").addEventListener("change", syncAuto);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "session" && state.tabId != null && changes[`lms-run:${state.tabId}`]) apply(changes[`lms-run:${state.tabId}`].newValue || null);
  });
  syncAuto();
})();
