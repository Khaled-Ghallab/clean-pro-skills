---
name: clean-infra-pro
description: "Review generated or changed infrastructure configuration before it ships — CI/CD workflows (GitHub Actions, GitLab CI), Dockerfiles and compose files, and IaC (Terraform, CloudFormation, Kubernetes manifests). Catches workflow script injection, pull_request_target misuse, overprivileged tokens, unpinned actions and base images, secrets in build args and layers, root containers, wildcard IAM, and open security groups. Maps findings to the OWASP Top 10 CI/CD Security Risks (CICD-SEC) and CIS benchmarks. Best used reactively after an agent writes or edits workflow YAML, Dockerfiles, or IaC. Use when the user asks \"review this workflow\", \"is this Dockerfile safe?\", \"audit our CI\", \"harden this pipeline\", or before merging changes under .github/workflows/, a Dockerfile, or *.tf. DO NOT USE for application code (use clean-code-pro / clean-security-pro), test code (use clean-test-pro), documentation (use clean-docs-pro), runtime cloud-account audits, or cost optimization."
---

# clean-infra-pro

You are reviewing generated or changed infrastructure configuration before it ships. Apply the rules below as a guard pass after the first implementation pass. Pipeline and infrastructure config is code that runs with the keys to production: a workflow injection or an overprivileged token is a repo-to-cloud compromise, not a style issue. Treat any change to CI/CD workflows, container builds, or IaC as security-sensitive by default.

## Compatibility

This is a portable instruction skill. It requires no MCP server, network access,
API key, shell command, local executable, or bundled script. It can be used in
any runtime that supports `SKILL.md` plus directly linked [references/](references/)
files; `agents/openai.yaml` is lightweight display metadata.

This skill does not replace the mechanical scanners — actionlint, zizmor,
hadolint, Checkov, tfsec/Trivy, kube-linter. Use those for what they automate;
use this skill for the judgement layer: what the scanner misses, and which
finding matters in this pipeline.

## How to use this skill

This skill has three modes — pick based on the user's request.

**Guard-pass mode** (recommended): after workflow YAML, a Dockerfile, or IaC has been generated or edited, check the diff against the _Always-applied imperatives_ below. Fix or flag violations before presenting, committing, or merging.

**Live mode** (explicit): when the user invokes this skill before writing infrastructure config, apply the imperatives while writing, then run the _Self-check before delivery_.

**Review mode** (triggered when the user asks you to review, audit, or assess infra config): walk [references/review-checklist.md](references/review-checklist.md) against the target files and produce a structured findings report mapped to CICD-SEC/CIS. Do not edit in review mode unless asked.

The rule bodies live in [references/](references/). Read the relevant reference when:

- You hit a rule and need the identifier or the concrete remediation pattern.
- The user pushes back and you need the source citation.
- You're in review mode and need the full checklist.
- The change touches a specific surface (workflows → [references/github-actions.md](references/github-actions.md); Dockerfiles → [references/containers.md](references/containers.md); Terraform/K8s → [references/iac-and-cloud.md](references/iac-and-cloud.md)).

The reference files are:

- [references/ai-infra-failure-modes.md](references/ai-infra-failure-modes.md) — the systematic ways LLMs produce insecure infrastructure config. **Read this one first if you are an AI agent reading this skill.**
- [references/github-actions.md](references/github-actions.md) — script injection, `pull_request_target`, token permissions, action pinning, artifact and cache trust, self-hosted runners.
- [references/containers.md](references/containers.md) — non-root, secrets in layers, base-image pinning, multi-stage builds, compose privileges.
- [references/iac-and-cloud.md](references/iac-and-cloud.md) — wildcard IAM, open ingress, public storage, state-file secrets, module pinning, Kubernetes securityContext.
- [references/review-checklist.md](references/review-checklist.md) — structured walk-through for review mode.
- [references/sources.md](references/sources.md) — central bibliography. Read it only when a URL is needed.

## Why this skill exists

Infrastructure config is where the other skills explicitly stop: clean-code-pro excludes CI/tooling config from its scope, and clean-security-pro reviews application code. Yet agents write workflow YAML, Dockerfiles, and Terraform constantly — and the training data for these is dominated by tutorial-grade examples whose defaults are permissive on purpose (root containers, `write-all` tokens, `0.0.0.0/0` ingress, mutable `latest` tags). The same plausible-but-insecure mechanism documented for application code (Pearce et al., IEEE S&P 2022; Perry et al., CCS 2023) applies, but here a single finding — a poisoned pipeline, an exfiltrated `GITHUB_TOKEN` — compromises every artifact the pipeline ships. OWASP catalogs these risks as the Top 10 CI/CD Security Risks (CICD-SEC-1 through 10); CIS benchmarks cover the container and cloud layers.

## Always-applied imperatives

These are the rules to follow on every infrastructure change. They are imperative, not suggestions.

### CI/CD workflows

