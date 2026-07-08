# Flutter Portal v2 Student Portal Specification

## 1. Purpose

The student portal shall provide a focused Flutter-only workspace for assessment tasks. It shall feel closer to a lightweight IDE than a form-driven submission page.

## 2. Core Layout

The student portal shall include:

- navigation header
- project or challenge summary
- file explorer
- code editor
- console output panel
- live preview panel
- execution controls
- submission controls
- status and history area

## 3. Student Requirements

SP-1. The portal shall allow students to edit only the challenge-scoped Flutter project.

SP-2. The portal shall allow students to run the app in an isolated execution environment.

SP-3. The portal shall allow students to stop an active run.

SP-4. The portal shall show execution status clearly.

SP-5. The portal shall show console logs in near real time.

SP-6. The portal shall show a live preview that behaves like a normal Flutter application.

SP-7. The portal shall show task-specific instructions and scoring guidance.

SP-8. The portal shall preserve stable Level 1A-1C behavior when those levels are launched.

## 4. UX Requirements

- Desktop-first layout
- Strong visual hierarchy
- Clear run/stop/submit actions
- Minimal confusion between code, logs, and preview
- Professional educational tone

## 5. State Requirements

The portal shall track:

- active session identifier
- selected file
- unsaved edits
- current execution state
- latest preview state
- current console output
- submission result

## 6. Verification Criteria

The student portal is acceptable when:

1. Students can locate code, logs, and preview without ambiguity.
2. Run and stop actions behave predictably.
3. The portal remains usable while the preview is running.
4. Existing stable levels still work.
