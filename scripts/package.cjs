const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const source = path.join(root, "extension");
const manifest = JSON.parse(fs.readFileSync(path.join(source, "manifest.json"), "utf8"));
const release = path.join(root, "release");
const destination = path.join(release, `auto-fill-form-${manifest.version}`);
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true });
fs.cpSync(path.join(root, "examples"), path.join(destination, "examples"), { recursive: true });
if (fs.existsSync(path.join(root, "data"))) fs.cpSync(path.join(root, "data"), path.join(destination, "data"), { recursive: true });
fs.writeFileSync(path.join(destination, "README.md"), fs.readFileSync(path.join(root, "README.md"), "utf8").replaceAll("(./extension/", "(./"));
fs.copyFileSync(path.join(root, "REPORT.md"), path.join(destination, "REPORT.md"));
fs.copyFileSync(path.join(root, "INSTALL.txt"), path.join(destination, "INSTALL.txt"));
fs.copyFileSync(path.join(root, "ROADMAP.md"), path.join(destination, "ROADMAP.md"));
const zip = `${destination}.zip`;
if (process.platform === "win32") {
  const literal = (s) => `'${s.replace(/'/g, "''")}'`;
  // Archive the contents, not the containing folder: manifest.json must be at ZIP root.
  execFileSync("powershell.exe", ["-NoProfile", "-Command", `Compress-Archive -Path ${literal(path.join(destination, "*"))} -DestinationPath ${literal(zip)} -Force`], { stdio: "inherit" });
  console.log(`ZIP: ${zip}`);
}
console.log(`Load unpacked: ${destination}`);
