/* Development-only update for the reviewed print PDF. No PDF import is shipped. */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const C=require("../extension/core.js");
const root=path.resolve(__dirname,"..");
const source=process.argv[2];
if(!source)throw new Error("Provide the reviewed source PDF path.");
const extractedRoot=path.resolve(process.argv[3]||path.join(root,"tmp/pdfs/new-source"));
const records=JSON.parse(fs.readFileSync(path.join(extractedRoot,"extracted.json"),"utf8"));
const info=JSON.parse(fs.readFileSync(path.join(extractedRoot,"source.json"),"utf8"));
const hash=crypto.createHash("sha256").update(fs.readFileSync(source)).digest("hex");
assert.equal(hash,info.sha256,"Source PDF does not match extraction metadata");
const bankPath=path.join(root,"extension/data/quy-che-2026.1.json");
const before=C.validateBank(JSON.parse(fs.readFileSync(bankPath,"utf8")));
const previousAudit=JSON.parse(fs.readFileSync(path.join(root,"data/answer-source-audit.json"),"utf8"));
if(previousAudit.sha256===hash){console.log("This PDF is already integrated.");process.exit(0);}
const used=new Set(),changes=[];
const answers=records.map((record)=>{
  const matches=before.answers.map((answer)=>({answer,score:C.similarity(record.question,answer.question)})).sort((a,b)=>b.score-a.score);
  assert.ok(matches[0].score>=.96,`No reliable identity for new question ${record.number}`);
  assert.ok(matches.length===1||matches[0].score-matches[1].score>=.03,`Ambiguous identity: ${record.number}`);
  const old=matches[0].answer;
  assert.ok(!used.has(old.questionId),`Duplicate mapping: ${old.questionId}`);used.add(old.questionId);
  if(C.documentKey(record.answer[0])!==C.documentKey(old.answer[0]))changes.push({questionId:old.questionId,previousSourceNumber:old.sourceNumber,sourceNumber:record.number,question:record.question,before:old.answer,after:record.answer,sourcePage:record.page});
  return {questionId:old.questionId,question:record.question,type:"single_choice",options:record.options,answer:record.answer,sourceNumber:record.number,sourcePage:record.page};
});
assert.equal(answers.length,200);assert.equal(used.size,200);
const bank=C.validateBank({...before,name:"Quy chế 2026.1 · PDF cập nhật 26/10/2026",answers});
fs.writeFileSync(bankPath,JSON.stringify(bank,null,2)+"\n");
const audit={document:info.document,sha256:hash,pages:info.pages,answers:answers.length,sourceQuestionNumbers:answers.map((a)=>a.sourceNumber),method:info.method,review:"All 200 selections extracted from colored vector radio states; four non-empty options and exactly one selection per question; matched against all 200 prior questions by content; changed selection visually checked on PDF page 33.",preservedStableQuestionIds:true,comparedAgainst:{document:previousAudit.document,sha256:previousAudit.sha256,pages:previousAudit.pages},answerChanges:changes,realFormVerified:false};
fs.writeFileSync(path.join(root,"data/answer-source-audit.json"),JSON.stringify(audit,null,2)+"\n");
fs.writeFileSync(path.join(root,"data/ANSWERS.md"),"# Đáp án đã tích hợp\n\nNguồn mới: "+info.document+" ("+info.pages+" trang), cập nhật 26/10/2026. Đáp án lấy theo lựa chọn được đánh dấu trong PDF; không suy đoán lại. Số câu dưới đây theo PDF mới, không dùng làm khóa điền trên form.\n\n"+answers.map((a)=>`- **${a.sourceNumber}.** ${a.question}\n  - Đáp án: ${a.answer[0]} (PDF trang ${a.sourcePage})`).join("\n")+"\n");
fs.writeFileSync(path.join(root,"data/ANSWER_CHANGES.md"),"# Cập nhật đáp án ngày 26/10/2026\n\nĐã thay nguồn bằng PDF mới, đọc trực tiếp chữ và trạng thái radio vector. Cả 200 câu được đối chiếu theo nội dung và giữ ID ổn định dù số thứ tự thay đổi.\n\n"+changes.map((c)=>`## Câu ${c.sourceNumber} trong PDF mới (trang ${c.sourcePage})\n\n${c.question}\n\n- Trước: ${c.before.join("; ")}\n- Mới: **${c.after.join("; ")}**\n`).join("\n")+"\n");
console.log(JSON.stringify({answers:answers.length,pages:info.pages,changedSelections:changes.length,changes},null,2));
