# Reference clones (instance)

Policy for optional third-party git checkouts used as **read-only evidence**.

- Clone **bytes** live outside this tree (default: `$PROJECT_ROOT/repos`,
  gitignored).
- This directory holds the **portfolio manifest** and notes only.
- Scripts: `../scripts/refresh-reference-clones.sh`,
  `../scripts/acquire-reference-clone.sh`.

Full pattern: see the parent repo’s `docs/reference-clones.md`.

## Instance checklist

1. Ensure the project `.gitignore` includes the clone root (e.g. `/repos/`).
2. Copy `portfolio.example.json` → `portfolio.json` and edit remotes.
3. Acquire only remotes justified by a bounded question.
4. Refresh before packets that read local clones; record commits on source pages.
5. Never treat a clone as a product dependency or import path by default.
