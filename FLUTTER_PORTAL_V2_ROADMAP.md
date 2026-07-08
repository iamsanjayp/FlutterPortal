# Flutter Portal v2 Roadmap

## Purpose

This roadmap turns the redesign brief into a phased delivery plan. It preserves the stable Levels 1A–1C path while replacing the obsolete UI screenshot workflow with an interactive Flutter Web execution model for Levels 2A+.

## Status Update

Completed artifacts:

- [FLUTTER_PORTAL_V2_PHASE_1_ARCHITECTURE_AUDIT.md](FLUTTER_PORTAL_V2_PHASE_1_ARCHITECTURE_AUDIT.md)
- [FLUTTER_PORTAL_V2_SRS.md](FLUTTER_PORTAL_V2_SRS.md)
- [FLUTTER_PORTAL_V2_MIGRATION_PLAN.md](FLUTTER_PORTAL_V2_MIGRATION_PLAN.md)
- [FLUTTER_PORTAL_V2_EXECUTION_ENGINE_SPEC.md](FLUTTER_PORTAL_V2_EXECUTION_ENGINE_SPEC.md)
- [FLUTTER_PORTAL_V2_MOCK_BACKEND_SPEC.md](FLUTTER_PORTAL_V2_MOCK_BACKEND_SPEC.md)
- [FLUTTER_PORTAL_V2_MOCK_DATABASE_SPEC.md](FLUTTER_PORTAL_V2_MOCK_DATABASE_SPEC.md)
- [FLUTTER_PORTAL_V2_STUDENT_PORTAL_SPEC.md](FLUTTER_PORTAL_V2_STUDENT_PORTAL_SPEC.md)
- [FLUTTER_PORTAL_V2_ADMIN_PORTAL_SPEC.md](FLUTTER_PORTAL_V2_ADMIN_PORTAL_SPEC.md)

Current implementation focus:

- Phase 4 execution engine hardening through the new backend service boundary in [backend/src/services/execution/flutterExecutionService.js](backend/src/services/execution/flutterExecutionService.js)

## Delivery Rules

- Do not rewrite working features without a technical reason.
- Keep Levels 1A–1C unchanged unless a bug forces a targeted fix.
- Treat the SRS as the source of truth after Phase 2.
- Complete and verify one phase before starting the next.
- Prefer parallel capability over disruptive replacement during migration.

## Phase Outline

### Phase 1 - Architecture Audit

Deliverable:

- Current-state architecture audit
- Verified control flow for backend, frontend, execution, and schema
- Stable-vs-rewrite boundary map

Status:

- Completed in [FLUTTER_PORTAL_V2_PHASE_1_ARCHITECTURE_AUDIT.md](FLUTTER_PORTAL_V2_PHASE_1_ARCHITECTURE_AUDIT.md)

### Phase 2 - SRS

Deliverable:

- Complete software requirements specification
- Functional and non-functional requirements
- Level-by-level behavior definitions
- Security, isolation, and scalability requirements
- Acceptance criteria for each major capability

### Phase 3 - Migration Plan

Deliverable:

- Incremental migration strategy
- Compatibility rules for existing levels
- Data migration and schema evolution plan
- Cutover and rollback strategy

### Phase 4 - Execution Engine

Deliverable:

- Isolated execution service design
- Docker lifecycle management
- Queueing, pooling, resource limits, and cleanup
- Execution session persistence

### Phase 5 - Interactive Flutter Web Preview

Deliverable:

- Live browser-based preview for student apps
- Console and runtime log capture
- Preview lifecycle for Run, Stop, and rerun flows

### Phase 6 - Mock Backend Engine

Deliverable:

- Challenge-owned mock REST endpoints
- Authentication simulation
- Static and dynamic response modeling
- Validation and error behavior configuration

### Phase 7 - Mock Database System

Deliverable:

- Resettable datasets for challenges
- Controlled CRUD and query behavior
- Support for SQLite-like or service-backed challenge data models

### Phase 8 - Student Portal Redesign

Deliverable:

- Modern IDE-like experience for Flutter only
- File explorer, editor, console, preview, execution status
- Run, Stop, Submit, and history flows

### Phase 9 - Admin Portal Redesign

Deliverable:

- Live preview review workflow
- Project explorer, console, network logs, execution logs
- Challenge management, mock backend builder, mock DB builder
- Student analytics and execution history

### Phase 10 - Security, Networking, and Lifecycle

Deliverable:

- Container isolation hardening
- Network restrictions and allowlists
- Timeout, CPU, RAM, and disk controls
- Cleanup guarantees and tenant isolation

### Phase 11 - Test Coverage

Deliverable:

- Unit, integration, and end-to-end tests
- Regression tests for stable levels
- Execution engine and preview verification
- Admin workflow coverage

### Phase 12 - Performance Optimization

Deliverable:

- Queue throughput tuning
- Container startup and caching optimization
- Frontend responsiveness improvements
- Horizontal scaling readiness

## Migration Guidance

The safest migration path is:

1. Keep the test-case pathway stable.
2. Build the new interactive execution stack in parallel.
3. Move Levels 2A+ onto the new stack only after Phase 5 is verified.
4. Migrate admin review and analytics after the student flow is stable.

## Notes For Future Work

- The current codebase already contains a partial UI grading path based on preview images.
- That path should be treated as transitional, not the target architecture.
- The interactive preview model should become the new default for all Flutter UI assessments.
