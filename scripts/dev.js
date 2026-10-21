import { concurrently } from "concurrently";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("\n=======================================================");
console.log("             STARTING WEDPLAN AI LOCALLY               ");
console.log("=======================================================\n");

// 1. Detect Python executable (.venv preferred)
const isWindows = process.platform === "win32";
const venvPythonWin = path.join(ROOT_DIR, ".venv", "Scripts", "python.exe");
const venvPythonUnix = path.join(ROOT_DIR, ".venv", "bin", "python");

let pythonCmd = "python";
if (isWindows && fs.existsSync(venvPythonWin)) {
  pythonCmd = venvPythonWin;
} else if (!isWindows && fs.existsSync(venvPythonUnix)) {
  pythonCmd = venvPythonUnix;
}

console.log(`[WedPlan AI] Using Python: ${pythonCmd}`);

// Quote python executable and prefix paths to safely handle spaces in directory names (e.g. "WedPlan AI")
const backendCommand = `"${pythonCmd}" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload`;
const frontendCommand = isWindows
  ? `npm.cmd --prefix "${path.join(ROOT_DIR, "frontend")}" run dev`
  : `npm --prefix "${path.join(ROOT_DIR, "frontend")}" run dev`;

console.log("[WedPlan AI] Starting backend and frontend concurrently...\n");

const { result } = concurrently(
  [
    {
      command: backendCommand,
      name: "backend",
      prefixColor: "blue",
    },
    {
      command: frontendCommand,
      name: "frontend",
      prefixColor: "magenta",
    },
  ],
  {
    prefix: "name",
    killOthers: ["failure", "success"],
    restartTries: 0,
    cwd: ROOT_DIR,
  }
);

result.then(
  () => {
    console.log("\n[WedPlan AI] Processes stopped successfully.");
    process.exit(0);
  },
  (err) => {
    // Normal termination or interrupt
    process.exit(0);
  }
);
