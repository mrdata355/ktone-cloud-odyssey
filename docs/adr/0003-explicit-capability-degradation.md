# ADR-0003: Keep stateless services available when persistence is unavailable

**Status:** Accepted

## Context

A missing database secret or transient Postgres failure should not make every learning interaction fail, but the system must not pretend durable writes succeeded.

## Decision

Health, capability discovery, grading, recommendations, and read-only smoke diagnostics remain available without Postgres.

Event writes, progress synchronization, and evidence persistence return an explicit capability error when durable storage is unavailable.

## Why

This creates honest failure semantics and keeps useful functionality available without creating phantom durability.

## Rejected alternative

Silently falling back to local-only writes from a server persistence API would make the UI appear healthy while losing durable state.
