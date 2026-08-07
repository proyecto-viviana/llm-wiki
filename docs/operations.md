# Operations cheat sheet

Tracks: **Lite** (default) · **Strict** (batteries). See instance `AGENTS.md`.

## Metaresearch checklist

Use when the instance has a **Sibling portfolio** table, multiple repos, or a new
workstream before greenfield invention. Full pattern: [metaresearch.md](./metaresearch.md).

- [ ] Read this instance `wiki/index.md` + purpose
- [ ] Census sibling portfolio paths (wikis / packages) depth-bounded
- [ ] Inventory table with **reuse modes** (pattern / wiki-ingest / thin-port / package-link / forbid-product / …)
- [ ] Anti-inventory (temptations refused)
- [ ] Evidence honesty: sibling wiki prose ≤ L1 lead unless re-pinned here
- [ ] Ticket under `wiki/metaresearch/` or decision page with non-claims
- [ ] Index + log (`## [YYYY-MM-DD] metaresearch | …`)
- [ ] Follow-ups listed before inventing code or hubs from memory

## Ingest checklist

- [ ] Raw bytes stored or external pin recorded (immutable)
- [ ] **Source page** written/updated with links **into hubs**
- [ ] **Every affected hub** updated or created (wiki-first — required both tracks)
- [ ] Index updated
- [ ] Log entry appended (`## [YYYY-MM-DD] ingest | …`)
- [ ] Open questions adjusted if the source answers or reframes them
- [ ] No invention of known structures without sourcing
- [ ] **Lite:** stop here for L0–L1
- [ ] **Strict / before L2:** source registered in `raw/provenance.json` (honest class)
- [ ] **Strict:** if using git trees — clones refreshed; dirty not overwritten; paths recorded
- [ ] L2/L3 claim packets **only** for load-bearing statements
- [ ] No product import from `repos/` unless instance schema allows

## Query checklist

- [ ] Read `wiki/index.md` first
- [ ] Cite wiki pages (and raw when needed)
- [ ] File residue under `wiki/queries/` if the answer should survive the session
- [ ] Log `## [YYYY-MM-DD] query | …` when filing residue

## Close checklist

- [ ] Stop condition stated and met
- [ ] Decision page with non-claims
- [ ] Honest evidence level (L1 default; L2+ only with pins on Strict)
- [ ] Hubs link to the decision
- [ ] Superseded decisions marked
- [ ] Index + log updated
- [ ] **L2+:** frontmatter `evidence` + `claims` bound to packets

## Experiment checklist

Use when running a **prototype, oracle, harness, or multi-step measurement**.
Full pattern: [experiments.md](./experiments.md). Scaffolds:
`template/experiments/`.

### Lock (before coding)

- [ ] Bounded question + stop condition
- [ ] Known algorithms sourced or parked-unsourced
- [ ] PRIORS locked (belief · confidence · falsified-if) — no later rewrites
- [ ] ENCOUNTERS catalog (blockers / detours / findings)
- [ ] Tickets with prior IDs, encounter IDs, claim ceiling
- [ ] COMPARISON tables empty (`_pending_`)
- [ ] Log `## [YYYY-MM-DD] experiment | lock <slug>`

### After each ticket / phase

- [ ] COMPARISON: holds / falsified / inconclusive
- [ ] Encounters logged (uncatalogued → E9.x)
- [ ] Residuals and non-claims honest
- [ ] Synthesis: which priors survived; promote only with human step
- [ ] Log `## [YYYY-MM-DD] experiment | run|synthesize <slug>`

## Lint checklist

### Always — semantic (agent)

- [ ] Follow [lint-semantic.md](./lint-semantic.md) / `scripts/lint-semantic.md`
- [ ] Write `wiki/lint/YYYY-MM-DD.md` (optional but preferred)
- [ ] Log `## [YYYY-MM-DD] lint | …`

### Strict / when claims exist — mechanical

- [ ] `node scripts/validate.mjs` (pins + provenance)
- [ ] `node scripts/lint-structure.mjs` (index/log, non-claims, stop conditions, orphans)
- [ ] `node scripts/lint-cadence.mjs` (close rate from git history, agent fleets)

## Periodic pass (hand-run, not per-close)

- [ ] Semantic lint even if “nothing new”
- [ ] `node scripts/validate.mjs --refetch 5` when url origins exist
- [ ] `./scripts/refresh-reference-clones.sh` when the instance uses clones
- [ ] `node scripts/lint-cadence.mjs --report` on Strict fleets
- [ ] Log what the pass found, including "nothing"

## Smell checks that no script performs

(Also in semantic lint.)

- [ ] Do the external sources answer questions the wiki actually asked, or were they found afterwards to justify a conclusion?
- [ ] Does any decision rest entirely on other pages of this wiki? If so it is synthesis, and it should say so at L1.
- [ ] Would a stranger reading only `raw/` reach the same conclusions, or only someone who already read our prose?
- [ ] Was anything closed faster than it could plausibly have been read?
- [ ] Claim packets without hub updates?
- [ ] Empty green instance?
- [ ] New workstream invented structure while Sibling portfolio listed paths never scanned?
- [ ] Sibling wiki cited as if it were external-primary (provenance laundering)?
- [ ] Experiment priors rewritten after outcomes, or COMPARISON empty while tickets “done”?
- [ ] “Proof” harness with no claim ceiling?
