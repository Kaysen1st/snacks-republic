# Coding Rules

All agents (`backend`, `frontend`, `reviewer`) follow these. Written once here instead of repeating in every agent file, so there's one place to update.

## 1. Folder structure = one module, one folder

Every feature/module lives in its own folder under `src/`, containing only that module's views, logic, and data-access code. A developer should be able to open one folder and understand one feature end-to-end, without hunting through the rest of the codebase.

```
src/
  <module-name>/
    views/            (or components/, templates/)
    controllers/       (or routes/)
    services/          (business logic)
    models/            (or repositories/ — data access only)
    assets/            (module-specific images/icons, if not global)
```

Shared/global code (shared components, shared utils, base config) lives in its own top-level folder, e.g. `src/shared/`.

## 2. Naming conventions

- **Files & folders:** lowercase, hyphen or snake_case, consistent per language convention already used in the codebase — pick one and don't mix within the same project.
- **Database:** `snake_case` for tables and columns; table names plural (`users`, `orders`); foreign keys explicit (`user_id`, not `uid` or `fk_user`).
- **Functions/methods:** verb-first, describe exactly what they do (`getUserById`, not `userStuff`).
- **Booleans:** prefix with `is`/`has`/`can` (`isActive`, `hasPermission`).

## 3. Single responsibility

If a function validates input, runs business logic, AND talks to the database, split it into three. This isn't style preference — it's what makes a bug traceable to one place instead of a tangle.

## 4. No hardcoding

Anything that could differ between environments (URLs, credentials, asset paths, feature flags, magic numbers with real meaning) goes into config/env, not inline in code. See `.claude/rules/security.md` for secrets specifically.

## 5. DRY, but don't over-abstract too early

Reuse an existing component/service/util before writing a new one. But don't build a generic abstraction for something used only once — wait until a second real use case shows up.

## 6. Comments explain "why," not "what"

Code should be readable enough that a comment isn't needed to explain what it does. Comment when a decision isn't obvious from the code alone (a workaround, a business rule, a non-obvious constraint).

## 7. Every error/log line states its layer

Format: `[layer:ComponentName] message`. Example: `[service:OrderService] failed to calculate total`. This is what lets `qa` isolate a bug fast — don't skip it.
