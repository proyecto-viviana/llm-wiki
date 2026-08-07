# Semantic lint (agent pass)

Mechanical scripts check **integrity** (digests, provenance, structure). They do
not check **meaning**. Semantic lint is the Ryan-shaped health pass: contradictions,
missing hubs, stale synthesis, and what to source next.

Run it on **every** instance (Lite and Strict). Log the result.

## When

- After a batch of ingests
- Before a close you care about
- On a cadence (e.g. weekly) even if “nothing changed”

## Procedure

1. Read `wiki/index.md`, then sample hubs, open questions, and recent log entries.
2. Walk the checklist below.
3. Write findings to `wiki/lint/YYYY-MM-DD.md` (create `wiki/lint/` if needed).
4. Append `## [YYYY-MM-DD] lint | <one-line summary>` to `wiki/log.md`.
5. On Strict (or when claims exist), also run:

```sh
node scripts/validate.mjs
node scripts/lint-structure.mjs
# agent-driven closes:
node scripts/lint-cadence.mjs
```

A prompt copy lives at [`template/scripts/lint-semantic.md`](../template/scripts/lint-semantic.md).

## Checklist

### Structure of knowledge (Ryan)

- [ ] Contradictions between hubs or between hub and decision
- [ ] Stale claims or prose superseded by a newer source or decision
- [ ] Orphan pages (no inbound links from index or hubs)
- [ ] Concepts mentioned often but lacking a hub
- [ ] Missing reverse links after a close
- [ ] Open questions with no stop condition or no next evidence step
- [ ] Suggest **3 questions** worth asking next
- [ ] Suggest **3 sources** (or source types) that would fill the largest gaps

### Honesty (Viviana smells — no script performs these)

- [ ] Do external sources answer questions the wiki actually asked, or were they found afterwards to justify a conclusion?
- [ ] Does any decision rest entirely on other pages of this wiki? If so it is synthesis and should say so at L1.
- [ ] Would a stranger reading only `raw/` reach the same conclusions, or only someone who already read our prose?
- [ ] Was anything closed faster than it could plausibly have been read?
- [ ] Any claim packets without hub updates (claims without compound)?
- [ ] Empty green instance (validators pass, no real sources/hubs)?
- [ ] Sibling portfolio listed in `AGENTS.md` but no metaresearch ticket while inventing a new workstream?
- [ ] Sibling wiki or monorepo prose cited as if it were external-primary?
- [ ] Experiment priors rewritten after outcomes, or COMPARISON empty while tickets marked done?
- [ ] Runnable “proof” without a claim ceiling (what green does not prove)?

## Output shape (suggested)

```md
# Lint YYYY-MM-DD

## Findings
- …

## Suggested questions
1. …

## Suggested sources
1. …

## Track note
Lite | Strict — scripts run: none | validate | structure | cadence
```
