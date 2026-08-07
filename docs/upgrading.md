# Upgrading an instance

An instance is a **copy**, not a checkout. Instantiating copies `template/` into
your project and (ideally) records the template commit it came from; from that
moment the copy evolves with your corpus while the template evolves here. That
is by design — an instance must never break because this repo moved — but it
means staleness is silent unless you look for it.

## Knowing where you stand

Two pins tell you what you are running:

- **The commit your instance method/schema records.** Write it down at
  instantiation time (`pattern commit: <sha>` in your instance `AGENTS.md` or
  method page). If you never recorded one, `git log` on the earliest copy of
  your `scripts/` files is a serviceable reconstruction.
- **The `version` field the check scripts print.** `validate.mjs`,
  `lint-structure.mjs`, and `lint-cadence.mjs` all report the
  `TEMPLATE_VERSION` they were copied from in their JSON output. An instance
  whose scripts print no version at all predates `1.1.0`.

## The upgrade itself

1. **Diff scripts first.** The scripts are the contract; docs drift matters
   less. From your instance:

   ```sh
   for f in validate.mjs lint-structure.mjs lint-cadence.mjs; do
     diff scripts/$f /path/to/llm-wiki/template/scripts/$f
   done
   ```

   If your copies are byte-identical to the old template commit, the upgrade is
   a plain re-copy. If you patched them locally, the diff shows you what to
   carry forward — and the patch is worth upstreaming as an issue here.

2. **Re-copy the scripts, then re-run everything.** New checks can turn a
   previously green instance red. That is the upgrade working: the redness was
   already true, the old scripts just could not see it. Triage each new error
   as a real finding, not as upgrade friction. For new *warnings*, commit a
   baseline (`lint-structure.mjs --baseline`, accepted list in
   `wiki/lint/baseline.json`) so the pile is on record and only additions fail.

3. **Adopt new operations incrementally.** A template release may add
   operations (queries residue, semantic lint, metaresearch, priors-locked
   experiments) that your instance predates. Missing directories are not
   errors — adopt an op the first time you actually need it, and create its
   directory then. What *is* worth fixing promptly: directories your schema
   declares but that do not exist. A schema that names `wiki/questions/` while
   no question was ever filed advertises a discipline it does not practice
   (`lint-structure` warns on this shape).

4. **Update the recorded pin.** The instance method page should now name the
   new template commit. The old pin stays in history, which is exactly where a
   "compiled against" record belongs.

## What not to do

- Do not symlink or submodule the template into an instance. The copy is the
  point: your checks must run when this repo is unreachable, renamed, or gone.
- Do not skip versions by cherry-picking single checks. The negative fixtures
  here guard combinations; a hand-carried check without its neighbors may pass
  things the full set rejects.
- Do not rewrite instance history to make old pages match new schema. Supersede
  pages; the log is append-only for the same reason `raw/` is immutable.
