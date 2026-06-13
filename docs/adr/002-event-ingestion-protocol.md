# ADR-002: Event Ingestion Protocol (REP)

**Status:** Accepted
**Date:** 2026-06-13

## Context

SDKs running in diverse agent frameworks need a common language to report telemetry. We need a protocol that is framework-agnostic, versioned, and efficient for batched transmission.

## Decision

Define the **Rift Event Protocol (REP)** — a custom, JSON-based event format with a shared envelope and typed payloads.

### Key Properties

- **Versioned:** `version` field in every event envelope
- **Batched:** SDK sends up to 100 events per HTTP request
- **Async:** Ingest returns `202 Accepted` immediately
- **Typed:** Event types are a closed enum; payloads validated via Zod
- **Client-generated IDs:** UUID v7 for idempotency

### Transport

```
POST /v1/events
Authorization: Bearer rift_live_...
Content-Type: application/json

{ "events": [ EventEnvelope, ... ] }
```

### Not Using OpenTelemetry

REP is custom rather than OTLP (OpenTelemetry Protocol) because:

1. Agent-specific event types (reasoning chain, memory access, tool calls) don't map cleanly to OTel spans
2. LLM prompt/completion payloads are domain-specific
3. Simpler SDK integration — no OTel SDK dependency
4. Full control over schema evolution

OTel compatibility may be added later as an export format, not as the primary protocol.

## Rationale

- Custom protocol gives full control over agent-specific semantics
- JSON is debuggable and works everywhere (no protobuf dependency)
- Batching reduces HTTP overhead (agents can generate 10–50 events per run)
- Zod validation at ingest boundary catches SDK bugs early

## Consequences

- Every SDK adapter must map framework events to REP types
- Schema changes require version bumps and migration logic
- `packages/observability-types` is the single source of truth for schemas
- Ingest API and worker depend on this package

## Alternatives Considered

| Alternative | Why Rejected |
|------------|--------------|
| OpenTelemetry (OTLP) | Poor fit for agent-specific events; heavy SDK |
| Apache Kafka schema registry | Over-engineered for Phase 1 |
| Plain unstructured logs | No schema validation; hard to query |
| gRPC streaming | Harder SDK integration; JSON is sufficient |
