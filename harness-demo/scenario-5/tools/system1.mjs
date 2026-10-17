#!/usr/bin/env node
// System 1 for a coding agent: fast, cheap decisions.
//
// A decision model (Cloudflare Clef-flash on Workers AI) does not write text.
// It reads a state, answers typed questions, and returns a probability for every
// allowed answer in a single forward pass, in tens of milliseconds. That suits
// the wide, shallow work an agent repeats on every task: which file, which tool,
// what kind of request. The agent's big model (System 2) keeps the slow work:
// reading code closely, editing it, explaining it.
//
// Usage:
//   node tools/system1.mjs rank  "<what you are looking for>"   which file to open
//   node tools/system1.mjs tools "<user request>"               which tools to load
//   node tools/system1.mjs route "<user request>"               question or change?
//
// Options: --offline (skip the model)  --json  --raw (print the API response)
//          --root <dir> (rank: where to search, default: this repo)
//
// Real model: export CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.
// Without them (or if the call fails) it uses an offline keyword stand-in and
// says so in its output. SYSTEM1_MODEL picks another model (default clef-flash).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODEL = process.env.SYSTEM1_MODEL || "@cf/cloudflare/clef-flash";
// Average big-model turn in the recorded scenario-1 run (32.8 s over 9 turns).
const SYSTEM2_SECONDS_PER_TURN = 3.6;

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((arg) => arg.startsWith("--") && arg !== "--root"));
const rootIndex = argv.indexOf("--root");
const searchRoot = rootIndex === -1 ? repoRoot : path.resolve(argv[rootIndex + 1] ?? ".");
const positional = argv.filter((arg, i) => !arg.startsWith("--") && argv[i - 1] !== "--root");
const [command, ...words] = positional;
const request = words.join(" ").trim();

const color = process.stdout.isTTY && !flags.has("--json");
const paint = (code) => (text) => (color ? `\x1b[${code}m${text}\x1b[0m` : String(text));
const bold = paint("1");
const dim = paint("2");
const amber = paint("33");
const green = paint("32");

// ── rank: which file should the agent open? ─────────────────────────────────

async function rank() {
  const gatherStart = performance.now();
  const candidates = gatherCandidates(request, searchRoot);
  const gatherMs = performance.now() - gatherStart;

  if (candidates.length === 0) {
    console.log(`No files mention: ${keywordsOf(request).join(", ")}`);
    return;
  }

  const keys = candidates.map((_, i) => `f${i + 1}`);
  const state = [
    `A coding agent must handle this request: ${request}`,
    "",
    "Candidate files found by search (path, top-of-file comments, matching lines):",
    ...candidates.map((c, i) => `\n[${keys[i]}] ${c.file}\n${c.excerpt}`),
  ].join("\n");
  const questions = {
    target: {
      type: "choice",
      instructions:
        "Which candidate file should the agent open to make this change? " +
        "Prefer the live source of truth over caches, snapshots, defaults, legacy copies and environment overrides.",
      criteria: Object.fromEntries(keys.map((key, i) => [key, `Candidate [${key}]: ${candidates[i].file}`])),
    },
  };

  const decision = await decide(state, questions, () => ({
    target: offlineRank(request, candidates, keys),
  }));
  const probs = choiceProbabilities(decision.answers.target, keys);
  const ranked = candidates
    .map((c, i) => ({ ...c, p: probs[keys[i]] ?? 0 }))
    .sort((a, b) => b.p - a.p);

  if (flags.has("--json")) {
    printJson({ command, request, engine: decision.engine, gather_ms: gatherMs, decide_ms: decision.ms, ranked });
    return;
  }

  header("rank", decision, `1 choice question, ${candidates.length} options`);
  console.log(dim(`gathered ${candidates.length} candidate files with grep in ${fmtMs(gatherMs)}`));
  console.log("");
  const width = Math.max(...ranked.map((c) => c.file.length));
  for (const c of ranked) {
    const line = `  ${c.p.toFixed(2)}  ${bar(c.p)}  ${c.file.padEnd(width)}  ${dim(c.headline)}`;
    console.log(c === ranked[0] ? bold(line) : line);
  }
  console.log("");
  const top = ranked[0];
  const next = top.p < 0.5 && ranked[1] ? ` (low confidence: also check ${ranked[1].file})` : "";
  console.log(green(`→ open ${top.file}  (p=${top.p.toFixed(2)})${next}`));
  console.log(
    dim(`  each file a big model opens itself costs a full turn (~${SYSTEM2_SECONDS_PER_TURN} s in the recorded s1 run)`),
  );
}

