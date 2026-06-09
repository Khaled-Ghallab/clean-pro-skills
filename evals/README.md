# Evals — measuring the skills

Each subdirectory holds one or two **intentionally defective fixtures** and an `expected-findings.md` listing every planted violation with the rule/imperative it triggers. They exist to answer one question after any change to a skill: *does an agent using the skill still catch what it is supposed to catch?*

> ⚠️ The fixtures are deliberately insecure and badly written. Never copy from them, never run them, never import them. "Secrets" inside are inert placeholders.

## Running an eval

1. Start a fresh agent session with the target skill available.
2. Ask it to review the fixture in **review mode** (e.g., "security-review `evals/clean-security-pro/fixture_api.py`").
3. Compare the report against `expected-findings.md`.

## Scoring

- **Pass:** every finding marked **must-find** is reported, at any severity.
- **Quality signals:** severities roughly match; no fabricated Critical findings that aren't planted (false positives on a 50-line fixture indicate over-flagging).
- A skill change that drops a must-find is a regression — fix the skill, not the expectation.

## Maintaining fixtures

When a skill gains a rule worth defending, plant one violation for it here and add the row to `expected-findings.md` in the same change. Keep fixtures small (≤ ~60 lines) — the eval tests detection, not endurance.
