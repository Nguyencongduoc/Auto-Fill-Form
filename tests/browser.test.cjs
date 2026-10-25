/* Browser integration tests run only against local fixture data in an isolated profile. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const bank = require("../examples/demo-answers.json");
const profile = path.join(root, `.test-profile-${process.pid}`);
const output = path.join(root, "test-results");
const executable = process.env.CHROME_PATH || (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined);
const errors = [];
let passed = 0, context;
function ok(name) { passed++; console.log(`PASS ${name}`); }

(async () => {
  fs.mkdirSync(output, { recursive: true });
  context = await chromium.launchPersistentContext(profile, {
    executablePath: executable, headless: true,
    args: ["--enable-unsafe-extension-debugging"], ignoreDefaultArgs: ["--disable-extensions"], viewport: { width: 1150, height: 900 },
    timeout: 20000
  });
  context.setDefaultTimeout(15000);
  context.on("page", (page) => page.on("pageerror", (error) => errors.push(error.message)));
  const browserSession = await context.browser().newBrowserCDPSession();
  const loaded = await browserSession.send("Extensions.loadUnpacked", { path: path.join(root, "extension") });
  const extensionId = loaded.id;
  assert.ok(extensionId);
  const installed = await browserSession.send("Extensions.getExtensions");
  assert.ok(installed.extensions.some((item) => item.id === extensionId && item.enabled), JSON.stringify(installed));
  ok("Chrome loads the unpacked Manifest V3 extension");

  const demo = await context.newPage();
  await demo.goto(`chrome-extension://${extensionId}/demo.html`);
  await demo.waitForFunction(() => Boolean(globalThis.AutoFillContent));
  const scan = await demo.evaluate(() => AutoFillContent.handle("scan"));
  assert.equal(scan.questions.length, 4);
  assert.deepEqual(scan.questions.map((q) => q.type), ["single_choice", "multiple_choice", "short_text", "unsupported"]);
  assert.equal(scan.questions[0].question, "Thủ đô Việt Nam là gì?");
  ok("adapter reads Choice/Text and reports unsupported dropdown");
  const repeatedScan=await demo.evaluate(()=>AutoFillContent.handle("scan"));
  assert.equal(repeatedScan.scanToken,scan.scanToken);
  await demo.locator('input[type="text"]').fill("Snapshot changed");
  const changedValueScan=await demo.evaluate(()=>AutoFillContent.handle("scan"));
  assert.notEqual(changedValueScan.scanToken,repeatedScan.scanToken);
  await demo.locator('input[type="text"]').fill("");
  ok("repeated scans share a token only while structure and field values are unchanged");

  const panel = await context.newPage();
  await panel.goto(`chrome-extension://${extensionId}/panel.html`);
  const demoTabId = await demo.evaluate(async () => (await chrome.tabs.getCurrent()).id);
  await panel.evaluate(async (tabId) => { await chrome.tabs.update(tabId, { active: true }); await target(tabId); }, demoTabId);
  await panel.locator("#scan").click();
  await panel.waitForFunction(() => document.querySelectorAll(".question-card").length === 4 && !document.getElementById("scan").disabled);
  await panel.locator(".paste-box summary").click();
  await panel.locator("#bankText").fill(JSON.stringify(bank));
  await panel.locator("#importText").click();
  await panel.waitForFunction(() => document.getElementById("selectedCount").textContent === "3");
  await panel.locator("#fill").click();
  await panel.waitForFunction(() => document.getElementById("notice").textContent.includes("3/3") && !document.getElementById("scan").disabled);
  assert.equal(await demo.locator('input[aria-label="Hà Nội"]').isChecked(), true);
  assert.equal(await demo.locator('input[aria-label="2"]').isChecked(), true);
  assert.equal(await demo.locator('input[aria-label="3"]').isChecked(), true);
  assert.equal(await demo.locator('input[aria-label="4"]').isChecked(), false);
  assert.equal(await demo.locator('input[type="text"]').inputValue(), "4");
  assert.equal(await panel.locator("#fill").isEnabled(), false);
  ok("panel imports JSON, fills real controls, verifies them and consumes the scan");

  await panel.setViewportSize({ width: 410, height: 1050 });
  await panel.screenshot({ path: path.join(output, "panel-filled.png"), fullPage: true });
  assert.ok(await panel.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  ok("panel layout fits a narrow Chrome side panel");
  await demo.locator('input[type="text"]').fill("Sửa sau khi điền");
  await panel.locator("#undo").click();
  await panel.waitForFunction(() => !document.getElementById("scan").disabled && document.getElementById("notice").textContent.includes("hoàn tác"));
  assert.equal(await demo.locator('input[aria-label="Hà Nội"]').isChecked(), false);
  assert.equal(await demo.locator('input[aria-label="2"]').isChecked(), false);
  assert.equal(await demo.locator('input[aria-label="3"]').isChecked(), false);
  assert.equal(await demo.locator('input[type="text"]').inputValue(), "Sửa sau khi điền");
  ok("undo restores radio/checkbox values and preserves later user edits");

  await demo.reload(); await demo.waitForFunction(() => Boolean(globalThis.AutoFillContent));
  const old = await demo.evaluate(() => AutoFillContent.handle("scan"));
  await demo.locator('input[type="text"]').fill("Người dùng đang sửa");
  const staleInput = await demo.evaluate(async (s) => AutoFillContent.handle("fill", { documentToken: s.documentToken, scanToken: s.scanToken, actions: [{ id: s.questions[2].id, signature: s.questions[2].signature, answer: "4", overwrite: true }] }), old);
  assert.equal(staleInput.results[0].status, "skipped");
  assert.equal(await demo.locator('input[type="text"]').inputValue(), "Người dùng đang sửa");
  ok("form edits after scan are not overwritten by stale preview");

  const changedScan = await demo.evaluate(() => AutoFillContent.handle("scan"));
  await demo.evaluate(() => { document.querySelector('[data-automation-id="questionItem"]').hidden = true; });
  const changed = await demo.evaluate(async (s) => { try { await AutoFillContent.handle("fill", { documentToken: s.documentToken, scanToken: s.scanToken, actions: [{ id: s.questions[2].id, signature: s.questions[2].signature, answer: "4", overwrite: true }] }); return "accepted"; } catch (e) { return e.message; } }, changedScan);
  assert.match(changed, /thay đổi/);
  ok("changed/hidden questions invalidate the previous fill plan");

  // Route a Microsoft Forms URL to a local fixture: no real form is submitted or edited.
  let fixture = fs.readFileSync(path.join(root, "extension/demo.html"), "utf8").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<link\b[^>]*>/gi, "");
  fixture = fixture.replace("</head>", '<style>body{font-family:Arial} [data-automation-id="questionItem"]{padding:20px}</style></head>');
  const fixtureUrl = "https://forms.cloud.microsoft/pages/responsepage.aspx?id=local-fixture-test";
  await context.route("https://forms.cloud.microsoft/**", (route) => route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: fixture }));
  const microsoft = await context.newPage(); await microsoft.goto(fixtureUrl);
  const targets = await browserSession.send("Target.getTargets", { filter: [{ type: "tab" }] });
  const tabTarget = targets.targetInfos.find((item) => item.url === fixtureUrl);
  assert.ok(tabTarget, JSON.stringify(targets));
  await browserSession.send("Extensions.triggerAction", { id: extensionId, targetId: tabTarget.targetId });
  const msTabId = await panel.evaluate(async (url) => (await chrome.tabs.query({})).find((tab) => tab.url === url)?.id, fixtureUrl);
  assert.ok(msTabId);
  await panel.evaluate(async (id) => { await chrome.tabs.update(id, { active: true }); await target(id); }, msTabId);
  await panel.locator("#scan").click();
  await panel.waitForFunction(() => document.querySelectorAll(".question-card").length === 4 && !document.getElementById("scan").disabled);
  const fixtureBank = JSON.parse(JSON.stringify(bank)); fixtureBank.sourceForm.formId = "local-fixture-test";
  await panel.locator("#bankText").fill(JSON.stringify(fixtureBank)); await panel.locator("#importText").click();
  await panel.waitForFunction(() => document.getElementById("selectedCount").textContent === "3");
  await panel.locator("#fill").click();
  await panel.waitForFunction(() => document.getElementById("notice").textContent.includes("3/3") && !document.getElementById("scan").disabled);
  assert.equal(await microsoft.locator('input[aria-label="Hà Nội"]').isChecked(), true);
  assert.equal(await microsoft.locator('input[type="text"]').inputValue(), "4");
  ok("toolbar action grants activeTab, injects scripts, messages the tab and fills Microsoft-host fixture");

  await panel.locator("#scan").click();
  await panel.waitForFunction(() => !document.getElementById("scan").disabled);
  assert.equal(await panel.locator("#selectedCount").textContent(), "0");
  await panel.locator("#overwrite").check(); await panel.locator("#selectReady").click();
  assert.equal(await panel.locator("#selectedCount").textContent(), "3");
  ok("existing answers are protected until explicit overwrite selection");

  // The same sourceForm binding also blocks another live form ID.
  await panel.locator("#bankText").fill(JSON.stringify(bank)); await panel.locator("#importText").click();
  await panel.waitForFunction(() => !document.getElementById("scan").disabled);
  assert.equal(await panel.locator("#matchedCount").textContent(), "0");
  assert.equal(await panel.locator("#selectedCount").textContent(), "0");
  ok("bank bound to another form cannot auto-select answers");

  await demo.reload(); await demo.waitForFunction(() => Boolean(globalThis.AutoFillContent));
  const branchScan = await demo.evaluate(() => AutoFillContent.handle("scan"));
  await demo.evaluate(() => {
    document.querySelector('input[aria-label="Hà Nội"]').addEventListener("change", () => document.querySelectorAll('[data-automation-id="questionItem"]').forEach((el) => { el.hidden = true; }));
  });
  const branching = await demo.evaluate(async (s) => AutoFillContent.handle("fill", { documentToken: s.documentToken, scanToken: s.scanToken, actions: [
    { id: s.questions[0].id, signature: s.questions[0].signature, answer: ["Hà Nội"] },
    { id: s.questions[2].id, signature: s.questions[2].signature, answer: "4" }
  ] }), branchScan);
  assert.deepEqual(branching.results.map((item) => item.status), ["filled", "skipped"]);
  assert.equal(branching.undoAvailable, true);
  ok("branching during fill returns partial results and preserves undo rather than losing progress");

  await demo.reload(); await demo.waitForFunction(() => Boolean(globalThis.AutoFillContent));
  await demo.evaluate(() => {
    const options = document.querySelector(".options");
    const labels = ["Đà Nẵng", "Hà Nội", "TP. Hồ Chí Minh"];
    options.replaceChildren(...labels.map((text) => {
      const button = document.createElement("button"); button.type = "button"; button.setAttribute("role", "radio"); button.setAttribute("aria-checked", "false"); button.textContent = text;
      button.addEventListener("click", () => { options.querySelectorAll('[role="radio"]').forEach((el) => el.setAttribute("aria-checked", el === button ? "true" : "false")); });
      return button;
    }));
  });
  const ariaScan = await demo.evaluate(() => AutoFillContent.handle("scan"));
  assert.equal(ariaScan.questions[0].type, "single_choice");
  const aria = await demo.evaluate(async (s) => AutoFillContent.handle("fill", { documentToken: s.documentToken, scanToken: s.scanToken, actions: [{ id: s.questions[0].id, signature: s.questions[0].signature, answer: ["Hà Nội"] }] }), ariaScan);
  assert.equal(aria.results[0].status, "filled");
  assert.equal(await demo.getByRole("radio", { name: "Hà Nội" }).getAttribute("aria-checked"), "true");
  ok("ARIA radio controls without native inputs are read and filled through click interaction");

  const bundled = JSON.parse(fs.readFileSync(path.join(root,"extension/data/quy-che-2026.1.json"),"utf8"));
  const escape = (s) => String(s).replace(/&/gu,"&amp;").replace(/</gu,"&lt;").replace(/>/gu,"&gt;").replace(/"/gu,"&quot;");
  const fixtureQuestions = [...bundled.answers].reverse();
  const personal = ['Họ và tên','Mã số sinh viên'].map((label,i)=>`<div data-automation-id="questionItem"><div id="QuestionId_identity_${i}"><div data-automation-id="questionTitle"><span class="text-format-content">${label}</span></div></div><input type="text" aria-label="${label}"></div>`).join('');
  const body = fixtureQuestions.map((q,i)=> {
    const options=[...q.options.slice(1),q.options[0]];
    return `<div data-automation-id="questionItem"><div id="QuestionId_bundled_${q.sourceNumber}"><div data-automation-id="questionTitle"><span data-automation-id="questionOrdinal">${i+3}.</span><span class="text-format-content">${escape(q.question)} *</span></div></div>${options.map((value)=>`<label><input type="radio" name="q-${q.sourceNumber}" aria-label="${escape(value)}"><span class="text-format-content">${escape(value)}</span></label>`).join('')}</div>`;
  }).join('');
  const readyFixture=`<!doctype html><meta charset="utf-8"><title>KIỂM TRA QUY CHẾ 2026.1</title><style>body{font-family:Arial} [data-automation-id=questionItem]{padding:12px;border-bottom:1px solid #eee}label{display:block}</style><h1 data-automation-id="formTitle">KIỂM TRA QUY CHẾ 2026.1</h1><div id="question-list">${personal}${body}</div>`;
  const bundledUrl=`https://forms.cloud.microsoft/pages/responsepage.aspx?id=${bundled.sourceForm.formId}&route=shorturl`;
  await context.route(bundledUrl,(route)=>route.fulfill({status:200,contentType:"text/html; charset=utf-8",body:readyFixture}));
  const readyPage=await context.newPage();await readyPage.goto(bundledUrl);
  const readyTargets=await browserSession.send("Target.getTargets",{filter:[{type:"tab"}]});
  const readyTarget=readyTargets.targetInfos.find((t)=>t.url===bundledUrl);
  await browserSession.send("Extensions.triggerAction",{id:extensionId,targetId:readyTarget.targetId});
  await panel.waitForFunction(()=>document.getElementById("selectedCount").textContent==="200"&&!document.getElementById("scan").disabled,undefined,{timeout:30000});
  assert.equal(await panel.locator("#total").textContent(),"202 câu");
  assert.equal(await panel.locator("#matchedCount").textContent(),"200");
  assert.match(await panel.locator("#bankName").textContent(),/Có sẵn/);
  ok("toolbar auto-scans target form and loads all 200 bundled answers without JSON import");
  await panel.screenshot({path:path.join(output,"panel-bundled-ready.png"),fullPage:false});
  await panel.locator("#fill").click();
  await panel.waitForFunction(()=>!document.getElementById("scan").disabled,undefined,{timeout:90000});
  const outcome=await panel.evaluate(()=>({notice:document.getElementById("notice").textContent,results:[...document.querySelectorAll("#results li")].map((el)=>el.textContent)}));
  fs.writeFileSync(path.join(output,"bundled-outcome.json"),JSON.stringify(outcome,null,2));
  assert.ok(outcome.notice.includes("200/200"),JSON.stringify(outcome));
  for(const q of fixtureQuestions){
    const selected=await readyPage.locator(`input[name="q-${q.sourceNumber}"]:checked`).getAttribute("aria-label");
    assert.equal(selected,q.answer[0],`Source question ${q.sourceNumber}`);
  }
  assert.equal(await readyPage.getByLabel("Họ và tên",{exact:true}).inputValue(),"");
  assert.equal(await readyPage.getByLabel("Mã số sinh viên",{exact:true}).inputValue(),"");
  ok("one Fill action completes 200 shuffled questions while leaving identity fields untouched");

  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(output, "browser-summary.json"), JSON.stringify({ passed, errors, chrome: context.browser().version(), realMicrosoftFormTested: false, note: "Microsoft-host fixture was intercepted locally; user sample required sign-in." }, null, 2));
  console.log(`\n${passed} browser checks passed. No page errors.`);
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (context) await context.close();
  // Resolve and verify the owned path before recursive cleanup on Windows.
  const resolved = path.resolve(profile);
  if (resolved.startsWith(`${root}${path.sep}.test-profile-`) && path.dirname(resolved) === root) fs.rmSync(resolved, { recursive: true, force: true });
});
