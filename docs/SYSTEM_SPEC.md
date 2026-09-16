# Snacks Republic by PJRB — POS + Customer Storefront Specification

Status: requested technical foundation updated; product additions are proposals for brainstorming. No application code exists yet.

## 1. Project overview

A single-location Snacks Republic by PJRB food-and-drink shop with a cinematic customer storefront, in-store POS, preparation queue, and management dashboard. Fruity soda is the main beverage category, alongside silog meals, kanto foods, Samyang noodles, and sandwiches. All channels share catalog, pricing, recipes, inventory, and order services. The user confirmed that milk tea is excluded from scope.

Confirmed requirements: React frontend, Vite, Tailwind CSS, TypeScript backend, MySQL with MySQL Workbench, layered MVC, helpers/services/constants/routes/environment configuration, migrations, normalized database design, soft deletion, timestamps on every application table, appropriate CRUD, and responsive interfaces.

Branding follows the user's [Facebook page](https://www.facebook.com/profile.php?id=61591189150675) and eight subsequently supplied screenshots. The screenshots establish the name, logo, pink/cream/red/yellow visual direction, and advertised PHP menu prices; current availability/prices, payment methods, location, and hours remain unverified. See [brand/BRAND_REFERENCE.md](brand/BRAND_REFERENCE.md) for source images, menu transcription, proposed UI colors, and unanswered details, and [BRAINSTORM.md](BRAINSTORM.md) for release scope.

Draft About copy:
> Welcome to Snacks Republic by PJRB—your spot for refreshing fruity sodas and satisfying bites. Choose your favorite fruity flavor and pair it with kanto snacks, silog meals, cheesy Samyang noodles, or an overloaded sandwich. From a quick merienda to a filling meal, find something for your craving.

This is creative placeholder copy; verify it against the actual store before launch.

## 2. Technology

| Layer | Choice | Status |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Required; TypeScript/TSX also recommended for frontend |
| Backend | Node.js + Express + TypeScript, strict mode | TypeScript required; Express proposed |
| Database | MySQL, InnoDB, utf8mb4 | Required |
| Database tooling | MySQL Workbench for SQL inspection and EER diagrams | Required; MySQL Server stores data |
| Data access | Knex + mysql2, parameterized queries and versioned migrations | Proposed |
| Auth | Staff sessions in secure HttpOnly cookies, role checks, guest customer checkout | Proposed |
| Validation | Shared request schemas with independent server validation | Required behavior |
| Testing | Service tests, real MySQL integration tests, browser flow tests | Required before implementation is complete |
| Hosting | Same-origin frontend/API where practical | Hosting/domain undecided |

Pin compatible dependency versions and a lockfile when scaffolding; check runtime/browser requirements then.

## 3. Architecture and folders

React views -> API routes -> validation/auth middleware -> controllers -> services -> models/repositories -> MySQL.

Controllers translate HTTP input/output. Services own business rules, calculations, and transactions. Repositories perform data access using the service transaction. Helpers contain small reusable functions. Constants contain stable identifiers; env contains deployment values; editable prices/recipes belong in the database.

POS and customer controllers invoke the same catalog, order, and inventory services. Staff identity comes from the session, never a request-supplied staff ID; customer routes assign the online channel server-side.

Proposed structure:

~~~text
src/
  frontend/
    src/
      app/                    # router, providers, layouts
      modules/                # storefront, pos, preparation, admin, auth
      shared/                 # components, hooks, helpers, constants, api, styles
    public/assets/
  backend/
    src/
      app.ts
      server.ts
      modules/
        <feature>/            # routes, controllers, services, models, validators
      shared/
        config/               # validated env configuration
        middleware/
        helpers/
        constants/
        errors/
      database/
        migrations/
        seeds/
  contracts/                  # shared safe types/schemas; no server secrets
tests/
  unit/
  integration/
  e2e/
docs/
~~~

## 4. Proposed first release

- Customer storefront: branded hero, featured items, searchable food/drink menu, applicable customization, basket, guest pickup checkout, private order tracking, About/store details. Only label items bestsellers when supported by sales data.
- POS: staff login, category/search grid, serving/size/flavor and product-specific add-ons, cart editing, cash tender/change, authorized manual payment confirmation, receipt, order history. Fruity soda customization starts with the configured flavor and 12/16/22 oz size; additional options require actual menu configuration.
- Preparation queue: accepted, preparing, ready, completed, with readable food/drink customizations and serving quantities.
- Admin: category/product/size/option/recipe/ingredient CRUD, restocking/waste, low-stock overview, staff roles, store content, basic sales reports.
- Archive/restore: supported master records get a recycle-bin view, conflict-aware restoration, and audit history.

Suggested later scope: loyalty, promotions, supplier purchasing, shift reconciliation, customer accounts, integrated payments, delivery, multiple branches, and offline checkout. These are not implicitly included in v1.

## 5. Database design

Logical proposal only: executable migrations, complete constraints/indexes, and Workbench-compatible schema export accompany implementation.

Every application table, including junctions and audit tables, has an explicit primary key and ends with these columns in this exact order:

