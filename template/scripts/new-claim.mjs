#!/usr/bin/env node
/**
 * Helper: print a claim stub for a raw file that is already registered.
 *
 * Deliberately refuses to invent a source. If the file is not in
 * raw/provenance.json, this tells you to register it — deciding what a source
 * IS, and where it came from, is the part a human or an agent has to actually
 * do. Emitting a stub with a blank class would make that step skippable, and
 * skippable is how the class ends up wrong.
 *
 * Usage: node scripts/new-claim.mjs CLAIM-id "statement" path/to/raw.md [lineStart] [lineEnd]
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [, , id, statement, sourcePath, lineStart, lineEnd] = process.argv;
if (!id || !statement || !sourcePath) {
  console.error(
    'usage: node scripts/new-claim.mjs CLAIM-id "statement" path/to/file [lineStart] [lineEnd]',
  );
  process.exit(2);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const abs = resolve(process.cwd(), sourcePath);
const rawDir = resolve(root, "raw");
const claimsDir = resolve(root, "claims");

let registry;
try {
  registry = JSON.parse(await readFile(resolve(rawDir, "provenance.json"), "utf8"));
} catch (e) {
  console.error(`cannot read raw/provenance.json: ${e.message}`);
  process.exit(2);
}

const entry = (registry.sources ?? []).find((s) => resolve(rawDir, s.path) === abs);
if (!entry) {
  console.error(
    [
      `${sourcePath} is not registered in raw/provenance.json.`,
      "",
      "Add it first — you need to answer three things that this script cannot answer for you:",
      "  class   external-primary | external-secondary | own-corpus | product-code",
      "  origin  where it came from, in a form someone else can re-resolve",
      "  why     the distinct question this source answers",
      "",
      "If the honest class is own-corpus, stop: that caps at L1 and does not belong in claims/.",
    ].join("\n"),
  );
  process.exit(2);
}

if (entry.class === "own-corpus") {
  console.error(
    `${entry.id} is own-corpus, which caps at L1. Cite it as prose with a wiki link, not a pinned claim.`,
  );
  process.exit(2);
}

const relFromClaims = relative(claimsDir, abs).replaceAll("\\", "/");
const sha256 = createHash("sha256").update(await readFile(abs)).digest("hex");

const claim = {
  id,
  statement,
  level: "L2",
  source: {
    id: entry.id,
    provenanceClass: entry.class,
    path: relFromClaims.startsWith(".") ? relFromClaims : `./${relFromClaims}`,
    sha256,
  },
};
if (lineStart) claim.source.lineStart = Number(lineStart);
if (lineEnd) claim.source.lineEnd = Number(lineEnd);

console.log(JSON.stringify(claim, null, 2));
