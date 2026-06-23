#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const repoRoot = path.resolve(scriptDir, "..", "..");
const demoRoot = path.join(repoRoot, "harness-demo");

const expectedTargets = {
  1: "utils/cfg_res_acl.js",
  2: "utils/user-permissions.js",
  3: "utils/user-permissions.js",
  4: "utils/cfg_res_acl.js",
};

const scenarioNotes = {
  1: "Maximum ambiguity; messy repo and decoys",
  2: "Semantic filename reduces exploration",
  3: "Context file short-circuits discovery",
  4: "Custom tool shortcuts search on messy repo",
};

function parseArgs(argv) {
  const result = {
    format: "table",
    details: false,
    scenario: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--details") {
      result.details = true;
      continue;
    }
    if (arg === "--format") {
      result.format = argv[i + 1] ?? result.format;
      i += 1;
      continue;
    }
    if (arg === "--scenario") {
      const value = Number.parseInt(argv[i + 1] ?? "", 10);
      if (!Number.isNaN(value)) result.scenario = value;
      i += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!["table", "json"].includes(result.format)) {
    console.error(`Unsupported format: ${result.format}`);
    process.exit(1);
  }

  return result;
}

function printHelp() {
  console.log(`Usage: node harness-demo/tools/session-table.mjs [options]

Options:
  --scenario <n>    Only include a single scenario
  --format <type>   table (default) or json
  --details         Include per-scenario discovery details
  --help, -h        Show this help
`);
}

function findSessionFiles() {
  if (!fs.existsSync(demoRoot)) {
    console.error(`Could not find harness demo directory: ${demoRoot}`);
    process.exit(1);
  }

  const dirs = fs
    .readdirSync(demoRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^scenario-\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]));

  return dirs.flatMap((dirName) => {
    const scenarioDir = path.join(demoRoot, dirName);
    return fs
      .readdirSync(scenarioDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^session-.*\.md$/.test(entry.name))
      .map((entry) => ({
        scenario: Number.parseInt(dirName.split("-")[1], 10),
        scenarioDir,
        sessionFile: path.join(scenarioDir, entry.name),
      }));
  });
}

function parseSession(sessionInfo) {
  const markdown = fs.readFileSync(sessionInfo.sessionFile, "utf8");
  const tools = [];
  const toolRegex = /\*\*Tool: ([^*]+)\*\*\s+\*\*Input:\*\*\s+```json\s*([\s\S]*?)```/g;

  for (const match of markdown.matchAll(toolRegex)) {
    const tool = match[1].trim();
    const rawInput = match[2].trim();
    let input = {};

    try {
      input = JSON.parse(rawInput);
    } catch {
      input = { __raw: rawInput };
    }

    tools.push({ tool, input });
  }

  const counts = countTools(tools);
  const editedFile = findEditedFile(tools, sessionInfo.scenarioDir);
  const expectedTarget = expectedTargets[sessionInfo.scenario] ?? "";
  const correctTarget = editedFile === expectedTarget;

  return {
    scenario: sessionInfo.scenario,
    session_file: path.basename(sessionInfo.sessionFile),
    total_tools: tools.length,
    bash: counts.bash,
    glob: counts.glob,
    grep: counts.grep,
    read: counts.read,
    edit: counts.edit,
    searchish_total: countSearchishTools(tools),
    edited_file: editedFile || "-",
    correct_target: correctTarget,
    notes: buildNotes(sessionInfo.scenario, editedFile, correctTarget),
    sequence: tools.map((item) => item.tool),
    searchish_details: buildSearchishDetails(tools),
  };
}

function countTools(tools) {
  const counts = { bash: 0, glob: 0, grep: 0, read: 0, edit: 0 };
  for (const item of tools) {
    if (item.tool in counts) counts[item.tool] += 1;
  }
  return counts;
}

function countSearchishTools(tools) {
  return tools.filter((item) => {
    if (item.tool === "glob" || item.tool === "grep") return true;
    if (item.tool !== "bash") return false;
    return isSearchLikeBash(item.input);
  }).length;
}

function isSearchLikeBash(input) {
  const command = String(input.command ?? "");
  const description = String(input.description ?? "");
  const text = `${command}\n${description}`;

  return (
    /\b(find|grep|rg|ripgrep|glob|fd|ls)\b/i.test(text) ||
    /\b(search|explore|locate|look for|discover|project structure|configuration files)\b/i.test(text)
  );
}

function findEditedFile(tools, scenarioDir) {
  const editTool = tools.find((item) => item.tool === "edit" && typeof item.input.filePath === "string");
  if (!editTool) return "";
  return normalizePath(editTool.input.filePath, scenarioDir);
}

function normalizePath(filePath, scenarioDir) {
  if (!filePath) return "";
  if (path.isAbsolute(filePath)) {
    return path.relative(scenarioDir, filePath).replaceAll(path.sep, "/");
  }
  return filePath.replaceAll(path.sep, "/");
}

function buildNotes(scenario, editedFile, correctTarget) {
  if (!editedFile) return "No edit recorded";
  if (scenario === 1 && editedFile === "config/access-defaults.js") {
    return "Wrong file edited; default config not source of truth";
  }
  if (!correctTarget) {
    return `Wrong target edited; expected ${expectedTargets[scenario]}`;
  }
  return scenarioNotes[scenario] ?? "Correct target edited";
}

function buildSearchishDetails(tools) {
  return tools
    .filter((item) => item.tool === "glob" || item.tool === "grep" || (item.tool === "bash" && isSearchLikeBash(item.input)))
    .map((item) => {
      if (item.tool === "bash") {
        return `bash:${String(item.input.description ?? item.input.command ?? "").trim()}`;
      }
      if (item.tool === "glob") {
        return `glob:${String(item.input.pattern ?? "").trim()}`;
      }
      if (item.tool === "grep") {
        return `grep:${String(item.input.pattern ?? "").trim()}`;
      }
      return item.tool;
    });
}

function renderTable(rows) {
  const headers = [
    "scenario",
    "session_file",
    "total_tools",
    "bash",
    "glob",
    "grep",
    "read",
    "edit",
    "searchish_total",
    "edited_file",
    "correct_target",
    "notes",
  ];

  const headerLine = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) =>
    `| ${[
      `s${row.scenario}`,
      row.session_file,
      row.total_tools,
      row.bash,
      row.glob,
      row.grep,
      row.read,
      row.edit,
      row.searchish_total,
      row.edited_file,
      row.correct_target,
      row.notes,
    ].join(" | ")} |`,
  );

  console.log(headerLine);
  console.log(separator);
  body.forEach((line) => console.log(line));
  console.log("");
  console.log("Tool sequences:");
  rows.forEach((row) => {
    console.log(`- s${row.scenario}: ${row.sequence.join(" -> ")}`);
  });
}

function renderDetails(rows) {
  console.log("");
  console.log("Search details:");
  rows.forEach((row) => {
    const detail = row.searchish_details.length > 0 ? row.searchish_details.join(" | ") : "none";
    console.log(`- s${row.scenario}: ${detail}`);
  });
}

const args = parseArgs(process.argv.slice(2));
const rows = findSessionFiles()
  .map(parseSession)
  .filter((row) => (args.scenario ? row.scenario === args.scenario : true))
  .sort((a, b) => a.scenario - b.scenario);

if (rows.length === 0) {
  console.error("No matching session markdown files found.");
  process.exit(1);
}

if (args.format === "json") {
  console.log(JSON.stringify(rows, null, 2));
} else {
  renderTable(rows);
  if (args.details) renderDetails(rows);
}
