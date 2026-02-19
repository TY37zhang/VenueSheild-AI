import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadDotEnv(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf8");
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const idx = line.indexOf("=");
    if (idx <= 0) {
      continue;
    }

    const key = line.slice(0, idx).trim();
    const rawValue = line.slice(idx + 1).trim();
    if (!key) {
      continue;
    }

    env[key] = stripQuotes(rawValue);
  }

  return env;
}

const mergedEnv = {
  ...process.env,
  ...loadDotEnv(".env"),
  ...loadDotEnv(".env.local"),
};

const tasks = [
  {
    name: "next-dev",
    cmd: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "dev"],
  },
  {
    name: "shadow-adapter",
    cmd: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "shadow:adapter"],
  },
];

const children = [];
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
    process.exit(code);
  }, 1500);
}

for (const task of tasks) {
  const child = spawn(task.cmd, task.args, {
    stdio: "inherit",
    env: mergedEnv,
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;

    if (signal) {
      console.error(`[demo:local] ${task.name} exited from signal ${signal}`);
      shutdown(1);
      return;
    }

    if (typeof code === "number" && code !== 0) {
      console.error(`[demo:local] ${task.name} exited with code ${code}`);
      shutdown(code);
    }
  });

  children.push(child);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("[demo:local] running: next dev + shadow adapter");
console.log("[demo:local] open http://localhost:3000/feed");
if (mergedEnv.SHADOW_DEBUG_LOGS === "true") {
  console.log("[demo:local] SHADOW_DEBUG_LOGS=true");
}
