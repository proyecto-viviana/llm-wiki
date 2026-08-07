#!/usr/bin/env node
/**
 * Structural lint for an LLM Wiki instance.
 *
 * Warnings are hygiene. Errors are the things that, left unchecked, let a wiki
 * look complete while being empty:
 *   - a decision with no Non-claims section states no boundary, so nothing it
 *     says can later be found to be overreach;
 *   - a question with no Stop condition can never be finished, only abandoned
 *     or declared done;
 *   - an instance that pins repo-origin sources but has no clone portfolio
 *     never actually acquired anything;
 *   - a decision that asserts an evidence level in prose while claims/ is empty.
 *
 * That last one is the whole gate. Pinning is opt-in: an instance with no
 * claims/ passes validate.mjs trivially, so a wiki can assert "Evidence level:
 * L2" on every page and never register a single external byte. Evidence level
 * therefore lives in decision frontmatter, where it can be read mechanically,
 * and L2+ must name the claims that carry it — at least one of them external.
 *
 * Node stdlib only. Errors carry stable E_* codes.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Version of the template these scripts were copied from. Instances pin a
 * template commit when they instantiate; this constant is what lets a later
 * reader notice the copy is stale. See docs/upgrading.md in the pattern repo.
 */
const TEMPLATE_VERSION = "1.1.0";

/** See validate.mjs: LLM_WIKI_ROOT lets the negative fixtures run these checks. */
const root = process.env.LLM_WIKI_ROOT
  ? resolve(process.env.LLM_WIKI_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const wiki = join(root, "wiki");

/**
 * --baseline [path] (default wiki/lint/baseline.json): a committed list of
 * accepted warnings. With it, a warning not in the list is an error
 * (E_NEW_WARNING) instead of one more line in a pile nobody reads — green
 * means "no NEW warnings", not "no warnings". A missing or empty baseline
 * file accepts nothing, so the flag fails closed.
 */
const argv = process.argv.slice(2);
const baselineIdx = argv.indexOf("--baseline");
const baselinePath =
  baselineIdx === -1
    ? null
    : argv[baselineIdx + 1] && !argv[baselineIdx + 1].startsWith("--")
      ? resolve(root, argv[baselineIdx + 1])
      : join(root, "wiki", "lint", "baseline.json");

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readIfExists(path) {
  return (await exists(path)) ? readFile(path, "utf8") : null;
}

async function walkMarkdown(dir, out = []) {
  if (!(await exists(dir))) return out;
  for (const name of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) await walkMarkdown(p, out);
    else if (name.name.endsWith(".md")) out.push(p);
  }
  return out;
}

function linkTargets(markdown) {
  const targets = new Set();
  const re = /\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(markdown))) {
    const t = m[1].split("#")[0].split("?")[0];
    if (t && !t.startsWith("http") && !t.startsWith("mailto:")) targets.add(t);
  }
  return targets;
}

/** Body text under a `## Heading`, up to the next heading of any level. */
function sectionBody(markdown, heading) {
  const re = new RegExp(`^#{2,3}\\s+${heading}\\s*$`, "im");
  const m = re.exec(markdown);
  if (!m) return null;
  const rest = markdown.slice(m.index + m[0].length);
  const next = /^#{1,6}\s+/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

/** Short pages often carry `- **Label:** value` instead of a heading. Accept both. */
function fieldValue(markdown, label) {
  const re = new RegExp(`^\\s*[-*]?\\s*\\*\\*${label}:?\\*\\*:?\\s*(.+)$`, "im");
  return re.exec(markdown)?.[1]?.trim() ?? null;
}

const LEVELS = ["L0", "L1", "L2", "L3"];
const EXTERNAL_CLASSES = new Set(["external-primary", "external-secondary"]);
const rank = (level) => LEVELS.indexOf(level);

const unquote = (s) => s.replace(/^['"]/, "").replace(/['"]$/, "").trim();

/**
 * Minimal frontmatter reader: a `---` fenced block at the very top, flat keys,
 * scalars plus inline (`[a, b]`) or block (`- a`) lists. Enough for `evidence:`
 * and `claims:`; deliberately not a YAML implementation.
 */
function frontmatter(text) {
  const m = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!m) return null;
  const out = {};
  let listKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const item = /^\s*-\s+(.+)$/.exec(line);
    if (item && listKey) {
      out[listKey].push(unquote(item[1]));
      continue;
    }
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, key, rest] = kv;
    const value = rest.trim();
    if (value === "") {
      listKey = key;
      out[key] = [];
      continue;
    }
    listKey = null;
    const inline = /^\[(.*)\]$/.exec(value);
    out[key] = inline
      ? inline[1].split(",").map((s) => unquote(s)).filter(Boolean)
      : unquote(value);
  }
  return out;
}

async function walkJson(dir, out = []) {
  if (!(await exists(dir))) return out;
  for (const name of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) await walkJson(p, out);
    else if (name.name.endsWith(".json")) out.push(p);
  }
  return out;
}

