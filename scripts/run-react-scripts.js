const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const frontendDir = path.join(rootDir, "frontend");
const reactScriptsBin = path.join(frontendDir, "node_modules", ".bin", process.platform === "win32" ? "react-scripts.cmd" : "react-scripts");
const mode = process.argv[2] || "start";

const child = spawn(reactScriptsBin, [mode], {
  cwd: frontendDir,
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    BROWSERSLIST_IGNORE_OLD_DATA: "true",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
