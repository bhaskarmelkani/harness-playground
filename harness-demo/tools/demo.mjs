#!/usr/bin/env node

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const toolsDir = path.dirname(__filename);
const demoRoot = path.resolve(toolsDir, "..");
const repoRoot = path.resolve(demoRoot, "..");
const statePath = path.join(demoRoot, ".demo-state.json");
const sessionTablePath = path.join(toolsDir, "session-table.mjs");
const resetPath = path.join(demoRoot, "reset.sh");

const taskPrompt = 'Change bhaskar\'s permission level from "read" to "write" in this project.';

const scenarios = {
  1: {
    id: 1,
    label: "s1",
    title: "Maximum ambiguity",
    lever: "none",
    codebase: "messy repo, cryptic target, four decoys",
    target: "utils/cfg_res_acl.js",
    expected: "10-14 calls, high risk",
    talkTrack: "No harness. The agent has to discover the source of truth.",
    watchFiles: [
      "utils/cfg_res_acl.js",
      "config/access-defaults.js",
      "utils/permissions-snapshot.js",
      "utils/permissions-legacy.js",
    ],
  },
  2: {
    id: 2,
    label: "s2",
    title: "Good filename",
    lever: "naming",
    codebase: "clean target name, no decoys",
    target: "utils/user-permissions.js",
    expected: "3-5 calls",
    talkTrack: "The filename becomes the search index.",
    watchFiles: ["utils/user-permissions.js"],
  },
  3: {
    id: 3,
    label: "s3",
    title: "Startup doc",
    lever: "docs",
    codebase: "clean repo plus CLAUDE.md",
    target: "utils/user-permissions.js",
    expected: "2-3 calls",
    talkTrack: "The startup doc removes discovery.",
    watchFiles: ["utils/user-permissions.js"],
  },
  4: {
    id: 4,
    label: "s4",
    title: "Project tool",
    lever: "skill/tool",
    codebase: "same mess as s1, but with a helper",
    target: "utils/cfg_res_acl.js",
    expected: "3-4 calls",
    talkTrack: "The tool encodes the senior-engineer hint once.",
    watchFiles: [
      "utils/cfg_res_acl.js",
      "config/access-defaults.js",
      "utils/permissions-snapshot.js",
      "utils/permissions-legacy.js",
    ],
  },
};

const command = process.argv[2] ?? "help";
const args = process.argv.slice(3);

switch (command) {
  case "init":
    initDemo();
    break;
  case "serve":
    serveDemo(args);
    break;
  case "stage":
    stageScenario(readScenarioArg(args[0]));
    break;
  case "verify":
    verifyScenario(readScenarioArg(args[0]));
    break;
  case "score":
    scoreDemo();
    break;
  case "recorded":
    loadRecorded();
    break;
  case "help":
  case "--help":
  case "-h":
    printHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
}

function printHelp() {
  console.log(`Harness demo stage manager

Usage:
  node harness-demo/tools/demo.mjs init
  node harness-demo/tools/demo.mjs serve [--port 4177]
  node harness-demo/tools/demo.mjs stage <1|2|3|4>
  node harness-demo/tools/demo.mjs verify <1|2|3|4>
  node harness-demo/tools/demo.mjs score
  node harness-demo/tools/demo.mjs recorded

Talk loop:
  1. init once before the talk
  2. serve the browser deck and live results in one terminal
  3. stage a scenario
  4. run opencode in that scenario directory
  5. verify the scenario to update the live results page
`);
}

function initDemo() {
  runReset();
  const state = makeFreshState();
  state.timeline.push(timelineItem("init", null, "Scenarios reset and scoreboard initialized."));
  writeState(state);
  console.log("");
  console.log("Demo initialized.");
  console.log("");
  console.log("Start the browser server in a second terminal:");
  console.log(`  node ${path.join(demoRoot, "tools/demo.mjs")} serve`);
  console.log("");
  console.log("Then open:");
  console.log("  http://localhost:4177/presentation");
  console.log("  http://localhost:4177/results");
  console.log("");
  printScoreRows(state.rows);
}

