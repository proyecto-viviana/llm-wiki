# Evidence levels

| Level | Name | Requirements |
| --- | --- | --- |
| L0 | Note | No formal citation required |
| L1 | Cited synthesis | Prose links to wiki pages and/or raw sources |
| L2 | Pinned claim | Claim record with source id, locator, revision or content digest, optional line/byte span |
| L3 | Checked claim | L2 plus a validator that re-hashes, and — for url origins — re-resolves, failing on drift |

## Provenance caps the level

These levels measure *care*, not *externality*, and care alone is cheap to fake.
A claim citing our own corpus is **L1 at most**, however carefully it is pinned;
L2/L3 require a source whose class is external or `product-code`. Sources are
registered in `raw/provenance.json` and the class is machine-checked against the
origin. See [provenance.md](provenance.md).

Without this cap, every level above L1 is reachable by writing a document and
hashing it.

## Re-resolution, not just re-hashing

Re-hashing proves our copy has not moved. It says nothing about whether the
origin was ever real — which is the hole a fabricated URL walks through, and the
likeliest one, because an agent told "L2 needs an external source" that did not
fetch one will produce a plausible URL over its own prose.

So url origins are acquired, not declared: `scripts/acquire-url.mjs` fetches,
writes the bytes into `raw/`, digests them, and appends the registry entry in
one motion, refusing to overwrite an existing id. An entry it wrote cannot exist
without the retrieval having happened.

`node scripts/validate.mjs --refetch [k]` is the audit behind that. It
re-resolves url origins — all of them, or a deterministic sample of `k` (sorted
by digest, then strided; no RNG) — and compares against the captured bytes:

- origin unreachable → `E_PROV_REFETCH_FAILED`
- origin serves different bytes → `E_PROV_REFETCH_DRIFT`

`file:` URLs are supported, so offline captures and fixtures re-resolve without
a network; a `file:` URL with a relative path resolves against the instance root.

**Honest limitation.** `--refetch` cannot catch a confabulated URL at the moment
it is written — only on the first pass afterwards. Acquisition through
`acquire-url.mjs` is the front line; `--refetch` is what makes a hand-written
url entry a losing move rather than a free one.

## Choosing a level

- Personal journal → L0–L1
- Team shared understanding → L1, L2 for policies
- Technical research meant to promote → L2 default for load-bearing claims, L3 when multiple agents edit
- Legal/compliance-adjacent → L2/L3 and human review

## Claim packet shape (L2/L3)

```json
{
  "id": "CLAIM-example-1",
  "statement": "One sentence claim.",
  "level": "L2",
  "source": {
    "id": "src-example",
    "provenanceClass": "external-primary",
    "path": "../raw/example.md",
    "sha256": "…",
    "lineStart": 10,
    "lineEnd": 20
  }
}
```

Paths are relative to the claim file. Digests are hex SHA-256 of file bytes.
`source.id` must match an entry in `raw/provenance.json`, and `path` must
resolve to the file that id was registered against. `provenanceClass` is
optional and advisory — the registry is authoritative, and a disagreement is an
error rather than an override.
