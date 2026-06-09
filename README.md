# clean-pro-skills

Five review-gate [Agent Skills](https://github.com/vercel-labs/skills) that catch the **systematic** ways AI coding agents produce bad code, tests, documentation, security holes, and insecure infrastructure — each rule traced to a primary source (Uncle Bob, Fowler, Hunt & Thomas, McCabe, Metz, OWASP, CWE) or to published 2022–2026 research on LLM code generation and security.

Generic "follow clean code" instructions don't catch what LLMs actually get wrong. These skills add the AI-specific layer: swallowed exceptions, hallucinated APIs, mock fallbacks declared as success, over-eager abstraction, docs written from memory instead of from the source, test bloat that asserts implementation instead of behavior, and plausible-but-insecure code that ships injection, missing authorization, and slopsquatted dependencies.

The security skill also covers the code that *calls* LLMs — prompt-injection containment, model output treated as untrusted input, agent-tool least privilege, prompt secrets, consumption caps, and RAG tenant isolation — mapped to the OWASP LLM Top 10. Review rules for AI-written code and for AI-calling code, in one place.

## The skills

| Skill | Guards | Use it after… |
| --- | --- | --- |
| **clean-code-pro** | Production code — Clean Code, SOLID, DRY/KISS/YAGNI, plus 15 documented LLM failure modes | an agent writes, edits, refactors, or fixes implementation code |
| **clean-test-pro** | Test code — behavior-over-implementation, justified mocks, no framework re-testing, no near-duplicate bloat (pytest · PHPUnit/Pest · Jest/Vitest, + LLM-app rules) | an agent writes or changes tests |
| **clean-docs-pro** | Documentation — every symbol, flag, endpoint, and code sample verified against the source; docs-vs-code drift; unverifiable claims (READMEs, API refs, docstrings, changelogs) | an agent writes or changes docs, or code changes documented behavior |
| **clean-security-pro** | Security — injection, broken access control, CSRF, mass assignment, secrets in code, weak crypto, SSRF, insecure deserialization, LLM-app risks (prompt-injection containment, model output to sinks, excessive agency), plus slopsquatting and supply-chain risk; mapped to OWASP Top 10:2025, the 2025 CWE Top 25, and the OWASP LLM Top 10 | an agent writes or changes code touching untrusted input, auth, secrets, I/O, dependencies, or LLM/agent calls |
| **clean-infra-pro** | Infrastructure — CI/CD workflow injection, `pull_request_target` misuse, overprivileged tokens, unpinned actions/images/modules, secrets in layers, root containers, wildcard IAM, open ingress; mapped to OWASP CICD-SEC and CIS benchmarks | an agent writes or changes workflow YAML, Dockerfiles, compose files, or IaC |

Each skill runs in three modes: **guard-pass** (review a diff before it ships), **live** (apply the rules while writing when invoked explicitly), and **review** (produce a structured findings report). They defer to your project's linters, formatters, test runners, and security scanners — they own the judgement layer, not the mechanical one.

## Install

With the [`skills` CLI](https://github.com/vercel-labs/skills):

```bash
# all four
npx skills add Khaled-Ghallab/clean-pro-skills --skill '*'

# or pick one
npx skills add Khaled-Ghallab/clean-pro-skills --skill clean-code-pro

# see what's in the repo first
npx skills add Khaled-Ghallab/clean-pro-skills --list
```

Skills are portable instructions — no MCP server, API key, network access, or executable required. They work in any agent runtime that reads `SKILL.md` plus its linked `references/`. An `agents/openai.yaml` ships with each skill so they are not locked to a single agent.

## Why this exists

The classic principles — and the current standards: OWASP Top 10:2025, the 2025 CWE Top 25, OWASP LLM Top 10 — are the foundation, but the measured failure modes are AI-specific:

- **Code duplication grew 8×** in tracked codebases between 2021 and 2024 (GitClear 2025).
- **Package hallucination averages ~19.7%** across 16 models — 5.2% commercial, 21.7% open-source (Spracklen et al., USENIX Security '25).
- **Half of AI answers to programming questions** contain incorrect information, and evaluators miss the errors 39% of the time (Kabir et al., CHI 2024).
- Agents **declare success despite failing tests** by returning hardcoded fixture values (Fowler).
- **~40% of AI-generated programs were vulnerable** in security-relevant scenarios, and developers with an AI assistant wrote less secure code while believing it was *more* secure (Pearce et al., S&P 2022; Perry et al., CCS 2023).

Full bibliographies live in each skill's `references/sources.md`.

## Layout

```
skills/
  clean-code-pro/       SKILL.md + references/ + agents/
  clean-test-pro/       SKILL.md + references/ + agents/
  clean-docs-pro/       SKILL.md + references/ + agents/
  clean-security-pro/   SKILL.md + references/ + agents/
  clean-infra-pro/      SKILL.md + references/ + agents/
evals/                  defective fixtures + expected-findings per skill
scripts/verify-skills.mjs   link / frontmatter / stat-drift checker (CI)
```

## Verifying the skills

The skills practice what they preach. `scripts/verify-skills.mjs` (run in CI on
every push and PR) dogfoods clean-docs-pro: it checks that every internal link
resolves, every skill has valid frontmatter, and shared statistics don't drift
across files. Run it locally with `node scripts/verify-skills.mjs`.

`evals/` holds intentionally defective fixtures with an `expected-findings.md`
per skill — review a fixture with the matching skill and compare the report to
the table to catch regressions when a rule changes. See [evals/README.md](evals/README.md).

## License

[MIT](LICENSE) © Khaled Ghallab
