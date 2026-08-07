# Source: leaf-only failure

- **Source id:** `src-leaf-only`
- **Ingested:** 2026-07-30
- **Local:** [raw/leaf-only-failure.txt](../../raw/leaf-only-failure.txt)

## Summary

Ingests that only create new leaves never form a compound graph. Multi-page
updates (source + hubs + index + log) are the floor.

## Links

- [concepts/compiled-wiki.md](../concepts/compiled-wiki.md)
- [concepts/multi-page-ingest.md](../concepts/multi-page-ingest.md)
