const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const frontendDir = path.join(rootDir, "frontend");
const backendUrl = process.env.BTDS_BACKEND_HEALTH_URL || "http://127.0.0.1:5000/health";
const timeoutMs = 45000;
const pollMs = 1000;

function waitForBackend(url, timeout) {
  const deadline = Date.now() + timeout;

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });

      request.on("error", retry);
      request.setTimeout(1500, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() >= deadline) {
        reject(new Error(`Timed out waiting for backend at ${url}`));
        return;
      }
      setTimeout(attempt, pollMs);
    };

    attempt();
  });
}

async function main() {
  try {
    await waitForBackend(backendUrl, timeoutMs);
  } catch (error) {
    console.warn(String(error.message || error));
    console.warn("Starting frontend anyway.");
  }

  const child = spawn(
    process.execPath,
    [path.join(rootDir, "scripts", "run-react-scripts.js"), "start"],
    {
      cwd: frontendDir,
      stdio: "inherit",
      shell: false,
      env: {
        ...process.env,
        BROWSERSLIST_IGNORE_OLD_DATA: "true",
      },
    }
  );

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

main();
