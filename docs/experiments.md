# Priors-locked experiments (prototypes and L3 proof)

**Experiment** is a first-class operation for **runnable** work: oracles, harnesses,
measurement scripts, multi-step prototypes — anything that can **confirm or
falsify** a belief under a stop condition.

It is not a substitute for ingest or close. It is the discipline that keeps
prototype work from rewriting the story after the result.

## One-sentence rule

**Lock beliefs and failure modes before the experiment; score outcomes against
those beliefs after — never rewrite the beliefs to match the story.**

## Why it exists

Common failure modes this catches:

1. **Post-hoc priors** — after a green (or red) run, prose quietly becomes “we
   expected this all along.”
2. **Oracles without ceilings** — green tests presented as full proof of the
   product or policy question.
3. **Survey dressed as proof** — field notes closed as if a harness had run.
4. **Silent product promotion** — a research-local prototype becomes authority
   without a human promotion step.

If your wiki or research lane **runs** anything (tests, generators, simulators,
benchmarks), this op belongs in the schema — not only in chat memory.

## When (Lite and Strict)

| Trigger | Action |
| --- | --- |
| Single small prototype / oracle | **Minimal pack:** priors + may-encounter + comparison (+ claim ceiling) on one ticket or README |
| Multi-step phase (several tickets, one question family) | **Full pack** under `experiments/<slug>/` or `phase-N/` |
| Pure survey / source ranking | **Do not** force this pack — use source pages, hubs, optional source-selection notes |
| Stakes are load-bearing | Stay honest on evidence level; Strict pins still apply to how-it-works claims |

Stay Lite for the pack itself (L0–L1 synthesis of what the run showed). Promote
individual load-bearing statements only when Strict pins exist.

## Relation to evidence levels and other ops

```text
ingest / field survey     → what external sources say (L1–L2)
open question + stop      → what we are trying to settle
experiment (this op)      → what we believed would happen when we ran a proof
close / decision          → disposition + non-claims after stop condition
promotion (optional)      → human step into product/policy authority
```

- **Source selection** ranks *what to learn from*.
- **Priors-locked experiment** ranks *what we believe will happen when we run*.
- An experiment pack does **not** waive L2/L3 pin requirements for how-it-works
  claims on Strict track.

## Layout (optional, recommended when multi-step)

Copy scaffolds from [`template/experiments/`](../template/experiments/):

```text
experiments/                         # or phase-N/, prototypes/<id>/
  README.md                          # goal, waves, definition of done
  PRIORS.md                          # lock before work
  ENCOUNTERS.md                      # blockers / detours / findings we may hit
  tickets.md                         # slate + dependencies
  COMPARISON.md                      # fill AFTER only
  tickets/
    _TEMPLATE.md
    <ID>.md
  # optional: oracles/, harnesses/ for runnable artifacts
```

Log prefix:

```text
## [YYYY-MM-DD] experiment | <lock | run | synthesize> <slug>
```

## Procedure (agent)

### 1. Lock (before implementation)

1. Write **PRIORS** — numbered beliefs, confidence H/M/L, source of belief,
   “falsified if…”. **Do not edit prior statements after step 2 starts.**
2. Write **ENCOUNTERS** — blockers, detours, findings, parks you might hit.
3. Write **tickets** with depends, stop conditions, prior IDs, encounter IDs,
   and a **claim ceiling** (what green does *not* prove).
4. Create empty **COMPARISON** tables (`Observed = _pending_`).
5. Prefer committing the lock pack alone (“priors locked; execution not started”).
6. Update index + log (`experiment | lock …`).

### 2. Execute

1. One ticket at a time preferred; exclusive write ownership of ticket files.
2. Log encounters as they happen (uncatalogued → `E9.x`, do not ignore).
3. Keep artifacts research-local unless the instance schema allows promotion.

### 3. Compare and synthesize

1. After each ticket: fill COMPARISON rows — `holds` / `falsified` / `inconclusive`.
2. At phase end: which priors survived; recommend stop / deepen / promote.
3. Close or park the open question with **non-claims**.
4. Log (`experiment | synthesize …`).

## Verdict vocabulary

| Verdict | Meaning |
| --- | --- |
| **holds** | Evidence matches prior within stated confidence |
| **falsified** | Direct counterexample |
| **inconclusive** | Stopped early, wrong instrument, or environment block |

## Naming (portable)

| Kind | Convention |
| --- | --- |
| Phase folders | `experiments/<slug>/`, `phase-2/`, `prototypes/<id>/` |
| Ticket IDs | Instance-local (`EXP-01`, track prefixes) — not host product ticket numbers unless schema maps them |
| Prior IDs | `P-A1`, `P-B2`, … |
| Encounter IDs | `E1.1`, uncatalogued `E9.x` |

## Minimal vs full pack

| Scale | Minimum artifacts |
| --- | --- |
| **Single small prototype** | Ticket or oracle README with Priors + May encounter + Comparison + claim ceiling |
| **Multi-ticket phase** | Full pack: README + PRIORS + ENCOUNTERS + tickets + COMPARISON |
| **Survey only** | Skip this pack |

## Anti-patterns

| Anti-pattern | Correct move |
| --- | --- |
| Rewrite priors to match outcomes | Leave PRIORS; mark **falsified** in COMPARISON |
| Ship prototype with no claim ceiling | State what green does not prove |
| Invent known algorithms “for the experiment” | Source-first (schema source-first rule), then deviate explicitly |
| Call phase done with empty COMPARISON | Fill or mark tickets `skipped` with reason |
| Treat experiment green as automatic product/policy authority | Human promotion step |
| Force the pack on pure literature survey | Use ingest + hubs + optional close only |

## Semantic lint smells

- Priors edited after the first execution commit
- COMPARISON empty while tickets marked done
- Claim ceiling missing on a “proof” harness
- Encounter catalog unused while residuals appear only in chat

## Boundary

Experiment packs compile **what the run showed against locked beliefs**. They do
not replace `raw/`, provenance, or promotion. Host projects may keep packs under
`research/`, `knowledge/experiments/`, or beside wiki trees — the schema should
say where.
