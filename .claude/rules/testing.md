# Testing Rules

Owned/applied primarily by `qa`, but `backend` and `frontend` are expected to write the first pass of tests for their own code before handing off.

## 1. Test types expected

- **Unit tests** — business logic in services, isolated from the DB/network where possible.
- **Integration tests** — the full request path through controller → service → repository → DB for key flows.
- **Manual UI pass** — happy path + loading/empty/error states, for anything with a UI, before it's marked done.

## 2. Structure mirrors source

Test files live in a structure that mirrors `src/`, so a developer can find the test for a given file without searching:

```
tests/
  <module-name>/
    <same-name-as-source-file>.test.*
```

## 3. Definition of done

A feature isn't "done" without:
- At least one test covering its main acceptance criteria.
- Confirmation that non-happy-path UI states were checked (if it has a UI).

## 4. Bug fixes require a regression test first

Before fixing a confirmed bug, write a test that reproduces it (and fails). The fix is only considered complete when that test passes. This is what stops the same bug from quietly coming back.

## 5. Regression pass before release

Before any release (per `.claude/workflows/release.md`), run the full existing test suite — not just tests for what changed this cycle.
