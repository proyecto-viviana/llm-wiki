# Adopting in an existing corpus

The instantiating recipe assumes a blank directory. Most real adoptions do not
get one: there is already a notes tree, a research folder, thousands of files
with no provenance and no schema. This page is the brownfield recipe. The short
version: **quarantine the legacy material, do not retrofit it.**

## Why not retrofit

Retrofitting means walking the old corpus and dressing each file in the new
schema — registering provenance, splitting pages into roles, minting claims. It
fails two ways at once:

- **The provenance is unrecoverable.** A three-year-old note that paraphrases a
  vendor doc is `own-corpus` now regardless of what it once drew on. Registering
  it as anything else launders it; registering it honestly caps it at L1, which
  the retrofit spent hours to establish and a directory boundary would have
  established for free.
- **The volume is the trap.** A corpus of thousands of files invites a bulk
  migration pass, and bulk passes are exactly the shape the cadence lint exists
  to reject: hundreds of "closes" nobody actually re-derived. A wiki bootstrapped
  that way starts life with the same unverifiable mass it was supposed to
  replace, now wearing a schema that implies otherwise.

## The recipe

1. **Create the instance beside the legacy tree, not over it.** Copy
   `template/` into a fresh directory (`knowledge/`, `research/wiki/` — see
   [instantiating.md](./instantiating.md)). The legacy corpus keeps its path
   and its history; nothing in it moves.
2. **Declare the legacy tree as what it is: own-corpus, L1 leads.** Old notes
   are leads — pointers to where an answer was once found — not evidence. Pages
   in the new wiki may link into the legacy tree freely at L0/L1. What they may
   not do is pin legacy files as external sources, however external the
   original inspiration was.
3. **Migrate by demand, never by sweep.** A legacy note enters the wiki when a
   live question actually needs it: re-derive the content, re-acquire the
   external sources it paraphrased (now registrable honestly), and write the
   page as a normal ingest. One question at a time. The legacy corpus shrinks
   in relevance instead of being converted.
4. **Expect the wiki to cover a thin wedge, and say so.** After adoption the
   instance might hold dozens of pages beside thousands of legacy files. That
   asymmetry is honest — the index describes what has been compiled, not what
   exists. A purpose section that names the legacy tree and its status ("~6,000
   uncompiled notes, treated as L1 leads") tells a reader exactly what the
   green checks do and do not cover.
5. **Optionally, point the cadence lint backwards.** `lint-cadence.mjs --dir`
   accepts any path, including the legacy tree. Running it there is a cheap
   census of how the old corpus was actually written — and a concrete answer to
   "why not just keep doing what we did."

## What "done" looks like

Adoption is done when new work lands in the wiki by default and the legacy tree
only ever gets read. There is no milestone where the old corpus is fully
migrated; that milestone existing would mean the sweep happened. If a year
later most legacy files were never needed, the recipe worked — compiling them
would have been waste, and now it is visible waste that never occurred.
