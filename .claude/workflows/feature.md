# Workflow: New Feature

Used by `orchestrator` whenever the request is "build/add X."

1. **Intake** — `orchestrator` reads `docs/SYSTEM_SPEC.md` and restates the feature as a short spec: what it does, who uses it, what "done" looks like.
2. **Design** — if the feature touches the database or module boundaries, `architect` updates `docs/SYSTEM_SPEC.md` first: schema changes, new module folder, and (if frontend + backend will work in parallel) the request/response contract between them.
3. **Build (parallel where possible)**
   - `backend` implements the module's logic/data-access per the spec.
   - `frontend` builds the UI/UX from the wireframe, against the same contract.
4. **Verify** — `qa` writes and runs test cases against the acceptance criteria from step 1, including non-happy-path UI states.
5. **Review** — `reviewer` checks the diff against `.claude/rules/coding.md` and `security.md`, and against the architecture in `docs/SYSTEM_SPEC.md`. Blocking issues go back to `backend`/`frontend`.
6. **Close out** — `orchestrator` confirms all steps passed, logs the feature in `docs/SYSTEM_SPEC.md`'s changelog, and reports back to the user.

Skip step 2 only if the feature is UI-only and touches no existing data shape.
