#!/usr/bin/env node
/**
 * Cadence lint: read closes out of git history, not out of the wiki's own prose.
 *
 * Every other check here can be satisfied by an agent working fast and shallow.
 * This one is harder to satisfy by accident: an agent that closes eleven
 * questions in nine minutes leaves that fact in the history whether or not its
 * pages say so.
 *
 * It is NOT unforgeable, and an earlier version of this comment claimed it was.
 * Both timestamps git records come from the environment — `GIT_AUTHOR_DATE` and
 * `GIT_COMMITTER_DATE` — and six closes committed seconds apart with dates
 * spread across two days pass clean. Reading both dates and flagging on either
 * (which this does) raises the cost from one variable to two; it does not close
 * the hole, and no local check can, because the history is written by the same
 * process being measured. The honest claim is that this is a signal an agent is
 * *unlikely to think to* author — not one it cannot.
 *
 * What it does catch, observed rather than assumed: batch-staging 21 files in
 * an unwatched directory and `git mv`-ing them into place. All 21 are still
 * adds.
 *
 * A close = a page added under a watched directory (default `wiki/decisions`).
 * Limits come from cadence.json at the instance root, if present.
 *
 * Usage: node scripts/lint-cadence.mjs [--since <git-date>] [--dir <path>]… [--report]
 *   --dir     watch this path instead of wiki/decisions; repeatable. Lets the
 *             check run over another repository's history — e.g. the corpus it
 *             was written in response to.
 *   --report  print the histogram and exit 0 regardless of violations
 *
 * Node stdlib only.
 */
import { spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** See validate.mjs: LLM_WIKI_ROOT lets the negative fixtures run these checks. */
const root = process.env.LLM_WIKI_ROOT
  ? resolve(process.env.LLM_WIKI_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Version of the template these scripts were copied from. Instances pin a
 * template commit when they instantiate; this constant is what lets a later
 * reader notice the copy is stale. See docs/upgrading.md in the pattern repo.
 */
const TEMPLATE_VERSION = "1.1.0";

const DEFAULTS = {
  maxClosesPerCommit: 1,
  maxClosesPerDay: 6,
  minGapMinutes: 15,
};

/** Record separator: any token that cannot occur in a path or an ISO date. */
const SEP = "@@commit@@";

const args = process.argv.slice(2);
const reportOnly = args.includes("--report");
const sinceIdx = args.indexOf("--since");
const since = sinceIdx >= 0 ? args[sinceIdx + 1] : null;

const dirs = args.flatMap((a, i) => (a === "--dir" && args[i + 1] ? [args[i + 1]] : []));
const watched = dirs.length ? dirs : ["wiki/decisions"];

async function loadLimits() {
  const path = join(root, "cadence.json");
  try {
    await stat(path);
  } catch {
    return { ...DEFAULTS, source: "defaults" };
  }
  try {
    return { ...DEFAULTS, ...JSON.parse(await readFile(path, "utf8")), source: "cadence.json" };
  } catch (e) {
    console.error(JSON.stringify({ ok: false, errors: [`E_CADENCE_CONFIG ${e.message}`] }, null, 2));
    process.exit(1);
  }
}

/** Both dates, because both are env-settable and forging only one is the cheaper mistake. */
function gitCloses() {
  const gitArgs = [
    "log",
    "--diff-filter=A",
    "--no-renames", // a file `git mv`d into a watched directory is a close, not a move
    "--name-only",
    `--format=${SEP}%H %aI %cI`,
    ...(since ? ["--since", since] : []),
    "--",
    ...watched,
  ];
  const r = spawnSync("git", gitArgs, { cwd: root, encoding: "utf8" });
  if (r.status !== 0) return null;

  const commits = [];
  for (const chunk of r.stdout.split(SEP).slice(1)) {
    const [header, ...rest] = chunk.split("\n");
    const [sha, authored, committed] = header.trim().split(" ");
    const files = rest.map((l) => l.trim()).filter((l) => l.endsWith(".md"));
    if (files.length) commits.push({ sha, authored, committed: committed ?? authored, files });
  }
  return commits.reverse(); // oldest first
}

/**
 * One pass over one date stream. Run twice — an agent that sets GIT_AUTHOR_DATE
 * and forgets GIT_COMMITTER_DATE (or the reverse) is caught by the other pass.
 */
function analyse(commits, limits, stream) {
  const violations = [];
  const perDay = new Map();
  const closes = [];
  const tag = stream === "authored" ? "" : " [committer dates]";

  for (const c of commits) {
    const iso = c[stream];
    if (c.files.length > limits.maxClosesPerCommit) {
      violations.push(
        `E_CADENCE_BATCH ${c.sha.slice(0, 9)}: ${c.files.length} closes in one commit (limit ${limits.maxClosesPerCommit})${tag}`,
      );
    }
    const day = iso.slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + c.files.length);
    for (const f of c.files) closes.push({ at: new Date(iso), file: f, sha: c.sha });
  }

  for (const [day, n] of perDay) {
    if (n > limits.maxClosesPerDay) {
      violations.push(`E_CADENCE_DAY ${day}: ${n} closes (limit ${limits.maxClosesPerDay})${tag}`);
    }
  }

  closes.sort((a, b) => a.at - b.at);
  const gaps = [];
  for (let i = 1; i < closes.length; i += 1) {
    const mins = (closes[i].at - closes[i - 1].at) / 60000;
    gaps.push(mins);
    if (mins < limits.minGapMinutes) {
      violations.push(
        `E_CADENCE_GAP ${closes[i].file}: ${mins.toFixed(1)} min after the previous close (limit ${limits.minGapMinutes})${tag}`,
      );
    }
  }

  const sorted = [...gaps].sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;

  return {
    violations,
    closes: closes.length,
    days: perDay.size,
    medianGapMinutes: median === null ? null : Number(median.toFixed(1)),
    busiestDay: [...perDay.entries()].sort((a, b) => b[1] - a[1])[0] ?? null,
  };
}

async function main() {
  const limits = await loadLimits();
  const commits = gitCloses();

  if (commits === null) {
    console.log(JSON.stringify({ ok: true, note: "not a git repository — cadence not checkable" }));
    return;
  }
  if (commits.length === 0) {
    console.log(JSON.stringify({ ok: true, closes: 0, watched, note: "no closes in range" }));
    return;
  }

  const byAuthor = analyse(commits, limits, "authored");
  const byCommitter = analyse(commits, limits, "committed");
  // Report a committer-date violation only when the author dates did not already
  // say the same thing: the second pass exists to catch the half-forged case, and
  // reporting every finding twice would bury it.
  const seen = new Set(byAuthor.violations);
  const violations = [
    ...byAuthor.violations,
    ...byCommitter.violations.filter((v) => !seen.has(v.replace(" [committer dates]", ""))),
  ];

  const result = {
    ok: violations.length === 0,
    version: TEMPLATE_VERSION,
    limits,
    watched,
    closes: byAuthor.closes,
    days: { authored: byAuthor.days, committed: byCommitter.days },
    medianGapMinutes: {
      authored: byAuthor.medianGapMinutes,
      committed: byCommitter.medianGapMinutes,
    },
    busiestDay: { authored: byAuthor.busiestDay, committed: byCommitter.busiestDay },
    violations,
  };

  if (violations.length && !reportOnly) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
