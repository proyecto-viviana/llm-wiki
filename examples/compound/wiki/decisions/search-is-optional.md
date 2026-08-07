---
evidence: L1
---

# Decision: local search is optional tooling

## Question

Must a wiki instance adopt a local search engine (e.g. qmd) to be valid?

## Stop condition

Separate “compiled wiki” from “search tooling” in one sentence.

## Disposition

**No.** Index + `rg` is enough at moderate scale. Local search is optional when
the index outgrows context. This **supersedes** any implication that tooling is
the core product.

## Supersedes

Earlier informal assumption (in chat, not filed) that search infrastructure was
required day one — retracted.

## Evidence level

L1.

## Non-claims

- Does not evaluate qmd quality vs alternatives.
- Does not forbid search; it is optional batteries for scale.
