# Source: the claim-stub helper (product code)

- **Source id:** `src-new-claim-usage`
- **Provenance class:** product-code
- **Ingested:** 2026-07-28
- **Locator:** `examples/minimal/scripts/new-claim.mjs`, argument handling
- **Local extract:** [raw/new-claim-usage-extract.mjs.txt](../../raw/new-claim-usage-extract.mjs.txt)

## Summary

Our own tooling, so it is authoritative about our own behaviour rather than
about the world. That is why `product-code` is not capped at L1 the way
`own-corpus` is.

The class only holds because `origin.path` resolves inside a declared
`productRoot` (`examples/minimal/scripts`). Relabelling a reading note as
product code fails `E_PROV_PRODUCT_ROOT`, which is the whole point of the roots
list: without it, `product-code` is an uncapped alias for `own-corpus`.

## Links

- Claim: `CLAIM-new-claim-args`
- Concept: [compiled-knowledge](../concepts/compiled-knowledge.md)
