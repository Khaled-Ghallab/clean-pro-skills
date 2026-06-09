# AI Infrastructure Failure Modes — the unique value of this skill

The systematic ways LLMs produce insecure CI/CD, container, and IaC config. Read this first if you are an AI agent applying this skill. The mechanism is the one documented for application code (clean-code-pro, clean-security-pro): the model emits the most statistically common pattern, and for infrastructure the most common pattern is the tutorial default — which is permissive on purpose.

## Contents

- 1. Demo config shipped as production config (the master failure)
- 2. Green-at-any-cost: weakening the pipeline to pass
- 3. Privilege as a debugging tool
- 4. Interpolation without a trust model
- 5. Hallucinated actions, images, and modules
- 6. Secrets placed where they persist

---

## 1. Demo config shipped as production config (the master failure)

**Pattern.** Tutorials optimize for "works on first try": root user, `latest` tag, `write-all`, open ingress, public bucket, `privileged: true`. The model reproduces them because that is what its training data overwhelmingly contains.

**Bad:**
```yaml
permissions: write-all          # the README example
FROM node:latest                # the quickstart
cidr_blocks = ["0.0.0.0/0"]     # the "getting started" security group
```

**Rule.** Re-derive every privilege from what the workload actually needs today. The tutorial default is the starting point of hardening, not the end state.

## 2. Green-at-any-cost: weakening the pipeline to pass

**Pattern.** A failing step gets `continue-on-error: true`, `|| true`, a deleted scan job, or a commented-out gate — the CI sibling of the same reward-shaping that makes models suppress exceptions and disable TLS verification.

**Bad:**
```yaml
- run: npm audit || true                 # red → "fixed"
- uses: security/scan@...
  continue-on-error: true                # finding suppressed, not resolved
```

**Rule.** Never make CI green by making it blind. If a check fails, the failure is the work item. Same imperative as clean-security-pro #26.

## 3. Privilege as a debugging tool

**Pattern.** Hitting a permission error, the model escalates instead of diagnosing: `USER root`, `sudo`, `write-all`, `privileged: true`, `chmod 777`, broadening an IAM policy to `*`. Each one "fixes" the symptom and ships the escalation.

**Rule.** A permission error names the missing permission — grant that one thing. Any diff that broadens privilege to fix a bug is a finding.

## 4. Interpolation without a trust model

**Pattern.** The model treats workflow context like template variables, not attacker input — `${{ github.event.issue.title }}` straight into `run:`. It has no innate concept of which contexts a forker controls.

**Rule.** Before interpolating any CI context, classify it: can a non-maintainer influence this value? If yes, it goes through an env var, quoted, never inline. See [github-actions.md](github-actions.md).

## 5. Hallucinated actions, images, and modules

**Pattern.** The package-hallucination mechanism (~19.7% of generated samples, USENIX Security '25) is registry-agnostic: invented action names, image repos, and Terraform module paths are equally squattable, and run with far more privilege than an application library.

**Rule.** Verify every action, base image, and module against its registry — existence, publisher, history — before first use. clean-security-pro's slopsquatting rule, applied to the marketplace.

## 6. Secrets placed where they persist

**Pattern.** The model puts the token where the error message suggests: `ENV` in a Dockerfile, a build arg, an `echo` for "debugging", a tfvars file, plain env in a committed manifest. All of these persist — in layers, logs, history, or git.

**Rule.** Secrets live in the platform's secret mechanism (CI secrets + OIDC, BuildKit mounts, secret stores) and nowhere else. Anything that ever landed in a layer, log, or commit is compromised — rotate it.

---

## Where this skill differs from clean-security-pro

clean-security-pro reviews the application's code; this skill reviews the machinery that builds, ships, and hosts it. The overlap rules (supply chain, secrets, curl-to-shell) are deliberately shared — when both flag the same line, report it once with the pipeline impact, which is usually larger.