/**
 * Index every claim under claims/ by its own id and by its filename stem, so a
 * decision can bind either way. Malformed packets are reported by validate.mjs;
 * here they are simply not bindable.
 */
async function loadClaims(claimsDir) {
  const byId = new Map();
  for (const file of await walkJson(claimsDir)) {
    let doc;
    try {
      doc = JSON.parse(await readFile(file, "utf8"));
    } catch {
      continue;
    }
    const list = Array.isArray(doc.claims) ? doc.claims : [doc];
    for (const claim of list) {
      if (!claim?.id) continue;
      const record = { id: claim.id, level: claim.level, sourceId: claim.source?.id, file };
      if (!byId.has(claim.id)) byId.set(claim.id, record);
      const stem = file.split(/[\\/]/).pop().replace(/\.json$/, "");
      if (!byId.has(stem)) byId.set(stem, record);
    }
  }
  return byId;
}

/** A section that exists but says nothing is the same as no section. */
function isSubstantive(body) {
  if (!body) return false;
  const stripped = body
    .split("\n")
    .map((l) => l.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .filter((l) => !/^(tbd|todo|n\/?a|none|—|-)$/i.test(l));
  return stripped.join(" ").length >= 20;
}

/**
 * The decision→claims binding.
 *
 * Prose is not a declaration: "Evidence level: L2" in the body is exactly the
 * 2026-07-28 shape, and it must fail rather than pass. L2+ has to name claims
 * that exist, must not out-rank them, and at least one of them must cite a
 * source the project did not write.
 */
function checkDecisionEvidence({ rel, text, claimIndex, sourceClass, errors }) {
  const fm = frontmatter(text) ?? {};
  const level = typeof fm.evidence === "string" ? fm.evidence.trim() : null;
  if (!level || !LEVELS.includes(level)) {
    errors.push(
      `E_DECISION_NO_LEVEL ${rel}: decisions need frontmatter \`evidence: L0|L1|L2|L3\` — a body-prose "Evidence level" line is a claim about the work, not a declaration a check can read`,
    );
    return;
  }
  if (rank(level) < rank("L2")) return;

  const declared = Array.isArray(fm.claims)
    ? fm.claims
    : typeof fm.claims === "string" && fm.claims
      ? [fm.claims]
      : [];
  if (declared.length === 0) {
    errors.push(
      `E_DECISION_UNBOUND ${rel}: evidence ${level} requires frontmatter \`claims: [<id>, …]\` naming the packets that carry it`,
    );
    return;
  }
  const dangling = declared.filter((id) => !claimIndex.has(id));
  if (dangling.length) {
    errors.push(
      `E_DECISION_UNBOUND ${rel}: bound claim(s) ${dangling.join(", ")} resolve to no file under claims/`,
    );
    return;
  }

  const bound = declared.map((id) => claimIndex.get(id));
  const maxBound = Math.max(...bound.map((c) => rank(c.level)));
  if (rank(level) > maxBound) {
    errors.push(
      `E_DECISION_NO_EXTERNAL ${rel}: declared ${level} exceeds the highest level its bound claims carry (${bound.map((c) => `${c.id}=${c.level}`).join(", ")})`,
    );
    return;
  }
  const external = bound.some((c) => EXTERNAL_CLASSES.has(sourceClass.get(c.sourceId)));
  if (!external) {
    errors.push(
      `E_DECISION_NO_EXTERNAL ${rel}: evidence ${level} needs at least one bound claim on an external-primary or external-secondary source; bound classes are ${bound
        .map((c) => `${c.id}=${sourceClass.get(c.sourceId) ?? "unregistered"}`)
        .join(", ")}`,
    );
  }
}

async function main() {
  const errors = [];
  const warnings = [];

  if (!(await exists(join(wiki, "index.md")))) errors.push("E_NO_INDEX missing wiki/index.md");
  if (!(await exists(join(wiki, "log.md")))) errors.push("E_NO_LOG missing wiki/log.md");

  const pages = await walkMarkdown(wiki);
  const indexText = (await readIfExists(join(wiki, "index.md"))) ?? "";

  const relPages = pages
    .map((p) => relative(wiki, p).replaceAll("\\", "/"))
    .filter((p) => p !== "index.md" && p !== "log.md");

  for (const rel of relPages) {
    const base = rel.split("/").pop();
    if (!indexText.includes(rel) && !indexText.includes(base)) {
      warnings.push(`not mentioned in index.md: ${rel}`);
    }
  }

  // --- Registry and claims, read once --------------------------------------
  const registryText = await readIfExists(join(root, "raw", "provenance.json"));
  let registryDoc = null;
  if (registryText) {
    try {
      registryDoc = JSON.parse(registryText);
    } catch {
      errors.push("E_PROV_REGISTRY_JSON raw/provenance.json is not valid JSON");
    }
  }
  const sources = registryDoc?.sources ?? [];
  const sourceClass = new Map(sources.filter((s) => s?.id).map((s) => [s.id, s.class]));
  const claimIndex = await loadClaims(join(root, "claims"));

  // --- Decisions must state what they do not claim -------------------------
  for (const page of pages) {
    const rel = relative(wiki, page).replaceAll("\\", "/");
    const text = await readFile(page, "utf8");
    if (rel.startsWith("decisions/")) {
      const body = sectionBody(text, "Non-claims") ?? fieldValue(text, "Non-claims");
      if (!isSubstantive(body)) {
        errors.push(
          `E_NO_NON_CLAIMS ${rel}: decisions need substantive Non-claims — what this decision does not settle`,
        );
      }
      checkDecisionEvidence({ rel, text, claimIndex, sourceClass, errors });
    }
    if (rel.startsWith("questions/")) {
      const body = sectionBody(text, "Stop condition") ?? fieldValue(text, "Stop condition");
      if (!isSubstantive(body)) {
        errors.push(
          `E_NO_STOP_CONDITION ${rel}: questions need a substantive Stop condition — what observable fact ends this question`,
        );
      }
    }
  }

  // --- Acquisition path must not be skippable ------------------------------
  if (registryText) {
    const repoPinned = sources.filter((s) => s?.origin?.type === "repo");
    if (repoPinned.length > 0) {
      const portfolio = join(root, "reference-clones", "portfolio.json");
      if (!(await exists(portfolio))) {
        errors.push(
          `E_NO_PORTFOLIO ${repoPinned.length} source(s) pin a repo commit but reference-clones/portfolio.json does not exist — the example file is not a portfolio`,
        );
      }
    }
    const sourcePages = relPages.filter((p) => p.startsWith("sources/"));
    for (const src of sources) {
      if (!src?.id) continue;
      const covered = await Promise.all(
        sourcePages.map(async (p) => (await readFile(join(wiki, p), "utf8")).includes(src.id)),
      );
      if (!covered.some(Boolean)) {
        warnings.push(`registered source ${src.id} has no page under wiki/sources/`);
      }
    }
  }

  // --- Orphan heuristic ----------------------------------------------------
  const inbound = new Map(relPages.map((p) => [p, 0]));
  for (const page of pages) {
    const text = await readFile(page, "utf8");
    const fromRel = relative(wiki, page).replaceAll("\\", "/");
    for (const target of linkTargets(text)) {
      const normalized = target.replace(/^\.\//, "");
      for (const rel of relPages) {
        if (
          rel === normalized ||
          rel.endsWith("/" + normalized) ||
          rel === normalized.replace(/^\.\.\//, "")
        ) {
          if (rel !== fromRel) inbound.set(rel, (inbound.get(rel) || 0) + 1);
        }
      }
    }
  }

  for (const [rel, count] of inbound) {
    if (
      count === 0 &&
      (rel.startsWith("concepts/") || rel.startsWith("entities/") || rel.startsWith("decisions/"))
    ) {
      warnings.push(`possible orphan (no inbound links): ${rel}`);
    }
  }

  // --- Declared roles that were never used ---------------------------------
  // A schema that names questions/ while every close arrives without one on
  // record is the "answers first, questions retrofitted" shape. Warning, not
  // error: a young wiki may genuinely have closed its only question.
  const decisionPages = relPages.filter((p) => p.startsWith("decisions/"));
  const questionPages = relPages.filter((p) => p.startsWith("questions/"));
  if (decisionPages.length > 0 && questionPages.length === 0) {
    warnings.push(
      `decisions exist (${decisionPages.length}) but wiki/questions/ has no pages — no open question was ever filed`,
    );
  }

  // --- Baseline: only new warnings fail ------------------------------------
  let baseline = null;
  if (baselinePath) {
    let accepted = [];
    let parseError = false;
    const text = await readIfExists(baselinePath);
    if (text) {
      try {
        const doc = JSON.parse(text);
        accepted = Array.isArray(doc) ? doc : Array.isArray(doc.warnings) ? doc.warnings : [];
      } catch {
        parseError = true; // unreadable baseline accepts nothing — fail closed
      }
    }
    const acceptedSet = new Set(accepted);
    const fresh = warnings.filter((w) => !acceptedSet.has(w));
    for (const w of fresh) {
      errors.push(`E_NEW_WARNING ${w} — not in the committed baseline (${relative(root, baselinePath)})`);
    }
    baseline = {
      path: relative(root, baselinePath),
      accepted: accepted.length,
      new: fresh.length,
      stale: accepted.filter((w) => !warnings.includes(w)),
      ...(parseError ? { parseError: true } : {}),
    };
  }

  const result = {
    ok: errors.length === 0,
    version: TEMPLATE_VERSION,
    pages: pages.length,
    errors,
    warnings,
    ...(baseline ? { baseline } : {}),
  };
  console.log(JSON.stringify(result, null, 2));
  if (errors.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
