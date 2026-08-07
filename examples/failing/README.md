# Negative fixtures

Each directory here is a deliberately broken instance. `scripts/check-template.mjs`
runs the real template scripts against every one and requires that it **fails**,
with the specific error code in its `expect.json`.

This exists because of a concrete failure. A research corpus once accumulated 83
green validators over several days while containing no external evidence at all:
every validator hashed documents the same agents had written hours earlier. The
checks were not broken. They had simply never been pointed at anything that could
fail, so passing them meant nothing, and passing them *felt* like sourcing.

A check nobody has watched reject something is decoration. If a fixture here
starts passing, the check it guards has stopped working, and `check-template`
treats that as loudly as a real instance breaking.

| Fixture | Script | Code |
| --- | --- | --- |
| `own-corpus-at-l2` | validate | `E_PROV_LEVEL_CAP` |
| `unregistered-source` | validate | `E_PROV_UNREGISTERED` |
| `laundered-class` | validate | `E_PROV_CLASS_MISMATCH` |
| `path-swap` | validate | `E_PROV_PATH_CONFLICT` |
| `digest-drift` | validate | `E_DIGEST_DRIFT` |
| `decision-without-non-claims` | lint-structure | `E_NO_NON_CLAIMS` |
| `question-without-stop-condition` | lint-structure | `E_NO_STOP_CONDITION` |
| `repo-pin-without-portfolio` | lint-structure | `E_NO_PORTFOLIO` |
| `decision-l2-unbound` | lint-structure | `E_DECISION_NO_LEVEL`, `E_DECISION_UNBOUND` |
| `decision-l2-zero-external` | lint-structure | `E_DECISION_NO_EXTERNAL` |
| `product-code-no-roots` | validate | `E_PROV_PRODUCT_ROOT` |
| `product-code-outside-roots` | validate | `E_PROV_PRODUCT_ROOT` |
| `raw-path-escape` | validate | `E_PROV_ESCAPE` |
| `raw-symlink-escape` | validate | `E_PROV_ESCAPE` |
| `claims-in-subdirectory` | validate | `E_PROV_UNREGISTERED` (found only by the recursive scan) |
| `url-origin-refetch-drift` | validate `--refetch` | `E_PROV_REFETCH_DRIFT` |
| `url-origin-refetch-failed` | validate `--refetch` | `E_PROV_REFETCH_FAILED` |
| `cadence-batch` | lint-cadence | `E_CADENCE_BATCH`, `E_CADENCE_DAY`, `E_CADENCE_GAP` |

A fixture may declare extra arguments for the script (`"args": ["--refetch"]`),
for checks that do not run in the default pass. Both `url-origin-*` fixtures are
green under plain `validate` — that is the finding, not an oversight.

A fixture may name several codes (`"codes": [...]` instead of `"code"`) when one
broken instance is supposed to trip more than one check.

A fixture may also declare `"setup": "setup.mjs"`, which `check-template` runs
first and whose last line of output is the instance to check. `cadence-batch`
needs this: its subject is git history, so a committed directory here would be
measured against *this* repository's commits. Its builder makes a throwaway repo
with every date passed in the environment — see
[`cadence-batch/regression-2026-07-28.md`](cadence-batch/regression-2026-07-28.md)
for the same check run over the real corpus that motivated it.

Adding a check means adding a fixture. `check-template` fails if a fixture
guards a code no script emits, so the two cannot drift apart silently.
