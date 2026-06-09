# Security Policy

## What this repository is

These skills are **portable instruction files** (Markdown + lightweight YAML).
They contain no executable code that runs on your machine, no MCP server, no
network access, and no install scripts. The one script in the repo,
`scripts/verify-skills.mjs`, is a dependency-free Node checker run only in CI
and locally; read it before running it.

The `evals/` directory contains **intentionally vulnerable fixtures** used to
test the skills. They are clearly marked, are never imported by anything, and
contain only inert placeholder "secrets". Do not copy from them.

## Reporting a vulnerability or a defective rule

If you find a genuine security issue in the tooling, or — more likely — a rule
that gives **unsafe guidance** (a "safe" example that is actually exploitable,
an outdated mapping, a wrong remediation), please report it:

- Open a [GitHub issue](https://github.com/Khaled-Ghallab/clean-pro-skills/issues)
  for non-sensitive rule corrections, or
- Use **private vulnerability reporting** (GitHub → Security → Report a
  vulnerability) if disclosure itself would create risk.

Please include the file and line, what the current guidance says, and the
corrected pattern with a source (OWASP/CWE/primary reference) where possible.
Unsafe-guidance reports are treated as the highest priority — a security skill
that teaches an insecure pattern is worse than no skill.

## Scope

In scope: incorrect or unsafe rule guidance, dead/misleading source citations,
defects in the verification script, secrets accidentally committed.
Out of scope: the deliberately vulnerable `evals/` fixtures.