~~~sql
deleted_at DATETIME(3) NULL DEFAULT NULL,
created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ON UPDATE CURRENT_TIMESTAMP(3)
~~~

Use UTC database connections/timestamps; localize display using the store timezone. Migration-runner metadata follows its tool schema and is not a business table.

| Domain | Tables and responsibilities |
|---|---|
| Access | roles, staff, staff_sessions: unique role code/username, password hash, role FK, hashed session token, expiry/revocation |
| Catalog | categories, products: category FK, unique slug, description, image reference, published state |
| Variants | serving_options, product_variants: product/serving-option FKs, unique SKU, price, unique product-serving pair; supports ounces, pieces, sticks, and default food servings |
| Customizations | option_groups, options, product_option_groups, variant_options: selection bounds, fruity soda flavors, product-specific food add-ons, allowed groups, variant-specific option pricing |
| Ingredients | units, ingredients, inventory_balances: ingredient base unit, reorder threshold, one balance per ingredient |
| Recipes | recipe_items, option_recipe_items: variant/ingredient quantities and variant-option/ingredient quantities in base units |
| Customers | customers: optional profile; guest checkout requires no account |
| Orders | orders: channel, optional staff/customer FKs, unique order number, order/payment states, currency, total snapshots, pickup contact, hashed tracking token |
| Order lines | order_items, order_item_options: variant/option FKs plus immutable names, size, quantities, customization, price and line-total snapshots |
| Payments | payments, refunds: order/payment FKs, method, amount, state, manual/external reference; no card credentials |
| Stock history | inventory_movements: ingredient/order-item FKs, signed quantity, reason, actor, reversal FK, operation identifier |
| Order history | order_status_history: order FK, previous/new state, actor, reason |
| Operations | idempotency_keys: request scope, unique key, request hash, resulting order FK, expiry |
| Store | store_settings: singleton name, About copy, timezone, currency, contact/address, opening-hours configuration |
| Audit | audit_logs: actor, action, resource identifier, sanitized change summary |

Rules:

- Match FK/PK types; use named constraints, nonnegative prices, positive line/recipe quantities, and indexes for FKs/common filters. Use DECIMAL for money/quantities with decimal arithmetic or currency minor units in services.
- Track ingredients and packaging through recipes, including cups/lids where needed. Do not maintain an unrelated product stock counter.
- Variants have their own recipes/prices per sellable serving. Two orders of a 3-piece serving consume two recipes/six pieces. Require a non-null serving option, including a default serving for products without size choices. Define base recipes and applicable flavor/add-on adjustments explicitly; avoid double-counting when an option replaces an ingredient. Use actual recipes rather than estimating them from photographs.
- Unknown prices remain null on unpublished drafts; publishing/ordering requires a configured nonnegative price. Never convert a missing price into a free item. Recipe-dependent live inventory checkout requires configured recipes.
- Update balances and corresponding movements in one transaction. Record actual consumption per order line so cancellation never recomputes usage from edited recipes.
- Derive browsing availability from balances/recipes; recheck the selected configuration inside checkout. Browsing is not a reservation.
- Snapshot names, options, prices, and tax/adjustment amounts so menu edits cannot rewrite past receipts.
- Use RESTRICT on required relationships rather than cascade deletion. Archiving parents with active dependents requires an explicit service policy.
- Default reads filter deleted_at IS NULL; authorized archive views opt in. Login/ordering also reject archived related records.
- Stable usernames/SKUs stay unique across archived rows in v1. Restore originals rather than introducing duplicates; a nullable deleted_at composite index is not sufficient to enforce active uniqueness.
- Financial, inventory, and audit history include the requested deletion/timestamp columns but expose no general edit/delete endpoints. Correct them with cancellations, refunds, or reversal entries. Archived products remain visible in historical sales reports.

## 6. CRUD and order integrity

Master-data resources provide create, paginated/searchable read, validated update, soft-delete, and authorized restore.

~~~text
GET/POST       /api/v1/admin/products
GET/PATCH      /api/v1/admin/products/:id
DELETE         /api/v1/admin/products/:id          # archive
POST           /api/v1/admin/products/:id/restore
GET            /api/v1/catalog/products
POST           /api/v1/pos/orders
POST           /api/v1/storefront/orders
GET            /api/v1/storefront/orders/track/:token
POST           /api/v1/orders/:id/transitions
POST           /api/v1/orders/:id/payments
POST           /api/v1/orders/:id/cancel
POST           /api/v1/payments/:id/refunds
~~~

Order input contains variant IDs, quantities, allowed option IDs, and an idempotency key. Calculate all totals server-side, verify selection requirements/limits, and reject archived or unpublished selections.

One transaction resolves recipes, locks ingredient balances in stable ID order, checks stock, writes order/line snapshots, records consumption/movements, and records applicable payment information. Failure rolls everything back. Bound deadlock retries. Matching duplicate requests return the existing order; the same idempotency key with a different payload returns a conflict.

Proposed states: accepted -> preparing -> ready -> completed. Cancellation is a transition, not deletion. Before preparation, cancellation can reverse consumption once; after preparation, ingredients remain consumed/waste unless a manager explicitly records recoverable stock. Refund and restock decisions are separate. Unpaid pickup expiry and stock commitment policy need agreement.

