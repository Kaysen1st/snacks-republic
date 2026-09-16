# Workflow: Bug Fix

Used by `orchestrator` whenever the request is "this is broken" / a bug report.

1. **Intake** — `orchestrator` captures the report as-is: what was expected, what happened, steps to reproduce (ask the user if missing).
2. **Isolate** — `qa` runs the bug isolation protocol from `.claude/agents/qa.md`: reproduce → check UI layer → check backend layer (using the layer-tagged logs) → check DB state → state which single layer the bug lives in.
3. **Assign**
   - UI/UX bug → `frontend`.
   - Server logic/data bug → `backend`.
   - If the bug reveals a structural/architecture flaw (not just a mistake in one file) → `architect` first, then whichever of `backend`/`frontend` implements the fix.
4. **Fix + regression test** — the assigned agent fixes the bug and writes the regression test `qa` will need (per `.claude/rules/testing.md` — a fix isn't done without a test that would've caught it).
5. **Review** — `reviewer` checks the fix doesn't violate layering or introduce a new issue.
6. **Verify & close** — `qa` confirms the regression test passes and the original repro steps no longer reproduce the bug. `orchestrator` logs the fix in `docs/SYSTEM_SPEC.md`'s changelog.
