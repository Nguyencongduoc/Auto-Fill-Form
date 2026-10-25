const fs = require("node:fs"), path = require("node:path");
const { createWorker } = require("tesseract.js");
const directory = path.resolve("tmp/pdfs/options");
const all = JSON.parse(fs.readFileSync(path.join(directory, "index.json"), "utf8"));
const queue = all.filter((item) => !fs.existsSync(path.join(directory, item.file + ".json")));
let done=0;
async function work() {
  const worker=await createWorker("vie",1,{langPath:path.resolve("tmp/pdfs"),cachePath:path.resolve("tmp/pdfs"),gzip:false});
  await worker.setParameters({tessedit_pageseg_mode:"6",user_defined_dpi:"300"});
  try { while(queue.length){ const item=queue.shift(); const {data}=await worker.recognize(path.join(directory,item.file)); fs.writeFileSync(path.join(directory,item.file+".json"),JSON.stringify({...item,text:data.text.trim().replace(/\s+/gu," "),confidence:data.confidence})); done++;if(done%100===0||!queue.length)console.log(`${done}/${all.length} option crops completed`); } }
  finally { await worker.terminate(); }
}
Promise.all(Array.from({length:3},work)).catch(e=>{console.error(e);process.exitCode=1});
