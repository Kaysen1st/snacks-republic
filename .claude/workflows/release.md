# Workflow: Release

Used by `orchestrator` when preparing a release/deploy.

1. **Freeze scope** — confirm with the user which features/fixes are going into this release; nothing new gets merged in after this point without restarting the checklist.
2. **Final review** — `reviewer` does a last pass across everything included, checking `.claude/rules/coding.md` and `security.md`.
3. **Full regression** — `qa` runs the entire existing test suite, not just tests for what changed this cycle.
4. **Prepare environment & assets** — `devops` confirms env/config values for the target environment, asset paths, and build output are correct per `docs/SYSTEM_SPEC.md`'s "Environment & Config Management" section.
5. **Version & changelog** — bump the version number and add a changelog entry to `docs/SYSTEM_SPEC.md` summarizing what shipped.
6. **Deploy** — `devops` runs the deploy script/process.
7. **Smoke test** — `qa` verifies the core happy paths work in the live/target environment immediately after deploy.
8. **Report** — `orchestrator` confirms the release is complete and summarizes what shipped to the user.
