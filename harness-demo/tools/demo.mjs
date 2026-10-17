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
// The agent launch command, the same for every scenario so only the harness varies.
// Override with HARNESS_AGENT, e.g. HARNESS_AGENT="pi --model claude-haiku-4-5".
const agentCommand = process.env.HARNESS_AGENT || "opencode --model github-copilot/claude-haiku-4.5";

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
  5: {
    id: 5,
    label: "s5",
    title: "Fast System 1 model",
    lever: "system 1",
    codebase: "same mess as s1, generic ranking tool, no registry",
    target: "utils/cfg_res_acl.js",
    expected: "~3 calls",
    talkTrack: "A fast decision model ranks the look-alikes so the big model doesn't have to open them.",
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
  case "trace":
    printTrace(readScenarioArg(args[0]));
    break;
  case "doctor":
    await runDoctor();
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
  node tools/demo.mjs doctor              preflight: tools, credentials, clean fixtures
  node tools/demo.mjs init                reset every fixture and the scoreboard
  node tools/demo.mjs serve [--port 4177] serve the deck and the live results page
  node tools/demo.mjs stage <1-5>         mark a scenario as running, print its commands
  node tools/demo.mjs verify <1-5>        check which file changed, update the scoreboard
  node tools/demo.mjs trace <1-4>         replay a recorded run turn by turn
  node tools/demo.mjs score               print the scoreboard
  node tools/demo.mjs recorded            fill the scoreboard from the recordings

Agent command (same for every scenario): ${agentCommand}
Change it with HARNESS_AGENT="..." before running stage.
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
    if (url.pathname === "/api/config") {
      sendJson(res, {
        demoRoot,
        agentCommand,
        prompt: taskPrompt,
        system1: hasClefCredentials() ? "clef-flash" : "offline",
      });
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
    notes: "Staged. Run the agent, paste the prompt, then verify.",
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
  console.log(`  cd ${path.join(demoRoot, `scenario-${id}`)} && ${agentCommand}`);
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
    console.error("Scenario must be 1, 2, 3, 4, or 5.");
    process.exit(1);
  }
  return id;
}

function now() {
  return new Date().toISOString();
}

function hasClefCredentials() {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && (process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_AUTH_TOKEN));
}

// ── trace: replay a recorded run turn by turn ───────────────────────────────

function printTrace(id) {
  const rec = readRecordedRows().find((row) => row.scenario === id);
  if (!rec) {
    console.error(`No recording for s${id}. Recordings exist for: ${readRecordedRows().map((r) => `s${r.scenario}`).join(", ")}`);
    process.exit(1);
  }
  const tty = process.stdout.isTTY;
  const paint = (code) => (text) => (tty ? `\x1b[${code}m${text}\x1b[0m` : String(text));
  const [bold, dim, amber, cyan, green, red] = ["1", "2", "33", "36", "32", "31"].map(paint);
  const toolColor = { glob: amber, grep: amber, bash: amber, read: cyan, edit: rec.correct_target ? green : red };

  console.log(bold(`s${id} · recorded run · ${rec.model} · ${rec.turns.length} model turns · ${rec.total_tools} tool calls · ${rec.total_seconds} s`));
  console.log(dim(`prompt: ${taskPrompt}`));
  console.log("");
  rec.turns.forEach((turn, index) => {
    const said = turn.text.replace(/\s+/g, " ");
    console.log(`${bold(String(index + 1).padStart(2))}  ${dim(`${turn.seconds.toFixed(1)}s`.padStart(5))}  ${said.length > 96 ? `${said.slice(0, 95)}…` : said}`);
    for (const tool of turn.tools) {
      const paintTool = toolColor[tool.tool] ?? ((t) => t);
      console.log(`           ${paintTool(tool.tool.padEnd(5))} ${tool.summary.length > 80 ? `${tool.summary.slice(0, 79)}…` : tool.summary}`);
      const preview = previewOutput(tool.output);
      if (preview) console.log(dim(`                 → ${preview}`));
    }
  });
  console.log("");
  const verdict = rec.correct_target ? green("correct file") : red(`WRONG file (expected ${scenarios[id].target})`);
  console.log(`${bold("result:")} edited ${rec.edited_file} · ${verdict}`);
}

