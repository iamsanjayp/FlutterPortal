# Flutter Portal v2 Software Requirements Specification

## 1. Purpose

This specification defines the target requirements for Flutter Portal v2. It preserves the stable Levels 1A-1C test-case system and replaces the obsolete UI screenshot workflow with a production-grade interactive Flutter assessment platform from Level 2A onward.

## 2. Scope

### In scope

- Student authentication and session-gated access
- Level-based assessment delivery
- Flutter-only student projects
- Interactive Flutter Web execution for UI-oriented levels
- Mock backend services for controlled challenge APIs
- Mock database services for controlled challenge data
- Execution isolation, queueing, and lifecycle management
- Student portal redesign
- Admin portal redesign
- Submission review, grading, feedback, and analytics
- Audit logging and operational observability

### Out of scope

- General-purpose online IDE support for arbitrary languages
- Student-built backend servers
- Direct access to real production databases by students
- AI-generated code completion as a required runtime dependency
- Browser-based editing of backend infrastructure

## 3. Business Goals

- Deliver a scalable educational assessment platform for Flutter
- Preserve backward compatibility for Levels 1A-1C
- Replace screenshot-based evaluation with live interactive execution
- Allow teachers to define controlled APIs and datasets per challenge
- Support hundreds of concurrent student sessions safely
- Make admin review practical for real classes and cohorts

## 4. User Roles

### Student

- Starts a scheduled assessment session
- Edits Flutter code in a dedicated workspace
- Runs the app in an isolated execution environment
- Interacts with the app in a live browser preview
- Views console logs, network activity, and execution status
- Submits work for automated and/or manual grading

### Teacher / Admin

- Creates and manages courses, levels, problems, and schedules
- Defines challenge requirements and allowed resources
- Configures mock APIs and mock databases for assessments
- Reviews live previews, logs, and submission history
- Grades submissions and leaves feedback
- Monitors student progress and execution performance

### System Operator

- Oversees deployments, container health, and resource usage
- Validates security isolation and cleanup behavior
- Manages scaling, queue backlogs, and failure recovery

## 5. Product Principles

- Preserve stable functionality unless a redesign is required
- Keep Flutter assessment behavior predictable and curriculum-driven
- Prefer explicit domain services over ad hoc controller logic
- Keep execution isolated, ephemeral, and auditable
- Treat the mock backend and mock database as portal-owned test fixtures

## 6. Functional Requirements

### 6.1 Authentication and Access Control

FR-1. The system shall authenticate users via the portal identity system.

FR-2. The system shall restrict assessments to active schedules and registered users.

FR-3. The system shall enforce role-based access for student, teacher, and admin functions.

FR-4. The system shall preserve the current login and schedule-gated behavior for existing stable flows.

### 6.2 Level Model

FR-5. The system shall support level-specific assessment types and configuration.

FR-6. Levels 1A-1C shall continue to use test-case-based Dart execution.

FR-7. Levels 2A+ shall use interactive Flutter assessment flows.

FR-8. Each level shall define duration, pass threshold, question count or task count, and resource rules.

FR-9. The system shall permit future levels to use different execution modes without changing student-facing routing.

### 6.3 Student Workspace

FR-10. The student portal shall provide a file explorer, code editor, console, execution status, and preview panel.

FR-11. The student shall be able to run, stop, and submit the current project.

FR-12. The student shall be able to work only within the challenge-scoped Flutter project.

FR-13. The portal shall persist session-scoped project state only as required by the assessment model.

FR-14. The portal shall present errors and run results in a professional, actionable format.

### 6.4 Interactive Execution

FR-15. The system shall build Flutter Web for interactive UI-oriented levels.

FR-16. The system shall launch each run inside a fresh isolated Docker container.

FR-17. The system shall expose a temporary local web server or equivalent preview endpoint for the running app.

FR-18. The system shall capture console output from the running app.

FR-19. The system shall capture network requests made by the app to portal-owned endpoints and mock services.

FR-20. The system shall destroy execution containers automatically after completion or timeout.

FR-21. The system shall not generate or store screenshot artifacts as the primary result of UI assessments.

### 6.5 Mock Backend

FR-22. The system shall allow each challenge to define one or more REST endpoints.

FR-23. The system shall support static JSON responses, dynamic responses, validation rules, and error responses.

FR-24. The system shall support authentication-like mock flows where required by a challenge.

FR-25. The system shall allow rate limits and failure cases to be configured per challenge.

FR-26. The mock backend shall be owned by the portal and not by the student project.

### 6.6 Mock Database

FR-27. The system shall support configurable datasets for challenge scenarios.

FR-28. The system shall reset challenge datasets after each execution or on defined lifecycle boundaries.

FR-29. The system shall expose controlled data access only through challenge-owned services.

FR-30. The system shall support common educational data models such as users, products, orders, todos, messages, inventory, appointments, and collections.

### 6.7 Submission and Grading

