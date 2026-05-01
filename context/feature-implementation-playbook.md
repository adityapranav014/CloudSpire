# Feature Implementation Playbook

This document defines how new features should be planned before any implementation work begins.

## Core Principle

Use spec-driven development, not vibe coding.

The developer remains the architect. AI is the implementation engine.

That means:

- Define the outcome before writing code.
- Bound the system before asking an agent to build.
- Ship in small, verifiable units.
- Review for correctness, accessibility, security, and regressions.

## Default Thinking Process Before Any New Feature

1. Clarify the goal.
   - What user problem does this solve?
   - What does success look like?
   - What is explicitly out of scope?

2. Pressure-test the design.
   - Walk through the feature like a senior engineer would.
   - Check edge cases, permissions, data dependencies, and failure states.
   - Identify the smallest version that is still useful.

3. Write the spec before implementation.
   - Describe the goal.
   - Define UX expectations.
   - Define data and state changes.
   - Define a verification checklist.

4. Give the agent bounded context.
   - Point it to the relevant context docs.
   - Ask it to work on one feature at a time.
   - Require focused validation after edits.

5. Review the result.
   - Check behavior against the spec.
   - Review accessibility, security, and logic.
   - Fix root causes, not symptoms.

## Six-File Context System

Store these files in the top-level `context/` folder to keep AI work grounded and consistent.

### 1. Project Overview

Purpose:

- Define product goals.
- Capture the main user flows.
- State what is out of scope.

Suggested filename:

- `context/project-overview.md`

### 2. Architecture

Purpose:

- Define the tech stack boundaries.
- Document data models and integration points.
- Record system invariants that must not be broken.

Suggested filename:

- `context/architecture.md`

### 3. Code Standards

Purpose:

- Capture coding conventions.
- Define styling and component rules.
- Standardize TypeScript, React, and styling expectations.

Suggested filename:

- `context/code-standards.md`

### 4. AI Workflow Rules

Purpose:

- Tell the agent how to work.
- Keep tasks atomic.
- Require validation and minimal diffs.

Suggested filename:

- `context/ai-workflow-rules.md`

### 5. UI Context

Purpose:

- Document design tokens.
- Capture color usage, spacing, typography, and component patterns.
- Keep new work visually consistent.

Suggested filename:

- `context/ui-context.md`

### 6. Progress Tracker

Purpose:

- Track the current phase.
- Record completed work.
- Keep session notes and next steps.

Suggested filename:

- `context/progress-tracker.md`

## Per-Feature Spec Requirement

Every new feature should start with its own markdown spec.

Suggested location:

- `context/specs/<feature-name>.md`

Each spec should include:

### Goal

- What the feature does.
- Why it matters.
- Who it is for.

### User Experience

- Entry points.
- User interactions.
- Loading, empty, error, and success states.

### Technical Design

- Files likely to change.
- Data dependencies.
- API, auth, permissions, and state implications.
- Constraints and non-goals.

### Verification Checklist

- Behavior matches the spec.
- Responsive behavior works.
- Edge cases are handled.
- No obvious accessibility regressions.
- No security shortcuts.
- Tests or focused validation were run.

## Recommended Workflow

1. Plan the system or feature with a strong reasoning model.
2. Convert that conversation into context documents.
3. Write a focused feature spec.
4. Ask the implementation agent to execute only that spec.
5. Run focused validation immediately after edits.
6. Perform AI-assisted or human review for bugs, security, and accessibility.

## Senior Habits To Preserve

- Think first. Design before prompting.
- Prefer RFCs, specs, and written decisions over improvisation.
- Break work into atomic units that can be validated cleanly.
- Use trusted infrastructure for auth, async work, storage, and collaboration instead of rebuilding complex systems from scratch.
- Optimize for maintainability, not just speed of first output.

## Reference Stack From The Video

These tools were referenced as examples of a production-grade AI product stack:

- Next.js App Router
- React 19
- Tailwind CSS
- Clerk
- Prisma with PostgreSQL
- Neon or Prisma Data Platform
- Liveblocks
- React Flow
- Trigger.dev
- Vercel Blob
- Google Gemini via the Vercel AI SDK

Use this list as a reference for architecture quality, not as a mandatory stack for every project.

## Quick Start Checklist

Before starting a new feature, confirm all of the following:

- The goal is written down.
- Out-of-scope behavior is written down.
- Relevant context files exist or were updated.
- A feature spec exists.
- Validation steps are defined before implementation starts.
- Security, permissions, and failure states were considered.

## Instruction To Future Agents

Before implementing any feature in this repository:

1. Read the relevant files in `context/`.
2. Read the feature spec first.
3. Work on one feature at a time.
4. Make the smallest change that satisfies the spec.
5. Validate immediately after the first meaningful edit.
6. Do not expand scope without updating the spec.
