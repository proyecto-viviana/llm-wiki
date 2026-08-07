# Experiment scaffolds (optional)

Copy this directory when an instance will run **prototypes, oracles, or multi-step
measurement** — not for pure survey notes.

Pattern doc: [docs/experiments.md](../../docs/experiments.md) (in the llm-wiki
meta-repo) or your project’s copy of that doc.

## One-sentence rule

**Lock beliefs and failure modes before the experiment; score outcomes against
those beliefs after — never rewrite the beliefs to match the story.**

## Files

| Scaffold | Copy to |
| --- | --- |
| [`workflow.md`](workflow.md) | Agent checklist (keep or link from instance AGENTS) |
| [`phase-readme.md`](phase-readme.md) | `experiments/<slug>/README.md` |
| [`priors-registry.md`](priors-registry.md) | `…/PRIORS.md` — **lock before work** |
| [`encounters-catalog.md`](encounters-catalog.md) | `…/ENCOUNTERS.md` |
| [`experiment-ticket.md`](experiment-ticket.md) | `…/tickets/<ID>.md` |
| [`comparison-ledger.md`](comparison-ledger.md) | `…/COMPARISON.md` — fill **after** only |

## Scale

- **Small:** one ticket file with priors + encounters + comparison sections.
- **Phase:** full pack under `experiments/<slug>/` or `phase-N/`.
- **Survey only:** do not use these scaffolds.