// ── tools: which tool definitions does this task need? ──────────────────────

const TOOL_CATALOG = [
  { name: "read_file", description: "Read a file from the repository", params: ["path", "offset", "limit"], words: ["read", "open", "show", "look", "file", "how", "what", "where", "why", "change", "update", "set"] },
  { name: "grep", description: "Search file contents for a regular expression", params: ["pattern", "path", "include"], words: ["where", "find", "search", "which", "defined", "used", "how", "why", "change", "update", "set"] },
  { name: "glob", description: "Find files by name pattern", params: ["pattern", "path"], words: ["file", "files", "named", "find", "where"] },
  { name: "edit_file", description: "Replace a string in a file", params: ["path", "old_string", "new_string"], words: ["change", "update", "set", "edit", "rename", "fix", "modify", "replace", "add", "remove"] },
  { name: "bash", description: "Run a shell command in the project directory", params: ["command", "timeout"], words: ["run", "execute", "script", "command", "install", "build"] },
  { name: "run_tests", description: "Run the project's test suite and report failures", params: ["filter"], words: ["test", "tests", "verify", "check", "break", "broken"] },
  { name: "git_history", description: "Read commit history and blame for a file", params: ["path", "since"], words: ["who", "when", "history", "changed", "blame", "commit", "why", "started", "since", "yesterday", "last"] },
  { name: "github_prs", description: "List, read and comment on pull requests", params: ["repo", "number", "body"], words: ["pr", "pull", "review", "merge", "github"] },
  { name: "jira", description: "Read and update Jira tickets", params: ["key", "fields"], words: ["ticket", "jira", "issue", "story", "sprint"] },
  { name: "postgres", description: "Run a read-only SQL query against the app database", params: ["sql"], words: ["database", "db", "sql", "table", "rows", "query", "records"] },
  { name: "browser", description: "Open a web page, click around and take screenshots", params: ["url", "action"], words: ["page", "browser", "ui", "screenshot", "url", "website", "click"] },
  { name: "slack", description: "Post a message to a Slack channel", params: ["channel", "text"], words: ["slack", "notify", "tell", "message", "channel", "team", "announce"] },
  { name: "sentry", description: "Read recent production errors and stack traces", params: ["project", "query"], words: ["error", "errors", "crash", "exception", "sentry", "stack", "failing", "failed", "production", "prod"] },
  { name: "figma", description: "Read frames and components from a design file", params: ["file", "node"], words: ["design", "figma", "mockup", "frame"] },
].map((tool) => ({ ...tool, tokens: estimateSchemaTokens(tool) }));

async function tools() {
  const questions = Object.fromEntries(
    TOOL_CATALOG.map((tool) => [
      `use_${tool.name}`,
      {
        type: "noul",
        instructions: `Will a coding agent need the "${tool.name}" tool (${tool.description}) to handle the request?`,
      },
    ]),
  );
  const state = `User request to a coding agent working in a code repository:\n${request}`;
  const decision = await decide(state, questions, () => offlineTools(request));
  const scored = TOOL_CATALOG.map((tool) => ({
    ...tool,
    p: noulProbability(decision.answers[`use_${tool.name}`]),
  })).sort((a, b) => b.p - a.p);
  const loaded = scored.filter((tool) => tool.p >= 0.5);
  const loadedTokens = loaded.reduce((sum, tool) => sum + tool.tokens, 0);
  const allTokens = scored.reduce((sum, tool) => sum + tool.tokens, 0);

  if (flags.has("--json")) {
    printJson({ command, request, engine: decision.engine, decide_ms: decision.ms, tools: scored.map(({ name, p, tokens }) => ({ name, p, tokens })) });
    return;
  }

  header("tools", decision, `${scored.length} yes/no questions in 1 request`);
  console.log("");
  for (const tool of scored) {
    const verdict = tool.p >= 0.5 ? green("load") : dim("skip");
    console.log(`  ${tool.p.toFixed(2)}  ${bar(tool.p)}  ${tool.name.padEnd(12)} ${verdict}`);
  }
  console.log("");
  console.log(
    green(`→ load ${loaded.length} of ${scored.length} tool definitions`) +
      dim(` (≈ ${loadedTokens.toLocaleString("en-US")} of ${allTokens.toLocaleString("en-US")} schema tokens, re-sent on every turn)`),
  );
}

