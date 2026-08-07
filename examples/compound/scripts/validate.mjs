#!/usr/bin/env node
/**
 * Validate L2/L3 claim packets.
 *
 * Two independent things are checked, and they are not the same thing:
 *   1. Integrity  — the bytes we pinned are still the bytes that are there.
 *   2. Provenance — what we pinned is external to this project.
 *
 * Integrity alone is satisfiable by hashing files we wrote ourselves, so it is
 * not evidence. Every claim must name a source registered in raw/provenance.json
 * with a class, and the class is cross-checked against the source's origin: an
 * own-project origin cannot be declared external, and an own-corpus source caps
 * at L1 — which means it cannot appear in claims/ at all.
 *
 * Usage: node scripts/validate.mjs [--refetch [k]]
 *   --refetch     re-resolve url origins and compare against the captured bytes.
 *                 With k, check a deterministic sample of k (sorted by digest,
 *                 strided — no RNG, so two runs check the same entries).
 *
 * Node stdlib only. Exit 0 if no claims or all claims ok.
 * Errors carry stable E_* codes so negative fixtures can assert on them.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, realpath, stat } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Normally the instance is the script's parent directory. LLM_WIKI_ROOT points
 * the same checks at another tree, which is how the negative fixtures prove
 * each check can actually fail — a gate never observed failing is not a gate.
 */