function previewOutput(output) {
  const lines = output
    .split("\n")
    .map((line) => line.replace(/^\d+:\s?/, "").trim())
    .filter((line) => line && !/^<\/?(path|type|content|entries)>/.test(line) && !/^\(End of file|^\(\d+ entries\)/.test(line));
  if (lines.length === 0) return "";
  const joined = lines.slice(0, 3).join(" | ");
  return joined.length > 90 ? `${joined.slice(0, 89)}…` : joined;
}

// ── doctor: preflight before the talk ───────────────────────────────────────

async function runDoctor() {
  const tty = process.stdout.isTTY;
  const paint = (code) => (text) => (tty ? `\x1b[${code}m${text}\x1b[0m` : String(text));
  const [ok, warn, bad, dim] = [paint("32")("ok  "), paint("33")("warn"), paint("31")("FAIL"), paint("2")];
  let failures = 0;
  const line = (status, text, hint) => {
    if (status === bad) failures += 1;
    console.log(`  ${status}  ${text}${hint ? dim(`\n        ${hint}`) : ""}`);
  };

  console.log("Harness demo preflight\n");

  const major = Number(process.versions.node.split(".")[0]);
  line(major >= 18 ? ok : bad, `node ${process.versions.node}`, major >= 18 ? "" : "Node 18+ is needed (fetch, performance).");

  const agentBin = agentCommand.split(/\s+/)[0];
  line(onPath(agentBin) ? ok : bad, `agent command: ${agentCommand}`, onPath(agentBin) ? "" : `${agentBin} is not on PATH. Install it or set HARNESS_AGENT.`);
  const others = ["opencode", "pi", "claude"].filter((bin) => bin !== agentBin && onPath(bin));
  if (others.length) line(ok, `also installed: ${others.join(", ")}`);

  line(onPath("python3") ? ok : bad, "python3 (used by reset.sh)");

  line(
    hasClefCredentials() ? ok : warn,
    hasClefCredentials() ? "System 1 will call Clef-flash on Workers AI" : "System 1 will use its offline stand-in",
    hasClefCredentials() ? "" : "export CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=... to use the real model",
  );

  const recorded = readRecordedRows();
  line(recorded.length >= 4 ? ok : bad, `recordings parsed: ${recorded.map((r) => `s${r.scenario}`).join(", ") || "none"}`);

  const leaks = Object.keys(scenarios).flatMap((id) =>
    fs.readdirSync(path.join(demoRoot, `scenario-${id}`)).filter((name) => /^session-.*\.md$|^TASK\.md$/.test(name)).map((name) => `scenario-${id}/${name}`),
  );
  line(leaks.length ? bad : ok, leaks.length ? `files an agent could read as hints: ${leaks.join(", ")}` : "no transcripts inside scenario folders", leaks.length ? "Move them to recordings/." : "");

  const dirtyLevels = Object.values(scenarios).flatMap((meta) => {
    const live = inspectScenario(meta);
    return live.changed_files.map((file) => `scenario-${meta.id}/${file}`);
  });
  line(dirtyLevels.length ? warn : ok, dirtyLevels.length ? `bhaskar is already "write" in: ${dirtyLevels.join(", ")}` : `bhaskar is "read" everywhere`, dirtyLevels.length ? "Run: node tools/demo.mjs init" : "");

  const git = spawnSync("git", ["status", "--porcelain", "--untracked-files=all", "--", "scenario-1", "scenario-2", "scenario-3", "scenario-4", "scenario-5", "concepts"], { cwd: demoRoot, encoding: "utf8" });
  if (git.status === 0) {
    const changed = git.stdout.split("\n").filter(Boolean);
    line(changed.length ? warn : ok, changed.length ? `${changed.length} fixture file(s) differ from git:` : "fixtures match git");
    for (const entry of changed.slice(0, 12)) console.log(dim(`        ${entry}`));
    if (changed.length) console.log(dim("        Restore with: git checkout -- <file>   (new files: delete them)"));
  }

  const port = 4177;
  const running = await fetch(`http://127.0.0.1:${port}/api/config`).then((r) => r.ok).catch(() => false);
  line(running ? ok : warn, running ? `deck server running on :${port}` : `deck server not running on :${port}`, running ? "" : "Start it in its own terminal: node tools/demo.mjs serve");

  console.log("");
  console.log(failures ? paint("31")(`${failures} problem(s) to fix before the talk.`) : paint("32")("Ready."));
  if (failures) process.exitCode = 1;
}

function onPath(bin) {
  return spawnSync("sh", ["-c", `command -v ${JSON.stringify(bin)}`], { encoding: "utf8" }).status === 0;
}