1. **Untrusted context never reaches a shell inline.** Attacker-controlled workflow context — issue titles, PR titles/bodies, branch names, commit messages, author names — must not appear inside `run:` via `${{ }}` interpolation. Pass it through an environment variable and quote it. (CICD-SEC-4, script injection)
2. **`pull_request_target` (and `workflow_run`) never executes fork code with secrets.** These triggers run with secret access; checking out and building/running the PR's head code under them hands your secrets to any forker. Use plain `pull_request`, or split privileged steps into a separate workflow that never executes untrusted code. (CICD-SEC-4, poisoned pipeline execution)
3. **Token permissions are minimal and explicit.** Every workflow (or job) declares `permissions:` with only what it needs — start from `contents: read`. Never `write-all`, never rely on a permissive org default. (CICD-SEC-2)
4. **Third-party actions are pinned to a full commit SHA.** A moving tag (`@v4`, `@main`) is a supply-chain handle anyone who compromises the action repo can yank. Pin the SHA, comment the version, and prefer official/verified publishers. (CICD-SEC-3; same registry-verification rule as clean-security-pro's slopsquatting imperative — hallucinated action names are squattable too)
5. **Secrets stay out of logs, artifacts, and forks.** No `echo` of secrets (masking fails on transforms), no secrets in artifact uploads or build args, no secrets available to workflows triggerable by forks. Long-lived cloud keys are replaced by OIDC federation where the platform supports it. (CICD-SEC-6)
6. **Artifacts, caches, and outputs from untrusted runs are untrusted input.** A `workflow_run` consumer that downloads an artifact produced by fork code and executes or trusts it re-opens imperative 2. Validate provenance before use. (CICD-SEC-9)
7. **Self-hosted runners never serve public-repo or fork workloads** without isolation — a fork PR on a self-hosted runner is remote code execution on your infrastructure. (CICD-SEC-5)

### Containers

8. **Containers run as non-root.** A `USER` directive with a non-zero UID in every final image; no `privileged: true`, no docker-socket mount, no `--cap-add` beyond need in compose/manifests. (CIS Docker Benchmark)
9. **No secrets in images — ever.** Not in `ENV`, not in `ARG`, not in a `COPY`'d file deleted "later": every layer is preserved and `docker history` shows build args. Use BuildKit secret mounts or runtime injection. (CWE-798 applied to layers)
10. **Base images are pinned and minimal.** Digest-pinned (`@sha256:...`) or at minimum exact-version base; never bare `latest`. Multi-stage builds keep compilers, package managers, and source out of the runtime image. (CICD-SEC-3)
11. **Nothing is piped from the network into a shell during build.** `curl | sh` in a Dockerfile is third-party code execution baked into every build — download, verify a checksum, then run. (Same rule as clean-security-pro imperative 21)

### IaC and cloud

12. **No wildcard IAM.** `Action: "*"`, `Resource: "*"`, or both is a finding, full stop. Grant the specific actions on the specific resources; prefer scoped roles over user keys. (CIS; least privilege)
13. **No open ingress to admin or data ports.** `0.0.0.0/0` (or `::/0`) to SSH/RDP/databases/k8s API is exposed-to-the-internet, not "convenient for now." Allow-list sources or use a bastion/VPN/identity-aware proxy.
14. **Storage and state are private and encrypted.** Buckets block public access unless serving a website on purpose; encryption at rest is explicit; Terraform state lives in an encrypted, access-controlled backend and is never committed — state files contain secrets in plaintext.
15. **Modules and providers are pinned and verified.** Version-pinned module sources from verified namespaces; a hallucinated module path is the IaC slopsquat. Kubernetes workloads declare a `securityContext` (`runAsNonRoot`, no privilege escalation) and resource limits.

### AI-specific guardrails — the highest-leverage section

16. **Never weaken the pipeline to make it green.** No `continue-on-error: true` on a failing security step, no `|| true`, no deleting the scan job, no `--no-verify`. If CI only passes by skipping the check, the check is the message. (The infra twin of clean-security-pro imperative 26)
17. **Demo config is not production config.** The model emits the tutorial default — root user, `write-all`, open ingress, `latest` — because that is what training data contains. Re-derive each privilege from what the workload actually needs. (Perry et al., CCS 2023, applied to config)
18. **Verify every action, image, and module name against its registry** before use — existence, publisher, popularity. The package-hallucination mechanism (USENIX Security '25) applies identically to the Actions marketplace, Docker Hub, and module registries.

## Self-check before delivery

Before you show the user infrastructure config you wrote or edited:

1. Walk imperatives 1–18 against your diff. Fix or flag every violation.
2. Any `${{ }}` of attacker-controlled context inside `run:`? Any `pull_request_target` that touches fork code?
3. Does every workflow declare minimal `permissions:`? Is every third-party action SHA-pinned?
4. Any secret in a layer, build arg, env literal, or log path? Any `curl | sh` in a build?
5. Final image non-root and minimal? Base image pinned?
6. Any wildcard IAM, `0.0.0.0/0` to an admin port, public bucket, or committed state file?
7. Did you loosen any permission, disable any check, or add `continue-on-error` to make something pass? If yes, revert and solve it properly or stop and report.

If you cannot answer safely to every check, fix or flag before shipping.

## When the user pushes back on a rule

Refer them to the CICD-SEC id or CIS benchmark section in the relevant [references/](references/) file, with the URL from [references/sources.md](references/sources.md). A context-specific exception (e.g., a genuinely public artifact bucket) must be documented in a comment naming the control and why it is safe here — never silently removed.

## Severity guide

- **Critical** — exploitable from a fork or the internet: workflow script injection, `pull_request_target` running fork code with secrets, secret in an image layer or log, wildcard IAM on production, `0.0.0.0/0` to a database, docker socket mounted into a container.
- **High** — `write-all` token permissions, unpinned third-party action on a release pipeline, root container in production, public bucket, committed Terraform state, fork access to self-hosted runners.
- **Medium** — unpinned base image, missing resource limits/securityContext, missing encryption-at-rest flags, mutable tags on internal images.
- **Low / note** — defense-in-depth: OIDC over stored keys, distroless images, artifact provenance/signing (SLSA), cache scoping.

## What this skill does not do

- Run scanners (actionlint, hadolint, Checkov, Trivy) — it is the judgement layer over their output and gaps.
- Audit live cloud accounts or running clusters — it reviews config in the repo, not deployed state.
- Decide deployment strategy, cost posture, or vendor choice — those are engineering calls; it flags only their security consequences.
- Replace a platform-security review for high-stakes pipelines — it raises the floor; it is not the ceiling.
