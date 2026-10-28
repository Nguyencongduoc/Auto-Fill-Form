/* All HUST URLs are intercepted with local fixture content. No real quiz is changed. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const {fixture,baseBank}=require('./fixtures/moodle-quiz.cjs');
const root=path.resolve(__dirname,'..'),profile=path.join(root,`.test-profile-moodle-${process.pid}`),out=path.join(root,'test-results');
const course=JSON.parse(fs.readFileSync(path.join(root,'extension/data/cnpm-lms-20242-vn.json'),'utf8'));
const sample=[course.answers[0],...course.answers.filter(q=>q.type==='multiple_choice').slice(0,4),...course.answers.filter(q=>q.options.length===2&&q.options.includes('True')).slice(0,3),...course.answers.slice(-6)];
let context,passed=0;const errors=[];const ok=s=>{passed++;console.log('PASS '+s)};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-extension-debugging'],ignoreDefaultArgs:['--disable-extensions'],viewport:{width:1150,height:950}});
 context.setDefaultTimeout(15000);context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 await context.addInitScript(()=>{
  window.testSubmissions=0;window.testNavClicks=0;window.testChanges=0;
  document.addEventListener('submit',e=>{window.testSubmissions++;e.preventDefault()},true);
  document.addEventListener('change',()=>window.testChanges++);
  document.addEventListener('click',e=>{if(e.target.closest('button[name="next"],button[name="finishattempt"]'))window.testNavClicks++},true);
 });
 await context.route('https://lms.hust.edu.vn/**',route=>{
  assert.equal(route.request().method(),'GET','fixture must never receive a submission');
  const url=new URL(route.request().url());
  const body=url.pathname.includes('login')?'<h1>Login</h1>':fixture({quiz:url.searchParams.get('quiz')||'49373',page:Number(url.searchParams.get('page')||0),usage:url.searchParams.get('attempt')||'991',legacy:url.searchParams.has('legacy'),locked:url.searchParams.has('locked'),...(url.searchParams.has('cnpm')?{questions:sample,unsupported:false}:{})});
  return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body});
 });
 const cdp=await context.browser().newBrowserCDPSession();const {id}=await cdp.send('Extensions.loadUnpacked',{path:path.join(root,'extension')});
 const panel=await context.newPage();await panel.goto(`chrome-extension://${id}/panel.html`);
 const settled=()=>panel.waitForFunction(()=>!document.getElementById('scan').disabled);
 await settled();
 const page=await context.newPage();
 async function connect(url,read=true){
  await page.goto(url);await page.bringToFront();
  const targets=await cdp.send('Target.getTargets',{filter:[{type:'tab'}]});
  await cdp.send('Extensions.triggerAction',{id,targetId:targets.targetInfos.find(t=>t.url===url).targetId});
  const tabId=await panel.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url).id,url);
  await settled();await panel.evaluate(async tabId=>{await target(tabId)},tabId);
  await panel.locator('#scan').click();await settled();
  if(read)await panel.waitForFunction(()=>document.querySelectorAll('.question-card').length>0);
 }
 const url='https://lms.hust.edu.vn/mod/quiz/attempt.php?attempt=991&page=0';
 await connect(url);
 const scan=await panel.evaluate(()=>command('scan'));
 assert.equal(scan.platform,'moodle');assert.equal(scan.formId,'moodle:hust:quiz:49373');
 assert.deepEqual(scan.questions.map(q=>q.type),['single_choice','multiple_choice','single_choice','short_text','short_text','unsupported','unsupported']);
 assert.deepEqual(scan.questions[0].options,[...baseBank.answers[0].options].reverse());
 assert.deepEqual(scan.questions[2].options,['False','True']);
 assert.equal(scan.questions[0].current.length,0); // Clear-choice radio is not an answer.
 ok('toolbar grants activeTab; Moodle 4 labels strip a/b and read-only decorations, flag and clear radios');

 await panel.locator('#bankFile').setInputFiles({name:'lms.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(baseBank))});await settled();
 await panel.waitForFunction(()=>document.getElementById('selectedCount').textContent==='5');
 const genericId=await panel.locator('#bankSelect').inputValue();
 await panel.locator('#fill').click();await settled();
 assert.match(await panel.locator('#notice').textContent(),/5\/5/u);
 assert.equal(await page.locator('input[id="q991:1_answer1"]').isChecked(),true);
 assert.equal(await page.locator('input[id="q991:2_answer1"]').isChecked(),true);
 assert.equal(await page.locator('input[id="q991:2_answer2"]').isChecked(),true);
 assert.equal(await page.locator('input[id="q991:2_answer0"]').isChecked(),false);
 assert.equal(await page.locator('input[id="q991:3_answer0"]').isChecked(),true);
 assert.equal(await page.locator('input[id="q991:4_answer"]').inputValue(),'4');
 assert.equal(await page.locator('input[id="q991:5_answer"]').inputValue(),'Xin chào');
 assert.equal(await page.locator('.info input:checked').count(),0);
 assert.ok(await page.evaluate(()=>window.testChanges>=5));
 ok('JSON fills native radio, checkbox, Vietnamese True/False, and successive short-answer fields');

 await panel.locator('#undo').click();await settled();
 assert.equal(await page.locator('input[id="q991:1_clear"]').isChecked(),true);
 assert.equal(await page.locator('.answer input:checked').count(),0);
 assert.equal(await page.locator('input[id="q991:4_answer"]').inputValue(),'');
 assert.equal(await page.evaluate(()=>window.testSubmissions+window.testNavClicks),0);
 ok('undo restores hidden Moodle -1 radio and blank answers; never clicks Next/Finish or submits');

 await page.locator('input[id="q991:4_answer"]').fill('Giữ nguyên');
 await page.locator('input[id="q991:1_answer0"]').check();
 await panel.locator('#scan').click();await settled();
 assert.equal(await panel.locator('#selectedCount').textContent(),'3');
 await panel.locator('#fill').click();await settled();
 assert.equal(await page.locator('input[id="q991:4_answer"]').inputValue(),'Giữ nguyên');
 assert.equal(await page.locator('input[id="q991:1_answer0"]').isChecked(),true);
 await panel.locator('#scan').click();await settled();await panel.locator('#overwrite').check();await panel.locator('#selectReady').click();
 await panel.locator('#fill').click();await settled();assert.match(await panel.locator('#notice').textContent(),/2\/5/u);
 assert.equal(await page.locator('input[id="q991:4_answer"]').inputValue(),'4');
 assert.equal(await page.locator('input[id="q991:1_answer1"]').isChecked(),true);
 ok('existing responses are protected and changed only after explicit overwrite');

 await connect(url);await panel.locator('#overwrite').check();await panel.locator('#selectReady').click();
 await page.locator('input[id="q991:4_answer"]').fill('Sửa sau khi quét');
 await panel.locator('#fill').click();await settled();
 assert.equal(await page.locator('input[id="q991:4_answer"]').inputValue(),'Sửa sau khi quét');
 assert.match(await panel.locator('#notice').textContent(),/4\/5/u);
 await page.locator('input[id="q991:5_answer"]').fill('Sửa sau khi điền');
 await panel.locator('#undo').click();await settled();
 assert.equal(await page.locator('input[id="q991:5_answer"]').inputValue(),'Sửa sau khi điền');
 ok('stale preview and undo both preserve later user edits');

 await connect(url);await panel.locator('#overwrite').uncheck();
 await page.evaluate(()=>document.querySelector('.qtext').textContent='Câu đã thay đổi');
 await panel.locator('#fill').click();await settled();
 assert.match(await panel.locator('#notice').textContent(),/thay đổi/u);
 assert.equal(await page.locator('.answer input:checked').count(),0);
 ok('a changed question invalidates the complete plan before any answer is filled');

 const next='https://lms.hust.edu.vn/mod/quiz/attempt.php?attempt=992&page=1&legacy=1';
 await connect(next);assert.equal(await panel.locator('#bankSelect').inputValue(),genericId);
 assert.equal(await panel.locator('#selectedCount').textContent(),'5');
 await panel.locator('#fill').click();await settled();assert.match(await panel.locator('#notice').textContent(),/5\/5/u);
 assert.equal(page.url(),next);assert.equal(await page.evaluate(()=>window.testSubmissions+window.testNavClicks),0);
 ok('Moodle 3 legacy labels, a new attempt and next page reuse the same quiz choice without auto-navigation');

 await panel.locator('#scan').click();await settled();await panel.locator('#savePreview').click();
 assert.equal(await panel.locator('#editorFormId').inputValue(),'moodle:hust:quiz:49373');
 await panel.locator('#editorName').fill('Bộ gắn quiz HUST');await panel.locator('#editorSave').click();await settled();
 const boundId=await panel.locator('#bankSelect').inputValue();
 const stored=await panel.evaluate(()=>chrome.storage.local.get('answerLibrary'));
 assert.equal(stored.answerLibrary.banks.find(b=>b.id===boundId).bank.sourceForm.platform,'moodle');
 await connect('https://lms.hust.edu.vn/mod/quiz/attempt.php?attempt=993&quiz=49374');
 assert.equal(await panel.locator('#bankSelect').inputValue(),'@none');
 assert.equal(await panel.locator(`#bankSelect option[value="${boundId}"]`).isDisabled(),true);
 ok('editor saves a Moodle-bound bank and prevents applying it to another quiz');

 await connect('https://lms.hust.edu.vn/mod/quiz/attempt.php?attempt=994&locked=1');
 assert.equal(await panel.locator('#selectedCount').textContent(),'0');assert.equal(await panel.locator('#fill').isDisabled(),true);
 await connect('https://lms.hust.edu.vn/mod/quiz/review.php?attempt=994',false);
 assert.match(await panel.locator('#notice').textContent(),/chỉ đọc/u);
 assert.equal(await page.evaluate(()=>Boolean(globalThis.AutoFillContent)),false);
 await connect('https://lms.hust.edu.vn/mod/quiz/view.php?id=49373',false);
 assert.match(await panel.locator('#notice').textContent(),/Tiếp tục/u);
 ok('locked responses, review.php and quiz introduction do not accept fill commands');

 await connect('https://lms.hust.edu.vn/mod/quiz/attempt.php?attempt=995&cnpm=1');
 await panel.locator('#loadCnpm').click();await settled();
 assert.equal(await panel.locator('#selectedCount').textContent(),String(sample.length));
 assert.match(await panel.locator('#bankName').textContent(),/351/u);
 await panel.locator('#fill').click();await settled();
 assert.match(await panel.locator('#notice').textContent(),new RegExp(`${sample.length}/${sample.length}`));
 const actual=await panel.evaluate(async()=>(await command('scan')).questions.map(q=>q.current));
 assert.deepEqual(actual.map(a=>[...a].sort()),sample.map(q=>[...q.answer].sort()));
 await panel.setViewportSize({width:410,height:1000});
 assert.ok(await panel.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await panel.screenshot({path:path.join(out,'moodle-panel.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>window.testSubmissions+window.testNavClicks),0);
 ok(`bundled 351-answer bank fills ${sample.length} mixed PDF questions with shuffled options and fits 410px panel`);

 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'moodle-summary.json'),JSON.stringify({passed,chrome:context.browser().version(),pageErrors:errors,realHustAttemptTested:false,cnpmAnswers:course.answers.length,cnpmSampleFilled:sample.length,noSubmit:true},null,2));
 console.log(`${passed} Moodle browser checks passed.`);
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(context)await context.close();const resolved=path.resolve(profile);if(path.dirname(resolved)===root&&path.basename(resolved).startsWith('.test-profile-moodle-'))fs.rmSync(resolved,{recursive:true,force:true})});