const root = process.env.LLM_WIKI_ROOT
  ? resolve(process.env.LLM_WIKI_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Version of the template these scripts were copied from. Instances pin a
 * template commit when they instantiate; this constant is what lets a later
 * reader notice the copy is stale. See docs/upgrading.md in the pattern repo.
 */
const TEMPLATE_VERSION = "1.1.0";

const argv = process.argv.slice(2);
const refetchIdx = argv.indexOf("--refetch");
const refetch = refetchIdx >= 0;
const refetchSample = Number.parseInt(argv[refetchIdx + 1] ?? "", 10);

const claimsDir = join(root, "claims");
const rawDir = join(root, "raw");
const registryPath = join(rawDir, "provenance.json");
const hex = /^[0-9a-f]{64}$/;

/**
 * Which origin types each provenance class admits, and whether a claim citing
 * that class may exceed L1. `own-corpus` is the load-bearing entry: our own
 * writing is a pointer to a question, never the answer to one.
 */
const CLASSES = {
  "external-primary": { origins: ["url", "repo", "offline"], maxLevel: "L3" },
  "external-secondary": { origins: ["url", "offline"], maxLevel: "L3" },
  "own-corpus": { origins: ["own-project"], maxLevel: "L1" },
  /** L3-eligible, but only from inside a declared product root — see checkProductRoot. */
  "product-code": { origins: ["own-project"], maxLevel: "L3" },
};

/** Fields an origin must carry for the pin to be re-resolvable by someone else. */
const ORIGIN_REQUIRED = {
  url: ["url", "retrieved"],
  repo: ["repo", "commit", "retrieved"],
  offline: ["citation"],
  "own-project": ["path"],
};

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Containment, resolved on disk rather than lexically. A string-prefix test on
 * `resolve()` output is defeated by a symlink, and a path that does not exist
 * is not contained in anything — both sides get realpath'd, and failure to
 * resolve is failure to contain.
 */
async function containedIn(childPath, parentPath) {
  let child;
  let parent;
  try {
    child = await realpath(childPath);
    parent = await realpath(parentPath);
  } catch {
    return false;
  }
  return child === parent || child.startsWith(parent + sep);
}

/**
 * Duplicated verbatim in acquire-url.mjs — see the note there. The fetch that
 * acquires and the fetch that audits must agree on what a URL means.
 */
async function fetchBytes(urlStr, base) {
  if (urlStr.startsWith("file:")) {
    const rest = urlStr.slice(5);
    const path = rest.startsWith("//")
      ? fileURLToPath(urlStr)
      : resolve(base, decodeURIComponent(rest));
    return readFile(path);
  }
  const res = await fetch(urlStr, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Re-resolution, the half of L3 that docs/evidence-levels.md promised and only
 * re-hash delivered. Re-hashing proves our copy has not moved; it says nothing
 * about whether the origin was ever real, which is exactly the hole a
 * confabulated URL walks through. This cannot catch the fabrication at the
 * moment of writing — it catches it on the first pass afterwards, when the URL
 * does not resolve or resolves to bytes that were never ours. That is enough to
 * make a hand-written url entry a losing move.
 *
 * Sampling is deterministic (sort by captured digest, then stride) so a
 * scheduled `--refetch k` covers the corpus over successive runs instead of
 * re-rolling the same dice.
 */
async function refetchOrigins(registry, errors) {
  const urlEntries = [...registry.values()].filter((s) => s.origin?.type === "url");
  const withDigest = [];
  for (const src of urlEntries) {
    const local = resolve(rawDir, src.path);
    if (!(await exists(local))) {
      errors.push(
        `E_PROV_REFETCH_FAILED ${src.id}: no captured bytes at raw/${src.path} to compare a re-fetch against`,
      );
      continue;
    }
    withDigest.push({ src, local, digest: sha256(await readFile(local)) });
  }
  withDigest.sort((a, b) => (a.digest < b.digest ? -1 : a.digest > b.digest ? 1 : 0));

  let selected = withDigest;
  if (Number.isInteger(refetchSample) && refetchSample > 0 && refetchSample < withDigest.length) {
    const stride = Math.ceil(withDigest.length / refetchSample);
    selected = withDigest.filter((_, i) => i % stride === 0).slice(0, refetchSample);
  }

  const checked = [];
  for (const { src, digest } of selected) {
    let bytes;
    try {
      bytes = await fetchBytes(src.origin.url, root);
    } catch (e) {
      errors.push(
        `E_PROV_REFETCH_FAILED ${src.id}: ${src.origin.url} did not resolve (${e.message}) — an origin that cannot be re-resolved is not an origin`,
      );
      continue;
    }
    const fetched = sha256(bytes);
    if (fetched !== digest) {
      errors.push(
        `E_PROV_REFETCH_DRIFT ${src.id}: ${src.origin.url} now serves ${fetched.slice(0, 12)}… but raw/${src.path} holds ${digest.slice(0, 12)}… — either the origin moved or these bytes never came from it`,
      );
      continue;
    }
    if (src.sha256 && src.sha256 !== fetched) {
      errors.push(
        `E_PROV_REFETCH_DRIFT ${src.id}: registry records ${src.sha256.slice(0, 12)}… but origin and capture agree on ${fetched.slice(0, 12)}…`,
      );
      continue;
    }
    checked.push(src.id);
  }
  return { urlOrigins: urlEntries.length, refetched: checked.length, checked };
}

/**
 * A registry path that leaves `raw/` is a pointer, not a capture — the exact
 * signal used to condemn the 2026-07-28 corpus, where 281 of 284 cited objects
 * lived in our own tree and were merely referenced in place. Two escapes are
 * possible and both are checked: `../` in the path (lexical, catches entries
 * whose target does not even exist) and a symlink inside `raw/` aimed outward
 * (only visible after realpath).
 */
async function escapesRaw(relPath) {
  const target = resolve(rawDir, relPath);
  if (!(target === rawDir || target.startsWith(rawDir + sep))) return "path leaves raw/";
  if ((await exists(target)) && !(await containedIn(target, rawDir))) {
    return "path resolves outside raw/ through a symlink";
  }
  return null;
}

/**
 * `product-code` origins are repo-relative, so they need the repository root,
 * not the wiki root. `LLM_WIKI_PROJECT_ROOT` wins; otherwise ask git. If
 * neither answers, product-code entries fail closed — an unanchored root is
 * indistinguishable from no root at all.
 */
let projectRootCache;
function projectRoot() {
  if (projectRootCache !== undefined) return projectRootCache;
  if (process.env.LLM_WIKI_PROJECT_ROOT) {
    projectRootCache = resolve(process.env.LLM_WIKI_PROJECT_ROOT);
    return projectRootCache;
  }
  const r = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: root, encoding: "utf8" });
  projectRootCache = r.status === 0 && r.stdout.trim() ? r.stdout.trim() : null;
  return projectRootCache;
}

/**
 * Recursive on purpose: a non-recursive readdir made `claims/hidden/CLAIM-x.json`
 * invisible, and an unvalidated claim reported as `{ok: true, claims: 0}` is
 * worse than a failing one. Subdirectories are allowed; unscanned is not.
 */
async function walkClaims(dir, prefix = "", out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await walkClaims(join(dir, entry.name), rel, out);
    else if (entry.name.endsWith(".json")) out.push(rel);
  }
  return out;
}

function normalizeClaims(doc, file) {
  if (Array.isArray(doc.claims)) return doc.claims;
  if (doc.id && doc.statement) return [doc];
  throw new Error(`E_SHAPE ${file}: expected claim object or { claims: [] }`);
}

