const { test }=require("node:test");
const assert=require("node:assert/strict");
const C=require("../extension/core.js"),L=require("../extension/library.js");
const demo=require("../examples/demo-answers.json");
const clone=(v)=>JSON.parse(JSON.stringify(v));
const empty=()=>L.initialize(null).library;
const generic=()=>{const bank=clone(demo);delete bank.sourceForm;return bank;};
const save=(library,bank,id,formId="")=>L.mutate(library,{op:"save",bank,formId},{newId:id,now:"2026-10-26T10:00:00.000Z"});

test("migrates the previous single-bank storage without losing its form binding",()=>{
  const result=L.initialize(undefined,demo);
  assert.equal(result.library.banks.length,1);
  assert.equal(result.library.selections["local-demo"],"legacy-import");
  assert.deepEqual(result.library.banks[0].bank,C.validateBank(demo));
  assert.equal(L.initialize(result.library,demo).migrated,false);
});
test("invalid legacy input is preserved by caller with a visible migration warning",()=>{
  const result=L.initialize(null,{schemaVersion:9});
  assert.equal(result.library.banks.length,0);
  assert.match(result.warning,/Bản gốc/);
  assert.throws(()=>L.initialize({schemaVersion:4},demo),/giữ nguyên/);
});
test("multiple banks persist independently and selections are remembered per form",()=>{
  let library=save(empty(),generic(),"a","form-a").library;
  const other=generic();other.name="Bộ B";other.answers[0].answer=["Đà Nẵng"];
  library=save(library,other,"b","form-b").library;
  assert.equal(L.resolve(library,"form-a",demo).id,"a");
  assert.equal(L.resolve(library,"form-b",demo).id,"b");
  assert.equal(L.resolve(library,"form-c",demo).id,L.NONE);
  assert.equal(library.banks.length,2);
});
test("never applies a bank bound to another form and supports explicit no-selection",()=>{
  let library=save(empty(),demo,"a","other").library;
  assert.equal(L.resolve(library,"other",demo).id,L.NONE);
  assert.throws(()=>L.mutate(library,{op:"select",id:"a",formId:"other"}),/form khác/);
  library=L.mutate(library,{op:"select",id:L.NONE,formId:"local-demo"}).library;
  assert.equal(L.resolve(library,"local-demo",demo).id,L.NONE);
});
test("ambiguous bound banks require explicit choice, bundled source remains independent",()=>{
  let library=save(empty(),demo,"a").library;
  assert.equal(L.resolve(library,"local-demo",demo).id,"a");
  library=save(library,{...demo,name:"Bản hai"},"b").library;
  assert.equal(L.resolve(library,"local-demo",demo).id,L.NONE);
  library=L.mutate(library,{op:"select",id:L.BUNDLED,formId:"local-demo"},{bundledFormId:"local-demo"}).library;
  assert.equal(L.resolve(library,"local-demo",demo).id,L.BUNDLED);
});
test("stale edits and stale deletes cannot overwrite newer library data",()=>{
  const original=save(empty(),generic(),"a").library;
  const updated=L.mutate(original,{op:"save",id:"a",expectedVersion:1,bank:{...generic(),name:"Mới nhất"}}).library;
  assert.equal(updated.banks[0].version,2);
  assert.throws(()=>L.mutate(updated,{op:"save",id:"a",expectedVersion:1,bank:generic()}),/bảng bên khác/);
  assert.throws(()=>L.mutate(updated,{op:"delete",id:"a",expectedVersion:1}),/thay đổi/);
  assert.equal(updated.banks[0].bank.name,"Mới nhất");
  assert.equal(original.banks[0].version,1);
});
test("deleting a bank removes only its selections and leaves other banks intact",()=>{
  let library=save(empty(),generic(),"a","one").library;
  library=save(library,{...generic(),name:"B"},"b","two").library;
  const result=L.mutate(library,{op:"delete",id:"a",expectedVersion:1}).library;
  assert.deepEqual(result.banks.map((item)=>item.id),["b"]);
  assert.equal(result.selections.two,"b");
  assert.equal(Object.hasOwn(result.selections,"one"),false);
});
test("rejects excess banks and duplicate library IDs without modifying existing data",()=>{
  let library=empty();
  for(let i=0;i<L.MAX_BANKS;i++)library=save(library,generic(),`b-${i}`).library;
  assert.throws(()=>save(library,generic(),"too-many"),/đủ 50/);
  assert.equal(library.banks.length,50);
  const invalid=clone(library);invalid.banks[1].id=invalid.banks[0].id;
  assert.throws(()=>L.validate(invalid),/không hợp lệ/);
});
test("JSON syntax/schema errors are actionable and BOM imports work",()=>{
  assert.deepEqual(L.parseText("\uFEFF"+JSON.stringify(demo)),C.validateBank(demo));
  assert.throws(()=>L.parseText(""),/Chưa có nội dung/);
  assert.throws(()=>L.parseText('{"name":}'),/cú pháp/);
  const invalid=generic();invalid.answers[1].answer=["not-an-option"];
  assert.throws(()=>L.parseText(JSON.stringify(invalid)),/Câu 2/);
  assert.throws(()=>L.parseText(" ".repeat(2*1024*1024)+"{}"),/2 MB/);
});
test("form IDs cannot modify object prototypes",()=>{
  const library=save(empty(),generic(),"a","__proto__").library;
  assert.equal(Object.getPrototypeOf(library.selections),Object.prototype);
  assert.equal(Object.hasOwn(library.selections,"__proto__"),true);
  assert.equal(L.resolve(library,"__proto__",demo).id,"a");
});
test("aggregate storage limit rejects a write without changing the prior library",()=>{
  const big=generic();
  big.answers=Array.from({length:500},(_,i)=>({questionId:`q-${i}`,question:"Q".repeat(10000),type:"short_text",answer:"x"}));
  const previous=save(empty(),big,"large-a").library;
  assert.throws(()=>save(previous,big,"large-b"),/8 MB/);
  assert.equal(previous.banks.length,1);
});
test("stored bank IDs must be strings, not numbers coerced by a pattern",()=>{
  const invalid=save(empty(),generic(),"a").library;invalid.banks[0].id=12;
  assert.throws(()=>L.validate(invalid),/không hợp lệ/);
});
test("matching diagnostics distinguish changed options from a changed question type",()=>{
  const bank=C.validateBank(demo),base=bank.answers[0];
  const q={...base,id:"q",supported:true,current:[],options:["Hà Nội","Khác"]};
  assert.match(C.matchQuestions({formId:"local-demo",questions:[q]},bank)[0].reason,/lựa chọn/);
  q.type="multiple_choice";
  assert.match(C.matchQuestions({formId:"local-demo",questions:[q]},bank)[0].reason,/loại câu/);
});
