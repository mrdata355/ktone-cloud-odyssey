# ADR-0001: Separate append-only learning events from proficiency snapshots

**Status:** Accepted

## Context

Cloud Odyssey needs both historical evidence and fast access to current proficiency. Updating one mutable progress JSON object loses lineage and makes debugging corrections difficult.

## Decision

Store immutable learning events in `odyssey_learning_events` and store current/periodic proficiency as separately versioned snapshots in `odyssey_proficiency_snapshots`.

## Why

The event ledger answers **what happened**. The snapshot answers **what is the current projection**. Separating them allows replay, audit, correction, retention analysis, and faster current-state reads.

## Rejected alternative

A single mutable user-progress row is simpler initially but destroys useful lineage and makes concurrent updates, debugging, and historical proficiency analysis harder.

## Consequences

- write volume is higher than a single mutable row
- projection logic must be versioned
- retention/archival policy will eventually be required
- debugging and auditability improve substantially
