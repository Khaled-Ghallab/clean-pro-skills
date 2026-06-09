# Container Security — Dockerfiles, images, compose

Source: CIS Docker Benchmark; Docker docs (BuildKit secrets, multi-stage builds). Rules apply to any OCI builder.

## Contents

- Run as non-root
- Secrets never enter a layer
- Pin and minimize base images
- Multi-stage: build tools out of runtime
- No network-to-shell during build
- Compose and runtime privileges
- Build context hygiene

## Run as non-root

A process that escapes a root container lands as root-adjacent on the host. Every final image sets a non-root user:

```dockerfile
# Unsafe — no USER directive: runs as root
FROM node:22-slim
CMD ["node", "server.js"]
# Safe
FROM node:22-slim
RUN useradd --uid 10001 --no-create-home app
USER 10001
CMD ["node", "server.js"]
```

Bind to ports >1024 so root isn't "needed"; never solve a permission error with `USER root` in the final stage.

## Secrets never enter a layer

Layers are immutable history. A secret `COPY`'d in and deleted in a later step is still in the image; `ARG` values are visible in `docker history`.

```dockerfile
# Unsafe — all three persist in the image
ENV API_KEY=sk_live_...
ARG NPM_TOKEN
COPY .npmrc /root/.npmrc          # "removed" later — still in the layer
# Safe — BuildKit secret mount: exists only during the RUN
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
```

Runtime secrets are injected at run time (env from the orchestrator, mounted secret files) — never baked in. (CWE-798 applied to layers)

## Pin and minimize base images

```dockerfile
# Unsafe
FROM python:latest                 # mutable; today's build ≠ tomorrow's
# Safe
FROM python:3.13-slim@sha256:...   # digest-pinned; slim/distroless surface
```

`latest` breaks reproducibility and lets a registry compromise ride straight into your build. Smaller base = smaller CVE surface; the scanner (Trivy/Grype) is the mechanical floor.

## Multi-stage: build tools out of runtime

Compilers, package managers, and source code in a production image are attacker tooling delivered free.

```dockerfile
FROM golang:1.24 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /app ./cmd/server

FROM gcr.io/distroless/static@sha256:...
COPY --from=build /app /app
USER nonroot
ENTRYPOINT ["/app"]
```

## No network-to-shell during build

`RUN curl https://… | sh` executes a third party's current file in every build, invisibly to review. Download, pin a checksum, verify, then run — or install from a pinned package. (Same rule as clean-security-pro's install-script imperative.)

## Compose and runtime privileges

```yaml
# Unsafe
privileged: true                       # full host access
volumes: ["/var/run/docker.sock:/var/run/docker.sock"]   # = root on host
network_mode: host
# Safe
cap_drop: [ALL]                        # add back only what's needed
read_only: true                        # plus tmpfs for scratch paths
```

The docker socket inside a container is host root with extra steps — a finding wherever it appears outside purpose-built tooling.

## Build context hygiene

`.dockerignore` excludes `.git`, `.env`, key material, and local config — `COPY . .` without it ships them into a layer. Check what the context actually contains before approving a broad `COPY`.
