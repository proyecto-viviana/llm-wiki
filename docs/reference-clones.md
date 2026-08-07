# Reference clones

Optional layer for wikis that need **read-only third-party source trees**
(engines, apps, libraries, specs checked out as git). Complements immutable
files under `raw/`: clones are large and changing; files are small snapshots.

This is **source acquisition for evidence**, not dependency vendoring. You do
not import or build product code from reference clones unless a separate
instance rule says so.

## Rules

1. **Clones are evidence.** A checkout answers “what did upstream look like at
   commit X?” It is not architecture authority and not a package dependency.
2. **Never track clone bytes in the wiki/git project.** Put them in a
   git-ignored directory (convention: project-root `repos/`).
3. **Latest-only by default.** Acquire and refresh with:
   - `--depth=1`
   - `--filter=blob:none` (blobless; materialize paths on demand)
   - prefer **sparse checkout** for large trees (only paths the question needs)
4. **No full history, submodules, LFS weights, or bulk test/app archives**
   unless a bounded question explicitly justifies them and records why.
5. **Detach at the fetched tip** after refresh. Record the exact commit.
6. **Refuse dirty overwrites.** Local edits in a clone mean skip/fail refresh
   until the human cleans or relocates them.
7. **Bounded network.** Refresh/query operations use a timeout so one dead
   host does not hang a session (default 30s per remote op; overridable).
8. **Justify new remotes.** Add a clone only when it answers a distinct
   question the existing portfolio cannot. Packet-triggered acquisition does
   not rewrite older pins.
9. **Pin in the wiki, not only on disk.** Source pages and L2/L3 claims record
   URL, commit, default branch, refresh date, license, and paths actually read.
10. **Old packets stay at their commits.** After a refresh, do not pretend old
    line numbers still describe the new tree. Reconcile or re-pin.

## Layout (recommended)

```text
<project>/
  repos/                    # gitignored; one clone per directory
    some-upstream/          # detached HEAD at pinned/refreshed commit
  knowledge/                # llm-wiki instance (or any name)
    raw/                    # small retained extracts / docs
    wiki/sources/…          # cites commit + paths in repos/
    reference-clones/       # portfolio manifest (tracked)
      portfolio.json
    scripts/
      refresh-reference-clones.sh
      acquire-reference-clone.sh
```

The clone root defaults to `$PROJECT_ROOT/repos`. Override with
`LLM_WIKI_REPOS_ROOT`.

## Portfolio manifest (`reference-clones/portfolio.json`)

Tracked JSON listing **external** remotes the instance cares about (names, URLs,
optional sparse paths). The refresh script can operate on **whatever is already
under `repos/`** without a manifest; the manifest is for acquisition discipline
and documentation.

**Not the same as** the optional **Sibling portfolio** table in `AGENTS.md`
(metaresearch: paths to *your other wikis/products*). That table is for
cross-project census; this JSON is for upstream evidence clones. See
[metaresearch.md](./metaresearch.md).

See [`template/reference-clones/portfolio.example.json`](../template/reference-clones/portfolio.example.json).

## Operations

### Acquire

```sh
# from instance root (directory that contains scripts/)
export LLM_WIKI_REPOS_ROOT=/path/to/project/repos   # optional
./scripts/acquire-reference-clone.sh \
  --name example-lib \
  --url https://github.com/example/lib.git \
  --sparse src docs
```

Creates a depth-1 blobless clone, optional sparse paths, detached at `HEAD`.

### Refresh

```sh
./scripts/refresh-reference-clones.sh
# optional:
LLM_WIKI_REFRESH_TIMEOUT_SECONDS=60 ./scripts/refresh-reference-clones.sh
```

For each clean git directory under the repos root:

1. resolve upstream default branch via `ls-remote`;
2. `fetch --depth=1 --filter=blob:none --prune`;
3. detach at `FETCH_HEAD`;
4. print a TSV receipt: name, result, before, after, default branch.

Dirty clones are reported and counted as failures (not overwritten).

### Record in the wiki

After acquire/refresh that you rely on for a packet:

- update or create a **source page** with URL, commit, branch, date, license,
  paths read;
- if claims are L2/L3, pin commit (and file digest of a retained extract if you
  also copied bytes into `raw/`);
- append **log**: `## [date] refresh | reference clones (N ok, …)`.

## What not to put here

- Your own product monorepo as a “reference clone” of itself (use normal git).
- Secrets or private mirrors without access policy in the instance schema.
- Automatic submodule updates of application dependencies (use the package
  manager; this pattern is for *reading* upstream evidence).

## Relationship to `raw/`

| | `raw/` | `repos/` |
| --- | --- | --- |
| Size | Prefer small | Large trees OK (gitignored) |
| Mutability | Immutable snapshot files | Refreshable latest-only checkouts |
| Pin unit | File digest / path | Git commit (+ paths read) |
| Best for | Papers, exports, excerpts | Multi-file code/spec exploration |

Many workflows use both: sparse-read code in `repos/`, then copy a short
excerpt into `raw/` when a claim needs a stable file digest.