FR-31. The system shall store submissions, execution logs, preview state, and grading outcomes.

FR-32. The system shall support automated grading where the challenge defines deterministic criteria.

FR-33. The system shall support manual grading for rubric-based review.

FR-34. The system shall support mixed grading models when a level requires both automated and manual assessment.

FR-35. The system shall retain execution history for admin review and audit purposes.

### 6.8 Admin Portal

FR-36. The admin portal shall display submission lists, project state, console logs, and network requests.

FR-37. The admin portal shall support re-running submissions in controlled environments.

FR-38. The admin portal shall support challenge management, mock API configuration, and mock database configuration.

FR-39. The admin portal shall provide student analytics, progress tracking, and execution history.

FR-40. The admin portal shall provide approve, reject, and feedback workflows.

## 7. Non-Functional Requirements

### 7.1 Security

NFR-1. Each execution shall run in an isolated Docker container.

NFR-2. Containers shall use CPU, RAM, disk, and timeout limits.

NFR-3. System directories shall be read-only inside student execution contexts.

NFR-4. Arbitrary outbound internet access shall be blocked.

NFR-5. Only portal-owned services and challenge-defined mock services shall be reachable.

NFR-6. Execution cleanup shall be reliable even on failure or timeout.

### 7.2 Scalability

NFR-7. The execution layer shall support queued runs under load.

NFR-8. The architecture shall support horizontal scaling of execution workers.

NFR-9. The design shall permit future Kubernetes deployment.

NFR-10. The portal shall avoid shared mutable state across student executions.

### 7.3 Reliability

NFR-11. Failed runs shall return actionable diagnostics.

NFR-12. The system shall avoid cross-student interference.

NFR-13. The system shall retain enough metadata to reproduce grading decisions.

### 7.4 Maintainability

NFR-14. The codebase shall use modular domain boundaries for execution, preview, mock backend, mock database, grading, and admin review.

NFR-15. New level types shall be addable without rewriting existing stable paths.

NFR-16. Public APIs shall be versioned.

### 7.5 Usability

NFR-17. The UI shall be desktop-first but responsive.

NFR-18. Student and admin workflows shall be intentionally structured and easy to navigate.

NFR-19. Errors shall be explained in plain, actionable language.

## 8. Domain Model

The system shall model at minimum the following core concepts:

- Users
- Roles
- Courses
- Levels
- Challenges / Problems
- Challenge resources
- Mock APIs
- Mock database definitions
- Execution sessions
- Student workspace files
- Submissions
- Reviews
- Progress records
- XP and achievements
- Audit logs

## 9. API Requirements

### 9.1 Versioning

APIs shall be versioned, with a stable public contract for student and admin clients.

### 9.2 Student APIs

The system shall expose APIs for:

- starting and finishing assessment sessions
- fetching challenge metadata
- running code
- stopping execution
- submitting work
- retrieving logs and preview state

### 9.3 Admin APIs

The system shall expose APIs for:

- managing levels, problems, and schedules
- configuring mock APIs and mock databases
- listing execution sessions and submissions
- reviewing logs, network traces, and submission history
- grading and feedback workflows

### 9.4 Documentation

Each public endpoint shall be documented with purpose, request shape, response shape, and authorization requirements.

## 10. Data Requirements

### 10.1 Persistence

The database shall store:

- user identity and role information
- course and level definitions
- challenge definitions and resources
- execution session metadata
- submission records and grades
- review data and feedback
- audit history
- progress, XP, and achievement state

### 10.2 Migration Rules

- Preserve stable data for Levels 1A-1C.
- Avoid destructive schema changes when a backward-compatible migration is possible.
- Introduce new tables or columns for the interactive execution path rather than overloading the screenshot-based one.

## 11. Acceptance Criteria

The redesign shall be considered acceptable when:

1. Levels 1A-1C continue to function without regression.
2. Levels 2A+ run as interactive Flutter Web applications, not screenshot generators.
3. Students can use Run, Stop, and Submit reliably.
4. Admins can review live previews, logs, and network behavior.
5. Mock backend and mock database behavior is configurable per challenge.
6. Container isolation and cleanup are demonstrably enforced.
7. The platform scales to multiple concurrent sessions without cross-session leakage.

## 12. Traceability To Current State

The current repository already contains:

- a stable test-case path for Levels 1A-1C
- a Docker-based Flutter execution harness
- a preview-image workflow for UI-oriented levels
- admin manual grading paths

The v2 redesign shall replace the preview-image workflow while preserving the stable path and as much of the existing portal structure as practical.

## 13. Open Questions For Design Phase

- Should the interactive preview be embedded in the portal UI or opened in a dedicated preview surface?
- Should the mock backend be implemented as isolated services, request interceptors, or both?
- What is the minimal persistent state needed for resuming in-progress work?
- Which events must be retained in audit logs versus transient execution logs?
- How should future automated widget tests coexist with live browser previews?
