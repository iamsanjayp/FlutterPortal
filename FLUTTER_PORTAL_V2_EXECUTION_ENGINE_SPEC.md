# Flutter Portal v2 Execution Engine Specification

## 1. Goal

The execution engine shall own the lifecycle of Flutter assessment runs for Levels 2A+. It shall replace the obsolete screenshot-centric UI workflow with an interactive, containerized execution model that supports preview, console output, network tracing, and cleanup.

## 2. Current Boundary

The backend now routes execution through a dedicated service boundary in [backend/src/services/execution/flutterExecutionService.js](backend/src/services/execution/flutterExecutionService.js). That service currently delegates to the existing Docker runner, which makes it the correct insertion point for the new engine.

## 3. Core Responsibilities

The execution engine shall:

- create a fresh isolated container per execution session
- build and serve the student Flutter Web application
- expose a temporary preview endpoint
- capture console output
- capture allowed network traffic
- enforce CPU, memory, disk, and timeout limits
- clean up all ephemeral resources after completion
- return a normalized result object to the controller layer

## 4. Non-Goals

The execution engine shall not:

- allow students to build backend servers
- expose arbitrary internet access
- rely on screenshots as the primary assessment artifact
- persist transient container state beyond the execution window

## 5. Execution Modes

### 5.1 Test-case mode

Used by Levels 1A-1C. This mode remains stable and continues to run Flutter tests against student code.

### 5.2 Interactive preview mode

Used by Levels 2A+. This mode builds Flutter Web, launches a browser-accessible preview, and streams interaction data back to the portal.

### 5.3 Mock service mode

Used when a challenge defines portal-owned REST endpoints or datasets. The engine shall attach the execution container to those services only.

## 6. Required Service Contract

The execution service shall support at least the following operations:

- run test-case execution
- run interactive preview execution
- run interactive submission execution
- stop an active execution
- fetch execution logs
- fetch network activity
- fetch preview session metadata

The service contract shall return a normalized payload containing:

- status
- execution time
- preview endpoint or preview state
- console logs
- network logs
- error details, if any
- cleanup outcome

## 7. Container Lifecycle

### 7.1 Launch

Each execution shall start from a clean container image or container pool entry.

### 7.2 Work directory

The student project shall be copied into an isolated workspace inside the container. No bind mount shall be required for the default path.

### 7.3 Serve

The engine shall start a temporary local web server or equivalent preview host inside the container.

### 7.4 Observe

The engine shall watch the preview process, runtime logs, and network behavior until completion or timeout.

### 7.5 Cleanup

The engine shall always terminate the container and delete transient workspaces.

## 8. Resource Limits

The engine shall support configurable limits for:

- CPU
- memory
- temporary disk usage
- execution timeout
- network access rules

## 9. Queueing Model

The engine shall support queued runs so that concurrent student activity does not exhaust infrastructure.

Requirements:

- queue entries must be identifiable per user and per session
- queue status must be queryable
- canceled or expired jobs must be removed safely
- queue processing must be horizontally scalable

## 10. Result Model

The execution engine shall normalize results into a single shape that can be consumed by student and admin clients.

Required fields:

- run identifier
- session identifier
- problem identifier
- status
- execution duration
- console output
- network output
- preview URL or preview session token
- automated score, if applicable
- cleanup status
- raw diagnostics for operators

## 11. Logging Requirements

The engine shall emit structured logs for:

- job creation
- container startup
- build start and end
- preview startup
- preview termination
- network events
- timeout events
- cleanup success or failure

Logs must be suitable for admin troubleshooting and future observability integration.

## 12. Security Requirements

The engine shall:

- restrict network access to portal-owned or challenge-owned services
- use read-only host access where possible
- avoid secrets leakage into the student workspace
- sanitize file names and container names
- prevent cross-session workspace reuse

## 13. Preview Requirements

The preview surface shall:

- render the live Flutter Web app
- support interaction like a normal Flutter application
- surface runtime console output
- allow future network and accessibility tooling to attach

The preview surface shall not depend on image snapshots for standard operation.

## 14. Backward Compatibility

The new engine shall coexist with the current test-case path. Existing test-case behavior shall remain available while the interactive stack is introduced.

## 15. Implementation Sequence

1. Finalize the execution service contract.
2. Implement job lifecycle management behind the service boundary.
3. Add queue management and resource enforcement.
4. Add preview startup and runtime log capture.
5. Add network logging and mock service attachment.
6. Migrate UI-oriented levels onto the new engine.
