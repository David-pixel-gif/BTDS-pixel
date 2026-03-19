const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");
const backendScript = path.join(backendDir, "app.py");
const venvPython = path.join(backendDir, "myenv1", "Scripts", "python.exe");
const venvConfig = path.join(backendDir, "myenv1", "pyvenv.cfg");
const backendVenvConfig = path.join(backendDir, "pyvenv.cfg");

function isWindowsAppsShimPath(targetPath) {
  return typeof targetPath === "string" && targetPath.toLowerCase().includes(`${path.sep}appdata${path.sep}local${path.sep}microsoft${path.sep}windowsapps${path.sep}`);
}

function isCommandName(command) {
  return typeof command === "string" && !command.includes("\\") && !command.includes("/") && !command.toLowerCase().endsWith(".exe");
}

function quoteCmdArg(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function buildCmdCommandLine(command, args = []) {
  return [quoteCmdArg(command), ...args.map(quoteCmdArg)].join(" ");
}

function runViaCmd(command, args, options = {}) {
  const commandLine = buildCmdCommandLine(command, args);
  return spawnSync("cmd.exe", ["/d", "/s", "/c", commandLine], {
    ...options,
    shell: false,
  });
}

function readPyVenvCandidates(configPath) {
  if (!fs.existsSync(configPath)) {
    return [];
  }

  const lines = fs.readFileSync(configPath, "utf8").split(/\r?\n/);
  const candidates = [];

  for (const line of lines) {
    const match = line.match(/^\s*(home|executable)\s*=\s*(.+?)\s*$/);
    if (!match) {
      continue;
    }

    let candidate = match[2].trim();
    if (match[1] === "home") {
      candidate = path.join(candidate, "python.exe");
    }
    candidates.push(candidate);
  }

  return candidates;
}

function addCandidate(seen, list, candidate) {
  if (!candidate) {
    return;
  }

  const normalized = candidate.replace(/^"(.*)"$/, "$1").trim();
  if (!normalized || seen.has(normalized.toLowerCase())) {
    return;
  }

  seen.add(normalized.toLowerCase());
  list.push(normalized);
}

function getPythonCandidates() {
  const seen = new Set();
  const candidates = [];

  addCandidate(seen, candidates, process.env.BACKEND_PYTHON);
  addCandidate(seen, candidates, venvPython);

  for (const candidate of [...readPyVenvCandidates(venvConfig), ...readPyVenvCandidates(backendVenvConfig)]) {
    addCandidate(seen, candidates, candidate);
  }

  const localAppData = process.env.LOCALAPPDATA || "";
  const userProfile = process.env.USERPROFILE || "";
  const programFiles = process.env.ProgramFiles || "";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "";

  [
    path.join(localAppData, "Programs", "Python", "Python312", "python.exe"),
    path.join(localAppData, "Programs", "Python", "Python311", "python.exe"),
    path.join(localAppData, "Programs", "Python", "Python310", "python.exe"),
    path.join(userProfile, "AppData", "Local", "Programs", "Python", "Python312", "python.exe"),
    path.join(userProfile, "AppData", "Local", "Programs", "Python", "Python311", "python.exe"),
    path.join(userProfile, "AppData", "Local", "Programs", "Python", "Python310", "python.exe"),
    path.join(programFiles, "Python312", "python.exe"),
    path.join(programFiles, "Python311", "python.exe"),
    path.join(programFiles, "Python310", "python.exe"),
    path.join(programFilesX86, "Python312", "python.exe"),
    path.join(programFilesX86, "Python311", "python.exe"),
    path.join(programFilesX86, "Python310", "python.exe"),
    "python",
    "py",
  ].forEach((candidate) => addCandidate(seen, candidates, candidate));

  return candidates;
}

function canRun(command, args) {
  if (!command) {
    return false;
  }

  const looksLikePath = command.includes("\\") || command.includes("/") || command.toLowerCase().endsWith(".exe");
  if (looksLikePath && !fs.existsSync(command)) {
    return false;
  }

  if (isWindowsAppsShimPath(command)) {
    return false;
  }

  try {
    const options = {
      cwd: backendDir,
      stdio: "ignore",
      timeout: 5000,
    };
    const result = isCommandName(command)
      ? runViaCmd(command, args, options)
      : spawnSync(command, args, {
          ...options,
          shell: false,
        });

    if (typeof result.status === "number") {
      return result.status === 0;
    }

    return false;
  } catch {
    return false;
  }
}

function resolvePythonCommand() {
  for (const candidate of getPythonCandidates()) {
    if (candidate === "py" && canRun("py", ["-3", "-c", "import sys"])) {
      return { command: "py", args: ["-3"] };
    }

    if (canRun(candidate, ["-c", "import sys"])) {
      return { command: candidate, args: [] };
    }
  }

  return null;
}

const python = resolvePythonCommand();

if (!python) {
  console.error("Unable to start Flask backend: no working Python interpreter was found.");
  console.error("The copied venv points to an unusable WindowsApps Python stub.");
  console.error("Set BACKEND_PYTHON to a valid python.exe or install a real Python interpreter.");
  process.exit(1);
}

const child = isCommandName(python.command)
  ? spawn("cmd.exe", ["/d", "/s", "/c", buildCmdCommandLine(python.command, [...python.args, backendScript])], {
      cwd: backendDir,
      stdio: "inherit",
      shell: false,
      env: {
        ...process.env,
        TF_CPP_MIN_LOG_LEVEL: process.env.TF_CPP_MIN_LOG_LEVEL || "2",
        TF_ENABLE_ONEDNN_OPTS: process.env.TF_ENABLE_ONEDNN_OPTS || "0",
      },
    })
  : spawn(python.command, [...python.args, backendScript], {
      cwd: backendDir,
      stdio: "inherit",
      shell: false,
      env: {
        ...process.env,
        TF_CPP_MIN_LOG_LEVEL: process.env.TF_CPP_MIN_LOG_LEVEL || "2",
        TF_ENABLE_ONEDNN_OPTS: process.env.TF_ENABLE_ONEDNN_OPTS || "0",
      },
    });

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
