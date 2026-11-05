# thought-diff

Compare your edits to a **frozen copy of AI-written code**, and see how the
*interpretation* of each line and of the whole program's structure changes as
you edit.

**v0.2.0** adds a Cursor / VS Code extension: a side view that shows the thought
diff and structure diff beside the built-in code diff while you edit. Analysis
still comes from the Python `thought_diff` library (AST interpretations). It is
**not regeneration** and **not recovered hidden model thoughts**.

## What it is

- A frozen reference copy (the AI's original code) and a working copy you edit.
- `thought_diff` shows three things:
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
- **Python-only analysis.** The library walks Python source with the AST. Other
  languages are not interpreted; non-Python files are ignored for thought/structure
  views.

## Cursor / VS Code extension (v0.2.0)

The same VSIX installs in Cursor and VS Code. It is **not** published to the VS
Marketplace or Open VSX — install from a local `.vsix`.

### Install from VSIX in Cursor

1. Build the package (from a clone), or download the `.vsix` from a GitHub Actions
   artifact / release asset when available:
   ```bash
   cd extension
   npm install
   npm run package
   # or: npx --yes @vscode/vsce package --no-dependencies -o thought-diff-0.2.0.vsix
   ```
2. In Cursor: **Extensions** view → `…` menu → **Install from VSIX…** → choose
   `extension/thought-diff-0.2.0.vsix`.
3. Reload the window if prompted.

### Set the original folder

1. Command Palette → **Thought Diff: Set Original Folder** and pick the frozen
   AI copy, **or** set `thoughtDiff.originalFolder` in settings.
2. Optional: set `thoughtDiff.originalGitRef` to a branch/tag/commit instead; the
   extension runs `git archive` from the workspace root into a temp dir.
3. Open the **Thought Diff** activity-bar view (or **Thought Diff: Open View**).
4. Edits refresh the view on save; or run **Thought Diff: Refresh**.

Settings of note:

| Setting | Meaning |
|---|---|
| `thoughtDiff.originalFolder` | Absolute path to the frozen original directory |
| `thoughtDiff.originalGitRef` | Git ref used as original (overrides folder when set) |
| `thoughtDiff.workingFolder` | Working copy (default: first workspace folder) |
| `thoughtDiff.pythonPath` | Python executable (default `python3`) |

If Python is missing, the view shows a clear error asking you to install Python
3.10+ and/or set `thoughtDiff.pythonPath`. The extension sets `PYTHONPATH` to its
bundled `extension/python` copy of the library.

### Limits (extension)

- Same Python-only AST limits as the CLI.
- Needs a local Python interpreter; the extension does not ship one.
- Git-ref originals need `git` on PATH and a workspace that is a git repo.
- Does not replace the built-in code diff — it sits beside it.

## CLI (unchanged workflow)

Needs Python 3.10+. No runtime dependencies; `pytest` for tests.

```
python -m thought_diff compare examples/original examples/working
python -m thought_diff compare ORIGINAL_DIR WORKING_DIR --exit-code
python -m thought_diff compare ORIGINAL_DIR WORKING_DIR --json   # machine-readable
python -m thought_diff structure examples/working
pip install -r requirements.txt && python -m pytest
```

A simple workflow: copy the AI's output to `original/` (or keep it on a git
branch), never edit it, edit `working/`, re-run `compare` or use the extension.

## Packaging the VSIX

```
cd extension && npm install && npm run package
```

CI builds the VSIX as a workflow artifact. Do not publish to VS Marketplace /
Open VSX unless that is decided later.

## Versioning

Each version gets its own branch `release/vX.Y.Z` and tag `vX.Y.Z` on the same
commit. `main` moves forward.

## License

No license yet. All rights reserved by the author until one is added.

See [docs/original-idea.md](docs/original-idea.md) for the idea this came from.
