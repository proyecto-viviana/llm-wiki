# Claims (L2/L3)

Optional JSON claim packets. See pattern docs: evidence levels.

Each `*.json` file is either one claim object or `{ "claims": [ ... ] }`.

```json
{
  "id": "CLAIM-1",
  "statement": "…",
  "level": "L2",
  "source": {
    "id": "src-1",
    "provenanceClass": "external-primary",
    "path": "../raw/example.md",
    "sha256": "<hex>",
    "lineStart": 1,
    "lineEnd": 5
  }
}
```

Run `node scripts/validate.mjs` after edits.
