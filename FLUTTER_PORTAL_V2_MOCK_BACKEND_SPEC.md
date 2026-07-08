# Flutter Portal v2 Mock Backend Specification

## 1. Purpose

The mock backend shall provide challenge-owned HTTP behavior for Flutter assessments. It allows students to interact with realistic APIs without exposing real backend systems or external internet access.

## 2. Scope

The mock backend shall support:

- REST endpoints
- JSON responses
- authentication-like flows
- CRUD-style operations
- validation rules
- configurable errors
- rate limits
- static and dynamic payloads

## 3. Requirements

MB-1. The mock backend shall be owned and configured by the portal, not by the student project.

MB-2. The mock backend shall be defined per challenge.

MB-3. The mock backend shall expose only challenge-approved routes.

MB-4. The mock backend shall support request validation and failure cases.

MB-5. The mock backend shall support deterministic responses for grading.

MB-6. The mock backend shall support stateful behaviors when a challenge requires them.

MB-7. The mock backend shall support stateless behaviors when a challenge only needs fixed JSON.

MB-8. The mock backend shall be isolated from the public internet.

MB-9. The mock backend shall be resettable between sessions or runs.

## 4. Challenge Definition Model

Each challenge may define:

- route path
- HTTP method
- request schema
- response schema
- response variants
- status codes
- auth requirements
- rate limits
- dataset dependencies
- error conditions

## 5. Runtime Behavior

The execution engine shall mount or attach to the mock backend using portal-owned network routes.

The student app shall see the mock backend as a normal REST endpoint from inside the allowed execution environment.

## 6. Administration

The admin portal shall allow teachers to:

- create and edit mock endpoints
- configure example payloads
- define validation rules
- attach datasets
- test endpoint behavior

## 7. Verification Criteria

The mock backend is acceptable when:

1. Student apps can call configured endpoints during interactive runs.
2. Responses are deterministic where required.
3. Invalid requests produce the configured errors.
4. No unapproved network destinations are reachable.