// ── route: what kind of request is this? ────────────────────────────────────

async function route() {
  const intents = {
    question: "The user wants to understand or locate something. The answer is an explanation; no file should change.",
    change: "The user wants files in the repository modified.",
    run: "The user wants a command, script or test executed and the result reported.",
  };
  const questions = {
    intent: { type: "choice", instructions: "What does the user want the coding agent to do?", criteria: intents },
    multi_file: { type: "noul", instructions: "Will handling this request probably need more than two files read or changed?" },
    risky: {
      type: "noul",
      instructions: "Could a mistake here break production, security or data (for example permissions, auth, payments, migrations)?",
    },
  };
  const state = `User request to a coding agent working in a code repository:\n${request}`;
  const decision = await decide(state, questions, () => offlineRoute(request));
  const intent = choiceProbabilities(decision.answers.intent, Object.keys(intents));
  const multiFile = noulProbability(decision.answers.multi_file);
  const risky = noulProbability(decision.answers.risky);
  const best = Object.entries(intent).sort((a, b) => b[1] - a[1])[0][0];

  if (flags.has("--json")) {
    printJson({ command, request, engine: decision.engine, decide_ms: decision.ms, intent, multi_file: multiFile, risky });
    return;
  }

  header("route", decision, "3 questions in 1 request");
  console.log("");
  const intentLine = Object.entries(intent)
    .sort((a, b) => b[1] - a[1])
    .map(([name, p]) => (name === best ? bold(`${name} ${p.toFixed(2)}`) : `${name} ${p.toFixed(2)}`))
    .join("   ");
  console.log(`  intent       ${intentLine}`);
  console.log(`  multi-file   ${multiFile.toFixed(2)}  ${bar(multiFile, 10)}`);
  console.log(`  risky        ${risky.toFixed(2)}  ${bar(risky, 10)}`);
  console.log("");
  const advice = {
    question: "question → read-only tools (plan mode). Search, read, answer. Nothing should change.",
    change: "change → edit tools on. Search, read, edit, then verify the edit.",
    run: "run → shell tool on. Run it and report the output.",
  };
  console.log(green(`→ ${advice[best]}`));
  if (risky >= 0.5) console.log(amber("  risky area: double-check the target file and verify after any edit."));
  if (multiFile >= 0.5) console.log(dim("  multi-file: worth a plan before editing."));
}

// ── the model call ──────────────────────────────────────────────────────────

async function decide(state, questions, offline) {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_AUTH_TOKEN;
  if (flags.has("--offline") || !account || !token) {
    const started = performance.now();
    const answers = offline();
    return { engine: "offline", answers, ms: performance.now() - started, note: account && token ? "--offline" : "no Cloudflare credentials" };
  }

  // SYSTEM1_API_URL lets you go through an AI Gateway (or a local mock) instead.
  const url = process.env.SYSTEM1_API_URL || `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${MODEL}`;
  const body = { model: MODEL.split("/").pop(), state, questions };
  const started = performance.now();
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const json = await response.json().catch(() => ({}));
    const ms = performance.now() - started;
    if (flags.has("--raw")) console.error(JSON.stringify(json, null, 2));
    if (!response.ok || json.success === false) {
      const reason = json.errors?.map((e) => e.message).join("; ") || response.statusText;
      throw new Error(`HTTP ${response.status}: ${reason}`);
    }
    const answers = json.result?.answers ?? json.answers ?? json.result ?? {};
    for (const [name, question] of Object.entries(questions)) {
      const ok = question.type === "choice"
        ? Object.keys(choiceProbabilities(answers[name], Object.keys(question.criteria), { strict: true })).length > 0
        : Number.isFinite(noulProbability(answers[name]));
      if (!ok) throw new Error(`could not read the answer to "${name}" (run with --raw to inspect)`);
    }
    return { engine: "model", answers, ms };
  } catch (error) {
    console.error(amber(`Clef call failed (${error.message}). Using the offline stand-in.`));
    const started2 = performance.now();
    return { engine: "offline", answers: offline(), ms: performance.now() - started2, note: "model call failed" };
  }
}

