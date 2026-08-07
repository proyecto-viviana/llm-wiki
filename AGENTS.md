# AGENTS — llm-wiki meta-repo

This repository publishes a **pattern** and a **template**, not a single domain wiki.

## What you may change

| Path | Purpose |
| --- | --- |
| `README.md` | Pattern idea file (keep domain-agnostic) |
| `docs/*` | How to instantiate and operate |
| `template/*` | Default layout other projects copy (Lite + Strict) |
| `examples/minimal/*` | Shape + L2 binding (batteries positive case) |
| `examples/compound/*` | Multi-source compound loop demo |
| `examples/failing/*` | Negative fixtures for every mechanical check |
| `scripts/*` | Meta-repo helpers |

## Rules

1. **Stay portable.** No product-specific vocabulary, crate names, or ticket IDs in `README.md` or `template/`.
2. **Credit lineages:** Karpathy (core), Ryan starter (start energy), Viviana batteries when restating the fork.
3. **Template must run offline.** Validate/lint scripts use Node stdlib only.
   Reference-clone scripts use `git` + `timeout` only — no product remotes
   hard-coded; no clone bytes committed.
4. **Examples stay small.** `minimal` = shape; `compound` = multi-page compound;
   neither is a real research corpus.
5. **Prefer improving the template** over adding heavy frameworks.
6. **Every mechanical check ships with a fixture that makes it fail.** Adding a
   check to `validate.mjs` or `lint-structure.mjs` means adding a directory under
   `examples/failing/` whose `expect.json` names the error code. A check nobody
   has watched reject something is decoration, and `check-template.mjs` treats a
   fixture that starts passing as an error.
7. **The minimal example's L2 pins must sit over external bytes.** If the only
   thing it can pin is its own prose, the pattern is teaching the failure it
   exists to prevent.
8. **Dual track is mandatory in docs.** Lite default; Strict batteries; do not
   force claim packets on L0–L1.

## When editing the pattern

- Keep operations named: ingest, query, close, lint (semantic + optional mechanical),
  **metaresearch** (portfolio census when multi-repo / multi-instance),
  **experiment** (priors-locked prototypes / oracles when runnable proof runs).
- Keep evidence levels L0–L3, and keep provenance class capping them.
- Keep page roles: source, hub, decision, question, query residue, metaresearch ticket,
  experiment pack (optional).
- Keep wiki-first compound (hub updates on ingest).
- Keep **sibling Portfolio** (metaresearch leads in `AGENTS.md`) distinct from
  **reference-clones `portfolio.json`** (external git evidence list).
- If you add a concept, document it in `docs/` and mirror defaults in `template/AGENTS.md`.

## Validation

```sh
node scripts/check-template.mjs   # required paths, example passes, every fixture fails
node examples/minimal/scripts/validate.mjs
```

`check-template.mjs` is the only thing standing between this repo and a template
whose checks quietly stopped working. Run it before publishing a change.
