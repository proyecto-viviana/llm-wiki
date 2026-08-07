# AGENTS — knowledge base schema

This directory is an **LLM Wiki instance**: compiled knowledge maintained by
agents under this schema. Pattern reference:
[proyecto-viviana/llm-wiki](https://github.com/proyecto-viviana/llm-wiki).

**Fork thesis:** Ryan-style start energy (compile a wiki, multi-page ingest,
file answers back) plus optional **batteries** (provenance, L2+ claims, machine
checks) when stakes rise. Empty green validators are not research.

## Purpose

<!-- One paragraph: what this wiki is for. Edit for your project. -->

_TODO: describe the domain and audience of this instance._

## Tracks

| Track | When | Required |
| --- | --- | --- |
| **Lite** (default) | Personal notes, early research, exploration | `raw/` + `wiki/` + this schema; L0–L1; multi-page ingest; agent semantic lint |
| **Strict** | Load-bearing research, multi-agent, promote-to-product/policy | Everything Lite **plus** provenance registry, claim packets for L2+, `validate` / structure (/ cadence) scripts |

**Promote to Strict** when any of: you need L2+ decisions; multiple agents edit
without shared trust; compiled pages may be promoted into product or policy; or
you have already been burned by self-citation.

Stay Lite until then. Empty `claims/` is healthy on Lite.

## Layout

```text
raw/                 immutable file sources (never rewritten by the agent)
  provenance.json    registry (Strict / before any L2+ cite) — class + origin
cadence.json         optional close-rate limits (Strict agent fleets)
reference-clones/    portfolio manifest only (clone bytes live elsewhere)
wiki/
  index.md           content catalog
  log.md             append-only operations log (ingest|query|close|lint|metaresearch|experiment)
  sources/           one page per ingested source
  concepts/          concept hubs
  entities/          entity hubs (optional split)
  decisions/         closed dispositions
  questions/         bounded open questions
  queries/           query residue (filed answers worth keeping)
  metaresearch/      optional: portfolio census tickets (research of research)
  lint/              semantic lint reports (optional)
experiments/         optional: priors-locked prototype packs (see below)
claims/              L2/L3 claim packets — only when level ≥ L2
scripts/             batteries: validate, lint, acquire/refresh
```

**Reference clone bytes** default to `$PROJECT_ROOT/repos/` (gitignored via
`gitignore.fragment`). Override with `LLM_WIKI_REPOS_ROOT`. Clones are
**evidence**, not dependencies: depth-1, `--filter=blob:none`, prefer sparse,
detach after refresh, refuse dirty trees, bounded network timeout.

## Sibling portfolio (optional; metaresearch)

Sibling wiki roots and code trees agents may **census during metaresearch**.
Paths are local leads, not automatic evidence. Leave empty for a single-repo wiki.

**Not the same as** `reference-clones/portfolio.json` (that file lists *external*
git remotes to clone as evidence). This table lists *your other projects*.

| Path | Role |
| --- | --- |
| <!-- ../sibling/knowledge | sibling wiki instance --> | |
| <!-- ../sibling | product or library code --> | |

## Page roles

Source · concept/entity hub · decision · open question · query residue ·
**metaresearch ticket** (portfolio census; optional role) ·
**experiment pack** (priors-locked prototype phase; optional role).

**Wiki-first compound:** a successful ingest updates hubs (or creates them).
Source page + index + log alone is incomplete. Prefer updating hubs over
near-duplicate pages.

**Metaresearch before inventing:** when this wiki sits next to other projects or
other wiki instances, run a portfolio census (reuse modes, anti-inventory) before
greenfield structure. Sibling wiki pages are **L1 leads** for *this* instance —
they do not upgrade provenance. Full procedure: pattern
[docs/metaresearch.md](https://github.com/proyecto-viviana/llm-wiki/blob/main/docs/metaresearch.md).

**Priors-locked experiments before multi-step prototypes:** when the work is a
runnable oracle/harness/measurement (not pure survey), lock **priors** and
**encounters** before coding; fill **comparison** after
(`holds` / `falsified` / `inconclusive`). Never rewrite priors to match outcomes.
Scaffolds ship under `experiments/` in this template. Full procedure: pattern
[docs/experiments.md](https://github.com/proyecto-viviana/llm-wiki/blob/main/docs/experiments.md).

## Evidence levels and claims policy

| Stakes | Level | Claims JSON? |
| --- | --- | --- |
| Exploratory notes | L0–L1 | **No** — prose + wiki links |
| Shared team understanding | L1 | **No** |
| Load-bearing technical or policy claims | L2 | **Yes** — packet + provenance |
| Multi-agent or promotion-bound | L3 when practical | **Yes** + validator |

Empty `claims/` is correct when nothing is L2+. Do not create claim packets “for
show.” Do not present L0 notes as decisions.

### Strict: decision frontmatter

When a decision is L2+, declare level in frontmatter (prose is not machine-readable):

```md
---
evidence: L2
claims: [CLAIM-example]
---
```

`lint-structure.mjs` requires `evidence:` on every page under `wiki/decisions/`,
`claims:` naming existing packets at L2+ (`E_DECISION_UNBOUND`), and at least one
external-primary or external-secondary bound claim (`E_DECISION_NO_EXTERNAL`).

### Provenance caps (Strict)

A claim citing our own corpus is L1 at most. Register every source in
`raw/provenance.json` before citing it at L2+. Full rules:
[provenance.md](https://github.com/proyecto-viviana/llm-wiki/blob/main/docs/provenance.md).

`product-code` requires non-empty `productRoots` and paths inside those roots.

## Source-first rule

If a claim concerns a known algorithm, protocol, or published method, **source
and pin it** (Lite: capture under `raw/` and cite; Strict: register + pin) before
inventing structure from memory. If a source cannot be obtained, close as
**parked-unsourced** — an honest park is a success.

## Operations

### Ingest (both tracks)

1. Place immutable material under `raw/` (or pin external storage).
2. **Strict / before L2:** register in `raw/provenance.json`. For url origins,
   prefer `scripts/acquire-url.mjs`. For git trees, refresh reference clones first.
3. Write/update `wiki/sources/<id>.md`.
4. **Update every affected hub** under `concepts/` / `entities/` (create if missing).
5. Update `wiki/index.md` and append `wiki/log.md` (`## [YYYY-MM-DD] ingest | …`).
6. Add claim packets under `claims/` **only** when level ≥ L2.

### Metaresearch (both tracks; when sibling portfolio is non-empty or workstream is new)

1. Read this schema’s **Sibling portfolio** table (or boundedly discover sibling roots).
2. Census READMEs / sibling `wiki/index.md` only — depth-limited.
3. Write `wiki/metaresearch/<ticket>.md` (or a decision) with inventory, **reuse
   modes**, anti-inventory, follow-ups, non-claims.
4. Update index + log (`## [YYYY-MM-DD] metaresearch | …`).
5. Only then invent structure or open implementation tickets.

### Query (both tracks)

Read `wiki/index.md` first (and any metaresearch ticket for “what exists?”).
Cite pages. File durable answers under
`wiki/queries/` (query residue). Chat is ephemeral; the wiki compounds.

### Close (both tracks)

When a bounded question’s stop condition is met, write `wiki/decisions/<id>.md`
with disposition, evidence level, and **non-claims**. Link hubs. Log the close.
Use L1 unless Strict pins justify L2+.

### Experiment (both tracks; when prototypes run)

1. **Lock** PRIORS + ENCOUNTERS before implementation; empty COMPARISON tables.
2. Ticket each step with stop conditions, prior IDs, encounter IDs, **claim ceiling**.
3. **After** each ticket: COMPARISON rows only — do not rewrite prior statements.
4. Synthesize which priors survived; recommend stop / deepen / human promotion.
5. Log `## [YYYY-MM-DD] experiment | lock|run|synthesize | <slug>`.

Single small prototypes may inline priors + encounters + comparison on one ticket.
Survey-only work skips this op. Scaffolds: `experiments/` in this template.

### Lint

**Always (Lite + Strict) — semantic first:**

1. Agent semantic lint — see `scripts/lint-semantic.md` and pattern
   [lint-semantic.md](https://github.com/proyecto-viviana/llm-wiki/blob/main/docs/lint-semantic.md).
2. Write `wiki/lint/YYYY-MM-DD.md` and log `## [YYYY-MM-DD] lint | …`.

**Strict / when claims exist — mechanical:**

```sh
node scripts/validate.mjs
node scripts/lint-structure.mjs
node scripts/lint-cadence.mjs   # if agent-driven closes
```

Green validate on an empty corpus is not evidence of a healthy wiki.

## Promotion (optional)

If this wiki sits next to another authority (product code, legal policy, ops
runbook), compiled pages are **not** that authority until a human promotes them
with an explicit step. Delete this section if unused.

## Naming

- Prefer stable kebab-case ids: `wiki/concepts/evidence-levels.md`
- Log lines: `## [YYYY-MM-DD] ingest|query|close|lint|metaresearch|experiment | title`
- Do not use the log for monorepo or ticket chatter; that belongs in git/tickets.
- Experiment prior IDs: `P-A1`… · encounter IDs: `E1.1`… · uncatalogued: `E9.x`

## Non-goals for the agent

- Do not rewrite files under `raw/`.
- Do not invent ticket/product vocabulary not already in the schema.
- Do not delete decisions; supersede them.
- Do not treat a green validator as evidence.
- Do not copy our own documents into `raw/` to launder them as external.
- Do not register a path that leaves `raw/` (`E_PROV_ESCAPE`).
- Do not batch closes on Strict fleets (one close per commit when cadence applies).
- Do not create claim packets for L0–L1 content.
