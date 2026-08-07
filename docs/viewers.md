# Viewers and human loop (optional)

The wiki is markdown files. Agents write; humans browse. None of this is required
for Lite or Strict tracks — it is how the loop feels when you live with the wiki.

## Obsidian (or any markdown IDE)

- Open the **instance root** (the folder that contains `wiki/` and `raw/`).
- Use **graph view** to see hubs vs orphans after a few ingests.
- Prefer following wiki links over searching chat history.

## Capturing sources into `raw/`

- **Obsidian Web Clipper** (or any “save as markdown”) → drop files under `raw/`.
- Optional: set attachment folder to `raw/assets/` and download remote images
  locally so the agent can open them without dead URLs.
- For **url** origins on Strict track, prefer `scripts/acquire-url.mjs` so fetch,
  digest, and provenance registration happen together.

## Output formats

- **Marp** (or similar): generate decks from hubs/decisions when presenting.
- **Dataview** (or equivalent): if you add YAML frontmatter (`role`, `updated`,
  `sources`), viewers can list pages by role. Frontmatter is optional on Lite;
  Strict decisions already require `evidence:` (and `claims:` at L2+).

## Search scale

| Scale | Prefer |
| --- | --- |
| Small / moderate | `wiki/index.md` then `rg` / editor search |
| Large | Local markdown search (e.g. [qmd](https://github.com/tobi/qmd)); still search the **compiled wiki**, not only raw dumps |

Prefer boring files until the index stops fitting in context.