Guest tracking uses unguessable tokens and exposes minimal information. Enforce role checks, request validation, password hashing, session expiry/revocation, CSRF protection for cookie-authenticated writes, rate limits, restricted CORS, sanitized errors, and parameterized queries.

## 7. Visual and mobile direction

Required brand reference: https://www.facebook.com/profile.php?id=61591189150675. Match the store's verified logo, palette, typography character, product presentation, and tone of voice. The earlier forest-green/cream/caramel palette is superseded and must not be treated as approved branding.

Reference status: direct web retrieval failed, but the user supplied eight brand/menu images establishing Snacks Republic by PJRB. Preserve them in docs/brand/references. Use pink-and-cream gingham, deep-red primary actions/headings, golden-yellow accents, and restrained leafy decoration. Proposed UI values, source observations, and exact menu transcription are documented in [brand/BRAND_REFERENCE.md](brand/BRAND_REFERENCE.md); these UI values are not claimed to be official measured colors.

Retain the requested cinematic presentation through strong product composition, readable typography, and restrained motion, adapted to the verified brand. Lead the hero with colorful fruity sodas, citrus, ice, and bubbles, with the food menu featured in supporting sections. Apply accessible UI colors derived from the brand palette across storefront, POS, and admin.

- Storefront: cinematic food/drink hero, gentle transitions, featured menu items, transparent prices/servings, prominent ordering buttons, story section, verified hours/location, mobile basket bar. Use gingham sparingly in decorative areas and readable cream/white card surfaces. Keep menu names/prices as live text rather than baking the menu into an image.
- POS: fast search, high-contrast touch controls, clear customization panel, persistent desktop basket, mobile cart drawer. Motion never delays checkout.
- Admin: desktop tables and prioritized cards/detail views on phones; clear validation and archive/restore actions.
- Accessibility: visible focus, keyboard access, semantic labels, reduced-motion support, sufficient contrast, no hover-only actions, large touch targets.
- Test widths: 320, 360, 390, 430, 768, 1024, 1440 CSS pixels; portrait/landscape, zoom, virtual keyboards, long names. Verify current iOS Safari and Android Chrome and agree on an older-browser baseline. Every historical phone cannot be guaranteed.
- Performance: compressed responsive images, lazy loading below the fold, lightweight motion, static hero fallback; video is not required to browse/order.
- Include loading, empty, validation, unavailable-product, network-error, and success states. Preserve recoverable baskets and prevent duplicate submissions.

## 8. Assets and environment

Centralize product asset resolution and separate uploads from bundled assets. Use original/licensed imagery. Never publish fake reviews, unverified sourcing claims, or placeholder locations/contact details as real store content.

Commit .env.example and ignore real env files. Validate configuration at startup:

~~~text
NODE_ENV, PORT, APP_ORIGIN
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
SESSION_SECRET, SESSION_TTL_SECONDS
ASSET_BASE_URL, LOG_LEVEL
VITE_API_BASE_URL
~~~

Vite-prefixed configuration is public. Keep credentials/session secrets backend-only. Use a least-privilege runtime DB account and separate migration account.

## 9. Migrations and acceptance

- Commit ordered migrations for schema/constraint/index changes; do not depend on manual Workbench edits or automatic production schema synchronization.
- Provide deterministic development seeds with a labeled demo menu/roles. Provision staff credentials through setup, never a committed default password.
- Supply a MySQL Workbench-compatible SQL export and ER diagram from the migrated schema.
- Verify migrations on empty and seeded MySQL databases; document rollback limitations and backup/restore for destructive changes.
- Test customization/pricing, concurrent last-serving checkout, rollback, duplicate retries, repeated cancellation, refund/restock separation, role checks, archive visibility, restore conflicts, and historical receipt integrity.
- Browser-verify customer checkout, cashier sale, preparation, and admin CRUD on desktop/mobile. Run build, type checking, lint, and appropriate tests before delivery.

## 10. Decisions log

| Date | Decision | Basis |
|---|---|---|
| 2026-09-12 | Center the beverage menu and storefront hero on fruity soda; exclude milk tea | Explicit user clarification |
| 2026-09-12 | Identify Snacks Republic by PJRB from eight supplied images; adopt pink/cream gingham, red/yellow branding; expand catalog model to food servings as well as drinks | User-supplied visual evidence; current operational details still need confirmation |
| 2026-09-12 | Use the supplied Facebook page as the brand reference; supersede the suggested green/cream palette | User direction; visual verification pending because page retrieval failed |
| 2026-09-12 | Replace Bootstrap/PHP specification with React/Vite/Tailwind and TypeScript backend | User requirement |
| 2026-09-12 | Keep MySQL and distinguish Server from Workbench | User requirement/tooling clarification |
| 2026-09-12 | Add deleted_at, with created_at/updated_at last on every application table | User requirement |
| 2026-09-12 | Propose recipes, variants, transaction-safe ordering, and separate storefront/POS layouts | Review proposal; brainstorming pending |
