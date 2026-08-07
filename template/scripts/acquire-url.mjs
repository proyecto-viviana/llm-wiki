#!/usr/bin/env node
/**
 * Acquire a url-origin source: fetch, capture, digest, register — one motion.
 *
 * A url origin used to be the cheapest sentence in the schema. Repo origins had
 * an acquisition path (acquire-reference-clone.sh, and E_NO_PORTFOLIO if it was
 * skipped); url origins had nothing, so an agent told "L2 needs an external
 * source" could type a plausible URL over bytes it wrote itself and validate
 * green at L3. That is not an adversary — it is the same reflex as inventing an
 * algorithm from memory, one field deeper.
 *
 * So the registry entry is not written by hand. It is written here, by the code
 * that actually retrieved the bytes, which means the entry cannot exist unless
 * the retrieval happened. `validate.mjs --refetch` is the audit behind it: a
 * hand-written entry over a confabulated URL survives until the first pass and
 * then fails permanently, because there is nothing at that URL to match.
 *
 * Usage:
 *   node scripts/acquire-url.mjs <url> --id <src-id> --why "<question>" \
 *        [--as <filename>] [--secondary] [--license "<terms>"]
 *
 * `file:` URLs are supported for offline captures and fixtures; a `file:` URL
 * with a relative path resolves against the instance root.
 *
 * Node stdlib only (fetch is built in).
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.env.LLM_WIKI_ROOT
  ? resolve(process.env.LLM_WIKI_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = join(root, "raw");
const registryPath = join(rawDir, "provenance.json");

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const url = argv[0];
const id = flag("--id");
const why = flag("--why");
const as = flag("--as");
const license = flag("--license");
const secondary = argv.includes("--secondary");

const die = (msg, code = 2) => {
  console.error(msg);
  process.exit(code);
};

if (!url || url.startsWith("--") || !id || !why) {
  die(
    'usage: node scripts/acquire-url.mjs <url> --id <src-id> --why "<question this answers>" [--as <filename>] [--secondary] [--license "<terms>"]',
  );
}

/**
 * Duplicated verbatim in validate.mjs --refetch, deliberately: the fetch that
 * acquires and the fetch that audits must agree on what a URL means, or the
 * audit checks a different thing from the one that was captured. Keep the two
 * copies identical.
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

const exists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

let registry;
try {
  registry = JSON.parse(await readFile(registryPath, "utf8"));
} catch (e) {
  die(`cannot read raw/provenance.json: ${e.message}`);
}
registry.sources ??= [];

if (registry.sources.some((s) => s?.id === id)) {
  die(`refusing to overwrite: ${id} is already registered. Pick a new id, or delete the old entry deliberately.`);
}

let derived = null;
try {
  derived = basename(new URL(url, "file:///").pathname);
} catch {
  derived = null;
}
const filename = as ?? derived;
if (!filename || filename === "/" || filename.includes("..")) {
  die(`cannot derive a filename from ${url} — pass --as <filename>`);
}
const target = join(rawDir, filename);
if (await exists(target)) {
  die(`refusing to overwrite raw/${filename} — raw/ is immutable; pass --as with a new name`);
}

let bytes;
try {
  bytes = await fetchBytes(url, root);
} catch (e) {
  die(`fetch failed for ${url}: ${e.message} — nothing was written, and no entry was registered`);
}

await mkdir(rawDir, { recursive: true });
await writeFile(target, bytes);
const sha256 = createHash("sha256").update(bytes).digest("hex");

registry.sources.push({
  id,
  path: filename,
  class: secondary ? "external-secondary" : "external-primary",
  origin: { type: "url", url, retrieved: new Date().toISOString().slice(0, 10) },
  sha256,
  ...(license ? { license } : {}),
  why,
});
await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

console.log(
  JSON.stringify({ ok: true, id, path: `raw/${filename}`, bytes: bytes.length, sha256, url }, null, 2),
);
