/* Native Next submits intercepted local fixtures; no real HUST request is made. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const {fixture,baseBank}=require('./fixtures/moodle-quiz.cjs');
const root=path.resolve(__dirname,'..'),profile=path.join(root,`.test-profile-auto-${process.pid}`),out=path.join(root,'test-results');
const knownA=baseBank.answers[0],knownB=baseBank.answers[2],unknown={questionId:'unknown',question:'Câu mới chưa có trong JSON?',type:'short_text',answer:'Trả lời bổ sung'};
const bank={schemaVersion:1,name:'Bộ tự chạy test',answers:[knownA,knownB]};
const submissions=[],clicks=[],errors=[];let context,passed=0;
const ok=s=>{passed++;console.log('PASS '+s)};
function htmlFor(attempt,page){
 const manual=attempt==='881',unsupported=attempt==='883',timeout=attempt==='884',link=attempt==='885';
 const questions=manual?[unknown]:page===0?[knownA]:page===1?[knownB,unknown]:[knownA];
 let html=fixture({usage:attempt,page,questions,unsupported:unsupported&&page===0});
 html=html.replace('<input type="hidden" name="attempt" value="991">',`<input type="hidden" name="attempt" value="${attempt}">`);
 const last=(manual||timeout||link)?(timeout?false:true):page===2;
 const next=last?-1:page+1;
 const navigation=`<input type="hidden" name="thispage" value="${page}"><input type="hidden" name="nextpage" value="${next}"><input type="submit" id="mod_quiz-next-nav" class="mod_quiz-next-nav" name="next" value="${last?'Finish attempt ...':'Next page'}"><button type="submit" name="finishattempt" hidden>Submit all and finish</button>`;
 html=html.replace(/<button name="next"[\s\S]*?<\/form>/u,navigation+'</form>');
 if(timeout)html=html.replace('</html>','<script>document.querySelector("form").addEventListener("submit",e=>e.preventDefault())</script></html>');
 return html;
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-extension-debugging'],ignoreDefaultArgs:['--disable-extensions'],viewport:{width:1050,height:900}});
 context.setDefaultTimeout(15000);context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 await context.exposeBinding('recordNav',(_,value)=>clicks.push(value));
 await context.addInitScript(()=>document.addEventListener('click',e=>{const node=e.target.closest('#mod_quiz-next-nav, [name="finishattempt"]');if(node)window.recordNav({attempt:new URL(location.href).searchParams.get('attempt'),label:node.value||node.textContent})},true));
 await context.route('https://lms.hust.edu.vn/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/mod/quiz/processattempt.php'){
   const fields=new URLSearchParams(route.request().postData());
   const attempt=fields.get('attempt'),page=Number(fields.get('thispage')),next=Number(fields.get('nextpage'));
   submissions.push({attempt,page,next,fields:Object.fromEntries(fields)});
   assert.ok(next>=0,'Finish must never be submitted');assert.equal(next,page+1);
   if(attempt==='886')await new Promise(resolve=>setTimeout(resolve,2000));
   // A document redirect keeps all redirected requests local under CDP-loaded extensions.
   return route.fulfill({status:200,contentType:'text/html',body:`<script>location.replace('/mod/quiz/attempt.php?attempt=${attempt}&page=${next}')</script>`});
  }
  if(url.pathname.includes('attempt.php'))return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:htmlFor(url.searchParams.get('attempt'),Number(url.searchParams.get('page')||0))});
  return route.fulfill({status:200,body:'<h1>Login or quiz overview</h1>'});
 });
 await context.route('https://forms.cloud.microsoft/**',route=>route.fulfill({status:200,body:'<h1>Microsoft Forms fixture</h1>'}));
 const cdp=await context.browser().newBrowserCDPSession();const {id}=await cdp.send('Extensions.loadUnpacked',{path:path.join(root,'extension')});
 let panel=await context.newPage();await panel.goto(`chrome-extension://${id}/panel.html`);
 const page=await context.newPage();let tabId;
 const settled=()=>panel.waitForFunction(()=>!document.getElementById('bankFile').disabled);
 async function connect(attempt){
  const url=`https://lms.hust.edu.vn/mod/quiz/attempt.php?attempt=${attempt}&page=0`;
  await page.goto(url);await page.bringToFront();
  const targets=await cdp.send('Target.getTargets',{filter:[{type:'tab'}]});
  await cdp.send('Extensions.triggerAction',{id,targetId:targets.targetInfos.find(t=>t.url===url).targetId});
  tabId=await panel.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url).id,url);
  await panel.waitForFunction(()=>!document.getElementById('scan').disabled);
  await panel.evaluate(async id=>{await target(id);await task(scanForm)},tabId);
 }
 const status=()=>panel.evaluate(async id=>{const r=await chrome.runtime.sendMessage({channel:'aff-lms-run',op:'get',tabId:id});return r.run},tabId);
 async function phase(expected,timeout=20000){await panel.waitForFunction(expected=>document.getElementById('autoStatus').textContent.includes(expected),expected,{timeout,polling:50})}
 await connect('880');
 await panel.locator('#bankFile').setInputFiles({name:'auto.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bank))});await settled();
 await panel.locator('#autoStart').click();
 await panel.close();
 await page.waitForURL(/attempt=880&page=1/u);
 panel=await context.newPage();await panel.goto(`chrome-extension://${id}/panel.html`);
 await panel.waitForFunction(()=>!document.getElementById('scan').disabled);
 await panel.evaluate(async id=>{await target(id)},tabId);
 await phase('câu cần bổ sung');
 let run=await status();assert.equal(run.phase,'waiting');assert.equal(run.scan.navigation.page,1);
 assert.equal(submissions.length,1);assert.equal(submissions[0].fields['q880:1_answer'],'1');
 assert.equal(await page.locator('input[type="text"]').inputValue(),'');
 assert.equal(await panel.locator('#autoResume').isDisabled(),true);
 assert.equal(await page.locator('input[id="q880:21_answer0"]').isChecked(),true); // Known False on page 1.
 await panel.setViewportSize({width:410,height:1000});await panel.locator('#lmsAuto').scrollIntoViewIfNeeded();
 assert.ok(await panel.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await panel.screenshot({path:path.join(out,'auto-waiting.png')});
 await panel.setViewportSize({width:1050,height:900});
 ok('native Next continues after closing the panel, saves answers and waits on the next page for missing data');

 // Reloading the panel must recover the waiting run, not issue another Next.
 await panel.reload();await panel.waitForFunction(()=>!document.getElementById('scan').disabled);
 await panel.evaluate(async id=>{await target(id)},tabId);
 await phase('câu cần bổ sung');assert.equal(submissions.length,1);
 await panel.getByLabel('Đáp án câu 2',{exact:true}).fill(unknown.answer);
 assert.equal(await panel.locator('#autoResume').isEnabled(),true);
 await panel.locator('#autoResume').click();await phase('trang cuối');
 run=await status();assert.equal(run.phase,'complete');assert.equal(run.completedPages,3);
 assert.equal(submissions.length,2);assert.equal(submissions[1].fields['q880:22_answer'],unknown.answer);
 assert.match(page.url(),/page=2/u);assert.equal(await page.locator('input[id="q880:41_answer1"]').isChecked(),true);
 assert.equal(clicks.filter(c=>/Finish|Submit/iu.test(c.label)).length,0);
 ok('waiting state survives panel reload, typed answer resumes across pages and final name=next is never clicked');

 await connect('881');await panel.locator('#autoStart').click();await phase('câu cần bổ sung');
 await panel.locator('#autoStop').click();await phase('Đã dừng');
 assert.equal((await status()).phase,'stopped');assert.equal(await page.locator('input[type="text"]').inputValue(),'');
 assert.equal(submissions.length,2);
 ok('Stop cancels a waiting workflow without filling or navigating');

 await connect('883');await panel.locator('#autoStart').click();await phase('câu cần bổ sung');
 assert.equal(await panel.locator('#autoUnsupportedLabel').isVisible(),true);
 assert.equal(await panel.locator('#autoResume').isDisabled(),true);
 await panel.locator('#autoUnsupported').check();await panel.locator('#autoResume').click();await page.waitForURL(/attempt=883&page=1/u);await phase('Trang 2:');
 assert.equal((await status()).scan.navigation.page,1);
 assert.equal(submissions.filter(s=>s.attempt==='883').length,1);
 await panel.locator('#autoStop').click();
 ok('unsupported image/matching controls require explicit acknowledgement before leaving their page');

 await connect('886');await panel.locator('#autoStart').click();await phase('đang chuyển');
 await panel.locator('#autoPause').click();await phase('Đã tạm dừng');
 await page.waitForURL(/attempt=886&page=1/u);
 assert.equal((await status()).phase,'paused');assert.equal(await page.locator('.answer input:checked').count(),0);
 await panel.locator('#autoResume').click();await phase('Trang 2:');
 assert.equal((await status()).phase,'waiting');assert.equal((await status()).completedPages,1);
 await panel.locator('#autoStop').click();
 ok('Pause during an in-flight Next prevents new-page fills; Resume accounts for that transition once');

 await connect('884');await panel.locator('#autoStart').click();await phase('15 giây',23000);
 assert.equal((await status()).phase,'paused');
 assert.equal(clicks.filter(c=>c.attempt==='884').length,1);
 await panel.locator('#autoStop').click();
 ok('a Next button that does not navigate times out and is not clicked repeatedly');

 await connect('885');
 // Native forward icon link is supported; an arbitrary finish link is not.
 await page.evaluate(()=>{const next=document.getElementById('mod_quiz-next-nav');next.outerHTML='<a id="mod_quiz-next-nav" rel="next" aria-label="Next page" href="/mod/quiz/attempt.php?attempt=885&page=1">➜</a>';document.querySelector('[name="nextpage"]').value='1'});
 const inspected=await panel.evaluate(()=>command('scan'));assert.equal(inspected.navigation.kind,'next');
 await page.evaluate(()=>document.getElementById('mod_quiz-next-nav').href='/mod/quiz/summary.php?attempt=885');
 const blocked=await panel.evaluate(()=>command('scan'));assert.notEqual(blocked.navigation.kind,'next');
 ok('a Next icon requires a same-attempt forward URL; summary/finish destinations are never followed');

 await page.goto('https://forms.cloud.microsoft/pages/responsepage.aspx?id=local-auto-guard');
 // Reject through the worker too, even if a caller ignores the hidden UI.
 const denied=await panel.evaluate(async id=>chrome.runtime.sendMessage({channel:'aff-lms-run',op:'start',tabId:id,bankId:'@none'}),tabId);
 assert.equal(denied.ok,false);assert.match(denied.error,/LMS/u);
 assert.equal(await panel.locator('#lmsAuto').isVisible(),false);
 ok('Microsoft Forms has no auto workflow and worker rejects attempts to start one there');

 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'lms-auto-summary.json'),JSON.stringify({passed,pageErrors:errors,realHustAttemptTested:false,postNavigationChecks:submissions.length,finishClicks:0},null,2));
 console.log(`${passed} auto-workflow browser checks passed.`);
})().catch(async e=>{console.error(e);process.exitCode=1;console.error('PAGES',context?.pages().map(p=>p.url()));console.error('SUBMISSIONS',JSON.stringify(submissions));const p=context?.pages().find(p=>p.url().endsWith('/panel.html'));if(p){console.error(await p.locator('#autoStatus').innerText());const saved=await p.evaluate(()=>chrome.storage.session.get(null));console.error(JSON.stringify(saved,null,2));}}).finally(async()=>{if(context)await context.close();const resolved=path.resolve(profile);if(path.dirname(resolved)===root&&path.basename(resolved).startsWith('.test-profile-auto-'))fs.rmSync(resolved,{recursive:true,force:true})});
