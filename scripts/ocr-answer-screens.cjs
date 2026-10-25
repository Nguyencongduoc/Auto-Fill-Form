/* Local OCR only. Supply the official vie.traineddata in tmp/pdfs first. */
const fs = require("node:fs");
const path = require("node:path");
const { createWorker } = require("tesseract.js");
const directory = path.resolve("tmp/pdfs/screens");
const index = JSON.parse(fs.readFileSync(path.join(directory, "index.json"), "utf8"));
const subset = process.argv.includes("--sample") ? index.slice(0,2) : index;
const queue = subset.filter((item) => !fs.existsSync(path.join(directory, item.file + ".json")));
let done = 0;
async function work() {
  const worker = await createWorker("vie", 1, { langPath: path.resolve("tmp/pdfs"), cachePath: path.resolve("tmp/pdfs"), gzip: false });
  await worker.setParameters({ tessedit_pageseg_mode: "3", preserve_interword_spaces: "1" });
  try {
    while (queue.length) {
      const item = queue.shift();
      const { data } = await worker.recognize(path.join(directory, item.file), {}, { text: true, blocks: true, tsv: true });
      fs.writeFileSync(path.join(directory, item.file + ".json"), JSON.stringify({ ...item, text: data.text, confidence: data.confidence, blocks: data.blocks }, null, 2));
      done++;
      if (process.argv.includes("--sample")) console.log(data.text);
      else if (done % 10 === 0 || !queue.length) console.log(`${done}/${subset.length} OCR screenshots completed`);
    }
  } finally { await worker.terminate(); }
}
Promise.all(Array.from({ length: Math.min(3, queue.length) }, work)).catch((error) => { console.error(error); process.exitCode = 1; });
