# PHILOSOPHY.md

Bayand exists to be a small, trustworthy, local-only health tracker.

## Core Principles

### 1. Local-Only By Default

Bayand should work fully offline. No telemetry, no sync, no background network activity, no cloud dependency.

### 2. Boring Security

Use established cryptography and conservative boundaries:

- Argon2 for password-derived key material
- AES-256-GCM for encrypted record payloads
- zeroization where sensitive material is held in memory

No custom cryptography, no recovery backdoors, no misleading security claims.

### 3. Narrow Scope

Bayand v1 is intentionally limited:

- one tracker
- password-only unlock
- multiple health records per day
- structured health logging
- JSON export

Features outside that boundary should usually be rejected rather than carried as dormant complexity.

### 4. Privacy Over Convenience

Health data should stay encrypted at rest and local to the device. Plaintext is acceptable only when the user explicitly exports JSON or copies content themselves.

### 5. Simple Architecture

Prefer direct, explicit code over donor-era compatibility layers or future-proof abstractions that add complexity now. A smaller codebase is easier to audit, test, and keep secure.

### 6. Documentation Must Match Reality

Bayand is security-sensitive software. Contributor docs, user docs, diagrams, workflows, and code comments must describe the system that actually ships, not a historical ancestor.

## Product Guardrails

Do not add these to Bayand v1:

- multiple journals or tracker switching
- key-file auth
- plugins or scripting
- imports
- search
- markdown or PDF export
- attachments or embedded media
- network-backed features

## Decision Test

Before adding a feature or refactor, ask:

1. Does it strengthen Bayand’s core health-tracking workflow?
2. Does it preserve the local-only encrypted model?
3. Does it keep the codebase simpler or safer?
4. Does the documentation stay accurate after the change?

If the answer is no, the change probably does not belong.
