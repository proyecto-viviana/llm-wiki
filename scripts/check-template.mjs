#!/usr/bin/env node
/**
 * Meta-repo check.
 *
 * Two halves, and the second is the one that matters:
 *   1. the template has its required paths, and the minimal example passes;
 *   2. every negative fixture under examples/failing/ FAILS, with the specific
 *      error code it is supposed to produce.
 *
 * Half 1 alone is what a green corpus with no evidence looks like: checks that
 * pass are consistent with checks that cannot fail. A gate nobody has watched
 * reject something is decoration. So a fixture that starts passing is an error
 * here, exactly as loud as a real instance that starts failing.
 */
import { spawnSync } from "node:child_process";
import { access, constants, readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "template/AGENTS.md",
  "template/raw/README.md",
  "template/raw/provenance.json",
  "template/wiki/index.md",
  "template/wiki/log.md",
  "template/scripts/validate.mjs",
  "template/scripts/lint-structure.mjs",
  "template/scripts/lint-cadence.mjs",
  "template/scripts/new-claim.mjs",
  "template/scripts/refresh-reference-clones.sh",
  "template/scripts/acquire-reference-clone.sh",
  "template/scripts/acquire-url.mjs",
  "template/reference-clones/portfolio.example.json",
  "template/gitignore.fragment",
  "docs/reference-clones.md",
  "docs/provenance.md",
  "docs/evidence-levels.md",
  "docs/lint-semantic.md",
  "docs/viewers.md",
  "docs/instantiating.md",
  "docs/metaresearch.md",
  "docs/experiments.md",
  "docs/upgrading.md",
  "docs/adopting-in-an-existing-corpus.md",
  "template/scripts/lint-semantic.md",
  "template/wiki/queries/.gitkeep",
  "template/wiki/metaresearch/README.md",
  "template/experiments/README.md",
  "template/experiments/workflow.md",
  "template/experiments/priors-registry.md",
  "template/experiments/encounters-catalog.md",
  "template/experiments/experiment-ticket.md",
  "template/experiments/comparison-ledger.md",
  "template/experiments/phase-readme.md",
  "examples/minimal/AGENTS.md",
  "examples/minimal/scripts/validate.mjs",
  "examples/minimal/raw/provenance.json",
  "examples/compound/AGENTS.md",
  "examples/compound/wiki/index.md",
  "examples/compound/wiki/queries/compile-vs-search.md",
  "examples/failing/README.md",
];

const missing = [];
for (const rel of required) {
  try {
    await access(join(root, rel), constants.R_OK);
  } catch {
    missing.push(rel);
  }
}
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}

const fail = (msg, detail) => {
  console.error(JSON.stringify({ ok: false, error: msg, detail }, null, 2));
  process.exit(1);
};

// --- script parity: the examples carry copies, and copies rot ---------------
// Each example ships the template scripts verbatim (that is what instantiating
// does). A copy that drifts from the template silently demos stale behavior.
const templateScriptsDir = join(root, "template/scripts");
const templateScripts = (await readdir(templateScriptsDir)).sort();
const parity = [];
for (const example of ["examples/minimal", "examples/compound"]) {
  for (const file of templateScripts) {
    const templateBytes = await readFile(join(templateScriptsDir, file));
    let exampleBytes;
    try {
      exampleBytes = await readFile(join(root, example, "scripts", file));
    } catch {
      parity.push(`${example}/scripts/${file} missing`);
      continue;
    }
    if (!templateBytes.equals(exampleBytes)) parity.push(`${example}/scripts/${file} differs from template`);
  }
}
if (parity.length) {
  fail("example script copies out of sync with template/scripts — re-copy them", parity);
}

/** Run one template script against an instance tree. */
function run(script, instanceDir, args = []) {
  return spawnSync(process.execPath, [join(root, "template/scripts", `${script}.mjs`), ...args], {
    encoding: "utf8",
    env: { ...process.env, LLM_WIKI_ROOT: instanceDir },
  });
}

