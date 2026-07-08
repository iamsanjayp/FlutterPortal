# Flutter Portal v2 - Phase 1 Architecture Audit

## Scope

This document captures the current production architecture of the FlutterPortal codebase before any v2 redesign work begins. It is limited to verified behavior in the current repository and separates stable functionality from the UI assessment path that must be redesigned.

## Verified Current Architecture

### Top-level system shape

The portal is a three-part system:

1. A Node/Express backend under [backend/src](backend/src)
2. A React frontend under [frontend/frontend/src](frontend/frontend/src)
3. A MySQL-backed persistence layer defined in the SQL dump files under [current_sql_dump](current_sql_dump)

The backend is the controlling layer for authentication, scheduling, test orchestration, submissions, grading, and admin review.

### Backend request flow

The backend starts in [backend/src/server.js](backend/src/server.js) and configures the Express app in [backend/src/app.js](backend/src/app.js). The main route surfaces are:

- `/auth` for login and session management
- `/api/test` for starting, fetching, and finishing sessions
- `/api/execute` for code execution and UI preview/submission
- `/api/admin` for metrics, submissions, levels, problems, users, and grading

The app currently uses helmet, CORS, cookies, passport initialization, a global rate limiter, and audit logging.

### Execution model

The current execution engine lives in [backend/src/execution/flutter/runFlutter.js](backend/src/execution/flutter/runFlutter.js).

Observed behavior:

- Student code is copied into a per-run working directory
- A Docker container named `flutter-runner` is started for each execution
- Test-case levels run `flutter test` and parse JSON test output
- UI levels also run Flutter in Docker, but the current flow still writes a PNG preview to disk and returns a preview URL
- Preview files are stored under `uploads/ui_previews`
- Temporary work directories and containers are cleaned up after execution

This means the current system is still image-artifact based for UI assessment, not a live browser preview environment.

### Level model

Level configuration is resolved in [backend/src/utils/level.js](backend/src/utils/level.js).

Current behavior:

- `1A` resolves to `TEST_CASE`
- Other levels fall back to `UI_COMPARE` when no DB row exists
- The levels table overrides the fallback when present

The SQL dump shows the current level split as:

- `1A`, `1B`, `1C` as `TEST_CASE`
- `2A`, `2B`, `2C` as `UI_COMPARE`
- `3A`, `3B`, `3C` as `TEST_CASE`

That means the database currently does not yet match the full future curriculum described in the redesign brief.

### Current UI assessment path

UI assessment is handled in [backend/src/controllers/execute.controller.js](backend/src/controllers/execute.controller.js) and [backend/src/controllers/admin.controller.js](backend/src/controllers/admin.controller.js).

Observed behavior:

- `POST /api/execute/flutter/ui-preview` renders student Flutter code in Docker and returns a preview image URL
- `POST /api/execute/flutter/ui-submit` renders the UI again, stores a preview image, computes a code-based score, and creates a submission with status `AWAITING_MANUAL`
- Admin review is exposed at `GET /api/admin/submissions/ui` and `POST /api/admin/submissions/:id/manual-grade`
- Manual grading combines the automated score and manual score into a final score and updates submission status

The current admin workflow still depends on preview images and manual review of rendered output.

### Frontend structure

The React frontend already splits student and admin concerns:

- [frontend/frontend/src/pages/TestPage.jsx](frontend/frontend/src/pages/TestPage.jsx) for test-case execution
- [frontend/frontend/src/pages/UITestPage.jsx](frontend/frontend/src/pages/UITestPage.jsx) for UI assessment
- [frontend/frontend/src/pages/admin/AdminLayout.jsx](frontend/frontend/src/pages/admin/AdminLayout.jsx) for admin navigation
- [frontend/frontend/src/pages/admin/AdminManualGrading.jsx](frontend/frontend/src/pages/admin/AdminManualGrading.jsx) for UI review

Routing in [frontend/frontend/src/App.jsx](frontend/frontend/src/App.jsx) already selects the UI page when the assessment type is `UI_COMPARE`.

### Data model

The current SQL dump files show the core schema around:

- `users`
- `levels`
- `problems`
- `test_sessions`
- `test_session_questions`
- `test_cases`
- `test_case_results`
- `test_session_submissions`
- `test_schedules`
- `test_schedule_registrations`

Key verified columns relevant to the redesign:

- `problems.reference_image_url`
- `problems.ui_required_widgets`
- `problems.resource_urls`
- `test_session_submissions.preview_image_url`
- `test_session_submissions.score`
- `test_session_submissions.match_percent`
- `test_session_submissions.manual_score`
- `test_session_submissions.manual_feedback`
- `test_session_submissions.final_score`
- `test_sessions.status` includes `AWAITING_MANUAL`

The schema is already partly adapted for manual UI grading, but it still encodes the obsolete preview-image workflow.

## Stable Functionality That Should Not Be Redesigned

These areas should be preserved unless a bug forces a targeted fix:

- Levels 1A–1C test-case execution
- Auth, scheduling, session gating, and role-based routing
- Core admin dashboards, user management, problem management, and scheduling
- Docker isolation for code execution
- Submission persistence and review history

## What Must Change for v2

The redesign goal is not to improve the current screenshot workflow. It is to replace it.

The following must be re-architected for Levels 2A+:

- Replace image preview generation with interactive Flutter Web execution
- Replace preview-image review with live preview, console, and network inspection
- Replace UI submission scoring based on screenshots or preview artifacts
- Introduce an execution service that owns container lifecycle, isolation, and cleanup
- Add mock backend and mock database support for controlled challenge environments
- Expand the admin workflow to review execution traces, not static images

## Risks And Constraints

1. The current UI path is tightly coupled to Dockerized Flutter rendering and preview-image persistence.
2. The current level model does not fully align with the future curriculum levels described in the redesign brief.
3. The frontend already contains operational UI review pages, so v2 should avoid breaking them until a replacement path is ready.
4. The backend relies on direct SQL queries rather than a repository/service boundary, so the v2 migration should introduce clearer domain modules rather than rewriting everything at once.

## Recommended Next Phase

Phase 2 should produce a source-of-truth SRS that defines:

- the new execution lifecycle
- the student workspace model
- mock backend and mock database behavior
- level-by-level assessment rules
- admin review workflow
- security and isolation requirements
- backward-compatibility rules for Levels 1A–1C

## Implementation Principle For The Redesign

Keep the existing stable path intact, introduce the new interactive execution stack as a parallel capability, and migrate only the UI assessment levels once the new stack is verified.
