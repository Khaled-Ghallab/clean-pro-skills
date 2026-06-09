# clean-pro-skills

Three review-gate [Agent Skills](https://github.com/vercel-labs/skills) that catch the **systematic** ways AI coding agents produce bad code, tests, and documentation — each rule traced to a primary source (Uncle Bob, Fowler, Hunt & Thomas, McCabe, Metz) or to published 2024–2026 research on LLM code generation.

Generic "follow clean code" instructions don't catch what LLMs actually get wrong. These skills add the AI-specific layer: swallowed exceptions, hallucinated APIs, mock fallbacks declared as success, over-eager abstraction, docs written from memory instead of from the source, and test bloat that asserts implementation instead of behavior.

## The skills

| Skill | Guards | Use it after… |
| --- | --- | --- |
| **clean-code-pro** | Production code — Clean Code, SOLID, DRY/KISS/YAGNI, plus 14 documented LLM failure modes | an agent writes, edits, refactors, or fixes implementation code |
| **clean-test-pro** | Test code — behavior-over-implementation, justified mocks, no framework re-testing, no near-duplicate bloat (pytest · PHPUnit/Pest · Jest/Vitest, + LLM-app rules) | an agent writes or changes tests |
| **clean-docs-pro** | Documentation — every symbol, flag, endpoint, and code sample verified against the source; docs-vs-code drift; unverifiable claims (READMEs, API refs, docstrings, changelogs) | an agent writes or changes docs, or code changes documented behavior |

Each skill runs in three modes: **guard-pass** (review a diff before it ships), **live** (apply the rules while writing when invoked explicitly), and **review** (produce a structured findings report). They defer to your project's linters, formatters, and test runners — they own the judgement layer, not the mechanical one.

## Install

With the [`skills` CLI](https://github.com/vercel-labs/skills):

```bash
# all three
npx skills add Khaled-Ghallab/clean-pro-skills --skill '*'

# or pick one
npx skills add Khaled-Ghallab/clean-pro-skills --skill clean-code-pro

# see what's in the repo first
npx skills add Khaled-Ghallab/clean-pro-skills --list
```

Skills are portable instructions — no MCP server, API key, network access, or executable required. They work in any agent runtime that reads `SKILL.md` plus its linked `references/`. An `agents/openai.yaml` ships with each skill so they are not locked to a single agent.

## Why this exists

The classic principles are the foundation, but the measured failure modes are AI-specific:

- **Code duplication grew 8×** in tracked codebases between 2021 and 2024 (GitClear 2025).
- **Package hallucination averages 19.6%** across 16 models (Spracklen et al., USENIX Security '25).
- **Half of AI answers to programming questions** contain incorrect information, and evaluators miss the errors 39% of the time (Kabir et al., CHI 2024).
- Agents **declare success despite failing tests** by returning hardcoded fixture values (Fowler).

Full bibliographies live in each skill's `references/sources.md`.

## Layout

```
skills/
  clean-code-pro/   SKILL.md + references/ + agents/
  clean-test-pro/   SKILL.md + references/ + agents/
  clean-docs-pro/   SKILL.md + references/ + agents/
```

## License

[MIT](LICENSE) © Khaled Ghallab
