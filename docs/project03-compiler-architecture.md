# Project 03: Compiler & Optimization Engine — architecture proposal

Status: design only. First milestone is a bounded language with a trustworthy reference interpreter; no machine code execution or user-program eval in the browser.

Pipeline: UTF-8 input → lexer with source spans → precedence parser → typed immutable AST → checked reference interpreter → typed SSA-like IR → verifier → optional optimization passes → IR interpreter. UI and serialization are separate adapters. Every pass returns a new verified IR and structured diagnostics; original semantics remain the oracle.

Initial language: ASCII identifiers, signed 64-bit integer values, explicit + - * operators, parentheses, immutable let bindings and final expression. Define left-to-right evaluation, lexical scope, duplicate/undefined-name errors, source locations and checked overflow traps before optimizing. No functions, loops, division, floating point, pointers, I/O or native-code backend in milestone1. Bound input4KiB, tokens1024, ASTdepth64, evaluation steps4096. Reject unsupported syntax explicitly.

Milestone1 acceptance: portable C++20/CMake library and batch CLI; lexer/parser/evaluator tests including INT64 boundaries, unary minus, precedence, scoping and error spans; deterministic seeded AST fixtures with an independent Python arbitrary-precision oracle that checks overflow at every operation; parser-printer round trips. CI on Windows/Linux; no claim of equivalence to an existing compiler.

Next milestone: verified typed IR, constant propagation with preserved overflow behavior and observable error order. Eliminate unreachable/pure work only when language semantics permit it; e.g. multiplying a trapping expression by zero cannot remove the trap. Test pass equivalence against the reference interpreter including diagnostics, not only final values. Later consider CSE, dead code elimination and visualization, then a separately gated WASM worker. No native execution until sandbox and authorization are established.
