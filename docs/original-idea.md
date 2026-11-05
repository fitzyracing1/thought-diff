# Original idea (Joshua Almeida)

Kept close to his own words:

> AI can build very useful real software, but if necessary they could break
> everything AI writes down somehow and go through the files AND their
> STRUCTURE — structure is important, not just the files. Cursor kind of does
> that (you can see the diff) but it could be better.

> Go line by line and see what AI thinks of the line compared to the whole
> program written.

> NOT regeneration. A re-thought / thought-diff as changes are made in the
> editor, while the editor is compared to a branch copy of the AI's original
> code in a (code) diff.

## Clarified design

- **Two linked views:** each line's purpose AND the whole program's structure.
  Change either and both update.
- **Frozen reference:** keep a frozen branch/copy of the AI original; compare the
  working editor against it as edits happen.
- **Diff of interpretations:** alongside the code diff, show how interpretations
  change for each affected line and for the whole project's structure. This is a
  diff of interpretations, not access to hidden original-model thoughts.
- **Interpretations must be checked:** an explanation is a current
  interpretation that must be checked against the actual code and tests, not
  treated as proof of original hidden reasoning.

## Where v0.1.0 stands

v0.1.0 makes interpretations deterministically from the Python AST, so results
are repeatable and testable without any AI service. Using a live model to write
richer interpretations is a possible future direction; it is not built.
