const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../extension/core.js'),F=require('../extension/lms-flow.js');
const bank={schemaVersion:1,name:'Test',answers:[{questionId:'a',question:'Chọn A',type:'single_choice',options:['A','B'],answer:['A']}]};
const q={...bank.answers[0],id:'page-q',supported:true,current:[],signature:C.signature(bank.answers[0])};
const scan=questions=>({platform:'moodle',formId:'moodle:hust:quiz:1',questions});
test('auto planner fills known answers and blocks missing and ambiguous questions',()=>{
 const unknown={...q,id:'unknown',question:'Câu thiếu',signature:'missing'};
 const plan=F.plan(scan([q,unknown]),bank);assert.equal(plan.actions.length,1);assert.equal(plan.blockers[0].id,'unknown');
 const duplicate={...bank,answers:[bank.answers[0],{...bank.answers[0],questionId:'b',answer:['B']}]};
 assert.equal(F.plan(scan([q]),duplicate).blockers.length,1);
});
test('manual answers resolve one exact question, validate signature and value',()=>{
 const entry={id:q.id,signature:q.signature,answer:['B']};
 assert.deepEqual(F.plan(scan([q]),null,{answers:[entry]}).actions[0].answer,['B']);
 assert.throws(()=>F.plan(scan([q]),null,{answers:[{...entry,signature:'old'}]}),/thay đổi/u);
 assert.throws(()=>F.plan(scan([q]),null,{answers:[{...entry,answer:['X']}]}),/lựa chọn/u);
 assert.throws(()=>F.plan(scan([q]),null,{answers:[entry,entry]}),/trùng/u);
});
test('existing responses remain unless overwrite or explicit manual correction is chosen',()=>{
 const filled={...q,current:['B']};assert.equal(F.plan(scan([filled]),bank).actions.length,0);
 assert.equal(F.plan(scan([filled]),null).blockers.length,0);
 assert.equal(F.plan(scan([filled]),bank,{overwrite:true}).actions[0].overwrite,true);
 assert.equal(F.plan(scan([{...q,current:['A']}]),bank,{overwrite:true}).actions.length,0);
});
test('unsupported types require explicit per-page acknowledgement',()=>{
 const unsupported={...q,id:'image',supported:false,reason:'Hình'};
 assert.equal(F.plan(scan([unsupported]),bank).blockers[0].supported,false);
 assert.equal(F.plan(scan([unsupported]),bank,{acknowledged:['image']}).blockers.length,0);
 assert.equal(F.plan(scan([unsupported]),bank,{acknowledged:['other']}).blockers.length,1);
});
test('auto workflow cannot run on Microsoft Forms, a review page or another host',()=>{
 assert.throws(()=>F.plan({...scan([q]),platform:'microsoft_forms'},bank),/LMS/u);
 for(const value of ['https://forms.cloud.microsoft/pages/responsepage.aspx?id=a','https://lms.hust.edu.vn/mod/quiz/review.php?attempt=1','https://lms.hust.edu.vn.evil.test/mod/quiz/attempt.php?attempt=1','https://lms.hust.edu.vn/mod/quiz/attempt.php'])assert.throws(()=>F.context(value));
 assert.equal(F.context('https://lms.hust.edu.vn/mod/quiz/attempt.php?attempt=1&page=2').attempt,'1');
 assert.equal(F.active('waiting'),false);assert.equal(F.active('navigating'),true);
});
