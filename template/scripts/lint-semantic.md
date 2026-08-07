# Agent prompt: semantic lint

You are linting an LLM Wiki instance. Scripts (if any) check integrity; you check
meaning. Follow the full checklist in the pattern doc
`docs/lint-semantic.md` (or the copy in your monorepo’s `llm-wiki/docs/`).

## Steps

1. Read `wiki/index.md` and `wiki/log.md` (recent entries).
2. Open hubs, decisions, and open questions linked from the index.
3. Apply the semantic checklist (contradictions, orphans, missing hubs, data gaps,
   honesty smells, sibling-portfolio/metaresearch smells if AGENTS.md lists siblings,
   experiment prior-rewrite / empty-comparison / missing claim-ceiling smells).
4. Write `wiki/lint/YYYY-MM-DD.md` with findings, 3 suggested questions, 3 suggested sources.
5. Append to `wiki/log.md`:

```text
## [YYYY-MM-DD] lint | <short summary>
```

6. If this instance is on **Strict** track or has files under `claims/`, remind the
   human (or run) `node scripts/validate.mjs` and `node scripts/lint-structure.mjs`.

Do not rewrite `raw/`. Do not invent sources; only suggest what to fetch next.
