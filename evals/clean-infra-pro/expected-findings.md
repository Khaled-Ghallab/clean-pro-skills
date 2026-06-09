# Expected findings — clean-infra-pro

## fixture_ci.yml

| ID | Location | Violation | Imperative | Class | Must-find |
|---|---|---|---|---|---|
| I2 | `on: pull_request_target` + checkout head.sha | Fork code executed with secret access | 2 | CICD-SEC-4 (PPE) | yes |
| I1 | `greet` run | PR title interpolated into `run:` | 1 | CICD-SEC-4 (injection) | yes |
| I3 | `permissions: write-all` | Token over-privileged | 3 | CICD-SEC-2 | yes |
| I4 | `setup-thing@main` | Third-party action unpinned | 4 | CICD-SEC-3 | yes |
| I5 | `echo "token=…"` | Secret written to logs | 5 | CICD-SEC-6 | yes |
| I11 | `curl … | sh` | Network piped to shell in pipeline | 11 | A08 | yes |
| I16 | `continue-on-error: true` on scan | Security gate weakened to pass | 16 | AI failure #2 | yes |

## fixture.Dockerfile

| ID | Location | Violation | Imperative | Class | Must-find |
|---|---|---|---|---|---|
| I9 | `ARG NPM_TOKEN`, `ENV API_KEY` | Secrets persisted in image layers/history | 9 | CWE-798 | yes |
| I8 | no `USER` | Container runs as root | 8 | CIS Docker | yes |
| I10 | `FROM node:latest` | Base image unpinned/mutable | 10 | CICD-SEC-3 | yes |

Quality signals: I2, I1, I9 reported at Critical. The bare `COPY . .` with no `.dockerignore` is a legitimate bonus find (build-context hygiene), not required.
