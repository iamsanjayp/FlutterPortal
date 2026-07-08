# Flutter Portal v2 Mock Database Specification

## 1. Purpose

The mock database shall provide controlled datasets for assessment scenarios that require storage-like behavior without exposing a real database to students.

## 2. Scope

The mock database shall support educational datasets such as:

- users
- products
- orders
- todos
- messages
- inventory
- appointments
- collections

## 3. Requirements

MD-1. The mock database shall be portal-owned and challenge-configurable.

MD-2. The mock database shall reset to a known state after each execution or on a defined lifecycle boundary.

MD-3. The mock database shall not be directly accessible to student code as a production database.

MD-4. The mock database shall support deterministic seed data.

MD-5. The mock database shall support CRUD-style interactions where required by the challenge.

MD-6. The mock database shall support queryable datasets for future automation and testing.

MD-7. The mock database shall preserve run isolation between students and between sessions.

## 4. Data Model

Each challenge dataset shall define:

- tables or collections
- schema fields
- seed records
- allowed mutations
- reset policy
- validation policy

## 5. Runtime Behavior

The execution engine shall attach the student run only to the mock database instances or services assigned to the challenge.

The mock database shall be reset before a new execution when required by the challenge definition.

## 6. Administration

The admin portal shall allow teachers to:

- define datasets
- seed sample records
- edit field structure
- preview challenge data behavior
- reset or clone datasets for new cohorts

## 7. Verification Criteria

The mock database is acceptable when:

1. A challenge can start from the same seed state every time.
2. Student operations only affect their own run context.
3. Reset restores the dataset exactly as defined.
4. The execution engine can attach and detach without data leakage.