// Decision-model responses carry a probability per option. Accept the common
// shapes: {a: 0.7, b: 0.3}, {probabilities: {...}}, [{option, probability}],
// {choice, confidence}.
function choiceProbabilities(answer, options, { strict = false } = {}) {
  const probs = {};
  const source = answer?.probabilities ?? answer?.scores ?? answer?.options ?? answer;
  if (Array.isArray(source)) {
    for (const item of source) {
      const key = item.option ?? item.label ?? item.name ?? item.choice;
      if (options.includes(key)) probs[key] = Number(item.probability ?? item.p ?? item.score);
    }
  } else if (source && typeof source === "object") {
    for (const key of options) if (Number.isFinite(source[key])) probs[key] = Number(source[key]);
  }
  if (Object.keys(probs).length === 0 && options.includes(answer?.choice)) {
    probs[answer.choice] = Number(answer.confidence ?? 1);
  }
  if (strict) return probs;
  const total = Object.values(probs).reduce((sum, p) => sum + p, 0) || 1;
  return Object.fromEntries(options.map((key) => [key, (probs[key] ?? 0) / total]));
}

function noulProbability(answer) {
  if (typeof answer === "number") return answer;
  const value = answer?.probability ?? answer?.p ?? answer?.true ?? answer?.yes ?? answer?.value;
  return Number.isFinite(Number(value)) ? Number(value) : NaN;
}

// ── offline stand-ins (keyword heuristics, not a model) ─────────────────────

function offlineRank(query, candidates, keys) {
  const scores = candidates.map((c) => {
    const firstLine = c.headline.toLowerCase();
    const header = c.header.toLowerCase();
    let score = c.keywordScore;
    if (/source of truth/.test(header)) score += 4;
    if (/\bproduction\b/.test(firstLine) && !/non-?prod/.test(firstLine)) score += 1;
    if (/auto-?generated|snapshot|cached?\b/.test(firstLine)) score -= 2.5;
    if (/deprecated|legacy|backward compat/.test(firstLine)) score -= 2;
    if (/override|non-?prod|staging/.test(firstLine)) score -= 2;
    if (/default/.test(firstLine)) score -= 1;
    return score;
  });
  return softmax(Object.fromEntries(keys.map((key, i) => [key, scores[i]])), 2);
}

function offlineTools(query) {
  const tokens = new Set(tokenize(query));
  return Object.fromEntries(
    TOOL_CATALOG.map((tool) => {
      const hits = tool.words.filter((word) => tokens.has(word)).length;
      return [`use_${tool.name}`, 1 - Math.exp(-0.9 * hits) * 0.95];
    }),
  );
}

function offlineRoute(query) {
  const q = query.toLowerCase();
  const asks = /^(how|what|why|where|which|who|when|does|do|is|are|can|could|explain|show|tell)\b/.test(q) || q.endsWith("?");
  const edits = /\b(change|update|set|add|remove|delete|rename|fix|refactor|implement|make|replace|bump|upgrade|grant)\b/.test(q);
  const runs = /\b(run|execute|test|build|deploy|start)\b/.test(q);
  return {
    intent: softmax({ question: asks ? 2.5 : 0, change: edits ? 2.5 : 0, run: runs ? 1.5 : 0 }, 1),
    multi_file: /\b(refactor|all|every|across|migrate|everywhere)\b/.test(q) ? 0.75 : 0.2,
    risky: /\b(permission|permissions|auth|password|token|payment|prod|production|migration|delete|security|role|access)\b/.test(q) ? 0.8 : 0.15,
  };
}

// ── candidate gathering (deterministic: this is the "grep" part) ────────────

const STOPWORDS = new Set("the a an and or of to in on for from with this that what where which who how is are be it its into project file files code change update set make from read write".split(" "));
const SKIP_DIRS = new Set(["node_modules", ".git", "tools", ".opencode", ".pi", ".claude"]);
const TEXT_EXT = new Set([".js", ".mjs", ".cjs", ".ts", ".json", ".yaml", ".yml"]);