/**
 * `own-corpus` and `product-code` admit the same origin type, so the L1 cap on
 * own-corpus is a self-assigned label unless something anchors the other one:
 * relabelling an invented taxonomy as `product-code` restores L3 with every
 * field still honest. What separates them is not intent, it is location —
 * product code lives in the product's source tree. `productRoots` says where
 * that is, and an entry that cannot be placed inside one is not product code.
 */
async function checkProductRoot(src, productRoots, errors) {
  const roots = (Array.isArray(productRoots) ? productRoots : []).filter(Boolean);
  if (roots.length === 0) {
    errors.push(
      `E_PROV_PRODUCT_ROOT ${src.id}: class product-code requires a top-level productRoots[] in raw/provenance.json naming the product source trees — without it the class is a self-assigned licence to cite anything at L3`,
    );
    return;
  }
  const proj = projectRoot();
  if (!proj) {
    errors.push(
      `E_PROV_PRODUCT_ROOT ${src.id}: productRoots are repo-relative but the repository root could not be determined (not a git tree; set LLM_WIKI_PROJECT_ROOT)`,
    );
    return;
  }
  const originPath = src.origin?.path;
  if (!originPath) return; // E_PROV_ORIGIN_FIELD already covers this
  const inside = await Promise.all(
    roots.map((r) => containedIn(resolve(proj, originPath), resolve(proj, r))),
  );
  if (!inside.some(Boolean)) {
    errors.push(
      `E_PROV_PRODUCT_ROOT ${src.id}: origin.path ${originPath} does not resolve inside any productRoot (${roots.join(", ")}) — product-code means bytes from the product's source tree, not our own writing about it`,
    );
  }
}

/** Registry entries are keyed by id; paths in them are relative to raw/. */
async function loadRegistry(errors) {
  if (!(await exists(registryPath))) {
    errors.push("E_PROV_NO_REGISTRY raw/provenance.json is missing");
    return new Map();
  }
  let doc;
  try {
    doc = JSON.parse(await readFile(registryPath, "utf8"));
  } catch (e) {
    errors.push(`E_PROV_REGISTRY_JSON raw/provenance.json: ${e.message}`);
    return new Map();
  }
  if (!Array.isArray(doc.sources)) {
    errors.push("E_PROV_REGISTRY_SHAPE raw/provenance.json: sources[] required");
    return new Map();
  }

  const byId = new Map();
  for (const src of doc.sources) {
    if (!src?.id || !src?.path) {
      errors.push("E_PROV_ENTRY_SHAPE registry entry needs id and path");
      continue;
    }
    if (byId.has(src.id)) {
      errors.push(`E_PROV_DUPLICATE_ID registry has two entries for ${src.id}`);
      continue;
    }
    const spec = CLASSES[src.class];
    if (!spec) {
      errors.push(
        `E_PROV_BAD_CLASS ${src.id}: class must be one of ${Object.keys(CLASSES).join(", ")}`,
      );
      continue;
    }
    const originType = src.origin?.type;
    if (!originType) {
      errors.push(`E_PROV_NO_ORIGIN ${src.id}: origin.type required`);
      continue;
    }
    if (!spec.origins.includes(originType)) {
      errors.push(
        `E_PROV_CLASS_MISMATCH ${src.id}: class ${src.class} cannot have origin.type ${originType}` +
          (originType === "own-project"
            ? " — something we wrote is not external evidence"
            : ""),
      );
      continue;
    }
    for (const field of ORIGIN_REQUIRED[originType] ?? []) {
      if (!src.origin[field]) {
        errors.push(
          `E_PROV_ORIGIN_FIELD ${src.id}: origin.${field} required for origin.type ${originType}`,
        );
      }
    }
    const escape = await escapesRaw(src.path);
    if (escape) {
      errors.push(
        `E_PROV_ESCAPE ${src.id}: ${escape} (${src.path}) — cite what was captured into raw/, not a file left where it already lived`,
      );
      continue;
    }
    if (src.class === "product-code") {
      await checkProductRoot(src, doc.productRoots, errors);
    }
    if (!src.why) {
      errors.push(`E_PROV_NO_WHY ${src.id}: why (question this source answers) required`);
    }
    byId.set(src.id, src);
  }
  return byId;
}

