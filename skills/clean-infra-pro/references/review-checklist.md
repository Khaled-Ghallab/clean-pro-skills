# Infrastructure Review Checklist

When the user asks you to **review, audit, or assess** infrastructure config (rather than write it), follow this structured walk. Do not edit unless asked. Produce a findings report mapped to CICD-SEC / CIS.

## Contents

- Output format
- Pre-flight: map the blast radius
- Walk order
- What to do with each finding
- When the review is contested

## Output format

```
# Infra review: <files or scope>

## Summary
<2–3 sentence verdict: ship / fix-first / do-not-ship — and the headline risk>

## Critical findings
<exploitable from a fork or the internet — fix before merge>
- **<short title>** — `<file>:<line>`
  Evidence: <quoted config / trigger-to-secret path>
  Class: <CICD-SEC-x / CIS section / CWE-xx>
  Impact: <what an attacker gains>
  Fix: <concrete remediation>

## High findings
- ...

## Medium / hardening
- ...

## What's solid
<controls done right — pinned actions, minimal permissions, non-root images>

## Coverage
- [ ] Workflow triggers and injection surfaces
- [ ] Token and credential scope
- [ ] Action/image/module pinning and provenance
- [ ] Container build and runtime privileges
- [ ] IAM, network exposure, storage, state
- [ ] AI-specific failure modes
```

Severity uses the SKILL.md guide. Lead with what a forker or unauthenticated outsider can exploit today.

## Pre-flight: map the blast radius

Before walking rules, answer for each file:

- **Who can trigger this?** (fork PR, issue event, push to main, schedule, manual)
- **What can it reach?** (secrets available, token permissions, runner type, cloud roles)
- **What does it produce?** (artifacts, images, releases, deploys — who consumes them downstream)

A workflow triggerable by a forker with secret access is the review's spine, exactly like a source→sink path in an app review.

## Walk order

1. **Workflows** ([github-actions.md](github-actions.md)) — untrusted context in `run:`? `pull_request_target`/`workflow_run` touching fork code? `permissions:` minimal? Actions SHA-pinned? Secrets printable or fork-reachable? Artifacts/caches crossing trust boundaries? Self-hosted runners fork-exposed?
2. **Containers** ([containers.md](containers.md)) — final image non-root? Secrets in ENV/ARG/layers? Base pinned and minimal? Multi-stage? `curl | sh` in build? compose `privileged`/docker-socket/host network?
3. **IaC** ([iac-and-cloud.md](iac-and-cloud.md)) — wildcard IAM? Open ingress to admin/data ports? Public/unencrypted storage? State committed or unprotected? Modules/providers pinned and verified? K8s securityContext and limits?
4. **AI failure modes** ([ai-infra-failure-modes.md](ai-infra-failure-modes.md)) — demo defaults shipped as-is? Any check weakened to go green? Privilege escalated to fix a bug? Unverified action/image/module names?

## What to do with each finding

1. Quote the config and, for pipeline findings, the **trigger-to-secret path** (who triggers it → what it executes → what it can reach).
2. Name the class (CICD-SEC-x / CIS / CWE).
3. State attacker impact in one line — this drives severity.
4. Give a concrete fix.
5. Assign severity from the SKILL.md guide. A finding with no path from an untrusted principal is hardening, not Critical — say which it is.

## When the review is contested

Cite the CICD-SEC id or CIS section with the URL from [sources.md](sources.md). For a deliberate, safe exception (a public website bucket, a workflow that genuinely needs write), require a comment naming the control and why it is safe here, and downgrade to a documented exception rather than dropping it.