function tokenize(text) {
  return text.toLowerCase().replace(/'s\b/g, "").split(/[^a-z0-9_]+/).filter(Boolean);
}

function keywordsOf(text) {
  return [...new Set(tokenize(text).filter((word) => word.length >= 3 && !STOPWORDS.has(word)))];
}

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...listFiles(path.join(dir, entry.name)));
    } else if (TEXT_EXT.has(path.extname(entry.name)) && entry.name !== "package.json") {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function gatherCandidates(query, root) {
  const keywords = keywordsOf(query);
  const files = listFiles(root).map((full) => ({
    full,
    file: path.relative(root, full).split(path.sep).join("/"),
    text: fs.readFileSync(full, "utf8"),
  }));
  // Rarer words say more: weight each keyword by how few files contain it.
  const df = Object.fromEntries(keywords.map((k) => [k, files.filter((f) => f.text.toLowerCase().includes(k)).length]));
  const idf = Object.fromEntries(keywords.map((k) => [k, df[k] ? Math.log(1 + files.length / df[k]) : 0]));

  const scored = files.map((f) => {
    const lower = f.text.toLowerCase();
    const matched = keywords.filter((k) => lower.includes(k) || f.file.toLowerCase().includes(k));
    const lines = f.text.split("\n");
    const headerLines = lines.filter((l) => l.trim().startsWith("//")).slice(0, 3);
    const lineScore = (l) => keywords.reduce((sum, k) => sum + (l.toLowerCase().includes(k) ? idf[k] : 0), 0);
    const hitLines = lines
      .filter((l) => l.trim() && !l.trim().startsWith("//") && lineScore(l) > 0)
      .sort((a, b) => lineScore(b) - lineScore(a))
      .slice(0, 2);
    return {
      file: f.file,
      keywordScore: matched.reduce((sum, k) => sum + idf[k], 0),
      header: headerLines.join("\n"),
      headline: (headerLines[0] ?? "").replace(/^\s*\/\/\s*/, "").slice(0, 70),
      excerpt: [...headerLines, ...hitLines.map((l) => `  ${l.trim()}`)].map((l) => l.slice(0, 160)).join("\n"),
    };
  });
  // Keep files that match a good share of the request, not every file with one common word.
  const best = Math.max(0, ...scored.map((c) => c.keywordScore));
  return scored
    .filter((c) => c.keywordScore > 0 && c.keywordScore >= best * 0.5)
    .sort((a, b) => b.keywordScore - a.keywordScore)
    .slice(0, 12);
}

// ── formatting helpers ──────────────────────────────────────────────────────

function header(name, decision, shape) {
  const engine =
    decision.engine === "model"
      ? `${MODEL.split("/").pop()} on Workers AI · ${shape} · ${fmtMs(decision.ms)} round trip`
      : amber(`offline stand-in (keyword heuristic, not a model; ${decision.note})`);
  console.log(`${bold(`System 1 · ${name}`)}   ${engine}`);
  console.log(dim(`request: ${request}`));
}

function bar(p, width = 20) {
  const filled = Math.round(Math.max(0, Math.min(1, p)) * width);
  return amber("█".repeat(filled)) + dim("░".repeat(width - filled));
}

function softmax(scores, temperature) {
  const entries = Object.entries(scores);
  const max = Math.max(...entries.map(([, s]) => s));
  const exps = entries.map(([k, s]) => [k, Math.exp((s - max) / temperature)]);
  const total = exps.reduce((sum, [, e]) => sum + e, 0);
  return Object.fromEntries(exps.map(([k, e]) => [k, e / total]));
}

function estimateSchemaTokens(tool) {
  const schema = {
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: "object",
      properties: Object.fromEntries(tool.params.map((p) => [p, { type: "string", description: `The ${p.replace(/_/g, " ")}` }])),
      required: tool.params.slice(0, 1),
    },
  };
  return Math.round(JSON.stringify(schema).length / 4);
}

function fmtMs(ms) {
  return ms < 1 ? "<1 ms" : `${Math.round(ms)} ms`;
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

// Dispatch last, so every constant above is initialised before it runs.
const commands = { rank, tools, route };
if (!commands[command] || !request) {
  console.log(`Usage:
  node tools/system1.mjs rank  "<what you are looking for>"
  node tools/system1.mjs tools "<user request>"
  node tools/system1.mjs route "<user request>"

Options: --offline  --json  --raw  --root <dir>`);
  process.exit(command ? 1 : 0);
}
await commands[command]();