function serveDemo(serveArgs) {
  const port = Number(readOption(serveArgs, "--port", "4177"));
  if (!fs.existsSync(statePath)) {
    writeState(makeFreshState());
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    if (url.pathname === "/") {
      redirect(res, "/presentation");
      return;
    }
    if (url.pathname === "/favicon.ico") {
      res.writeHead(204, { "cache-control": "no-store" });
      res.end();
      return;
    }
    if (url.pathname === "/presentation" || url.pathname === "/presentation.html") {
      sendFile(res, path.join(demoRoot, "presentation.html"), "text/html; charset=utf-8");
      return;
    }
    if (url.pathname === "/results" || url.pathname === "/results.html") {
      sendFile(res, path.join(demoRoot, "results.html"), "text/html; charset=utf-8");
      return;
    }
    if (url.pathname === "/api/state") {
      sendJson(res, readState());
      return;
    }
    if (url.pathname === "/api/sessions") {
      sendJson(res, readRecordedRows());
      return;
    }
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  });

  server.on("error", (error) => {
    console.error(`Could not start the local server on port ${port}: ${error.message}`);
    if (error.code === "EADDRINUSE") {
      console.error(`Try another port: node ${path.join(demoRoot, "tools/demo.mjs")} serve --port 4188`);
    }
    process.exit(1);
  });

  server.listen(port, "127.0.0.1", () => {
    console.log("Harness demo server running.");
    console.log(`  Presentation: http://localhost:${port}/presentation`);
    console.log(`  Live results: http://localhost:${port}/results`);
    console.log("");
    console.log("Keep this terminal open during the talk.");
  });
}

function stageScenario(id) {
  const meta = scenarios[id];
  const state = readState();
  const row = findRow(state, id);
  const live = inspectScenario(meta);
  row.status = "running";
  row.live = {
    ...live,
    status: "running",
    notes: "Staged. Run opencode, paste the prompt, then verify.",
  };
  state.activeScenario = id;
  state.lastUpdatedAt = now();
  state.timeline.push(timelineItem("stage", id, `${meta.label} staged: ${meta.title}.`));
  writeState(state);

  console.log(`${meta.label.toUpperCase()} staged: ${meta.title}`);
  console.log("");
  console.log(meta.talkTrack);
  console.log("");
  console.log("Run (same model every scenario — only the harness changes):");
  console.log(`  cd ${path.join(demoRoot, `scenario-${id}`)} && opencode --model github-copilot/claude-haiku-4.5`);
  console.log("");
  console.log("Paste this prompt:");
  console.log(`  ${taskPrompt}`);
  console.log("");
  console.log("When the agent finishes, update the live results:");
  console.log(`  node ${path.join(demoRoot, "tools/demo.mjs")} verify ${id}`);
}

function verifyScenario(id) {
  const meta = scenarios[id];
  const state = readState();
  const row = findRow(state, id);
  const live = inspectScenario(meta);
  const passed = live.correct_target === true;
  row.status = passed ? "passed" : "failed";
  row.live = {
    ...live,
    correct_target: passed,
    status: row.status,
    verifiedAt: now(),
  };
  state.lastUpdatedAt = now();
  state.timeline.push(timelineItem("verify", id, `${meta.label} ${row.status}: ${live.notes}`));
  writeState(state);

  console.log(`${meta.label.toUpperCase()} ${passed ? "PASS" : "FAIL"}`);
  console.log(`  Target: ${meta.target}`);
  console.log(`  Bhaskar target level: ${live.target_level || "missing"}`);
  console.log(`  Edited file detected: ${live.edited_file}`);
  console.log(`  Notes: ${live.notes}`);
  console.log("");
  printScoreRows(state.rows);
}

function scoreDemo() {
  const state = readState();
  console.log("Current live score");
  console.log("");
  printScoreRows(state.rows);
  console.log("");
  console.log(`Results page: http://localhost:4177/results`);
}

function loadRecorded() {
  const state = readState();
  const recorded = readRecordedRows();
  for (const row of state.rows) {
    const rec = recorded.find((item) => item.scenario === row.id);
    if (!rec) continue;
    row.status = rec.correct_target ? "passed" : "failed";
    row.live = {
      status: row.status,
      correct_target: rec.correct_target,
      edited_file: rec.edited_file,
      target_level: rec.correct_target ? "write" : "read",
      changed_files: rec.edited_file && rec.edited_file !== "-" ? [rec.edited_file] : [],
      notes: `Recorded run: ${rec.notes}`,
      verifiedAt: now(),
    };
  }
  state.lastUpdatedAt = now();
  state.activeScenario = null;
  state.timeline.push(timelineItem("recorded", null, "Loaded recorded session outcomes into the live scoreboard."));
  writeState(state);
  console.log("Recorded session outcomes loaded into the live scoreboard.");
  printScoreRows(state.rows);
}

