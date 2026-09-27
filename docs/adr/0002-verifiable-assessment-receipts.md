# ADR-0002: Hash assessment answers and support signed score receipts

**Status:** Accepted

## Context

A commercial proficiency product must distinguish a browser-edited local score from a result produced by the server under a known rubric.

## Decision

For server-graded assessments:

1. compute SHA-256 over the submitted answer
2. record rubric version, blind/reveal state, duration, score, and dimensions
3. optionally HMAC-sign the receipt with `ASSESSMENT_SIGNING_SECRET`
4. persist the answer hash instead of requiring raw answer retention

## Why

This provides provenance and tamper evidence while minimizing unnecessary data retention.

## Limitations

HMAC receipts are not a substitute for authenticated identity. A truly verified credential also needs authentication, anti-replay controls, controlled assessment variants, and proctoring/behavioral safeguards appropriate to the claim being made.
