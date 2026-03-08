# Security Policy

Bayand is a local-only desktop health tracker. Security work is taken seriously, but there are no enterprise SLAs or guaranteed response times.

## Supported Versions

Only the latest Bayand release line is supported for security fixes.

## Reporting Vulnerabilities

Do not open a public issue for a suspected security problem.

Report privately through:

- GitHub Security Advisories: `https://github.com/fjrevoredo/bayand/security/advisories/new`
- Email if a private contact address is listed on the maintainer profile

Include:

- affected version
- operating system
- reproduction steps
- impact assessment
- whether health data confidentiality, integrity, or availability is affected

## Threat Model

Bayand is designed to protect persisted health data if an attacker gets a copy of the local app data directory, including `bayand.db` and backup files.

### Protected against

- Offline file access to `bayand.db` and rotated backups
- Password guessing slowed by Argon2-derived wrapping key material
- Direct disclosure of health-record content from raw SQLite inspection
- Residual in-memory secrets after explicit lock, because unlocked state is dropped and sensitive buffers are cleared where implemented

### Not protected against

- A compromised or already-unlocked local session
- Keyloggers, screen capture malware, or hostile software running as the same user
- Weak user-chosen passwords against determined offline attackers
- Manual JSON exports, which are intentionally plaintext files

## Cryptographic Model

- Bayand generates a random master key when the tracker is created.
- The password derives wrapping key material with Argon2.
- The wrapped master key is stored in the `auth` table.
- Record payloads are encrypted with AES-256-GCM.
- Record `date` values remain plaintext for calendar navigation; structured record content remains inside the encrypted payload blob.

Bayand v1 is password-only. It does not support key files, multiple auth slots, journal switching, plugins, importers, or search.

## Operational Security

- No runtime network activity
- No analytics or telemetry
- Local preferences stored in `localStorage`
- Health records stored locally in `bayand.db`
- Backups stored locally under `backups/`
- Plaintext health data written to disk only when the user explicitly exports JSON

## Security Limitations

- Bayand cannot protect data shown on screen while unlocked.
- Bayand has no password recovery path.
- Exported JSON files are outside the encrypted-at-rest boundary and must be handled carefully.
