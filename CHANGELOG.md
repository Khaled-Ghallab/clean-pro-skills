# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project aims to
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **clean-infra-pro** — fifth skill: CI/CD, container, and IaC security
  (GitHub Actions script injection and `pull_request_target` misuse, token
  least-privilege, action/image/module pinning, non-root containers, secrets
  in layers, wildcard IAM, open ingress). Mapped to OWASP CICD-SEC and CIS
  benchmarks, with six AI infra failure modes.
- **clean-security-pro** — `references/llm-app-security.md` covering the OWASP
  LLM Top 10 for code that calls LLMs (prompt-injection containment, model
  output as untrusted input, tool least-privilege, prompt secrets, consumption
  caps, RAG tenant isolation). Imperatives grew from 20 to 27.
- **clean-code-pro** — failure mode 15: async and concurrency hazards
  (unawaited promises, blocking I/O in async, unsynchronized shared state).
  Imperatives grew to 24.
- **clean-test-pro** — Rule 10: tests are deterministic (no sleep-based
  synchronization, real network, wall-clock/timezone/locale dependence,
  uncontrolled randomness, or execution-order coupling).
- `scripts/verify-skills.mjs` and a CI workflow that dogfoods clean-docs-pro:
  checks internal links resolve, frontmatter is valid, and shared statistics
  do not drift across files.
- `evals/` — intentionally defective fixtures with expected-findings tables
  for clean-security-pro, clean-code-pro, and clean-infra-pro.

### Changed
- **clean-security-pro** upgraded from OWASP Top 10:2021 to **Top 10:2025**
  (final) and the **2025 CWE Top 25**. New CWE coverage: CSRF, NoSQL operator
  injection, open redirect, XXE, mass assignment, ReDoS, unbounded resource
  consumption, TOCTOU. Password hashing aligned to the OWASP cheat sheet
  (argon2id first; PBKDF2 accepted for edge/Web-Crypto runtimes); constant-time
  comparison added.
- Fixed two unsafe "safe" examples: the path-traversal check was missing its
  trailing separator, and the SSRF pattern now pins the resolved IP against
  DNS rebinding.
- Standardized the USENIX package-hallucination figure to ~19.7%
  (5.2% commercial / 21.7% open-source) across all files.
- Added the shared **Compatibility** section to clean-test-pro and
  clean-docs-pro.