function runReset() {
  const result = spawnSync("bash", [resetPath], {
    cwd: demoRoot,
    encoding: "utf8",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function makeFreshState() {
  const recorded = readRecordedRows();
  return {
    version: 1,
    title: "The Harness Around the Model",
    prompt: taskPrompt,
    demoRoot,
    repoRoot,
    initializedAt: now(),
    lastUpdatedAt: now(),
    activeScenario: null,
    rows: Object.values(scenarios).map((meta) => {
      const rec = recorded.find((item) => item.scenario === meta.id);
      return {
        id: meta.id,
        label: meta.label,
        title: meta.title,
        lever: meta.lever,
        codebase: meta.codebase,
        target: meta.target,
        expected: meta.expected,
        talkTrack: meta.talkTrack,
        status: "pending",
        recorded: rec
          ? {
              total_tools: rec.total_tools,
              searchish_total: rec.searchish_total,
              edited_file: rec.edited_file,
              correct_target: rec.correct_target,
              notes: rec.notes,
              sequence: rec.sequence,
            }
          : null,
        live: {
          ...inspectScenario(meta),
          status: "pending",
          notes: "Waiting to run live.",
        },
      };
    }),
    timeline: [],
  };
}

function readRecordedRows() {
  const result = spawnSync(process.execPath, [sessionTablePath, "--format", "json"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return [];
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    return [];
  }
}

function inspectScenario(meta) {
  const scenarioDir = path.join(demoRoot, `scenario-${meta.id}`);
  const levels = {};
  const changedFiles = [];

  for (const rel of meta.watchFiles) {
    const full = path.join(scenarioDir, rel);
    const level = readBhaskarLevel(full);
    levels[rel] = level;
    if (level === "write") changedFiles.push(rel);
  }

  const targetLevel = levels[meta.target] ?? "";
  const wrongWrites = changedFiles.filter((file) => file !== meta.target);
  if (targetLevel === "write") {
    return {
      correct_target: true,
      target_level: targetLevel,
      edited_file: meta.target,
      changed_files: changedFiles,
      levels,
      notes: wrongWrites.length
        ? `Target is correct, but also saw writes in ${wrongWrites.join(", ")}.`
        : "Bhaskar is write in the production target.",
    };
  }
  if (wrongWrites.length > 0) {
    return {
      correct_target: false,
      target_level: targetLevel,
      edited_file: wrongWrites[0],
      changed_files: changedFiles,
      levels,
      notes: `Wrong file changed: ${wrongWrites[0]}. Target is still ${targetLevel || "missing"}.`,
    };
  }
  return {
    correct_target: null,
    target_level: targetLevel,
    edited_file: "-",
    changed_files: changedFiles,
    levels,
    notes: "No live change detected yet.",
  };
}

function readBhaskarLevel(filePath) {
  if (!fs.existsSync(filePath)) return "";
  const text = fs.readFileSync(filePath, "utf8");
  const match = text.match(/bhaskar\s*:\s*\{[^}]*?level\s*:\s*["']([^"']+)["']/s);
  return match?.[1] ?? "";
}

function readState() {
  if (!fs.existsSync(statePath)) {
    return makeFreshState();
  }
  return JSON.parse(fs.readFileSync(statePath, "utf8"));
}

function writeState(state) {
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function findRow(state, id) {
  const row = state.rows.find((item) => item.id === id);
  if (!row) {
    console.error(`Scenario ${id} is missing from state. Run init again.`);
    process.exit(1);
  }
  return row;
}

function printScoreRows(rows) {
  const printable = rows.map((row) => ({
    scenario: row.label,
    lever: row.lever,
    live: row.status,
    calls: row.recorded?.total_tools ?? "-",
    correct: String(row.live?.correct_target ?? "-"),
    edited: row.live?.edited_file ?? "-",
  }));
  const widths = {
    scenario: 8,
    lever: 12,
    live: 10,
    calls: 5,
    correct: 8,
    edited: 32,
  };
  const headers = ["scenario", "lever", "live", "calls", "correct", "edited"];
  console.log(headers.map((key) => pad(key, widths[key])).join("  "));
  console.log(headers.map((key) => "-".repeat(widths[key])).join("  "));
  for (const row of printable) {
    console.log(headers.map((key) => pad(row[key], widths[key])).join("  "));
  }
}

function pad(value, width) {
  const text = String(value);
  if (text.length >= width) return text.slice(0, width);
  return `${text}${" ".repeat(width - text.length)}`;
}

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end(String(error.message ?? error));
      return;
    }
    res.writeHead(200, {
      "content-type": contentType,
      "cache-control": "no-store",
    });
    res.end(data);
  });
}

function sendJson(res, value) {
  res.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(`${JSON.stringify(value, null, 2)}\n`);
}

function redirect(res, location) {
  res.writeHead(302, { location });
  res.end();
}

function timelineItem(action, scenario, message) {
  return {
    at: now(),
    action,
    scenario,
    message,
  };
}

function readOption(optionArgs, name, fallback) {
  const index = optionArgs.indexOf(name);
  if (index === -1) return fallback;
  return optionArgs[index + 1] ?? fallback;
}

function readScenarioArg(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || !(id in scenarios)) {
    console.error("Scenario must be 1, 2, 3, or 4.");
    process.exit(1);
  }
  return id;
}

function now() {
  return new Date().toISOString();
}
