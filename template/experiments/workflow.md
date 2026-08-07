# Workflow — priors-locked prototypes and experiments

> Normative tactic. Full pattern: docs/experiments.md in the llm-wiki meta-repo.

## Rule

**Lock beliefs and failure modes before the experiment; score outcomes against
those beliefs after — never rewrite the beliefs to match the story.**

## Agent checklist

### Before coding a prototype / multi-ticket phase

- [ ] Bounded question + stop condition named
- [ ] Known algorithms/structures sourced (or parked-unsourced)
- [ ] Phase folder or single-ticket minimum pack created
- [ ] PRIORS locked (no silent later rewrites)
- [ ] ENCOUNTERS catalog exists
- [ ] Tickets list prior IDs + encounter IDs + **claim ceiling**
- [ ] COMPARISON tables empty (`_pending_`)
- [ ] Log: `## [YYYY-MM-DD] experiment | lock <slug>`

### During

- [ ] Exclusive write ownership per ticket files
- [ ] Log encounters (uncatalogued → E9.x)
- [ ] Artifacts stay instance-local until promotion rules allow otherwise

### After each ticket

- [ ] Stop condition checklist
- [ ] COMPARISON: holds / falsified / inconclusive
- [ ] Residuals named honestly

### After phase

- [ ] Synthesis: which priors survived
- [ ] Recommend stop / deepen / human promotion
- [ ] Log: `## [YYYY-MM-DD] experiment | synthesize <slug>`

## Minimal vs full

| Scale | Minimum |
| --- | --- |
| Single small prototype | One ticket: priors + may-encounter + comparison + claim ceiling |
| Multi-ticket phase | README + PRIORS + ENCOUNTERS + tickets + COMPARISON |
| Survey only | Skip this workflow |
