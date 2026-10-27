"use strict";
const C = globalThis.AutoFillCore;
const L = globalThis.AutoFillLibrary;
const P = globalThis.AutoFillPlatform;
const $ = (id) => document.getElementById(id);
const state = { tabId: null, windowId: null, tabUrl: "", scan: null, bank: null, bankId: L.NONE, bundledBank: null, library: L.initialize(null).library, pendingLibrary: null, drafts: new Map(), rows: [], busy: false, consumed: false, undoAvailable: false };
const editor = new BankEditor($("bankEditor"));
let deleteCandidate = null;
const labels = { single_choice: "Một đáp án", multiple_choice: "Nhiều đáp án", short_text: "Văn bản", unsupported: "Chưa hỗ trợ" };
const statusLabels = { matched: "Khớp JSON", manual: "Nhập trực tiếp", missing: "Chưa có đáp án", ambiguous: "Cần duyệt", unsupported: "Chưa hỗ trợ" };
function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}
function notice(message, kind = "") { $("notice").textContent = message; $("notice").className = `notice ${kind}`; }
function ready(row) {
  try { C.desiredAnswer(row.q, row.answer); return true; } catch { return false; }
}
function canSelect(row) { return row.q.supported && ready(row) && (C.isEmpty(row.q.current) || $("overwrite").checked); }
function sync() {
  const selected = state.rows.filter((row) => row.selected && canSelect(row)).length;
  $("matchedCount").textContent = state.rows.filter((row) => row.status === "matched").length;
  $("selectedCount").textContent = selected;
  $("unsupportedCount").textContent = state.rows.filter((row) => !row.q.supported).length;
  $("total").textContent = `${state.rows.length} câu`;
  $("fill").textContent = `Điền ${selected} câu đã chọn →`;
  $("fill").disabled = state.busy || !selected || state.consumed;
  $("scan").disabled = state.busy;
  $("template").disabled = state.busy || !state.scan?.questions.some((q) => q.supported);
  $("undo").disabled = state.busy || !state.undoAvailable;
  $("selectReady").disabled = state.busy || !state.rows.length || state.consumed;
  $("deselect").disabled = state.busy || !state.rows.length;
  $("overwrite").disabled = state.busy;
  $("bankFile").disabled = state.busy;
  $("bankText").disabled = state.busy;
  $("importText").disabled = state.busy;
  $("loadCnpm").disabled = state.busy;
  $("clearBank").disabled = state.busy || !state.library.banks.some((entry) => entry.id === state.bankId);
  $("exportBank").disabled = state.busy || !state.bank;
  $("bankName").textContent = state.bank ? `${state.bank === state.bundledBank ? "Có sẵn · " : ""}${state.bank.answers.length} câu · ${state.bank.name}` : "Chưa nạp";
  $("bankSelect").disabled = state.busy;
  $("newBank").disabled = state.busy;
  $("editBank").disabled = state.busy || !state.bank;
  $("editBank").textContent = state.bankId === L.BUNDLED ? "Sao chép & chỉnh" : "Chỉnh bộ này";
  $("savePreview").disabled = state.busy || !state.scan?.questions.some((q) => q.supported);
  $("previewDirty").hidden = !state.rows.some((row) => row.status === "manual");
  $("deleteBank").disabled = state.busy;
  editor.setBusy(state.busy);
  for (const row of state.rows) {
    if (!row.card) continue;
    row.checkbox.disabled = state.busy || state.consumed || !canSelect(row);
    row.checkbox.checked = row.selected && canSelect(row);
    row.card.querySelectorAll(".editor input, .editor select").forEach((el) => { el.disabled = state.busy || state.consumed; });
  }
  globalThis.AutoFillAutoUI?.sync();
}
function applyFilter() {
  const query = C.normalize($("search").value), filter = $("filter").value;
  let visible = 0;
  for (const row of state.rows) {
    const show = C.normalize(row.q.question).includes(query) && (filter === "all" || (filter === "ready" && ready(row)) || (filter === "missing" && row.q.supported && !ready(row)) || (filter === "unsupported" && !row.q.supported));
    row.card.hidden = !show;
    if (show) visible++;
  }
  $("noResults").hidden = !state.rows.length || visible > 0;
}
function edited(row, answer) {
  row.answer = answer;
  row.status = "manual";
  row.chip.textContent = statusLabels.manual;
  row.chip.className = "chip manual";
  row.reason.textContent = "Đáp án do bạn chọn trực tiếp.";
  row.selected = canSelect(row);
  if (state.scan) {
    if (!state.drafts.has(state.scan.documentToken)) state.drafts.set(state.scan.documentToken, new Map());
    state.drafts.get(state.scan.documentToken).set(row.id, { signature: row.q.signature, answer: L.copy(answer) });
    if (state.drafts.size > 10) state.drafts.delete(state.drafts.keys().next().value);
  }
  sync(); applyFilter();
}
function renderRows() {
  const list = $("questions"); list.replaceChildren();
  if (!state.scan) {
    const empty = node("div", "empty");
    empty.append(node("span", "", "☷"), node("h3", "", "Câu hỏi sẽ hiện ở đây"), node("p", "", "Mở Microsoft Forms hoặc lượt làm quiz LMS HUST rồi chọn Quét form."));
    list.append(empty); sync(); return;
  }
  const matches = C.matchQuestions(state.scan, state.bank);
  state.rows = state.scan.questions.map((q, index) => {
    const match = matches[index];
    const row = { q, ...match, selected: match.status === "matched" && (C.isEmpty(q.current) || $("overwrite").checked) };
    const draft = state.drafts.get(state.scan.documentToken)?.get(q.id);
    if (draft && draft.signature === q.signature) { row.answer = L.copy(draft.answer); row.status = "manual"; row.reason = "Đáp án đang chỉnh, chưa lưu vào thư viện."; row.selected = canSelect(row); }
    const card = node("article", "question-card"); row.card = card;
    const top = node("div", "question-top");
    const checkbox = node("input"); checkbox.type = "checkbox"; checkbox.setAttribute("aria-label", `Chọn câu ${index + 1}`);
    checkbox.addEventListener("change", () => { row.selected = checkbox.checked; sync(); }); row.checkbox = checkbox;
    const heading = node("div");
    heading.append(node("div", "question-number", `Câu ${index + 1}${q.required ? " · Bắt buộc" : ""}`), node("div", "question-title", q.question));
    const meta = node("div", "question-meta"); row.chip = node("span", `chip ${row.status}`, statusLabels[row.status]);
    meta.append(node("span", "chip", labels[q.type]), row.chip);
    if (q.supported && !C.isEmpty(q.current)) meta.append(node("span", "chip", "Đã có câu trả lời"));
    heading.append(meta); top.append(checkbox, heading); card.append(top);
    if (q.supported) {
      const editor = node("div", "editor");
      if (q.type === "short_text") {
        const input = node("input"); input.type = "text"; input.value = row.answer ?? ""; input.placeholder = "Nhập đáp án…"; input.setAttribute("aria-label", `Đáp án câu ${index + 1}`);
        input.addEventListener("input", () => edited(row, input.value)); editor.append(input);
      } else if (q.type === "single_choice") {
        const select = node("select"); select.setAttribute("aria-label", `Đáp án câu ${index + 1}`);
        const placeholder = node("option", "", "— Chọn đáp án —"); placeholder.value = ""; select.append(placeholder);
        q.options.forEach((option, optionIndex) => { const el = node("option", "", option); el.value = String(optionIndex); select.append(el); });
        select.value = row.answer?.length ? String(q.options.indexOf(row.answer[0])) : "";
        select.addEventListener("change", () => edited(row, select.value === "" ? [] : [q.options[Number(select.value)]])); editor.append(select);
      } else {
        q.options.forEach((option) => {
          const label = node("label", "option"), input = node("input"); input.type = "checkbox"; input.checked = row.answer?.includes(option) || false;
          input.addEventListener("change", () => {
            const values = new Set(row.answer || []); input.checked ? values.add(option) : values.delete(option); edited(row, [...values]);
          }); label.append(input, node("span", "", option)); editor.append(label);
        });
      }
      card.append(editor);
    }
    row.reason = node("p", "question-reason", row.reason);
    const current = q.supported && !C.isEmpty(q.current) ? ` Hiện tại: ${Array.isArray(q.current) ? q.current.join("; ") : q.current}` : "";
    row.reason.textContent += current;
    card.append(row.reason); list.append(card);
    return row;
  });
  sync(); applyFilter();
}
function resetScan(message) {
  state.scan = null; state.rows = []; state.consumed = false; state.undoAvailable = false;
  $("resultsSection").hidden = true; renderRows();
  if (message) notice(message);
}
async function target(tabId) {
  const tab = tabId ? await chrome.tabs.get(tabId) : (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  if (!tab) throw new Error("Không tìm thấy tab đang mở.");
  const changed = state.tabId !== tab.id;
  state.tabId = tab.id; state.windowId = tab.windowId; state.tabUrl = tab.url || "";
  $("targetTitle").textContent = tab.title || "Tab đang chọn";
  try { const url = new URL(tab.url); $("targetUrl").textContent = url.protocol === "chrome-extension:" ? "Form demo cục bộ" : `${url.hostname}${url.pathname}`; } catch { $("targetUrl").textContent = "Bấm biểu tượng extension trên tab form để cấp quyền."; }
  if (changed) resetScan("Đã đổi tab. Chọn Quét form để đọc câu hỏi.");
  applyBank();
  const identified = P.identify(tab.url);
  if (changed && identified.platform === "moodle" && !identified.supported) notice(identified.reason);
  await globalThis.AutoFillAutoUI?.target(tab.id);
  return tab;
}
async function command(command, payload = {}) {
  if (!state.tabId) await target();
  const tab = await chrome.tabs.get(state.tabId);
  const isDemo = (tab.url || "").split(/[?#]/u)[0] === chrome.runtime.getURL("demo.html");
  let response;
  if (isDemo) {
    response = await chrome.runtime.sendMessage({ channel: "aff-demo", tabId: tab.id, command, payload });
  } else {
    const identified = P.identify(tab.url);
    if (!identified.supported) throw new Error(identified.reason);
    const adapter = identified.platform === "moodle" ? "moodle-adapter.js" : "adapter.js";
    const files = identified.platform === "moodle" ? ["core.js", "platform.js", "lms-flow.js", adapter, "lms-navigation.js", "content.js"] : ["core.js", "platform.js", adapter, "content.js"];
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files });
    response = await chrome.tabs.sendMessage(tab.id, { channel: "aff-content", command, payload });
  }
  if (!response?.ok) throw new Error(response?.error || "Chưa kết nối được với form. Hãy tải lại trang, bấm biểu tượng extension và thử quét lại.");
  return response.data;
}
async function task(fn) {
  if (state.busy) return;
  state.busy = true; sync();
  try { await fn(); } catch (error) {
    const message = /Cannot access|Missing host permission|Cannot read properties|Receiving end does not exist|Could not establish connection/iu.test(error.message)
      ? "Chưa có quyền hoặc trang chưa sẵn sàng. Bấm biểu tượng extension trên tab form; nếu vừa cài/cập nhật, tải lại trang rồi quét lại." : error.message;
    notice(message, "error");
  } finally {
    state.busy = false;
    if (state.pendingLibrary) { const pending = state.pendingLibrary; state.pendingLibrary = null; if (pending.revision > state.library.revision) updateLibrary(pending); }
    sync();
  }
}
function currentFormId() {
  if (state.scan) return state.scan.formId || "";
  try { const url = new URL(state.tabUrl); if (url.href.split(/[?#]/u)[0] === chrome.runtime.getURL("demo.html")) return "local-demo"; if (P.identify(url.href).platform === "moodle") return P.lmsFormId(url); return [...url.searchParams].find(([key]) => key.toLowerCase() === "id")?.[1] || ""; } catch { return ""; }
}
async function libraryRequest(change) {
  const response = await chrome.runtime.sendMessage({ channel: "aff-library", ...change });
  if (!response?.ok) throw new Error(response?.error || "Không kết nối được với thư viện. Hãy mở lại bảng bên.");
  return response.data;
}
function renderLibrary() {
  const select = $("bankSelect"); select.replaceChildren();
  const add = (id, label, bank) => { const option = node("option", "", label); option.value = id; option.disabled = bank ? !L.compatible(bank, currentFormId()) : false; select.append(option); };
  add(L.NONE, "— Chọn bộ đáp án —");
  if (state.bundledBank) add(L.BUNDLED, `Có sẵn · ${state.bundledBank.name}`, state.bundledBank);
  for (const entry of state.library.banks) add(entry.id, `${entry.bank.name} · ${entry.bank.answers.length} câu${L.compatible(entry.bank, currentFormId()) ? "" : " · Form khác"}`, entry.bank);
  select.value = state.bankId;
  $("libraryCount").textContent = `(${state.library.banks.length} bộ riêng)`;
  $("bankScope").textContent = state.bank
    ? state.bank.sourceForm ? `Liên kết form: ${state.bank.sourceForm.formId}. Mỗi form nhớ bộ đã chọn.` : "Dùng chung: ghép theo nội dung và lựa chọn. Form hiện tại sẽ nhớ bộ đã chọn."
    : "Chọn bộ trong thư viện, nhập JSON hoặc tạo bộ từ form. Bộ liên kết form khác không được áp dụng ở đây.";
}
function applyBank() {
  const resolved = L.resolve(state.library, currentFormId(), state.bundledBank);
  state.bankId = resolved.id; state.bank = resolved.bank; renderLibrary();
}
function updateLibrary(library, refresh = false) {
  const before = state.bank;
  state.library = library; applyBank();
  if (state.scan && (refresh || JSON.stringify(before) !== JSON.stringify(state.bank))) renderRows();
}
function discardPreview() {
  if (state.rows.some((row) => row.status === "manual") && !window.confirm("Đáp án đang chỉnh chưa lưu. Tiếp tục đổi bộ sẽ bỏ bản chỉnh trên form này. Bạn có thể hủy rồi lưu thành bộ mới trước.")) return false;
  if (state.scan) state.drafts.delete(state.scan.documentToken);
  return true;
}
function supportedTarget() {
  return P.identify(state.tabUrl).supported;
}
async function scanForm() {
  await target(); notice("Đang đọc câu hỏi trên form…");
  state.scan = await command("scan"); state.consumed = false; state.undoAvailable = state.scan.undoAvailable;
  applyBank();
  $("targetTitle").textContent = state.scan.title;
  $("resultsSection").hidden = true; renderRows();
  const count = state.rows.filter((row) => row.status === "matched").length;
  notice(state.bank === state.bundledBank && state.scan.formId === state.bundledBank.sourceForm.formId
    ? `Đã tự nạp đáp án Quy chế 2026.1: khớp ${count}/${state.scan.questions.length} câu đang hiển thị. Kiểm tra rồi bấm Điền các câu đã chọn.`
    : `Đã đọc ${state.scan.questions.length} câu${state.scan.platform === "moodle" ? " LMS trên trang này" : ""}, khớp ${count} câu. ${state.scan.platform === "moodle" ? "Chọn bộ JSON/CNPM; nếu có nhiều trang, tự chuyển trang rồi quét lại." : "Nhập JSON hoặc chọn đáp án trực tiếp bên dưới."}`, "success");
}
function download(name, value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" }));
  const anchor = node("a"); anchor.href = url; anchor.download = name; anchor.hidden = true;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function importBank(value) {
  const bank = C.validateBank(value);
  if (!discardPreview()) return;
  const formId = currentFormId();
  const equivalent = L.equivalent(state.library, bank);
  const result = equivalent ? await libraryRequest({ op: "select", id: equivalent.id, formId: L.compatible(bank, formId) ? formId : "" })
    : await libraryRequest({ op: "save", bank, formId });
  if (formId && !L.compatible(bank, formId)) {
    const cleared = await libraryRequest({ op: "select", id: L.NONE, formId });
    updateLibrary(cleared.library, true);
    notice(`Đã lưu “${bank.name}” vào thư viện, nhưng bộ này thuộc form khác nên chưa áp dụng. Mở đúng form hoặc sửa liên kết trong bộ đáp án.`);
  } else { updateLibrary(result.library, true); notice(`Đã ${equivalent ? "chọn bộ đã có" : "nhập vào thư viện"}: “${bank.name}” (${bank.answers.length} câu). Lựa chọn được nhớ cho form này.`, "success"); }
}
function results(data, undo = false) {
  state.undoAvailable = data.undoAvailable;
  $("resultsSection").hidden = false; $("results").replaceChildren();
  for (const result of data.results) {
    const row = state.rows.find((item) => item.id === result.id);
    $("results").append(node("li", "", `${row ? `Câu ${row.q.index + 1}: ` : ""}${result.message}`));
    if (row) {
      row.card.querySelector(".result-line")?.remove();
      row.card.append(node("p", `result-line ${result.status === "failed" ? "failed" : ""}`, result.message));
    }
  }
  const count = data.results.filter((item) => item.status === (undo ? "undone" : "filled")).length;
  notice(`${undo ? "Đã hoàn tác" : "Đã điền và kiểm tra"} ${count}/${data.results.length} câu. ${undo ? "Quét lại để tiếp tục." : "Kiểm tra form trước khi tự nộp bài. Quét lại nếu muốn điền tiếp."}`, count === data.results.length ? "success" : "");
}

$("scan").addEventListener("click", () => task(scanForm));
$("openTarget").addEventListener("click", () => task(async () => { const tab = await chrome.tabs.create({ url: AutoFillBundled.formUrl }); await target(tab.id); notice("Đã mở form. Đăng nhập nếu được yêu cầu, rồi bấm biểu tượng extension để tự quét và nạp đáp án."); }));
$("openLms").addEventListener("click", () => task(async () => { const tab = await chrome.tabs.create({ url: "https://lms.hust.edu.vn/mod/quiz/view.php?id=49373" }); await target(tab.id); notice("Đã mở quiz LMS. Bạn tự đăng nhập và bấm Bắt đầu/Tiếp tục làm bài, rồi mở extension trên trang câu hỏi."); }));
$("loadCnpm").addEventListener("click", () => task(async () => {
  const response = await fetch(chrome.runtime.getURL("data/cnpm-lms-20242-vn.json"));
  if (!response.ok) throw new Error("Thiếu file đáp án CNPM trong gói cài. Hãy nạp lại đầy đủ thư mục extension.");
  await importBank(await response.json());
}));
$("template").addEventListener("click", () => { if (state.scan) { download("answers-template.json", C.makeTemplate(state.scan)); notice("Đã xuất mẫu. Điền answer, xóa những câu chưa có đáp án rồi nạp lại file JSON."); } });
$("demo").addEventListener("click", () => task(async () => { const tab = await chrome.tabs.create({ url: chrome.runtime.getURL("demo.html") }); await target(tab.id); notice("Đã mở demo. Chọn Quét form, rồi nạp file examples/demo-answers.json hoặc nhập trực tiếp."); }));
$("bankFile").addEventListener("change", () => task(async () => {
  const file = $("bankFile").files[0]; if (!file) return;
  try { if (file.size > 2 * 1024 * 1024) throw new Error("File quá lớn; giới hạn 2 MB."); await importBank(L.parseText(await file.text())); }
  finally { $("bankFile").value = ""; }
}));
$("importText").addEventListener("click", () => task(async () => {
  await importBank(L.parseText($("bankText").value));
}));
$("bankSelect").addEventListener("change", () => task(async () => {
  const id = $("bankSelect").value;
  if (!discardPreview()) { renderLibrary(); return; }
  const result = await libraryRequest({ op: "select", id, formId: currentFormId() });
  state.library = result.library;
  // With no form open, keep the requested library item available for management.
  applyBank();
  if (!currentFormId()) { state.bankId = id; state.bank = id === L.BUNDLED ? state.bundledBank : result.library.banks.find((entry) => entry.id === id)?.bank || null; renderLibrary(); }
  if (state.scan) renderRows();
  notice(state.bank ? `Đã chọn “${state.bank.name}”. ${currentFormId() ? "Đã nhớ lựa chọn cho form này." : "Quét form trước khi điền."}` : "Chưa áp dụng bộ đáp án. Bạn có thể chọn bộ khác hoặc nhập trực tiếp.");
}));
$("clearBank").addEventListener("click", () => {
  const entry = state.library.banks.find((item) => item.id === state.bankId);
  if (!entry) return;
  deleteCandidate = { id: entry.id, expectedVersion: entry.version };
  $("deleteMessage").textContent = `Xóa “${entry.bank.name}” khỏi thư viện trên máy? File đã xuất không bị xóa.`;
  $("deleteConfirm").hidden = false;
});
$("cancelDelete").addEventListener("click", () => { $("deleteConfirm").hidden = true; deleteCandidate = null; });
$("deleteBank").addEventListener("click", () => task(async () => {
  if (!deleteCandidate) throw new Error("Chọn một bộ nhập riêng để xóa.");
  if (!discardPreview()) return;
  const result = await libraryRequest({ op: "delete", ...deleteCandidate });
  deleteCandidate = null;
  updateLibrary(result.library); $("deleteConfirm").hidden = true; notice("Đã xóa bộ khỏi thư viện. Bộ Quy chế tích hợp vẫn được giữ nguyên.");
}));
function openEditor(bank, metadata = {}) {
  if (editor.dirty && !window.confirm("Bản soạn chưa lưu. Bạn muốn bỏ bản đang soạn để mở bộ khác?")) return;
  editor.open(bank, { formId: currentFormId(), ...metadata });
  $("bankEditor").scrollIntoView({ block: "start" });
}
$("newBank").addEventListener("click", () => openEditor({ schemaVersion: 1, name: "Bộ đáp án mới", answers: [] }));
$("editBank").addEventListener("click", () => {
  if (!state.bank) return;
  const entry = state.library.banks.find((item) => item.id === state.bankId);
  openEditor(entry ? entry.bank : { ...L.copy(state.bank), name: `${state.bank.name} — Bản sao` }, entry ? { id: entry.id, version: entry.version } : {});
});
$("savePreview").addEventListener("click", () => {
  if (!state.scan) return;
  const bank = C.makeTemplate(state.scan);
  bank.name = `${state.scan.title} — Đáp án`.slice(0, 200);
  const supported = state.rows.filter((row) => row.q.supported);
  bank.answers.forEach((record, i) => { if (ready(supported[i])) record.answer = L.copy(supported[i].answer); });
  openEditor(bank, { fromPreview: true });
});
$("bankEditor").addEventListener("cancel-bank", () => { if (!editor.dirty || window.confirm("Bản soạn chưa lưu. Đóng và bỏ bản đang soạn?")) editor.close(); });
$("bankEditor").addEventListener("save-bank", (event) => task(async () => {
  try {
    const result = await libraryRequest({ op: "save", ...event.detail, formId: currentFormId() });
    if (state.scan) state.drafts.delete(state.scan.documentToken);
    editor.close(); updateLibrary(result.library, true);
    notice(`Đã lưu “${event.detail.bank.name}” vào thư viện.${L.compatible(event.detail.bank, currentFormId()) ? " Bộ này đã sẵn sàng cho form hiện tại." : " Bộ liên kết form khác nên chưa áp dụng ở đây."}`, "success");
  } catch (error) { editor.showError(error.message); throw error; }
}));
$("exportBank").addEventListener("click", () => { if (state.bank) download("answers.json", state.bank); });
$("overwrite").addEventListener("change", () => { for (const row of state.rows) if (!canSelect(row)) row.selected = false; sync(); });
$("selectReady").addEventListener("click", () => { state.rows.forEach((row) => { row.selected = canSelect(row); }); sync(); });
$("deselect").addEventListener("click", () => { state.rows.forEach((row) => { row.selected = false; }); sync(); });
$("search").addEventListener("input", applyFilter); $("filter").addEventListener("change", applyFilter);
$("fill").addEventListener("click", () => task(async () => {
  const selected = state.rows.filter((row) => row.selected && canSelect(row));
  if (!state.scan || state.consumed || !selected.length) throw new Error("Hãy quét form và chọn câu có đáp án.");
  const payload = { documentToken: state.scan.documentToken, scanToken: state.scan.scanToken, actions: selected.map((row) => ({ id: row.id, signature: row.q.signature, answer: row.answer, overwrite: $("overwrite").checked })) };
  state.consumed = true; notice("Đang điền và kiểm tra từng câu…");
  results(await command("fill", payload));
}));
$("undo").addEventListener("click", () => task(async () => {
  if (!state.scan) throw new Error("Quét lại form để khôi phục kết nối với lần điền.");
  state.consumed = true; notice("Đang hoàn tác lần điền…");
  results(await command("undo", { documentToken: state.scan.documentToken }), true);
}));
chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.id === chrome.runtime.id && message.channel === "aff-ui" && message.type === "target" && message.windowId === state.windowId && !state.busy) task(async () => { await target(message.tabId); if (supportedTarget() && !globalThis.AutoFillAutoUI?.running()) await scanForm(); });
});
chrome.tabs.onActivated.addListener((info) => {
  if (info.windowId === state.windowId && !state.busy) task(() => target(info.tabId));
});
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (tabId === state.tabId && info.status === "loading" && !info.url) { state.tabUrl = ""; globalThis.AutoFillAutoUI?.sync(); }
  if (tabId === state.tabId && info.url) { state.tabUrl = info.url; globalThis.AutoFillAutoUI?.sync(); }
  if (tabId === state.tabId && info.status === "complete") chrome.tabs.get(tabId).then(tab => { if (tabId === state.tabId) { state.tabUrl = tab.url || ""; globalThis.AutoFillAutoUI?.refresh(); } }).catch(() => {});
  if (tabId === state.tabId && (info.status === "loading" || info.url) && !state.busy) resetScan("Trang đang tải hoặc đã đổi địa chỉ. Đợi form hiển thị rồi quét lại.");
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.answerLibrary?.newValue) return;
  try {
    const library = L.validate(changes.answerLibrary.newValue);
    if (state.busy) state.pendingLibrary = library;
    else if (library.revision > state.library.revision) { updateLibrary(library); sync(); }
  } catch (error) { notice(error.message, "error"); }
});
task(async () => {
  const response = await fetch(chrome.runtime.getURL(AutoFillBundled.bankPath));
  if (!response.ok) throw new Error("Thiếu file đáp án tích hợp. Hãy nạp lại đầy đủ thư mục tiện ích bản v0.5.0.");
  state.bundledBank = C.validateBank(await response.json());
  const saved = await libraryRequest({ op: "list" }); state.library = saved.library;
  await target(); sync();
  if (supportedTarget() && !globalThis.AutoFillAutoUI?.running()) await scanForm();
  if (saved.warning) notice(saved.warning);
});
