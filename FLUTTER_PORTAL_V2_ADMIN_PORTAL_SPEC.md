# Flutter Portal v2 Admin Portal Specification

## 1. Purpose

The admin portal shall replace screenshot review with execution-aware review workflows. It shall help teachers inspect student code, logs, network behavior, and live output.

## 2. Core Views

The admin portal shall include views for:

- submissions
- live preview review
- project explorer
- console logs
- network requests
- execution logs
- challenge management
- mock API builder
- mock database builder
- student analytics
- execution history

## 3. Admin Requirements

AP-1. The admin portal shall list submissions with search and filtering.

AP-2. The admin portal shall show live preview state for each submission.

AP-3. The admin portal shall show console logs and execution traces.

AP-4. The admin portal shall show network requests made by the student app.

AP-5. The admin portal shall support rerunning a submission in a controlled environment.

AP-6. The admin portal shall allow approval, rejection, and feedback.

AP-7. The admin portal shall support challenge authoring and configuration.

AP-8. The admin portal shall preserve access to existing stable review workflows until the new paths are ready.

## 4. Operational Requirements

- Fast filtering and drill-down
- Clear difference between automated and manual evaluation data
- Historical record retention
- Audit-friendly actions for grading and challenge changes

## 5. Verification Criteria

The admin portal is acceptable when:

1. Teachers can review a submission without relying on screenshots.
2. Logs and network traces are easy to inspect.
3. Approval and feedback workflows remain straightforward.
4. Historical records are retained for audit purposes.