async function checkClaim({ claim, file, full, registry, errors }) {
  if (!claim.id || !claim.statement) {
    errors.push(`E_SHAPE ${file}: claim missing id/statement`);
    return;
  }
  const where = `${file} ${claim.id}`;
  if (!["L2", "L3"].includes(claim.level)) {
    errors.push(`E_LEVEL ${where}: level must be L2 or L3`);
    return;
  }
  const src = claim.source;
  if (!src?.path) {
    errors.push(`E_SHAPE ${where}: source.path required`);
    return;
  }
  if (!src.id) {
    errors.push(`E_PROV_NO_SOURCE_ID ${where}: source.id required, must match raw/provenance.json`);
    return;
  }

  const entry = registry.get(src.id);
  if (!entry) {
    errors.push(
      `E_PROV_UNREGISTERED ${where}: source ${src.id} is not in raw/provenance.json — register it with a class and an origin before citing it`,
    );
    return;
  }
  if (src.provenanceClass && src.provenanceClass !== entry.class) {
    errors.push(
      `E_PROV_CLASS_CONFLICT ${where}: claim says ${src.provenanceClass}, registry says ${entry.class}`,
    );
    return;
  }
  if (CLASSES[entry.class].maxLevel === "L1") {
    errors.push(
      `E_PROV_LEVEL_CAP ${where}: source ${src.id} is ${entry.class}, which caps at L1 — state this as prose with a wiki link, not a pinned claim`,
    );
    return;
  }

  const target = resolve(dirname(full), src.path);
  if (target !== resolve(rawDir, entry.path)) {
    errors.push(
      `E_PROV_PATH_CONFLICT ${where}: claim pins ${src.path}, registry registered ${entry.path} for ${src.id}`,
    );
    return;
  }
  if (!(await exists(target))) {
    errors.push(`E_MISSING_FILE ${where}: missing file ${src.path}`);
    return;
  }
  if (src.sha256 && !hex.test(src.sha256)) {
    errors.push(`E_DIGEST_FORMAT ${where}: bad sha256`);
    return;
  }
  if (!src.sha256 && claim.level === "L3") {
    errors.push(`E_DIGEST_REQUIRED ${where}: L3 requires source.sha256`);
    return;
  }
  if (src.sha256) {
    const dig = sha256(await readFile(target));
    if (dig !== src.sha256) {
      errors.push(`E_DIGEST_DRIFT ${where}: digest drift (got ${dig.slice(0, 12)}…)`);
      return;
    }
  }
  if (src.lineStart != null || src.lineEnd != null) {
    const lines = (await readFile(target, "utf8")).split("\n").length;
    if (src.lineEnd > lines) {
      errors.push(`E_LINE_RANGE ${where}: lineEnd ${src.lineEnd} > ${lines}`);
    }
  }
}

async function main() {
  const errors = [];

  const files = (await exists(claimsDir)) ? (await walkClaims(claimsDir)).sort() : [];

  // --refetch audits the registry, so it runs even with no claims: an instance
  // can register url origins long before anything pins them.
  if (files.length === 0 && !refetch) {
    console.log(
      JSON.stringify({
        ok: true,
        version: TEMPLATE_VERSION,
        claims: 0,
        note: files.length ? "no claim files" : "no claims/",
      }),
    );
    return;
  }

  const registry = await loadRegistry(errors);
  let refetchReport = null;
  if (refetch) {
    refetchReport = await refetchOrigins(registry, errors);
    if (files.length === 0) {
      if (errors.length) {
        console.error(
          JSON.stringify(
            { ok: false, version: TEMPLATE_VERSION, claims: 0, refetch: refetchReport, errors },
            null,
            2,
          ),
        );
        process.exit(1);
      }
      console.log(JSON.stringify({ ok: true, version: TEMPLATE_VERSION, claims: 0, refetch: refetchReport }));
      return;
    }
  }
  let count = 0;
  const byClass = {};

  for (const file of files) {
    const full = join(claimsDir, file);
    let doc;
    try {
      doc = JSON.parse(await readFile(full, "utf8"));
    } catch (e) {
      errors.push(`E_JSON ${file}: invalid JSON (${e.message})`);
      continue;
    }

    let claims;
    try {
      claims = normalizeClaims(doc, file);
    } catch (e) {
      errors.push(e.message);
      continue;
    }

    for (const claim of claims) {
      count += 1;
      const before = errors.length;
      await checkClaim({ claim, file, full, registry, errors });
      if (errors.length === before) {
        const cls = registry.get(claim.source.id).class;
        byClass[cls] = (byClass[cls] ?? 0) + 1;
      }
    }
  }

  const refetchField = refetchReport ? { refetch: refetchReport } : {};
  if (errors.length) {
    console.error(
      JSON.stringify(
        { ok: false, version: TEMPLATE_VERSION, claims: count, ...refetchField, errors },
        null,
        2,
      ),
    );
    process.exit(1);
  }
  console.log(
    JSON.stringify({
      ok: true,
      version: TEMPLATE_VERSION,
      claims: count,
      files: files.length,
      byClass,
      ...refetchField,
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
