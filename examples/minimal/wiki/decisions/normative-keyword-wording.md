---
evidence: L2
claims: [CLAIM-normative-keywords]
---

# Decision: normative keyword wording

## Question

When this wiki writes "MUST" or "SHOULD" about its own rules, does it mean what
IETF usage means, or something looser?

## Stop condition

A named external definition is pinned and the wording rule points at it.

## Disposition

**IETF usage.** "MUST" is an absolute requirement; "SHOULD" permits deviation
only when the full implications are understood and weighed and the reason is
written down. The wording is fixed by
[`CLAIM-normative-keywords`](../../claims/CLAIM-normative-keywords.json), pinned
to the RFC 2119 extract in `raw/`, not to house style.

## Evidence level

L2 — declared in frontmatter and bound to one claim on an `external-primary`
source. The body sentence is a courtesy for readers; the frontmatter is what
`lint-structure.mjs` reads, because a level asserted only in prose is a claim
about the work rather than a declaration a check can fail.

## Non-claims

- Does not settle whether this wiki's own rules are themselves normative for
  any consuming project; promotion is a separate, human step.
- Does not adopt RFC 8174's lowercase-keyword refinement; only sections 1–3 of
  RFC 2119 are pinned.
- Does not require every decision to reach L2. It requires that a decision
  claiming L2 name the packets that carry it.
