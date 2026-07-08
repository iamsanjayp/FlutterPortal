# Flutter Portal v2 Migration Plan

## 1. Objective

This plan converts the v2 SRS into a safe implementation sequence. The guiding principle is to keep the stable Levels 1A-1C pathway intact while building the new interactive Flutter assessment stack alongside the current system until it is verified.

## 2. Migration Strategy

### 2.1 Parallel capability first

The new interactive execution platform shall be introduced as a parallel capability rather than a destructive rewrite.

### 2.2 Stable path protection

Levels 1A-1C shall continue to use the existing test-case execution flow until the new stack has no dependency on it.

### 2.3 Incremental cutover

Levels 2A+ shall move to the new architecture only after the execution engine, preview surface, and mock service model are individually verified.

### 2.4 Compatibility boundary

Old screenshot-based artifacts may remain readable during transition, but they shall not be the target architecture.

## 3. Workstream Order

### Workstream A - Foundation and Domain Boundaries

Deliverables:

- Execution service boundary
- Preview service boundary
- Mock backend boundary
- Mock database boundary
- Submission and review domain services

Implementation notes:

- Introduce service modules without rewriting existing controllers wholesale.
- Move orchestration logic out of controller code where possible.
- Keep current APIs functioning during refactoring.

### Workstream B - Execution Engine

Deliverables:

- Fresh Docker container per run
- Flutter Web build and serve pipeline
- Runtime console capture
- Network capture for allowed services
- Timeout, CPU, RAM, and disk enforcement
- Deterministic cleanup

Migration notes:

- Start by implementing the engine behind a new internal interface.
- Keep the current execution entrypoints as adapters until the new engine is stable.

### Workstream C - Interactive Preview

Deliverables:

- Embedded or dedicated browser preview surface
- Run, stop, refresh, and rerun controls
- Live logs and runtime status
- No screenshot dependency for normal operation

Migration notes:

- Preserve current UI level routing until the new preview surface is proven.
- Keep preview transport stateless from the student perspective.

### Workstream D - Mock Backend

Deliverables:

- Configurable REST endpoint definitions
- Static and dynamic payloads
- Validation and error rules
- Optional auth-like flows and rate limits

Migration notes:

- Model mock endpoints as challenge metadata first.
- Add execution-time wiring after the metadata format is stable.

### Workstream E - Mock Database

Deliverables:

- Resettable challenge datasets
- Controlled query or service access
- Dataset lifecycle tied to execution sessions

Migration notes:

- Prefer deterministic resets over shared mutable state.
- Treat the mock database as portal-owned, not student-owned.

### Workstream F - Student Portal

Deliverables:

- IDE-style layout
- File explorer and editor
- Console output
- Preview panel
- Execution status and history

Migration notes:

- Keep the existing student dashboard and auth structure where possible.
- Introduce the new UI as a new route or level-aware view rather than replacing everything at once.

### Workstream G - Admin Portal

Deliverables:

- Submission explorer
- Live preview review
- Console and network log inspection
- Challenge builder
- Mock API and mock DB builders
- Execution analytics

Migration notes:

- Replace the screenshot review focus with execution-focused review.
- Keep grading history and moderation workflows compatible with old records.

### Workstream H - Security and Isolation

Deliverables:

- Container hardening
- Network restrictions
- Resource quotas
- Cleanup guarantees
- Tenant isolation checks

Migration notes:

- Make security gates part of the execution service contract.
- Verify isolation before expanding concurrent load.

## 4. Schema Evolution Plan

### 4.1 Preserve existing tables

Keep the current stable data structures for users, schedules, sessions, and Levels 1A-1C intact.

### 4.2 Add new domain tables or columns

Introduce new persistence structures for:

- execution sessions
- preview session metadata
- mock backend definitions
- mock database definitions
- network traces
- execution logs
- workspace file state, if persistence is required

### 4.3 Avoid destructive changes

Do not remove screenshot-related columns until the new flow is fully deployed and historical review no longer needs them.

### 4.4 Migration safety

Any schema change shall be reversible or at least backward-compatible during the migration window.

## 5. API Migration Plan

### 5.1 Versioned endpoints

Add new versioned endpoints for the interactive stack instead of changing stable contracts in place.

### 5.2 Adapter pattern

Where practical, keep current student and admin APIs as thin adapters while backend services move underneath.

### 5.3 Contract verification

Document request and response shapes before switching frontend behavior to the new endpoints.

## 6. Frontend Migration Plan

### 6.1 Student portal

- Add the IDE-style experience behind level-based or feature-flagged routing.
- Preserve existing login, dashboard, and stable test-case routes.
- Introduce console and preview surfaces only after the backend contract is ready.

### 6.2 Admin portal

- Replace image-centric review views with execution-centric review views.
- Keep existing administrative navigation and permissions.
- Introduce challenge builders and review tools incrementally.

## 7. Testing Plan

### 7.1 Required gates

Each workstream shall have a focused verification step before the next one starts.

### 7.2 Regression coverage

- Verify Levels 1A-1C after every execution-layer change.
- Verify that session gating and scheduling still work.
- Verify that submission history remains consistent.

### 7.3 New capability coverage

- Verify live preview start/stop/reconnect behavior.
- Verify mock backend responses and validation.
- Verify mock database resets and isolation.
- Verify admin review of logs and network traces.

## 8. Rollout Phases

### Phase A - Internal build only

- Implement the new services behind internal interfaces.
- Keep user-facing behavior unchanged.

### Phase B - Controlled beta for Levels 2A+

- Route a limited set of UI levels to the new stack.
- Collect operational feedback and repair defects.

### Phase C - Broader rollout

- Expand the new stack to all UI-oriented levels.
- Keep stable test-case levels unchanged.

### Phase D - Cleanup

- Retire obsolete screenshot assumptions.
- Keep historical data and review records intact.

## 9. Rollback Strategy

Rollback shall be possible at the level of routing and service selection.

- If interactive preview fails, route the affected level back to the stable path where feasible.
- Keep the current preview-image workflow available during transition if it is needed for emergency continuity.
- Do not delete legacy data until the new workflow has been operational for a verified period.

## 10. Acceptance Criteria For Migration Completion

The migration shall be considered complete when:

1. Levels 1A-1C are unchanged in behavior and remain green in regression checks.
2. Levels 2A+ use the new interactive stack in production-like runs.
3. Admins can review execution logs, network activity, and live previews.
4. Mock backend and mock database challenges can be configured without code changes to the student project.
5. Security isolation, cleanup, and resource limits are verified under load.

## 11. Immediate Next Implementation Decision

Build the execution service boundary first. Every later phase depends on having a single place that owns container lifecycle, preview startup, logs, and cleanup.
