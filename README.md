# LLM Wiki

A portable pattern for **compiled knowledge bases** maintained by LLM agents.

This repository is:

1. an **idea file** (this README) — the pattern in plain language;
2. a **copyable setup** under [`template/`](template/) — directory layout, schema, and scripts other projects can repeat;
3. a **minimal example** under [`examples/minimal/`](examples/minimal/) — a tiny wiki that shows the shape.

**Fork thesis:** [Ryan Dahl’s starter](https://github.com/ry/llm-wiki-starter) maximizes *start* (paste the idea, grow a wiki). This repo keeps that loop and adds **batteries** (evidence levels, provenance caps, page roles, closeouts, optional machine checks) for agent fleets that must not launder self-citation. Core compile-vs-RAG idea: [Andrej Karpathy’s llm-wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

| Track | Goal | Default rigor |
| --- | --- | --- |
| **Lite** | First useful pages today | L0–L1, multi-page ingest, agent semantic lint |
| **Strict** | Load-bearing / multi-agent / promote-bound | Provenance + L2+ claims + validate scripts |

Stay Lite until stakes require Strict; empty `claims/` is healthy there.

---

## The core idea

Most people’s experience with LLMs and documents looks like RAG: upload files, retrieve chunks at query time, generate an answer. That works, but the model rediscovers knowledge from scratch on every question. Nothing compounds.

**Instead:** the LLM incrementally builds and maintains a **persistent wiki** — interlinked markdown between you and the raw sources. When a source arrives, it is not only indexed; it is read, integrated, and used to update entity and concept pages, flag contradictions, and strengthen or challenge the synthesis. Knowledge is compiled once and **kept current**.

The wiki is a compounding artifact. Cross-references are already there. Contradictions are already flagged. Synthesis already reflects what you have read. It gets richer with every source and every good question.

You rarely write the wiki by hand. You curate sources, set direction, and ask questions. The LLM does the bookkeeping: summarizing, cross-referencing, filing, linting. In practice: agent on one side, file browser or Obsidian on the other. The wiki is the codebase; the LLM is the programmer; you are the editor-in-chief.

### Where it fits

Personal notes, multi-week research, book companions, team internal wikis, competitive analysis, due diligence, course notes, hobby deep-dives — anything that accumulates and should stay organized rather than scattered in chat.

---

## Architecture

### Three layers

| Layer | Role | Who writes |
| --- | --- | --- |
| **Raw sources** | Curated inputs: articles, papers, exports, images, data. **Immutable.** | Humans (and fetch tools). The LLM never rewrites raw. |
| **Reference clones** *(optional)* | Git-ignored, latest-only upstream checkouts for multi-file code/spec evidence. | Acquire/refresh scripts; never product imports by default. |
| **Wiki** | Compiled markdown: hubs, decisions, source summaries, filed answers. | LLM by default; humans review and promote. |
| **Schema** | `AGENTS.md` (or equivalent): structure, page roles, ops, when pins are required. | Humans co-evolve with the agent. |

Raw is truth for *what was ingested as files* — but not, on its own, truth for
*where those files came from*. `raw/provenance.json` records that separately,
because a directory of files looks equally authoritative whether the bytes came
from a standards body or from our own summary written an hour ago. See
[docs/provenance.md](docs/provenance.md).

Reference clones are truth for
*what an upstream tree looked like at a recorded commit* (evidence, not
vendoring). Wiki is truth for *what we currently believe and how it connects*.
Schema is truth for *how the agent must behave*.

See [docs/reference-clones.md](docs/reference-clones.md) for depth-1 blobless
sparse acquire/refresh, dirty refusal, timeouts, and wiki pin receipts.

### Page roles (wiki layer)

Not every page is the same kind of object. Recommended roles:

| Role | Purpose | Typical lifecycle |
| --- | --- | --- |
| **Source page** | Summary of one raw input + links into hubs | Created on ingest; rarely rewritten wholesale |
| **Concept / entity hub** | Associative page for a person, idea, system, term | Updated on almost every related ingest |
| **Decision** | Closed disposition with evidence and non-claims | Written when a bounded question stops |
| **Open question** | Named question + stop condition + status | Created early; closed or parked deliberately |
| **Query residue** | A good answer worth keeping (comparison, analysis) | Filed under `wiki/queries/`, not left in chat |

Leaf-only wikis (new note per ingest, no hub updates) do not compound. **One ingest should touch many pages** — often a source page, several hubs, index, and log. **Wiki-first:** claim packets (when used) never replace hub updates.

### Evidence levels and claims policy

Not every claim needs the same rigor. Scale by stakes:

| Level | Meaning | Use when | Claim JSON? |
| --- | --- | --- | --- |
| **L0** | Note / working memory | Journaling, soft exploration | No |
| **L1** | Cited synthesis (prose links to sources) | Most personal and team wiki pages | No |
| **L2** | Pinned claim (source identity + revision/digest + optional span) | Research, policy, anything you may defend later | **Yes** (Strict) |
| **L3** | Checked claim (L2 + a validator script that fails on drift) | High-stakes or multi-agent corpora | **Yes** |

The pattern does not require L2/L3 everywhere. It requires **honest level**: do not present L0 notes as proven decisions. Empty `claims/` is correct on Lite.

**Provenance caps the level** (Strict / L2+). These levels measure how carefully a claim is
pinned, which says nothing about whether the pinned thing came from outside the
project — and hashing a document you wrote yesterday produces a perfectly valid
L2 packet containing no knowledge. So a claim citing your own corpus is L1 at
most, regardless of digests; L2/L3 require an external source (or, for claims
about your own system's behaviour, your own code). Sources are registered with a
class, and the class is checked against the origin so relabelling does not work.
See [docs/provenance.md](docs/provenance.md).

This is the one rule here that came from a failure rather than a design session.
A corpus accumulated 83 green validators over several days while containing three
external files in total: every other pin hashed documents the same agents had
written hours earlier, and every check passed the whole time.

### Optional boundary: promotion

Some instances sit next to a second authority (product code, legal policy, ops runbooks). Compiled wiki knowledge is **not automatically that authority**. Promotion is an explicit human step: copy or restate into the owning system with a named owner. Instances without a second authority can ignore this section.

### Optional op: metaresearch (sibling portfolio census)

If you maintain **multiple wiki instances or multiple product repos**, agents will otherwise reinvent pipelines and launder sibling prose as “external.” **Metaresearch** is the early ticket: census siblings, assign **reuse modes** (pattern / wiki-ingest / thin-port / package-link / forbid-product), write anti-inventory, then invent. Sibling wikis are L1 leads for *this* instance until you re-pin external sources here. Full pattern: [docs/metaresearch.md](docs/metaresearch.md). Template hook: optional `wiki/metaresearch/` + **Sibling portfolio** table in `AGENTS.md` (distinct from `reference-clones/portfolio.json`, which is for external git evidence).

---

## Operations

### Ingest

Drop or pin a raw source, then ask the agent to process it.

Typical flow:

1. Read the source (and only that source’s bytes/revision for hard claims).
2. Discuss or confirm emphasis with the human when stakes are high.
3. Write or update a **source page**.
4. Update every relevant **concept/entity hub** (create hubs that are missing).
5. Update **index** and append **log**.
6. If the source closes a bounded question, write or revise a **decision** with non-claims.
7. Optionally add L2/L3 claim pins under `claims/`.

A single source might touch 10–15 files. Prefer supervised single-source ingest for important material; batch only when the schema says so.

### Query

Ask against the **wiki first** (index → hubs → decisions), not only raw dumps. Synthesize with citations to wiki pages and, when needed, raw sources.

**File good answers back** as query-residue or decision pages rather than leaving them in chat.

### Close (optional but powerful)

Turn exploration into a **decision**:

- question and stop condition were met;
- disposition is explicit;
- evidence level is stated;
- **non-claims** list what was *not* established;
- hubs and index point at the decision.

Without close, wikis accumulate leaves and never crystallize judgment.

### Experiment (optional; prototypes and L3 proof)

When the work is a **runnable** prototype, oracle, harness, or multi-step
measurement — not a pure survey — lock beliefs **before** the run and score them
**after**:

1. **PRIORS** (belief, confidence, falsified-if) + **ENCOUNTERS** (what we may hit).
2. Tickets with stop conditions, prior/encounter IDs, and a **claim ceiling**.
3. **COMPARISON** after each ticket: `holds` / `falsified` / `inconclusive` —
   never rewrite prior text to match outcomes.
4. Synthesize which priors survived; promote only with an explicit human step.

Scaffolds: [`template/experiments/`](template/experiments/). Pattern:
[docs/experiments.md](docs/experiments.md). Log:
`## [YYYY-MM-DD] experiment | lock|run|synthesize <slug>`.

### Lint

**Semantic first** (Lite and Strict) — agent health check:

- contradictions between pages;
- stale claims superseded by newer sources or decisions;
- orphan pages (no inbound links);
- concepts mentioned often but lacking a hub;
- missing reverse links after a close;
- open questions with no stop condition;
- suggest next questions and sources.

See [docs/lint-semantic.md](docs/lint-semantic.md). Log each pass; optional report under `wiki/lint/`.

**Mechanical batteries** (Strict, or whenever `claims/` is non-empty):
[`template/scripts/`](template/scripts/) — pin digests, provenance, structure,
cadence. Machine checks catch integrity drift; they do **not** prove the wiki is
worth reading.

---

## Indexing and logging

**`wiki/index.md`** — content catalog: link, one-line summary, role, optional metadata. Updated on every ingest/close. Agents read index first at moderate scale (~hundreds of pages) before grepping the tree.

**`wiki/log.md`** — append-only chronology. Suggested prefixes:

```text
## [YYYY-MM-DD] ingest       | <source title>
## [YYYY-MM-DD] query        | <short topic>
## [YYYY-MM-DD] close        | <decision title>
## [YYYY-MM-DD] lint         | <summary>
## [YYYY-MM-DD] metaresearch | <portfolio / workstream>
## [YYYY-MM-DD] experiment   | lock|run|synthesize <slug>
```

```sh
grep '^## \[' wiki/log.md | tail -5
```

Git history is an audit trail; the log is a *narrative* trail for humans and agents.

---

## Portable setup (this repo)

```text
llm-wiki/
├── README.md                 ← you are here (pattern)
├── AGENTS.md                 ← how to maintain this meta-repo
├── docs/                     ← instantiating, roles, evidence, ops, lint, viewers
├── template/                 ← copy into any project
│   ├── AGENTS.md             ← instance schema (Lite default + Strict batteries)
│   ├── raw/                  ← immutable file sources
│   ├── reference-clones/     ← portfolio manifest (clones live in /repos)
│   ├── wiki/                 ← compiled pages (incl. queries/, lint/)
│   ├── experiments/          ← optional priors-locked prototype scaffolds
│   ├── claims/               ← L2/L3 packets when needed (empty OK on Lite)
│   ├── gitignore.fragment    ← add /repos/ to the host project
│   └── scripts/              ← validate, structure, cadence, acquire, semantic prompt
├── examples/minimal/         ← shape + one L2 binding (batteries positive case)
├── examples/compound/        ← multi-source hubs + residue (Ryan loop demo)
├── examples/failing/         ← negative fixtures: every check, watched failing
└── scripts/                  ← helpers for this meta-repo
```

| Example | Proves |
| --- | --- |
| `minimal` | Roles + L2 binding + validators pass |
| `compound` | Multi-ingest hub fan-out, query residue, supersession (compound loop) |
| `failing/*` | Every check can fail for a named reason |

Every mechanical check in `template/scripts/` has at least one fixture under
`examples/failing/` that makes it fail, and `scripts/check-template.mjs` treats
a fixture that starts *passing* as an error.
[`docs/closeout-2026-07-28.md`](docs/closeout-2026-07-28.md) records what each
one printed the day the set was completed.

**New project (Lite first):**

```sh
# from a project root
cp -R path/to/llm-wiki/template/. knowledge/   # or docs/wiki/, research/, …
# edit knowledge/AGENTS.md purpose; stay Lite until you need L2+
# point your coding agent at knowledge/AGENTS.md
# ingest one real source: source page + hubs + index + log
```

See [docs/instantiating.md](docs/instantiating.md). Dropping the pattern into a
project that already has a large notes tree is its own recipe — quarantine, do
not retrofit: [docs/adopting-in-an-existing-corpus.md](docs/adopting-in-an-existing-corpus.md).
Instances are copies and go stale on purpose; when this repo moves, see
[docs/upgrading.md](docs/upgrading.md).

---

## Schema contract (every instance)

The instance `AGENTS.md` should define at least:

1. purpose and **which track** (Lite default vs Strict);
2. directory layout and page roles in use;
3. when L0 vs L1 vs L2/L3 is required (and that L0–L1 need no claim JSON);
4. ingest checklist (**wiki-first** multi-page update rule);
5. query file-back policy (`wiki/queries/`);
6. close and promotion rules (if any);
7. experiment rules when prototypes run (priors lock → compare; optional);
8. lint: semantic always; mechanical scripts when Strict / claims exist;
9. naming conventions and what *not* to invent from memory when sources exist;
10. close-rate limits in `cadence.json`, if Strict and agent-driven.

Co-evolve the schema; do not treat the first draft as sacred.

---

## Optional tooling

- **Viewers / human loop:** [docs/viewers.md](docs/viewers.md) — Obsidian, clipper, assets, Marp, Dataview, search scale.
- **Small scale:** `index.md` + `rg` / editor search is enough.
- **Larger scale:** local search (e.g. [qmd](https://github.com/tobi/qmd)), still over the compiled wiki.
- **Integrity (Strict batteries):** Node scripts in `template/scripts/` validate claim digests, provenance registration, and basic link presence — no cloud, no vector DB required.
- **Cadence:** `lint-cadence.mjs` reads closes out of `git log` — a side effect of the work rather than a claim about it. See `examples/failing/cadence-batch/`.
- **Reference clones:** `acquire-reference-clone.sh` / `refresh-reference-clones.sh` for latest-only blobless portfolios under a git-ignored `repos/` root.

Prefer boring files over infrastructure until the index stops fitting in context.

---

## Anti-patterns

| Anti-pattern | Prefer |
| --- | --- |
| RAG-only, no compiled layer | Maintain the wiki |
| Inventing known algorithms/structures from memory | Source and pin first |
| Leaf-only ingest (no hub updates) | Multi-page / **wiki-first** ingest |
| Claim packets without hub updates | Update hubs; claims are optional until L2 |
| Empty green instance (validators pass, no knowledge) | Ingest real sources; semantic lint |
| Forcing Strict on day one | Lite until stakes require batteries |
| Infinite adjacent mining | Bounded question + stop |
| Presenting notes as decisions | Evidence levels + close |
| Silent promotion into product/policy | Explicit promotion step |
| Hard claims without pins when stakes are high | L2/L3 |
| Skipping semantic lint | Agent lint first; scripts on Strict |
| Letting chat answers vanish | File-back under `wiki/queries/` |
| Full-history clones / importing from `repos/` as deps | Latest-only evidence; pin commit; no silent vendoring |
| Refreshing dirty clones or moving line pins without reconcile | Refuse dirty; re-pin after tip change |
| Citing your own corpus at L2 because it has a digest | Provenance class caps the level |
| Copying your own documents into `raw/` to make them citable | Register honestly as `own-corpus`; say it at L1 |
| Treating a green validator as evidence | It checks integrity, not worth |
| Shipping a check nobody has watched fail | A negative fixture per check |
| Closing many questions in one commit | One close per commit; cadence is legible in history |
| Closing a question that could not be sourced | Park it as `parked-unsourced` — an honest park is a success |

---

## Why this works

The hard part of a knowledge base is not reading — it is maintenance: cross-refs, stale claims, consistency across dozens of pages. Humans abandon wikis because maintenance grows faster than value. LLMs do not get bored and can touch many files in one pass. Humans keep judgment: what to source, what matters, what to promote.

Related in spirit to Vannevar Bush’s Memex (1945): private, curated, associative trails. The missing piece was who maintains the trails. The agent can — if the schema forces multi-page updates, honest evidence levels, and lint.

---

## Credit

- Compile-vs-RAG core: [Andrej Karpathy, llm-wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) (2026).
- Paste-and-go starter shape: [ry/llm-wiki-starter](https://github.com/ry/llm-wiki-starter) (`raw/llm-wiki.md`).
- Evidence pins, provenance caps, bounded closeouts, page roles, dual Lite/Strict tracks, and optional validators: Proyecto Viviana practice, generalized here.

This document is intentionally portable. Domain names, product APIs, and ticket systems belong in *instances*, not in this pattern.

## License

See [LICENSE](LICENSE).
