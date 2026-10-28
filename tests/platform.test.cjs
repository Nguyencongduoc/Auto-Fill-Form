const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../extension/platform.js'),C=require('../extension/core.js');
const item={questionId:'q',question:'Một câu?',type:'single_choice',options:['Có','Không'],answer:['Có']};
test('routes only the exact HUST LMS host and active quiz page',()=>{
 assert.equal(P.identify('https://lms.hust.edu.vn/mod/quiz/attempt.php?attempt=1').supported,true);
 for(const url of ['http://lms.hust.edu.vn/mod/quiz/attempt.php?attempt=1','https://lms.hust.edu.vn.evil.test/mod/quiz/attempt.php','https://other.hust.edu.vn/mod/quiz/attempt.php','https://lms.hust.edu.vn/login/index.php','https://lms.hust.edu.vn/mod/quiz/summary.php?attempt=1'])assert.equal(P.identify(url).supported,false,url);
 assert.match(P.identify('https://lms.hust.edu.vn/mod/quiz/view.php?id=49373').reason,/Tiếp tục/u);
 assert.match(P.identify('https://lms.hust.edu.vn/mod/quiz/review.php?attempt=1').reason,/chỉ đọc/u);
});
test('Microsoft routes and read-only error remain supported',()=>{
 for(const host of ['forms.cloud.microsoft','forms.office.com'])assert.ok(P.identify(`https://${host}/Pages/ResponsePage.aspx?id=a`).supported);
 assert.match(P.identify('https://forms.cloud.microsoft/Pages/ResponseDetailPage.aspx?id=a').reason,/chi tiết kết quả/u);
 assert.equal(P.identify('not a url').supported,false);
});
test('Moodle quiz IDs are stable across attempts and pages with an isolated namespace',()=>{
 for(const attempt of [12,13])for(const page of [0,1])assert.equal(P.lmsFormId(new URL(`https://lms.hust.edu.vn/mod/quiz/attempt.php?attempt=${attempt}&page=${page}`),'49373'),'moodle:hust:quiz:49373');
 assert.equal(P.lmsFormId(new URL('https://lms.hust.edu.vn/mod/quiz/attempt.php?attempt=12')),'moodle:hust:attempt:12');
 assert.equal(P.lmsFormId(new URL('https://lms.hust.edu.vn/mod/quiz/attempt.php?cmid=49373&attempt=12')),'moodle:hust:quiz:49373');
 assert.equal(P.lmsFormId(new URL('https://lms.hust.edu.vn/mod/quiz/attempt.php?attempt=bad')),'');
});
test('Moodle templates preserve their platform; incompatible platforms and malformed IDs reject',()=>{
 const scan={platform:'moodle',formId:'moodle:hust:quiz:49373',questions:[{...item,id:'test',supported:true}]};
 const template=C.makeTemplate(scan);assert.equal(template.sourceForm.platform,'moodle');template.answers[0].answer=['Có'];
 const bank=C.validateBank(template);assert.equal(C.matchQuestions(scan,bank)[0].status,'matched');
 assert.equal(C.matchQuestions({...scan,platform:'microsoft_forms'},bank)[0].status,'missing');
 assert.throws(()=>C.validateBank({...bank,sourceForm:{platform:'moodle',formId:'49373'}}),/ID Moodle/u);
 assert.throws(()=>C.validateBank({...bank,sourceForm:{platform:'microsoft_forms',formId:scan.formId}}),/platform/u);
});