// --- half 1: the worked example passes -----------------------------------
const minimal = join(root, "examples/minimal");
const positives = {};
for (const script of ["validate", "lint-structure"]) {
  const r = run(script, minimal);
  if (r.status !== 0) fail(`examples/minimal fails ${script}`, r.stdout || r.stderr);
  positives[script] = JSON.parse(r.stdout);
}
if (positives.validate.claims < 1) {
  fail("examples/minimal has no claims — the positive case must exercise the validator", positives.validate);
}
if ((positives.validate.byClass?.["own-corpus"] ?? 0) > 0) {
  fail("examples/minimal pinned an own-corpus source", positives.validate);
}
// The positive half must exercise the decision→claims binding, not just avoid it:
// an example with no L2+ decision would pass lint-structure by declaring nothing.
const minimalDecisions = await readdir(join(minimal, "wiki/decisions"));
const bound = [];
for (const f of minimalDecisions.filter((f) => f.endsWith(".md"))) {
  const text = await readFile(join(minimal, "wiki/decisions", f), "utf8");
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "";
  if (/^evidence:\s*L[23]\s*$/m.test(fm) && /^claims:/m.test(fm)) bound.push(f);
}
if (bound.length === 0) {
  fail("examples/minimal has no L2+ decision bound to claims — the binding check is never exercised positively", minimalDecisions);
}

// --- half 1b: compound example shows multi-page loop (Lite / L1 ok) ---------
const compound = join(root, "examples/compound");
const compoundPositives = {};
{
  const r = run("lint-structure", compound);
  if (r.status !== 0) fail(`examples/compound fails lint-structure`, r.stdout || r.stderr);
  compoundPositives["lint-structure"] = JSON.parse(r.stdout);
}
// Compound must exercise hub fan-out + query residue, not only empty green.
const compoundSources = (await readdir(join(compound, "wiki/sources"))).filter((f) => f.endsWith(".md"));
const compoundConcepts = (await readdir(join(compound, "wiki/concepts"))).filter((f) => f.endsWith(".md"));
const compoundQueries = (await readdir(join(compound, "wiki/queries"))).filter((f) => f.endsWith(".md"));
if (compoundSources.length < 4) {
  fail("examples/compound needs ≥4 source pages for multi-ingest demo", compoundSources);
}
if (compoundConcepts.length < 3) {
  fail("examples/compound needs ≥3 concept hubs for fan-out demo", compoundConcepts);
}
if (compoundQueries.length < 1) {
  fail("examples/compound needs ≥1 query residue page", compoundQueries);
}

// --- half 2: every negative fixture fails, for the stated reason -----------
const failingDir = join(root, "examples/failing");
const cases = (await readdir(failingDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

if (cases.length === 0) fail("no negative fixtures — every check must have one", null);

/**
 * A fixture whose subject is git history cannot be a committed tree — inside
 * this repo it would be measured against llm-wiki's own commits. Such a fixture
 * ships a builder instead; it prints the instance path it built, and the check
 * runs against that.
 */
function build(dir, setup) {
  const r = spawnSync(process.execPath, [join(dir, setup)], { encoding: "utf8" });
  if (r.status !== 0) fail(`fixture setup ${setup} failed`, `${r.stdout}\n${r.stderr}`.trim());
  const built = r.stdout.trim().split("\n").pop().trim();
  if (!built) fail(`fixture setup ${setup} printed no instance path`, r.stdout);
  return built;
}

const negatives = [];
for (const name of cases) {
  const dir = join(failingDir, name);
  const expect = JSON.parse(await readFile(join(dir, "expect.json"), "utf8"));
  const codes = expect.codes ?? [expect.code];
  const instance = expect.setup ? build(dir, expect.setup) : dir;
  const r = run(expect.script, instance, expect.args ?? []);
  const output = `${r.stdout}\n${r.stderr}`;

  if (r.status === 0) {
    fail(`fixture ${name} PASSED — the check it guards has stopped working`, output.trim());
  }
  for (const code of codes) {
    if (!output.includes(code)) {
      fail(`fixture ${name} failed without ${code} (wanted ${codes.join(", ")})`, output.trim());
    }
  }
  negatives.push({ case: name, script: expect.script, args: expect.args ?? [], codes });
}

// Every error code a fixture guards must be one the scripts can still emit.
const sources = await Promise.all(
  ["validate", "lint-structure", "lint-cadence"].map((s) =>
    readFile(join(root, "template/scripts", `${s}.mjs`), "utf8"),
  ),
);
for (const n of negatives) {
  for (const code of n.codes) {
    if (!sources.some((s) => s.includes(code))) {
      fail(`fixture ${n.case} guards ${code}, which no script emits`, null);
    }
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      required: required.length,
      scriptParity: { files: templateScripts.length, examples: 2 },
      minimal: positives,
      compound: {
        ...compoundPositives,
        sources: compoundSources.length,
        concepts: compoundConcepts.length,
        queries: compoundQueries.length,
      },
      observedFailing: negatives,
    },
    null,
    2,
  ),
);
