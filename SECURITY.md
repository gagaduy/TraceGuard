<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Security Policy

## Supported versions

TraceGuard is currently pre-release. Only the latest commit on `main` is considered for security fixes; no production-ready version is supported yet.

## Report a vulnerability privately

Use GitHub's [private vulnerability reporting form](https://github.com/gagaduy/TraceGuard/security/advisories/new). Do not disclose the issue in a public issue, discussion, pull request, or social post before coordinated disclosure.

Include, when available:

- affected commit, component, endpoint, or workflow;
- impact and prerequisites;
- minimal reproduction steps or a proof of concept;
- whether tenant isolation, authorization, evidence integrity, approval, audit, or secrets are affected;
- a safe way to contact you for follow-up.

Do not access another tenant's data, degrade a live service, persist unauthorized access, or include real personal or regulated data in a report.

## Response and disclosure

Maintainers will acknowledge a complete report as soon as practical, validate and prioritize it, coordinate a remediation and release plan, and credit the reporter when requested and appropriate. Timelines depend on severity and project maturity; no fixed remediation SLA is promised during pre-release development.

Public disclosure should occur only after a fix or mitigation is available and affected users have had a reasonable opportunity to respond.
