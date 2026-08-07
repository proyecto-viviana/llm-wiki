# Instantiating an LLM Wiki

## Quick copy

```sh
REPO=https://github.com/proyecto-viviana/llm-wiki.git
# or a local path:
# REPO=/path/to/llm-wiki

git clone "$REPO" /tmp/llm-wiki-src
cp -R /tmp/llm-wiki-src/template/. ./knowledge/
```

Pick any directory name: `knowledge/`, `wiki/`, `research/`, `docs/compiled/`.

Record the template commit you copied from in your instance `AGENTS.md`
(`pattern commit: <sha>`) — the copy is yours from here on, and that pin is
what makes a later [upgrade](./upgrading.md) a diff instead of an excavation.
Adopting inside a project that already has a large notes corpus? Read
[adopting-in-an-existing-corpus.md](./adopting-in-an-existing-corpus.md)
first — the recipe below assumes a blank directory.

## Recipe A — Lite (default, Ryan-shaped)

Use this for almost every new instance.

1. Point your coding agent at `knowledge/AGENTS.md`.
2. Edit **Purpose** only; leave track at Lite.
3. Drop **one real source** under `knowledge/raw/`.
4. Supervised **ingest**: source page + **hub updates** + index + log.
5. Ask a real question; file the answer under `wiki/queries/` if it should survive.
6. Run **semantic lint** (`scripts/lint-semantic.md` / [lint-semantic.md](./lint-semantic.md)).
7. First **close** when a stop condition is met — usually **L1**, no claim JSON.

Do **not** require provenance registration, claim packets, or `validate.mjs` until
you promote to Strict or write an L2+ decision.

## Recipe B — Strict (batteries)

Promote when stakes rise (see template `AGENTS.md` Tracks table).

1. Keep everything from Lite.
2. Register sources in `raw/provenance.json` (class + origin + why).
3. For url origins: `scripts/acquire-url.mjs` preferred.
4. For multi-file upstream trees:
   - append `gitignore.fragment` to the **project** `.gitignore`;
   - copy `reference-clones/portfolio.example.json` → `portfolio.json` and edit;
   - acquire/refresh with the shell scripts; pin commits on source pages;
   - never track `repos/` in git.
5. L2+ decisions: claim packets + frontmatter `evidence` / `claims`.
6. Lint order: **semantic agent pass**, then:

```sh
node scripts/validate.mjs
node scripts/lint-structure.mjs
node scripts/lint-cadence.mjs   # agent fleets
```

## Suggested first week

| Day | Action |
| --- | --- |
| 1 | Copy template; write purpose; ingest 1–3 core sources (**hubs**, not leaves) |
| 2–3 | Grow hubs; file query residue; stay Lite |
| 4 | First **close** (L1 unless you truly need L2) |
| 5 | Semantic lint; only then Strict scripts if claims exist |
| ongoing | File good answers back; log ingest/query/close/lint/(metaresearch|experiment) |

## When you will run prototypes

If the instance will host harnesses, oracles, or multi-step measurements:

1. Read [experiments.md](./experiments.md).
2. Copy scaffolds from `template/experiments/` into `experiments/<slug>/` (or keep the
   scaffolds as reference and place packs next to research tracks).
3. **Lock priors before coding**; fill comparison after — see experiment checklist in
   [operations.md](./operations.md).

## Examples in this repo

| Path | Role |
| --- | --- |
| `examples/minimal/` | Small shape + one L2 decision (batteries positive case) |
| `examples/compound/` | Multi-source compound loop without product domain |
| `examples/failing/` | Every mechanical check watched failing |

## Embedding inside a monorepo

- Keep `raw/` out of product build pipelines.
- If raw binaries are large, store them outside git and keep pins + small extracts in-repo.
- Do not mix product tickets with wiki page IDs unless the instance schema defines that mapping.
- Do not use `wiki/log.md` as the monorepo changelog — git and tickets own that.

## Multiple wikis

One repo may hold several instances (`research/`, `ops/`, `personal/`) each with its own `AGENTS.md`. Do not silently share writable wiki trees across agents without a merge/review rule.

### Cross-research across projects (metaresearch)

If you maintain **several wiki instances or several product repos**, fill the
template **Sibling portfolio** table and treat **metaresearch** as an early op on
each new workstream. See [metaresearch.md](./metaresearch.md).

| Do | Don't |
| --- | --- |
| Census sibling `wiki/index.md` read-only | Merge all hubs into one shared writable tree |
| Re-pin external sources into *this* instance for L2 | Treat sibling decisions as external-primary |
| Record reuse modes + forbid-product | Import private product engines as “the algorithm” |
| Log `metaresearch` ops | Rely on chat memory for “we already had a crate for that” |

Recipe addition for multi-repo humans (either track):

0. (Optional day 0) Write **Sibling portfolio** paths in `AGENTS.md`; run one
   `wiki/metaresearch/EARLY-TICKET.md` census for the first workstream.

## Viewers

Optional human loop (Obsidian, clipper, search): [viewers.md](./viewers.md).
