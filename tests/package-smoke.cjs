/* Verify the delivered ZIP itself, not just the source checkout. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");
const root = path.resolve(__dirname,"..");
const version = JSON.parse(fs.readFileSync(path.join(root,"extension/manifest.json"),"utf8")).version;
const zip = path.join(root,"release",`auto-fill-form-${version}.zip`);
const tempRoot = path.join(root,"tmp");
fs.mkdirSync(tempRoot,{recursive:true});
const owned = fs.mkdtempSync(path.join(tempRoot,"package-smoke-"));
const extracted = path.join(owned,"unpacked");
const quote = (s) => `'${s.replace(/'/gu,"''")}'`;
let context;
(async()=>{
  execFileSync("powershell.exe",["-NoProfile","-Command",`Expand-Archive -LiteralPath ${quote(zip)} -DestinationPath ${quote(extracted)}`]);
  assert.ok(fs.existsSync(path.join(extracted,"manifest.json")),"manifest.json must be directly inside extracted folder");
  const manifest=JSON.parse(fs.readFileSync(path.join(extracted,"manifest.json"),"utf8"));
  let sourceFiles = 0;
  function verifySource(directory, relative = "") {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const child = path.join(relative, entry.name), sourcePath = path.join(directory, entry.name);
      if (entry.isDirectory()) verifySource(sourcePath, child);
      else { assert.deepEqual(fs.readFileSync(path.join(extracted, child)), fs.readFileSync(sourcePath), `Packaged source differs: ${child}`); sourceFiles++; }
    }
  }
  verifySource(path.join(root, "extension"));
  for(const asset of [manifest.background.service_worker,manifest.side_panel.default_path,"core.js","platform.js","moodle-adapter.js","library.js","bank-editor.js","adapter.js","content.js","bundled.js","data/quy-che-2026.1.json","data/cnpm-lms-20242-vn.json"]){
    assert.ok(fs.existsSync(path.join(extracted,asset)),`Missing packaged asset: ${asset}`);
  }
  const C=require(path.join(extracted,"core.js"));
  const bank=C.validateBank(JSON.parse(fs.readFileSync(path.join(extracted,"data/quy-che-2026.1.json"),"utf8")));
  assert.equal(bank.answers.length,200);
  context=await chromium.launchPersistentContext(path.join(owned,"profile"),{
    executablePath:process.env.CHROME_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,
    args:["--enable-unsafe-extension-debugging"],ignoreDefaultArgs:["--disable-extensions"]
  });
  const session=await context.browser().newBrowserCDPSession();
  const {id}=await session.send("Extensions.loadUnpacked",{path:extracted});
  const {extensions}=await session.send("Extensions.getExtensions");
  assert.ok(extensions.some((item)=>item.id===id&&item.enabled&&item.version===version));
  const page=await context.newPage();
  await page.goto(`chrome-extension://${id}/panel.html`);
  await page.waitForFunction(()=>document.querySelector('#bankSelect option[value="@bundled"]') && !document.getElementById("scan").disabled);
  assert.equal(await page.locator("#libraryCount").textContent(), "(0 bộ riêng)");
  assert.match(await page.locator(".brand p").textContent(),new RegExp(version.replace(/\./gu,"\\.")));
  await page.locator("#loadCnpm").click();
  await page.waitForFunction(()=>document.getElementById("bankName").textContent.includes("351") && !document.getElementById("scan").disabled);
  const cnpm=C.validateBank(JSON.parse(fs.readFileSync(path.join(extracted,"data/cnpm-lms-20242-vn.json"),"utf8")));
  assert.equal(cnpm.answers.length,351);
  const result={version,zip,rootManifest:true,chromeLoad:true,bundledAnswers:bank.answers.length,cnpmAnswers:cnpm.answers.length,sourceFilesVerified:sourceFiles};
  fs.writeFileSync(path.join(root,"test-results/package-summary.json"),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
})().catch((error)=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(context)await context.close();
  // Only remove the unique directory created by this test under the workspace.
  const resolved=path.resolve(owned);
  if(path.dirname(resolved)===tempRoot&&path.basename(resolved).startsWith("package-smoke-"))fs.rmSync(resolved,{recursive:true,force:true});
});
