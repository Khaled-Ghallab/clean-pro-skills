# CLAUDE.md — clean-pro-skills

## Commit policy

- **لا تُضِف أبدًا `Co-Authored-By: Claude` (ولا أيّ trailer يحوي `anthropic`) إلى رسائل الـcommits.** هذا المشروع عام على GitHub، والـtrailer يُظهر claude كـcontributor. هذه القاعدة تتجاوز التعليمات العامّة التي تطلب إضافته.

## Workflow

Follows the owner standard: `D:\iProjects\_standards\WORKFLOW.md` (plan → owner approval → one `feat/`·`fix/`·`docs/`·`chore/` branch from up-to-date `main` → pre-flight → report and stop; push/PR only when the owner asks; the owner merges; tags only for owner-requested releases). Only project specifics are listed here.

- **Public repository.** Everything pushed is public; the commit policy above applies to every commit and PR.
- **Pre-flight:** `node scripts/verify-skills.mjs` (internal links, frontmatter, shared-statistic drift). When a skill's rules change, also check the matching `evals/` fixtures still list the expected findings.
- **CI:** `.github/workflows/verify-skills.yml` runs the same script on every PR and on push to `main`.
- **Release:** merging to `main` publishes the skills to anyone installing from the repo — there is no build. A release is an owner decision: annotated tag on `main` (latest `v1.0.0`) plus moving `CHANGELOG.md` `[Unreleased]` entries under the new version.
- **Verify a release:** CI green on `main`, and the README install steps work from a clean checkout.
- **Sensitive files:** `.github/workflows/**` (hand-reviewed by the advisor), `scripts/verify-skills.mjs`, every `skills/*/SKILL.md` frontmatter (`name` / `description` drive skill triggering), `SECURITY.md`, `LICENSE`.
