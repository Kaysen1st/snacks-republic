# Snacks Republic by PJRB — Review and Brainstorming

Prepared 2026-09-12. Product proposals await feedback; no application has been implemented.

## Review findings

The workspace contains development guidelines, a system-spec template, and an empty src directory. There is no runnable frontend/backend, migration, or test suite yet.

- The original Bootstrap/PHP stack conflicts with the requested technology. SYSTEM_SPEC.md now specifies React/Vite/Tailwind and a TypeScript backend.
- Product-level stock counts cannot accurately support fruity soda and food recipes, serving sizes, add-ons, and shared ingredients. Ingredient-based inventory is proposed.
- Original tables lack consistent timestamps and soft deletion. All application tables now require deleted_at, created_at, updated_at, with the timestamps last.
- The original order contract permits request-supplied staff identity and has no transaction/idempotency requirements. The revised proposal uses authenticated identity, server-calculated totals, and transactional stock checks.
- Payments, customizations, preparation status, stock history, restore rules, and financial corrections need explicit design; the revised specification proposes these.
- No visual design or mobile criteria existed. The revised specification defines a proposed direction and responsive verification criteria.

## Experience proposal

Use the actual store identity from the user's [Facebook page](https://www.facebook.com/profile.php?id=61591189150675). This supersedes the earlier forest-green/cream/caramel suggestion. Keep the cinematic product presentation and gentle motion, with colors, typography, photography, and copy adapted to the verified brand.

Reference review status (2026-09-12): eight user-supplied screenshots now identify **Snacks Republic by PJRB**. The visual direction is pink-and-cream gingham, deep red, golden yellow, and leafy green accents. The menu includes drinks, silog meals, kanto foods, Samyang noodles, and sandwiches. See [brand/BRAND_REFERENCE.md](brand/BRAND_REFERENCE.md) for preserved originals, proposed interface colors, and advertised prices. Facebook remains unverified directly; screenshots do not confirm current availability or missing business details.

Customer journey: explore hero/featured dishes and drinks -> browse categories -> choose serving/flavor and applicable add-ons -> review price -> order for pickup -> track preparation.

Staff journey: sign in -> tap/search food or drinks -> select applicable options -> collect payment -> issue receipt -> prepare and mark ready.

The customer storefront carries the cinematic presentation. The POS shares the branding and prioritizes quick touch interaction and clear order details.

## Proposed first release

- Customer homepage, menu, About section, store details, basket, pickup checkout, order tracking.
- Staff POS, customization, cash tender/change, authorized manual payment confirmation, receipt, order history.
- Preparation queue.
- Management CRUD for catalog, recipes, ingredients, staff, store content; archive/restore for eligible records.
- Ingredient stock, restocking/waste, low-stock indicators, basic sales reports.

Suggested later additions: loyalty, promotions, supplier purchasing, shift reconciliation, integrated payments, delivery, multiple branches, and offline checkout.

## Draft About copy

> Welcome to Snacks Republic by PJRB—your spot for refreshing fruity sodas and satisfying bites. Choose your favorite fruity flavor and pair it with kanto snacks, silog meals, cheesy Samyang noodles, or an overloaded sandwich. From a quick merienda to a filling meal, find something for your craving.

Creative placeholder only; confirm the actual menu and store identity before launch.

## Brainstorming questions

1. Resolved: the eight images establish the brand direction, and the user confirmed fruity soda as the main beverage category. Milk tea is excluded. Lead the storefront hero with fruity soda and retain the pictured food categories.
2. Should release one include customer pickup ordering alongside the in-store POS? The original specification includes both.
3. The supplied posters show PHP prices. Confirm current prices, missing silog/Strawberry Summer Drink prices, serving quantities, customization rules, and payment methods. Cash, manually verified GCash, and pay-on-pickup remain proposals. Shanghai is transcribed as PHP 75 for 3 pieces and flagged for verification.
4. When should unpaid online orders commit stock, and when should uncollected orders expire?

## Implementation sequence after feedback

1. Finalize brand, scope, ordering/payment rules, ER diagram, API contracts.
2. Scaffold frontend/backend, configuration, migrations/seeds, authentication, shared UI.
3. Build catalog -> customized order -> inventory -> payment -> preparation end to end.
4. Complete admin CRUD, archive/restore, reporting, About content, responsive polish.
5. Verify real MySQL behavior and desktop/mobile flows; document setup and remaining limitations.

## Technical references checked

- [Vite getting started](https://vite.dev/guide/): React templates and runtime/browser compatibility.
- [Tailwind CSS with Vite](https://tailwindcss.com/docs/installation/using-vite): official integration.
- [MySQL Workbench manual](https://dev.mysql.com/doc/workbench/en/): database development and administration tooling.
