---
name: feature-flow
description: Run the standard feature workflow using Superpowers + OpenSpec from a single feature request.
disable-model-invocation: true
argument-hint: [feature description] [--auto-implement] [--archive]
---

You are running the project standard feature workflow.

User feature request:

$ARGUMENTS

## Goal

Convert the user's feature request into a complete implementation using this workflow:

1. Superpowers-style brainstorming
2. OpenSpec proposal/design/tasks/specs
3. Human/spec review checkpoint
4. Superpowers subagent-driven implementation
5. OpenSpec verification
6. Optional archive

## Hard Rules

- OpenSpec artifacts are the source of truth.
- Do not create a separate competing plan if OpenSpec `tasks.md` exists.
- Do not run `/superpowers:write-plan` by default.
- Do not expand scope beyond the user's feature request.
- If scope changes are needed, update the OpenSpec change first.
- Implement strictly from `openspec/changes/<change-name>/tasks.md`.
- Mark tasks as completed only after code and tests are done.
- Run available verification commands before `/opsx:verify`.
- Archive only if verification passes and the user passed `--archive`.

## Step 1 — Classify the request

Classify the request as one of:

- Small change
- Medium feature
- Large feature
- Unclear requirement
- Risky architectural change

If the request is small, use a lightweight workflow.

If the request is medium/large/unclear/risky, use full workflow.

## Step 2 — Brainstorm

Run Superpowers-style brainstorming before OpenSpec.

Analyze:

- Intended behavior
- Existing behavior likely affected
- Data model impact
- UI impact
- API impact
- State management impact
- Offline/cache impact if relevant
- Navigation impact if relevant
- Permission/security impact if relevant
- Edge cases
- Failure cases
- Test cases
- Rollback risk

Produce a concise engineering summary.

## Step 3 — Create OpenSpec change

Create a clear kebab-case change name based on the feature.

Then use OpenSpec workflow:

- Generate proposal
- Generate design if needed
- Generate tasks
- Generate spec deltas

Prefer `/opsx:propose` for the default path.

The generated OpenSpec output must include:

- Problem
- Proposed change
- In scope
- Out of scope
- Acceptance criteria
- Edge cases
- Test scenarios
- Implementation tasks

## Step 4 — Review checkpoint

After OpenSpec output is generated, review it yourself and report:

- Missing scope
- Ambiguous requirements
- Missing test cases
- Risky assumptions
- Files/modules likely affected

If the user did NOT pass `--auto-implement`, stop here and ask for confirmation before implementation.

If the user passed `--auto-implement`, continue.

## Step 5 — Implementation

Use Superpowers subagent-driven development style.

Implementation rules:

- Read relevant files before editing
- Implement task by task from OpenSpec `tasks.md`
- Keep changes minimal and scoped
- Add/update tests
- Update task checkboxes
- Do not mark a task done until verified
- Avoid unrelated refactors

## Step 6 — Verification

Run available project commands, choosing from:

- lint
- typecheck
- test
- build

Use package scripts if available.

Then run `/opsx:verify`.

If verification fails:

- Identify failed requirement
- Fix implementation or update spec if the spec was wrong
- Re-run verification

## Step 7 — Archive

Only run `/opsx:archive` if:

- `/opsx:verify` passes
- all tasks are complete
- no unresolved requirement exists
- user passed `--archive`

Otherwise, summarize what remains.