import { spawn } from "node:child_process";
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

// 2. Start Backend Process (FastAPI / Uvicorn on 127.0.0.1:8000)
console.log("[WedPlan AI] Launching backend server on http://127.0.0.1:8000 ...");
const backend = spawn(
  pythonCmd,
  ["-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
  {
    cwd: ROOT_DIR,
    stdio: "inherit",
    shell: isWindows,
  }
);

// 3. Start Frontend Process (Vite on http://localhost:5173)
const npmCmd = isWindows ? "npm.cmd" : "npm";
console.log("[WedPlan AI] Launching frontend Vite on http://localhost:5173 ...");
const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(ROOT_DIR, "frontend"),
  stdio: "inherit",
  shell: isWindows,
});

// 4. Handle Clean Termination on Ctrl+C
function cleanup() {
  console.log("\n[WedPlan AI] Stopping servers...");
  try {
    if (isWindows) {
      if (backend.pid) spawn("taskkill", ["/pid", backend.pid.toString(), "/f", "/t"]);
      if (frontend.pid) spawn("taskkill", ["/pid", frontend.pid.toString(), "/f", "/t"]);
    } else {
      backend.kill("SIGTERM");
      frontend.kill("SIGTERM");
    }
  } catch {
    // Ignore shutdown errors
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

backend.on("error", (err) => {
  console.error("[WedPlan AI Backend Error]:", err);
});

frontend.on("error", (err) => {
  console.error("[WedPlan AI Frontend Error]:", err);
});
