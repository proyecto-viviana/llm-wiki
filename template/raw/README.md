# Raw sources

Immutable inputs. Agents **read** here and never rewrite.

Store text extracts, exported markdown, PDFs, or pointers (URL + revision) for
large blobs kept outside git.

Suggested naming: `YYYY-MM-DD-short-slug.ext` or content-addressed filenames.

## Register before citing

A file sitting in this directory is not yet a source. `provenance.json` records,
for each one, where it came from and what class it is — and `scripts/validate.mjs`
refuses any L2/L3 claim citing a file that was never registered.

The reason is that `raw/` looks authoritative regardless of what is in it.
Dropping our own summary of a specification here, hashing it, and pinning a claim
to it produces a packet that passes every integrity check while citing nobody but
us. Registration is the step where someone has to state, in writing, that the
bytes came from somewhere else.

Classing is about **whose bytes these are**:

- copied or downloaded from the origin → `external-primary` / `external-secondary`
- our summary, paraphrase, or notes → `own-corpus`, which caps at L1
- our own source code → `product-code`

Registering something as `own-corpus` is normal and costs nothing. It just means
the wiki cites it as thinking rather than as evidence.

See [provenance.md](https://github.com/proyecto-viviana/llm-wiki/blob/main/docs/provenance.md).
