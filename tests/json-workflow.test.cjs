/* Self-service JSON workflow in an isolated Chrome profile; all form pages are fixtures. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const C = require("../extension/core.js");
const root = path.resolve(__dirname, "..");
const profile = path.join(root, `.test-profile-json-${process.pid}`);
const output = path.join(root, "test-results");
const example = require("../examples/demo-answers.json");
let context, passed = 0;
const errors = [];
const ok = (name) => { passed++; console.log(`PASS ${name}`); };
(async () => {
  fs.mkdirSync(output, { recursive: true });
  context = await chromium.launchPersistentContext(profile, {
    executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true, args: ["--enable-unsafe-extension-debugging"], ignoreDefaultArgs: ["--disable-extensions"],
    viewport: { width: 1050, height: 1000 }, acceptDownloads: true
  });
  context.setDefaultTimeout(12000);
  context.on("page", page => page.on("pageerror", error => errors.push(error.message)));
  const cdp = await context.browser().newBrowserCDPSession();
  const downloads = path.join(profile, "downloads"); fs.mkdirSync(downloads, { recursive: true });
  await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads });
  const { id } = await cdp.send("Extensions.loadUnpacked", { path: path.join(root, "extension") });
  const base = `chrome-extension://${id}/`;
  const seed = await context.newPage(); await seed.goto(`${base}demo.html`);
  const legacy = structuredClone(example); legacy.name = "Bộ A cũ"; legacy.sourceForm.formId = "json-workflow-a";
  await seed.evaluate(bank => chrome.storage.local.set({ answerBank: bank }), legacy);
  const fixture = fs.readFileSync(path.join(root, "extension/demo.html"), "utf8").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<link\b[^>]*>/gi, "");
  await context.route("https://forms.cloud.microsoft/**", route => route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: fixture }));
  await context.route("https://forms.office.com/**", route => route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: fixture }));
  const urlA = "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=json-workflow-a";
  const urlB = "https://forms.office.com/Pages/ResponsePage.aspx?id=json-workflow-b";
  const a = await context.newPage(); await a.goto(urlA);
  const b = await context.newPage(); await b.goto(urlB);
  const panel = await context.newPage(); await panel.goto(`${base}panel.html`);
  await panel.waitForFunction(() => !document.getElementById("scan").disabled);
  const storage = () => panel.evaluate(() => chrome.storage.local.get(null));
  const rpc = change => panel.evaluate(change => libraryRequest(change), change);
  const settled = () => panel.waitForFunction(() => !document.getElementById("scan").disabled);
  const activate = async url => {
    const page = context.pages().find(page => page.url() === url); await page.bringToFront();
    const targets = await cdp.send("Target.getTargets", { filter: [{ type: "tab" }] });
    await cdp.send("Extensions.triggerAction", { id, targetId: targets.targetInfos.find(t => t.url === url).targetId });
    const tabId = await panel.evaluate(async url => (await chrome.tabs.query({})).find(t => t.url === url).id, url);
    await settled();
    await panel.evaluate(async tabId => { await chrome.tabs.update(tabId, { active: true }); await target(tabId); }, tabId);
    await panel.locator("#scan").click();
    await panel.waitForFunction(() => document.querySelectorAll(".question-card").length === 4 && !document.getElementById("scan").disabled);
  };
  const importFile = async value => {
    await panel.locator("#bankFile").setInputFiles({ name: "answers.json", mimeType: "application/json", buffer: Buffer.from(typeof value === "string" ? value : JSON.stringify(value)) });
    await settled();
  };
  await activate(urlA);
  let saved = await storage();
  assert.equal(saved.answerLibrary.banks.length, 1); assert.equal(saved.answerBank, undefined);
  assert.deepEqual(saved.answerLibrary.banks[0].bank, C.validateBank(legacy));
  assert.equal(await panel.locator("#selectedCount").textContent(), "3");
  ok("legacy bank migrates durably and retains form binding and all answers");

  await panel.locator("#editBank").click();
  await panel.locator("#editorName").fill("Bộ A đã chỉnh");
  await panel.locator(".edit-question summary").first().click();
  await panel.getByLabel("Đáp án biên soạn câu 1", { exact: true }).selectOption("1");
  await panel.locator("#editorSave").click(); await settled();
  saved = await storage();
  assert.equal(saved.answerLibrary.banks.length, 1); assert.equal(saved.answerLibrary.banks[0].version, 2);
  const editedA = saved.answerLibrary.banks[0];
  assert.equal(editedA.bank.name, "Bộ A đã chỉnh"); assert.deepEqual(editedA.bank.answers[0].answer, [editedA.bank.answers[0].options[1]]);
  await panel.bringToFront(); await settled();
  const downloading = panel.waitForEvent("download"); await panel.locator("#exportBank").click();
  const download = await downloading; assert.equal(await download.failure(), null);
  assert.equal(download.suggestedFilename(), "answers.json");
  const exported = path.join(output, "json-editor-export.json"); fs.copyFileSync(path.join(downloads, "answers.json"), exported);
  assert.deepEqual(C.validateBank(JSON.parse(fs.readFileSync(exported, "utf8"))), editedA.bank);
  ok("editor updates an existing bank and exported JSON round-trips exactly");

  await activate(urlB);
  assert.equal(await panel.locator("#bankSelect").inputValue(), "@none");
  const bankB = structuredClone(example); bankB.name = "Bộ B dùng chung"; delete bankB.sourceForm;
  await importFile(bankB); saved = await storage();
  assert.equal(saved.answerLibrary.banks.length, 2);
  const bId = saved.answerLibrary.selections["json-workflow-b"];
  assert.notEqual(bId, editedA.id); assert.equal(saved.answerLibrary.selections["json-workflow-a"], editedA.id);
  assert.equal(await panel.locator("#selectedCount").textContent(), "3");
  ok("second bank imports without replacing A; office.com form remembers its own choice");

  await panel.getByLabel("Đáp án câu 3", { exact: true }).fill("unsaved");
  panel.once("dialog", dialog => dialog.accept());
  await importFile(bankB);
  assert.equal(await panel.getByLabel("Đáp án câu 3", { exact: true }).inputValue(), "4");
  assert.equal(await panel.locator("#previewDirty").isVisible(), false);

  await panel.getByLabel("Đáp án câu 3", { exact: true }).fill("42");
  await panel.locator("#scan").click(); await settled();
  assert.equal(await panel.getByLabel("Đáp án câu 3", { exact: true }).inputValue(), "42");
  await panel.locator("#savePreview").click();
  await panel.locator("#editorName").fill("Bộ B từ bản xem trước");
  await panel.locator("#editorSave").click(); await settled();
  saved = await storage(); const previewId = saved.answerLibrary.selections["json-workflow-b"];
  assert.equal(saved.answerLibrary.banks.length, 3);
  const previewBank = saved.answerLibrary.banks.find(e => e.id === previewId).bank;
  assert.equal(previewBank.answers.length, 3); assert.equal(previewBank.answers[2].answer, "42");
  assert.equal(previewBank.sourceForm.formId, "json-workflow-b");
  assert.equal(await panel.locator("#previewDirty").isVisible(), false);
  ok("manual preview survives rescans and saves a new bank with current supported questions");

  await importFile('{"schemaVersion":1,');
  assert.match(await panel.locator("#notice").textContent(), /cú pháp/u);
  await importFile({ schemaVersion: 1, name: "bad", answers: [{ question: "Thiếu loại" }] });
  assert.match(await panel.locator("#notice").textContent(), /Câu 1/u);
  assert.equal((await storage()).answerLibrary.banks.length, 3);
  assert.equal(await panel.locator("#bankSelect").inputValue(), previewId);
  ok("syntax and schema errors preserve both library and current selection");

  await panel.locator("#editBank").click(); await panel.locator("#editorName").fill("Bản soạn giữ lại");
  const original = (await storage()).answerLibrary.banks.find(e => e.id === previewId);
  const elsewhere = structuredClone(original.bank); elsewhere.name = "Sửa từ bảng khác";
  await rpc({ op: "save", id: original.id, expectedVersion: original.version, bank: elsewhere, formId: "json-workflow-b" });
  await panel.locator("#editorSave").click(); await settled();
  assert.equal(await panel.locator("#bankEditor").isVisible(), true);
  assert.match(await panel.locator("#editorError").textContent(), /bảng bên khác/u);
  assert.equal(await panel.locator("#editorName").inputValue(), "Bản soạn giữ lại");
  assert.equal((await storage()).answerLibrary.banks.find(e => e.id === previewId).bank.name, "Sửa từ bảng khác");
  await panel.locator("#editorSaveCopy").click(); await settled();
  saved = await storage(); assert.equal(saved.answerLibrary.banks.length, 4);
  assert.equal(saved.answerLibrary.banks.find(e => e.id === saved.answerLibrary.selections["json-workflow-b"]).bank.name, "Bản soạn giữ lại");
  ok("concurrent edit cannot overwrite a newer version; draft can be saved as a copy");

  await activate(urlA);
  assert.equal(await panel.locator("#bankSelect").inputValue(), editedA.id);
  assert.equal(await panel.locator(`#bankSelect option[value="${previewId}"]`).isDisabled(), true);
  await panel.locator("#bankSelect").selectOption(bId); await settled();
  await panel.locator("#fill").click(); await settled();
  assert.equal(await a.locator('input[aria-label="Hà Nội"]').isChecked(), true);
  assert.equal(await a.locator('input[type="text"]').inputValue(), "4");
  await panel.locator("#undo").click(); await settled();
  assert.equal(await a.locator('input[type="text"]').inputValue(), "");
  ok("generic bank can be selected explicitly on another form and fills/undoes actual fixture controls");

  await activate(urlB);
  const selectedB = await panel.locator("#bankSelect").inputValue();
  await panel.locator("#clearBank").click();
  // Changing the selection after opening confirmation must not change its target.
  await panel.locator("#bankSelect").selectOption(bId); await settled();
  await panel.locator("#deleteBank").click(); await settled();
  saved = await storage(); assert.equal(saved.answerLibrary.banks.length, 3);
  assert.equal(saved.answerLibrary.banks.some(e => e.id === selectedB), false);
  assert.equal(saved.answerLibrary.selections["json-workflow-a"], bId);
  ok("inline delete removes only the chosen bank and its form selections");

  await importFile(editedA.bank); // Already in library, bound to the other form.
  assert.equal((await storage()).answerLibrary.banks.length, 3);
  assert.equal(await panel.locator("#bankSelect").inputValue(), "@none");
  assert.equal(await panel.locator("#selectedCount").textContent(), "0");
  ok("wrong-form import is deduplicated and does not silently apply another bank");

  await panel.locator("#newBank").click(); await panel.locator("#editorAdd").click();
  await panel.locator("#editorSave").click();
  assert.match(await panel.locator("#editorError").textContent(), /Câu 1/u);
  assert.equal(await panel.locator(".invalid-question").count(), 1);
  await panel.getByLabel("Nội dung câu 1", { exact: true }).fill("Một câu mới?");
  await panel.getByLabel("Loại câu 1", { exact: true }).selectOption("short_text");
  await panel.getByLabel("Đáp án biên soạn câu 1", { exact: true }).fill("Đáp án mới");
  await panel.locator("#editorName").fill("Bộ tự soạn");
  await panel.setViewportSize({ width: 410, height: 1050 });
  assert.ok(await panel.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await panel.screenshot({ path: path.join(output, "json-editor.png"), fullPage: true });
  await panel.locator("#editorSave").click(); await settled();
  saved = await storage(); assert.equal(saved.answerLibrary.banks.length, 4);
  const authoredId = saved.answerLibrary.selections["json-workflow-b"];
  assert.equal(saved.answerLibrary.banks.find(e => e.id === authoredId).bank.answers[0].answer, "Đáp án mới");
  ok("blank-bank editor highlights invalid question, authors text answer, and fits a narrow side panel");

  await panel.reload(); await settled(); await activate(urlB);
  assert.equal(await panel.locator("#bankSelect").inputValue(), authoredId);
  assert.equal((await storage()).answerLibrary.banks.length, 4);
  ok("library and per-form selection survive panel reload");

  const detail = "https://forms.cloud.microsoft/Pages/ResponseDetailPage.aspx?id=local-read-only";
  const detailPage = await context.newPage(); await detailPage.goto(detail);
  await detailPage.bringToFront();
  const detailTargets = await cdp.send("Target.getTargets", { filter: [{ type: "tab" }] });
  await cdp.send("Extensions.triggerAction", { id, targetId: detailTargets.targetInfos.find(t => t.url === detail).targetId });
  await settled();
  const detailTab = await panel.evaluate(async url => (await chrome.tabs.query({})).find(t => t.url === url).id, detail);
  await panel.evaluate(async tabId => { await chrome.tabs.update(tabId, { active: true }); await target(tabId); }, detailTab);
  await panel.locator("#scan").click(); await settled();
  assert.match(await panel.locator("#notice").textContent(), /chi tiết kết quả/u);
  ok("response-detail page receives actionable read-only explanation");
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(output, "json-workflow-summary.json"), JSON.stringify({ passed, pageErrors: errors, fixtureOnly: true }, null, 2));
  console.log(`${passed} JSON workflow checks passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (context) await context.close();
  const resolved = path.resolve(profile);
  if (path.dirname(resolved) === root && path.basename(resolved).startsWith(".test-profile-json-")) fs.rmSync(resolved, { recursive: true, force: true });
});
