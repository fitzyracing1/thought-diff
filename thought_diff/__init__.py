"""thought-diff: compare edits to a frozen copy of AI-written code, plus how
line and program-structure interpretations change. Interpretations are
deterministic AST heuristics, not recovered model thoughts."""
__version__ = "0.2.0"
from .core import compare, interpret_lines, structure_of  # noqa: F401
