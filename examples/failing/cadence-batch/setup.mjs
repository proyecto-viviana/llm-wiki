#!/usr/bin/env node
/**
 * Build the instance this fixture checks: a throwaway git repository whose
 * history contains the evasion the cadence lint is supposed to catch.
 *
 * The fixture cannot be a committed tree like the others — the thing under test
 * is history, and a directory inside *this* repo would be measured against
 * llm-wiki's own commits. So the fixture is a builder, and check-template runs
 * it first and points the script at what it prints.
 *
 * The shape: 21 decisions written into an unwatched directory in one commit,
 * then `git mv`d into wiki/decisions in a second. That is the batch-rename
 * evasion — the files never appear as adds under the watched path in the commit
 * that authored them. `--diff-filter=A --no-renames` still sees 21 adds.
 *
 * Every date is passed via GIT_AUTHOR_DATE/GIT_COMMITTER_DATE, so the output is
 * byte-identical on every run and nothing here reads the clock. That the dates
 * are settable at all is the honest limitation in lint-cadence's docstring: this
 * fixture forges timestamps in four lines. It is deliberately not hidden.
 */
import { spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = join(tmpdir(), "llm-wiki-fixture-cadence-batch");
const DAY = "2026-07-28";

const git = (args, date) => {
  const r = spawnSync("git", ["-c", "user.email=fixture@example.invalid", "-c", "user.name=Fixture", ...args], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  });
  if (r.status !== 0) {
    console.error(`git ${args.join(" ")} failed: ${r.stderr}`);
    process.exit(1);
  }
  return r.stdout;
};

await rm(dir, { recursive: true, force: true });
await mkdir(join(dir, "scratch"), { recursive: true });
await mkdir(join(dir, "wiki/decisions"), { recursive: true });

for (let i = 1; i <= 21; i += 1) {
  const n = String(i).padStart(2, "0");
  await writeFile(
    join(dir, "scratch", `decision-${n}.md`),
    `---\nrole: decision\nevidence: L1\n---\n\n# Decision ${n}\n\nClosed in the same minute as twenty others.\n`,
  );
}

git(["init", "-q", "-b", "main"], `${DAY}T02:00:00Z`);
git(["add", "-A"], `${DAY}T02:00:00Z`);
git(["commit", "-qm", "stage twenty-one decisions outside the watched path"], `${DAY}T02:00:00Z`);

for (let i = 1; i <= 21; i += 1) {
  const n = String(i).padStart(2, "0");
  git(["mv", `scratch/decision-${n}.md`, `wiki/decisions/decision-${n}.md`], `${DAY}T02:04:00Z`);
}
git(["commit", "-qm", "move them into place"], `${DAY}T02:04:00Z`);

console.log(dir);
