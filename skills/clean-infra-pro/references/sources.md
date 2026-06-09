# Sources

Central bibliography for `clean-infra-pro`. Other reference files use source
names instead of inline URLs so rule guidance stays readable.

## Contents

- Standards and benchmarks
- Platform hardening guides
- Research
- Tools

## Standards And Benchmarks

- **OWASP Top 10 CI/CD Security Risks (CICD-SEC-1..10)**: https://owasp.org/www-project-top-10-ci-cd-security-risks/
- **CIS Docker Benchmark**: https://www.cisecurity.org/benchmark/docker
- **CIS Kubernetes Benchmark**: https://www.cisecurity.org/benchmark/kubernetes
- **SLSA — Supply-chain Levels for Software Artifacts**: https://slsa.dev/
- **CWE-798 hard-coded credentials**: https://cwe.mitre.org/data/definitions/798.html
- **CWE-770 allocation without limits**: https://cwe.mitre.org/data/definitions/770.html

## Platform Hardening Guides

- **GitHub — Security hardening for GitHub Actions** (script injection, pull_request_target, permissions, pinning): https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
- **Docker — Build secrets (BuildKit secret mounts)**: https://docs.docker.com/build/building/secrets/
- **Docker — Multi-stage builds**: https://docs.docker.com/build/building/multi-stage/
- **HashiCorp — Terraform state, sensitive data**: https://developer.hashicorp.com/terraform/language/state/sensitive-data
- **Kubernetes — Pod Security Standards**: https://kubernetes.io/docs/concepts/security/pod-security-standards/

## Research

- **Asleep at the Keyboard?, Pearce et al., IEEE S&P 2022** (plausible-but-insecure generation): https://arxiv.org/abs/2108.09293
- **Do Users Write More Insecure Code with AI Assistants?, Perry et al., ACM CCS 2023**: https://arxiv.org/abs/2211.03622
- **We Have a Package for You!, Spracklen et al., USENIX Security 2025** (hallucination mechanism, registry-agnostic): https://arxiv.org/abs/2406.10279

## Tools

- **actionlint** (workflow linting): https://github.com/rhysd/actionlint
- **zizmor** (Actions security audit): https://github.com/zizmorcore/zizmor
- **hadolint** (Dockerfile linting): https://github.com/hadolint/hadolint
- **Checkov / tfsec (Trivy) / kube-linter** (IaC scanning): https://www.checkov.io/ · https://github.com/aquasecurity/trivy · https://github.com/stackrox/kube-linter
