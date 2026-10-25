"use strict";
const C = globalThis.AutoFillCore;
const $ = (id) => document.getElementById(id);
const state = { tabId: null, windowId: null, tabUrl: "", scan: null, bank: null, bundledBank: null, importedBank: null, preferImported: false, rows: [], busy: false, consumed: false, undoAvailable: false };
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
  $("clearBank").disabled = state.busy || !state.importedBank;
  $("exportBank").disabled = state.busy || !state.bank;
  $("bankName").textContent = state.bank ? `${state.bank === state.bundledBank ? "Có sẵn · " : ""}${state.bank.answers.length} câu · ${state.bank.name}` : "Chưa nạp";
  for (const row of state.rows) {
    if (!row.card) continue;
    row.checkbox.disabled = state.busy || state.consumed || !canSelect(row);
    row.checkbox.checked = row.selected && canSelect(row);
    row.card.querySelectorAll(".editor input, .editor select").forEach((el) => { el.disabled = state.busy || state.consumed; });
  }
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
  sync(); applyFilter();
}
function renderRows() {
  const list = $("questions"); list.replaceChildren();
  if (!state.scan) {
    const empty = node("div", "empty");
    empty.append(node("span", "", "☷"), node("h3", "", "Form của bạn sẽ hiện ở đây"), node("p", "", "Mở Microsoft Forms rồi chọn Quét form. Hoặc mở demo để thử trước."));
    list.append(empty); sync(); return;
  }
  const matches = C.matchQuestions(state.scan, state.bank);
  state.rows = state.scan.questions.map((q, index) => {
    const match = matches[index];
    const row = { q, ...match, selected: match.status === "matched" && (C.isEmpty(q.current) || $("overwrite").checked) };
    const card = node("article", "question-card"); row.card = card;
    const top = node("div", "question-top");
    const checkbox = node("input"); checkbox.type = "checkbox"; checkbox.setAttribute("aria-label", `Chọn câu ${index + 1}`);
    checkbox.addEventListener("change", () => { row.selected = checkbox.checked; sync(); }); row.checkbox = checkbox;
    const heading = node("div");
    heading.append(node("div", "question-number", `Câu ${index + 1}${q.required ? " · Bắt buộc" : ""}`), node("div", "question-title", q.question));
    const meta = node("div", "question-meta"); row.chip = node("span", `chip ${match.status}`, statusLabels[match.status]);
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
    row.reason = node("p", "question-reason", match.reason);
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
    let url;
    try { url = new URL(tab.url); } catch { throw new Error("Bấm biểu tượng extension trên tab Microsoft Forms để cấp quyền, rồi quét lại."); }
    if (url.protocol !== "https:" || !["forms.cloud.microsoft", "forms.office.com"].includes(url.hostname) || !/\/pages\/responsepage\.aspx\/?$/iu.test(url.pathname)) throw new Error("Hãy mở trang trả lời Microsoft Forms, đăng nhập nếu cần và bấm biểu tượng extension trên tab đó.");
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["core.js", "adapter.js", "content.js"] });
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
  } finally { state.busy = false; sync(); }
}
function selectBank(formId) {
  if (state.preferImported && state.importedBank && (!state.importedBank.sourceForm || state.importedBank.sourceForm.formId === formId)) return state.importedBank;
  if (state.bundledBank?.sourceForm.formId === formId) return state.bundledBank;
  return state.importedBank || state.bundledBank;
}
function supportedTarget() {
  try { const url = new URL(state.tabUrl); return url.protocol === "https:" && ["forms.cloud.microsoft", "forms.office.com"].includes(url.hostname) && /\/pages\/responsepage\.aspx\/?$/iu.test(url.pathname); } catch { return false; }
}
async function scanForm() {
  await target(); notice("Đang đọc câu hỏi trên form…");
  state.scan = await command("scan"); state.consumed = false; state.undoAvailable = state.scan.undoAvailable;
  state.bank = selectBank(state.scan.formId);
  $("targetTitle").textContent = state.scan.title;
  $("resultsSection").hidden = true; renderRows();
  const count = state.rows.filter((row) => row.status === "matched").length;
  notice(state.bank === state.bundledBank && state.scan.formId === state.bundledBank.sourceForm.formId
    ? `Đã tự nạp đáp án Quy chế 2026.1: khớp ${count}/${state.scan.questions.length} câu đang hiển thị. Kiểm tra rồi bấm Điền các câu đã chọn.`
    : `Đã đọc ${state.scan.questions.length} câu. Nhập JSON hoặc chọn đáp án trực tiếp bên dưới.`, "success");
}
function download(name, value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" }));
  const anchor = node("a"); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function importBank(value) {
  const bank = C.validateBank(value);
  await chrome.storage.local.set({ answerBank: bank });
  state.bank = bank;
  state.importedBank = bank; state.preferImported = true;
  if (state.scan && !state.consumed) renderRows();
  notice(`Đã nạp “${bank.name}” (${bank.answers.length} câu).${bank.sourceForm ? " Bộ đáp án có liên kết với một form cụ thể." : " Bộ đáp án dùng chung; hãy kiểm tra nội dung trước khi điền."}`, "success");
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
$("template").addEventListener("click", () => { if (state.scan) { download("answers-template.json", C.makeTemplate(state.scan)); notice("Đã xuất mẫu. Điền answer, xóa những câu chưa có đáp án rồi nạp lại file JSON."); } });
$("demo").addEventListener("click", () => task(async () => { const tab = await chrome.tabs.create({ url: chrome.runtime.getURL("demo.html") }); await target(tab.id); notice("Đã mở demo. Chọn Quét form, rồi nạp file examples/demo-answers.json hoặc nhập trực tiếp."); }));
$("bankFile").addEventListener("change", () => task(async () => {
  const file = $("bankFile").files[0]; if (!file) return;
  try { if (file.size > 2 * 1024 * 1024) throw new Error("File quá lớn; giới hạn 2 MB."); await importBank(JSON.parse((await file.text()).replace(/^\uFEFF/u, ""))); }
  finally { $("bankFile").value = ""; }
}));
$("importText").addEventListener("click", () => task(async () => {
  if ($("bankText").value.length > 2 * 1024 * 1024) throw new Error("Nội dung quá lớn; giới hạn 2 MB.");
  await importBank(JSON.parse($("bankText").value.replace(/^\uFEFF/u, "")));
}));
$("clearBank").addEventListener("click", () => task(async () => { await chrome.storage.local.remove("answerBank"); state.importedBank = null; state.preferImported = false; state.bank = state.bundledBank; $("bankText").value = ""; if (!state.consumed) renderRows(); notice("Đã xóa bộ nhập riêng. Bộ Quy chế 2026.1 tích hợp sẵn vẫn có thể sử dụng."); }));
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
  if (sender.id === chrome.runtime.id && message.channel === "aff-ui" && message.type === "target" && message.windowId === state.windowId && !state.busy) task(async () => { await target(message.tabId); if (supportedTarget()) await scanForm(); });
});
chrome.tabs.onActivated.addListener((info) => {
  if (info.windowId === state.windowId && !state.busy) task(() => target(info.tabId));
});
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (tabId === state.tabId && (info.status === "loading" || info.url) && !state.busy) resetScan("Trang đang tải hoặc đã đổi địa chỉ. Đợi form hiển thị rồi quét lại.");
});
task(async () => {
  const response = await fetch(chrome.runtime.getURL(AutoFillBundled.bankPath));
  if (!response.ok) throw new Error("Thiếu file đáp án tích hợp. Hãy nạp lại đầy đủ thư mục tiện ích bản v0.2.2.");
  state.bundledBank = C.validateBank(await response.json());
  const saved = await chrome.storage.local.get("answerBank");
  if (saved.answerBank) { try { state.importedBank = C.validateBank(saved.answerBank); } catch { notice("Bộ đáp án lưu trước đó không hợp lệ; hãy nạp lại.", "error"); } }
  state.bank = state.bundledBank;
  await target(); sync();
  if (supportedTarget()) await scanForm();
});
