# The corpus this fixture is a miniature of

The synthetic fixture next to this file is 21 closes. This is the real one, and
the reason `--dir` exists: the check could not be aimed at the corpus that
motivated it, because it only ever looked at `wiki/decisions`.

Run against the origin research corpus (a private repository; names and paths
are redacted here, numbers are verbatim; read-only, `git log` only), two commits
after the commit that catalogued the shape-only closes by hand:

```
$ LLM_WIKI_ROOT=/…/<origin-repo> \
    node template/scripts/lint-cadence.mjs --dir .claude/research/<corpus>
```

```json
{
  "ok": false,
  "limits": { "maxClosesPerCommit": 1, "maxClosesPerDay": 6, "minGapMinutes": 15, "source": "defaults" },
  "watched": [".claude/research/<corpus>"],
  "closes": 407,
  "days": { "authored": 5, "committed": 5 },
  "medianGapMinutes": { "authored": 0, "committed": 0 },
  "busiestDay": { "authored": ["2026-07-28", 251], "committed": ["2026-07-28", 251] }
}
```

474 violations: 110 `E_CADENCE_BATCH`, 359 `E_CADENCE_GAP`, and every day in
range over the limit —

```
E_CADENCE_DAY 2026-07-24: 65 closes (limit 6)
E_CADENCE_DAY 2026-07-25: 41 closes (limit 6)
E_CADENCE_DAY 2026-07-26: 34 closes (limit 6)
E_CADENCE_DAY 2026-07-27: 16 closes (limit 6)
E_CADENCE_DAY 2026-07-28: 251 closes (limit 6)
E_CADENCE_BATCH 6c5bebb93: 15 closes in one commit (limit 1)
E_CADENCE_GAP …/<page>.md: 0.0 min after the previous close (limit 15)
```

The median gap between consecutive closes is **0.0 minutes** across 407 pages.

The same command against the version of the script that shipped before this
ticket (`c2ff9a0`, a commit in this repository's pre-publication history — it
no longer resolves after the public squash) — the flag is unrecognised, so it
falls back to the hardcoded path, which does not exist in that repository:

```json
{"ok":true,"closes":0,"note":"no closes in range"}
```

That green is the finding. The check was written in response to this corpus and,
as written, returned `ok: true` on it. A check that cannot be pointed at the
thing it was built for has never been run against anything that could fail — the
same defect as the 83 green validators, one level up.

Two things follow, and both are in the code rather than here:

- `--dir` is repeatable, so this is re-runnable at any time, on any tree.
- The limits above are the defaults, not a judgment. 407 pages in five days is
  only a violation relative to `cadence.json`; the number an instance picks is
  its own. What is not negotiable is that the number exists and is checked.
