# thought-diff

Compare your edits to a **frozen copy of AI-written code**, and see how the
*interpretation* of each line and of the whole program's structure changes as
you edit.

## What it is

- A frozen reference copy (the AI's original code) and a working copy you edit.
- `thought_diff` shows three things side by side:
  1. **Code diff** – a normal unified diff, working vs frozen.
  2. **Thought diff** – for each changed line, what the line meant before and what
     it means now (what it does, which function it is in, what it calls, who calls
     it). Unchanged lines whose meaning changed (e.g. a function that now has a
     caller) are shown too, marked "unchanged text, reinterpreted".
  3. **Structure diff** – modules, classes, functions/signatures, imports and call
     relations, original vs current. Renames and moves of a function with the
     same body are reported as renames/moves, not just delete+add.

## What it is not

- **Not regeneration.** It never rewrites or regenerates your code.
- **Not hidden model thoughts.** The "interpretations" are a current, structured
  reading of the code computed from Python's AST. They are not the original
  model's reasoning and can be wrong or shallow. Check them against the real code
  and tests.
- Not a GUI editor yet. v0.1.0 is a command-line tool for Python code.

## Run it

Needs Python 3.10+. No dependencies to run; `pytest` for tests.

```
python -m thought_diff compare examples/original examples/working
python -m thought_diff compare ORIGINAL_DIR WORKING_DIR --exit-code   # exit 1 if anything differs
python -m thought_diff structure examples/working                      # structure view of one dir
pip install -r requirements.txt && python -m pytest
```

A simple workflow: copy the AI's output to `original/` (or keep it on a git
branch and check it out there), never edit it, edit `working/`, re-run `compare`.

## Versioning

Each version gets its own branch `release/vX.Y.Z` and tag `vX.Y.Z` on the same
commit. `main` moves forward.

## License

No license yet. All rights reserved by the author until one is added.

See [docs/original-idea.md](docs/original-idea.md) for the idea this came from.
