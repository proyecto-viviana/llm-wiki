# Provenance classes

Evidence levels measure how carefully a claim is pinned. They say nothing about
whether the pinned thing came from outside the project. Those are different
questions, and conflating them is the failure this layer exists to prevent.

A digest proves the bytes have not moved. It does not prove they were ever worth
citing. Hashing a document we wrote ourselves yesterday produces a valid L2
packet, a green validator, and zero knowledge.

> **Provenance class caps evidence level.** A claim citing our own corpus is L1
> at most, no matter how many digests are computed over it.

## The classes

| Class | What it is | Allowed `origin.type` | Max level |
| --- | --- | --- | --- |
| `external-primary` | The authoritative artifact itself: a specification, paper, standard, or upstream source at a pinned commit | `url`, `repo`, `offline` | L3 |
| `external-secondary` | Someone else describing something else: blog post, tutorial, vendor docs, talk | `url`, `offline` | L3 |
| `own-corpus` | Anything authored inside this project, including our restatements of external things | `own-project` | **L1** |
| `product-code` | Our own source code, inside a declared `productRoot` | `own-project` | L3 |

`product-code` is deliberately not capped. Our code is not evidence about the
world, but it is authoritative about *our own behaviour*, and "the encoder emits
this byte order" is a claim best answered by reading the encoder.

That uncapped class is also the obvious way around the `own-corpus` cap, since
both admit the same `own-project` origin: relabel the reading note as product
code and L3 comes back with every field still truthful. What distinguishes them
is location, not intent. `raw/provenance.json` therefore carries a top-level
**`productRoots`** — repo-relative directories that hold actual product source —
and every `product-code` entry's `origin.path` must resolve inside one of them:

```json
{
  "productRoots": ["engine/", "backend/src/"],
  "sources": [ ... ]
}
```

`validate.mjs` emits `E_PROV_PRODUCT_ROOT` when an entry lands outside every
root, and also when `productRoots` is absent or empty — an unanchored class is
a self-assigned licence, so it fails closed. Roots are resolved against the
repository root (`git rev-parse --show-toplevel`, overridable with
`LLM_WIKI_PROJECT_ROOT`), and containment is checked with `realpath` on both
sides so a symlink cannot walk out of the tree.

## Capture, not restatement

The line between `external-primary` and `own-corpus` is **whose bytes are in the
file**, not what the file is about.

- Bytes copied or downloaded from the origin → external.
- Our summary, paraphrase, or notes about the origin → `own-corpus`, always.

A restatement of a spec is not the spec. This is the specific move that lets a
corpus feel sourced while containing nothing external: paraphrase an idea into
`raw/`, hash the paraphrase, pin it at L2. Every step is mechanically valid and
the result is a citation of ourselves. If you have not captured bytes from the
origin, you do not have an external source yet — you have a reading note and a
reason to go get one.

## Registration

`raw/provenance.json` lists every source before it can be cited:

```json
{
  "id": "src-rfc2119-s1",
  "path": "rfc2119-section-1-extract.txt",
  "class": "external-primary",
  "origin": { "type": "offline", "citation": "RFC 2119, IETF, 1997", "retrieved": "2026-07-28" },
  "license": "freely redistributable with attribution",
  "why": "The distinct question this source answers."
}
```

`scripts/validate.mjs` enforces:

- the class exists and the `origin.type` is one the class admits — an
  `own-project` origin cannot be declared external;
- the origin carries enough to re-resolve it (a URL and retrieval date, a repo
  and commit, or a citation);
- every registered `path` stays inside `raw/` — `../` in the path, or a symlink
  aimed out of the directory, is `E_PROV_ESCAPE`. A pointer to where a file
  already lived is not a capture, and citing in place is precisely how a corpus
  cites itself without noticing;
- the claim's `path` resolves to the same file the id was registered against, so
  one honestly-acquired source id is not a licence to pin anything in `raw/`;
- `own-corpus` sources produce an error at L2/L3, since `claims/` holds only
  those levels — an own-corpus source belongs in prose with a wiki link;
- `why` is present. A source that answers no distinct question is a source
  nobody needed.

## Choosing an origin type

The class says where the bytes came from; the origin type says how a later
reader can get them again. Field-level validity is not enough here — a URL that
re-resolves to *different* bytes every time is mechanically fine and evidentially
worthless. Rules learned from running `--refetch` against real corpora:

- **`url` origins are for stable, dated artifacts** — a versioned spec, a
  tagged release page, an archived snapshot. A living page (docs that a vendor
  edits in place, a wiki, a changelog head) will drift, and every future
  `--refetch` becomes a judgment call about whether the drift matters. Cite
  living pages as `offline` with the URL and retrieval date in the citation:
  that is honest about what was captured — *the page as it stood that day* —
  and keeps `E_PROV_REFETCH_DRIFT` meaning "the evidence moved," not "the
  vendor shipped a typo fix."
- **A slice is never a `url` origin.** If the captured file is an extract — one
  section of a spec, one function from a repository — the URL serves the whole
  and can never byte-match the part. Pin an extract as `repo` + commit (when it
  came from a tree) or `offline` with a citation precise enough to find the
  section again. A `url` origin promises "these exact bytes came from this
  URL," and an extract breaks that promise on the day it is registered.
- **Some origins cannot be pinned at all.** Publishers that inject per-request
  bytes (rotating tokens, per-visitor markup, consent banners baked into the
  HTML) make two honest fetches differ. Do not paper over this by downgrading
  to `offline` — the URL is real and a reader should get to use it. Re-acquire
  from an archive snapshot that serves stable bytes (e.g. the Wayback Machine's
  `id_` raw-content URLs), register *that* URL, and record in `why` that the
  live page churns. If only the live page exists, diff the *cited section*
  against it when refetch drifts, and record the result — section-stable drift
  is a different fact from content drift.
- **A `repo` origin proves less than a `url` origin.** A commit hash names a
  tree; it does not show the bytes were ever acquired from it — that is what
  `reference-clones/portfolio.json` and the acquisition scripts are for
  (`E_NO_PORTFOLIO` fails the shortcut). When a registry mixes cited-but-not-
  cloned and actually-cloned repos, say so in the source pages: "cited at
  commit X" and "cloned and read at commit X" are different strengths of claim,
  and a reader deserves to know which one they are holding.

## Not a hierarchy of worth

`own-corpus` is not a demotion. Most of a good wiki is L1 synthesis over our own
thinking, and that is what synthesis is *for*. The cap only stops our own
thinking from being laundered into the evidence that supports it.

An honest L1 page is worth more than an L2 page pinned to ourselves, because a
reader can see exactly what it rests on.

See also [evidence-levels.md](evidence-levels.md) and
[reference-clones.md](reference-clones.md).

## What the scan covers

`claims/` is walked recursively. A malformed packet in a subdirectory used to be
invisible rather than rejected, and `{ok: true, claims: 0}` over an unread claim
is the same lie as a green validator over unread evidence.
