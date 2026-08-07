# Metaresearch (research of research)

**Metaresearch** is a first-class operation: before you invent structure, mine memory, or open a greenfield demo/feature ticket, you **census sibling knowledge and code** you already control (or already pin), then choose an honest reuse mode.

It is not RAG over the monorepo. It is a **compiled inventory** — usually one early ticket page — that compounds like any other wiki page.

## Why it exists

Common failure modes this catches:

1. **Reinventing a capability** that another repo or wiki instance already compiled (pipelines, packages, validators, teaching demos).
2. **Laundering sibling prose** as external L2: another wiki’s decision is still **own-corpus** relative to your instance until you re-source the *external* bytes it depended on.
3. **Importing product authority** by accident (shipping a private engine into a public curriculum, or treating a design tool’s ABI as “the” algorithm).
4. **Fleet thrash**: agents that do not know the portfolio will re-derive the same hubs under new names.

If your life has **more than one wiki instance or more than one product repo**, metaresearch belongs in the schema — not only in chat memory.

## When (Lite and Strict)

| Trigger | Action |
| --- | --- |
| New instance / empty wiki | Optional **portfolio scan** once purpose is written |
| New major workstream (feature, demo series, policy track) | **Required:** metaresearch ticket before first inventing ingest |
| “We should build X” | Metaresearch → reuse modes → then open/close |
| Multi-agent fleet | Paste the latest metaresearch ticket into the fleet brief |

Stay Lite for the census itself (L0–L1). Promote individual *load-bearing* claims from that census only when Strict pins exist.

## Reuse modes (portable vocabulary)

Record each asset with exactly one mode:

| Mode | Meaning |
| --- | --- |
| **host-already** | Already wired in *this* project; do not re-home |
| **pattern** | Mental model, layout, or ops only — reimplement if needed |
| **wiki-ingest** | Bring *classic / external* substance into *this* wiki (source-first) |
| **thin-port** | Teaching or isolated reimplementation of a public algorithm |
| **package-link** | Depend on a published or workspace package deliberately |
| **wasm-build / artifact** | Build or consume a binary artifact with a documented origin |
| **forbid-product** | Do not import or restate as curriculum/product authority |
| **out-of-scope** | Noted so agents stop rediscovering it |

Modes are **judgment**, not machine-checked. Wrong mode + confident prose is a semantic lint smell.

## Evidence honesty across instances

| What you found | Max level in *this* wiki without new work |
| --- | --- |
| Sibling wiki hub or decision | **L1** synthesis (cite the sibling path; non-claim that it is not external) |
| Sibling package README / code behavior | **L1** until `product-code` or external pins on Strict |
| External paper/RFC the sibling already pinned | Re-acquire or re-pin **here** for L2+; do not trust their digest alone |
| “I remember we had a crate for that” | **L0** until the path is verified |

**Rule:** sibling compilation is a **lead**, not a provenance class upgrade.

## Layout (optional, recommended in multi-repo lives)

```text
wiki/
  metaresearch/
    index.md           catalog of census tickets
    EARLY-TICKET.md    or YYYY-MM-DD-topic.md
```

Alternatively a single decision under `wiki/decisions/` is enough for small instances.
Use `metaresearch/` when you expect **repeated** portfolio scans.

Log prefix:

```text
## [YYYY-MM-DD] metaresearch | <one-line topic>
```

## Procedure (agent)

1. Read **this instance** `wiki/index.md` and purpose in `AGENTS.md`.
2. List the **sibling portfolio** (sibling repos / other wiki roots). Prefer an explicit list in `AGENTS.md` → **Sibling portfolio** when the human maintains one; otherwise discover from the monorepo root with a bounded `ls` (do not recursive-dump the disk).
3. For each candidate: open README / wiki index / package map only — depth-bounded.
4. Write a ticket page with:
   - question + stop condition  
   - inventory table (path · what it is · reuse mode · risk)  
   - **anti-inventory** (temptations to refuse)  
   - follow-up tickets / next ops (ingest, thin-port, forbid)  
   - non-claims + evidence level  
5. Update `wiki/index.md` and `wiki/log.md`.
6. **Do not** copy product trees into `raw/` as if they were external standards.
7. Only then invent greenfield structure.

## Sibling portfolio section (schema hook)

Instances that sit in a monorepo should add to `AGENTS.md`:

```md
## Sibling portfolio (optional; metaresearch)

Sibling wiki roots and code trees agents may census during metaresearch.
Paths are local leads, not automatic evidence.

**Not** `reference-clones/portfolio.json` — that lists external git remotes to
clone as evidence. This table lists *your other projects*.

| Path | Role |
| --- | --- |
| ../other-project/knowledge | sibling wiki |
| ../other-project | product code (forbid-product unless stated) |
```

Empty sibling portfolio is fine for single-repo personal wikis.

## Cross-research without a shared writable tree

Multiple wiki instances must **not** silently share one writable `wiki/` tree across agents.

Allowed patterns:

1. **Read-only census** of sibling `wiki/index.md` + hubs → write only into *this* instance.  
2. **Promotion** of a decision into product/docs (human-owned).  
3. **Re-ingest external sources** both instances care about (each keeps its own pins).  
4. Optional later: a thin **portfolio index** repo that only links instance roots (no merged hubs).

Forbidden: two agents appending to the same hub file from two products without a merge rule.

## Relationship to other ops

| Op | Relation to metaresearch |
| --- | --- |
| **Ingest** | After metaresearch, ingest *external* or *local raw* material — not bulk-dump sibling wikis |
| **Query** | May answer “what do we already have?” by reading the metaresearch ticket first |
| **Close** | Metaresearch tickets often *close* as “reuse X, forbid Y” decisions |
| **Lint** | Smell: new workstream with no sibling scan when `AGENTS.md` lists a sibling portfolio |

## Non-claims of this pattern doc

- Does not require a global knowledge graph or federated search.  
- Does not make monorepo paths portable across machines without human edits.  
- Does not replace reference-clones for upstream *external* trees.  
- Does not grant license to vendor product code into public teaching corpora.

## Worked shape (generic)

```md
# Metaresearch: <workstream>

## Question
What existing wikis/packages should we reuse before building X?

## Stop condition
Inventory table + reuse modes + anti-list for this workstream.

## Inventory
| Path | Signal | Mode |
| --- | --- | --- |
| … | … | pattern / wiki-ingest / forbid-product / … |

## Anti-inventory
| Temptation | Why not |
| --- | --- |
| … | … |

## Follow-ups
- …

## Evidence
L1 local path census YYYY-MM-DD

## Non-claims
- …
```
