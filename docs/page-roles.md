# Page roles

## Source page

- One raw input → one source page under `wiki/sources/`.
- Capture: title, date ingested, locator (path/URL), revision or digest if known, short summary, outbound links to hubs.
- Do not treat the source page as the only place knowledge lives.

## Concept / entity hub

- Stable name for a thing you will link to repeatedly.
- Updated on related ingests and closes.
- Holds current synthesis, open tensions, and links to decisions.
- Prefer updating an existing hub over creating near-duplicate names.

## Decision

- Closed disposition for a bounded question.
- Required sections: question, stop condition, disposition, evidence level, non-claims, links to sources/hubs.
- Decisions should not silently rewrite history; supersede explicitly.

## Open question

- Named question, why it matters, stop condition, status (`open` / `parked` / `closed`).
- Prevents infinite adjacent mining.

## Query residue

- Filed answer from a query worth keeping.
- Default path: `wiki/queries/<id>.md` (create the directory on first file-back).
- Link hubs and sources; promote to decision if it becomes binding judgment.
- Log as `## [YYYY-MM-DD] query | <topic>` when filing.

## Metaresearch ticket

- Sibling portfolio census: what sibling wikis/packages exist and how this instance may reuse them.
- Default path: `wiki/metaresearch/<ticket>.md` (optional directory).
- Required shape: question, stop condition, inventory + reuse modes, anti-inventory, non-claims, evidence level.
- Sibling pages are **leads** (L1 max) until external material is re-sourced here.
- Log as `## [YYYY-MM-DD] metaresearch | <topic>`.
- Full pattern: [metaresearch.md](./metaresearch.md).

## Experiment pack (optional)

- Priors-locked prototype / oracle / multi-step measurement phase.
- Default path: `experiments/<slug>/` (or `phase-N/` beside the wiki) — not every instance needs this.
- Required shape: locked **priors**, **encounters**, tickets with **claim ceiling**, **comparison** filled after runs.
- Rule: do not rewrite priors after execution starts; score `holds` / `falsified` / `inconclusive`.
- Log as `## [YYYY-MM-DD] experiment | lock|run|synthesize <slug>`.
- Full pattern: [experiments.md](./experiments.md). Scaffolds: `template/experiments/`.
