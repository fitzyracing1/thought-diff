import argparse
import sys
from . import __version__
from .core import compare, load_tree, structure_of, structure_lines


def main(argv=None) -> int:
    p = argparse.ArgumentParser(prog="thought_diff", description=(
        "Compare a working copy against a frozen copy of AI-written code: code diff, "
        "line-interpretation diff, and program-structure diff."))
    p.add_argument("--version", action="version", version=__version__)
    sub = p.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("compare", help="original/ (frozen) vs working/")
    c.add_argument("original"); c.add_argument("working")
    c.add_argument("--exit-code", action="store_true", help="exit 1 if anything differs")
    st = sub.add_parser("structure", help="print the structure view of one directory")
    st.add_argument("path")
    a = p.parse_args(argv)
    if a.cmd == "compare":
        r = compare(a.original, a.working)
        sys.stdout.write(r.render())
        return 1 if (a.exit_code and not r.empty) else 0
    print("\n".join(structure_lines(structure_of(load_tree(a.path)))))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
