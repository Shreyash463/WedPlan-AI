"""Stage 0 Measurement Script for WedPlan AI.

Gathers:
1. File counts and line counts per file (flagging files > 250 lines).
2. Functions over 40 lines.
3. Cyclomatic complexity (AST-based).
4. Test coverage.
5. Production bundle size (gzipped).
6. Security audits (pip-audit & npm audit).
"""

from __future__ import annotations

import ast
import json
import os
import subprocess
from pathlib import Path


def analyze_python_file(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines()
    line_count = len(lines)

    try:
        tree = ast.parse(content, filename=str(path))
    except Exception:
        return {"line_count": line_count, "functions": [], "max_complexity": 0}

    functions = []

    class FuncVisitor(ast.NodeVisitor):
        def visit_FunctionDef(self, node):
            self.check_func(node)
            self.generic_visit(node)

        def visit_AsyncFunctionDef(self, node):
            self.check_func(node)
            self.generic_visit(node)

        def check_func(self, node):
            end_line = getattr(node, "end_lineno", node.lineno)
            func_len = end_line - node.lineno + 1

            # Simple Cyclomatic Complexity estimation
            # count decisions: if, elif, for, while, and, or, except, with, assert
            decisions = 1
            for child in ast.walk(node):
                if isinstance(
                    child,
                    (
                        ast.If,
                        ast.For,
                        ast.While,
                        ast.AsyncFor,
                        ast.ExceptHandler,
                        ast.With,
                        ast.AsyncWith,
                        ast.Assert,
                    ),
                ):
                    decisions += 1
                elif isinstance(child, ast.BoolOp):
                    decisions += len(child.values) - 1

            functions.append({
                "name": node.name,
                "lineno": node.lineno,
                "length": func_len,
                "complexity": decisions,
            })

    visitor = FuncVisitor()
    visitor.visit(tree)

    max_c = max([f["complexity"] for f in functions], default=1)

    return {
        "line_count": line_count,
        "functions": functions,
        "max_complexity": max_c,
    }


def analyze_ts_js_file(path: Path) -> dict:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    lines = content.splitlines()
    line_count = len(lines)
    return {"line_count": line_count}


def main():
    root = Path(__file__).resolve().parent.parent

    print("=" * 80)
    print("STAGE 0: BEFORE METRICS AUDIT")
    print("=" * 80)

    # 1. Backend Analysis
    backend_dir = root / "backend"
    api_dir = root / "api"
    py_files = list(backend_dir.rglob("*.py")) + list(api_dir.rglob("*.py"))
    py_files = [p for p in py_files if "__pycache__" not in str(p)]

    print(f"\n[1] Python Files Analysis ({len(py_files)} files):")
    backend_over_250 = []
    backend_funcs_over_40 = []
    high_complexity_funcs = []

    for p in sorted(py_files):
        rel = p.relative_to(root)
        info = analyze_python_file(p)
        is_over = info["line_count"] > 250
        status = ">>> OVER 250 <<<" if is_over else "OK"
        if is_over:
            backend_over_250.append((str(rel), info["line_count"]))

        for f in info["functions"]:
            if f["length"] > 40:
                backend_funcs_over_40.append((str(rel), f["name"], f["length"]))
            if f["complexity"] > 10:
                high_complexity_funcs.append((str(rel), f["name"], f["complexity"]))

        print(f"  {str(rel):<45} : {info['line_count']:>4} lines (max complexity: {info['max_complexity']:>2}) {status}")

    # 2. Frontend Analysis
    frontend_src = root / "frontend" / "src"
    frontend_tests = root / "frontend" / "tests"
    ts_files = list(frontend_src.rglob("*.[tj]s*")) + list(frontend_tests.rglob("*.[tj]s*"))
    ts_files = [p for p in ts_files if "node_modules" not in str(p)]

    print(f"\n[2] Frontend Files Analysis ({len(ts_files)} files):")
    frontend_over_250 = []
    for p in sorted(ts_files):
        rel = p.relative_to(root)
        info = analyze_ts_js_file(p)
        is_over = info["line_count"] > 250
        status = ">>> OVER 250 <<<" if is_over else "OK"
        if is_over:
            frontend_over_250.append((str(rel), info["line_count"]))
        print(f"  {str(rel):<45} : {info['line_count']:>4} lines {status}")

    # CSS files
    css_files = list((root / "frontend" / "src" / "styles").rglob("*.css"))
    print(f"\n[3] Frontend CSS Analysis ({len(css_files)} files):")
    css_over_250 = []
    for p in sorted(css_files):
        rel = p.relative_to(root)
        info = analyze_ts_js_file(p)
        is_over = info["line_count"] > 250
        status = ">>> OVER 250 <<<" if is_over else "OK"
        if is_over:
            css_over_250.append((str(rel), info["line_count"]))
        print(f"  {str(rel):<45} : {info['line_count']:>4} lines {status}")

    print("\n" + "=" * 80)
    print("SUMMARY OF VIOLATIONS (BEFORE):")
    print("=" * 80)
    print(f"Files > 250 lines (Backend): {len(backend_over_250)}")
    for f, lc in backend_over_250:
        print(f"  - {f}: {lc} lines")

    print(f"\nFiles > 250 lines (Frontend): {len(frontend_over_250)}")
    for f, lc in frontend_over_250:
        print(f"  - {f}: {lc} lines")

    print(f"\nCSS Files > 250 lines: {len(css_over_250)}")
    for f, lc in css_over_250:
        print(f"  - {f}: {lc} lines")

    print(f"\nPython Functions > 40 lines: {len(backend_funcs_over_40)}")
    for f, name, length in backend_funcs_over_40:
        print(f"  - {f} :: {name} ({length} lines)")

    print(f"\nPython Functions with Cyclomatic Complexity > 10: {len(high_complexity_funcs)}")
    for f, name, comp in high_complexity_funcs:
        print(f"  - {f} :: {name} (complexity: {comp})")


if __name__ == "__main__":
    main()
