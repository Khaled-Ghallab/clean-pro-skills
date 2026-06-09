# IaC and Cloud Configuration — Terraform, CloudFormation, Kubernetes

Source: CIS Benchmarks (cloud providers, Kubernetes); provider security documentation. Examples use Terraform/K8s syntax; the rules are provider-agnostic.

## Contents

- Least-privilege IAM — no wildcards
- Network exposure — no open admin/data ports
- Storage: private and encrypted by default
- Terraform state is a secret
- Modules and providers: pinned and verified
- Kubernetes workload hardening

## Least-privilege IAM — no wildcards

```hcl
# Unsafe
statement { actions = ["*"], resources = ["*"] }
# Safe
statement {
  actions   = ["s3:GetObject", "s3:PutObject"]
  resources = ["arn:aws:s3:::app-uploads/*"]
}
```

`Action:*` on `Resource:*` makes every compromise a total compromise. Grant the verbs the workload provably uses on the resources it provably touches; prefer short-lived assumed roles over static user keys. `iam:PassRole` and `*:*` on identity services are privilege-escalation primitives — flag them even when scoped-looking.

## Network exposure — no open admin/data ports

```hcl
# Unsafe — SSH from the entire internet
ingress { from_port = 22, to_port = 22, cidr_blocks = ["0.0.0.0/0"] }
# Safe
ingress { from_port = 22, to_port = 22, cidr_blocks = [var.bastion_cidr] }
```

`0.0.0.0/0` (and `::/0`) to SSH/RDP/databases/Kubernetes API/etcd is internet-exposed infrastructure. Web ports (80/443) on actual public services are the exception, not the template.

## Storage: private and encrypted by default

- Buckets/blob containers: public access blocked unless the resource is a deliberate public website — and then say so in a comment.
- Encryption at rest declared explicitly (KMS key where the org manages keys); don't rely on remembering a console default.
- Snapshots and AMIs are storage too — not public, not shared to `all`.

## Terraform state is a secret

State files contain every attribute Terraform knows — including generated passwords and keys, in plaintext.

- Remote backend with encryption and access control (S3+KMS+DynamoDB lock, or equivalent); never a committed local `terraform.tfstate`.
- `*.tfstate`, `*.tfvars` with real values, and crash logs belong in `.gitignore`.
- Mark sensitive variables `sensitive = true`; it scrubs plan output, not state — the backend controls protect state.

## Modules and providers: pinned and verified

```hcl
# Unsafe
module "vpc" { source = "some-namespace/vpc/aws" }            # floating latest
# Safe
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"                    # verified namespace
  version = "5.8.1"                                            # pinned
}
```

A hallucinated module path or namespace is the IaC slopsquat — verify it exists on the registry with a real maintainer before applying. Pin provider versions in `required_providers`. (Same registry rule as clean-security-pro's supply-chain imperatives.)

## Kubernetes workload hardening

```yaml
# Safe baseline for every workload
securityContext:
  runAsNonRoot: true
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities: { drop: ["ALL"] }
resources:
  limits: { memory: "256Mi", cpu: "500m" }
```

Flag: `privileged: true`, `hostNetwork`/`hostPID`/`hostPath` mounts, missing resource limits (one pod can starve the node — CWE-770 at the cluster layer), secrets as plain env in manifests committed to git (use the secret store/CSI driver), and `latest` image tags in deployments.
