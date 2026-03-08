# Open Tasks

This document tracks larger Bayand follow-up work that is intentionally outside the initial rewrite baseline.

## 1. Accessibility Hardening

Priority: High

Goal:

- Make the app fully usable with keyboard-only and assistive technologies

Open work:

- audit landmarks, labels, and focus order
- trap focus correctly in overlays
- add keyboard calendar traversal expectations
- validate dark and light theme contrast on all supported platforms

## 2. Frontend Coverage Expansion

Priority: High

Goal:

- Raise confidence around the auth boundary and record-management flows

Open work:

- add direct tests for `PasswordCreation`, `PasswordPrompt`, `Calendar`, and overlay components
- add regression coverage for same-day multi-record behavior
- cover menu event handling and cleanup paths around lock/navigation

## 3. Session Lock Coverage

Priority: Medium

Goal:

- Validate that system lock events trigger the expected Bayand auto-lock behavior

Open work:

- isolate lock-trigger logic for easier tests
- verify that lock clears sensitive state and returns the app to a locked boundary

## 4. Internationalization

Priority: Medium

Goal:

- Introduce translations without changing Bayand’s local-only architecture

Open work:

- locale detection
- translation resource files
- menu and frontend string migration
- test coverage for fallback behavior

## 5. Release Pipeline Hardening

Priority: Medium

Goal:

- Increase confidence in the cross-platform release output

Open work:

- verify that renamed Bayand artifacts exist before draft release publication
- add clearer checksum and artifact reporting
- add installer smoke-test guidance for each platform

## 6. Diagram Verification Improvements

Priority: Medium

Goal:

- Make diagram verification stronger once tool versions are pinned consistently

Open work:

- pin Mermaid CLI and D2 versions across local and CI environments
- upgrade `diagrams:check` from existence checks to deterministic output checks

## 7. Future Product Evaluation

Priority: Low

Potential future work:

- internationalized onboarding copy
- additional explicit export formats
- broader statistics presentation
- mobile feasibility research

These are exploratory items, not commitments for Bayand v1.
