import { spawn } from "child_process";

const OCR_SCRIPT = `
const { createWorker } = require("tesseract.js");
const fs = require("fs");
(async () => {
  try {
    const filePath = process.argv[1];
    const buf = fs.readFileSync(filePath);
    const worker = await createWorker("eng");
    const { data: { text } } = await worker.recognize(buf);
    await worker.terminate();
    process.stdout.write(JSON.stringify({ ok: true, text: text || "" }));
  } catch (e) {
    process.stdout.write(JSON.stringify({ ok: false, error: (e && e.message) || String(e) }));
  }
  process.exit(0);
})();
`;

export const DEFAULT_OCR_TIMEOUT_MS = 20000;

export function runOcr(filePath, timeoutMs = DEFAULT_OCR_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(process.execPath, ["-e", OCR_SCRIPT, filePath], {
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch {
      return resolve({ ok: false, error: "OCR process failed to start" });
    }
    let stdout = "";
    const timer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {}
      resolve({ ok: false, error: "OCR timed out" });
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      stdout += d;
    });
    child.stderr.on("data", () => {});
    child.on("error", () => {
      clearTimeout(timer);
      resolve({ ok: false, error: "OCR process failed to start" });
    });
    child.on("close", () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        resolve({ ok: false, error: "OCR produced no output" });
      }
    });
  });
}
