# PowerSphere US Mock — Claude Code Rules

Mockups for **Power Sphere USA**, an enterprise energy operations platform. Next.js 16 App Router, React 19, TypeScript 5.7, pnpm. Mockups here must look like the real app (`frontend-power-sphere-usa`), so they are built with the **same component library** it uses: **`@powersphere/shared-tw`**.

**`docs/STYLE_GUIDE.md` is the rulebook.** Read it before building or changing any screen. When in doubt, the guide wins.

---

## New screens: `@powersphere/shared-tw` only

- Import every UI element from `@powersphere/shared-tw` (`AmpButton`, `AmpDataTable`, `AmpDialog`, `AmpSelect`, `AmpStack`, `AmpTypography`, …). The "What you need → what to use" table in the style guide maps each need to a component.
- **Don't guess props.** Read the typings: `node_modules/@powersphere/shared-tw/dist/components/shared/<Component>/<Component>.d.ts`. Several components differ from their MUI/PrimeReact namesakes (e.g. `AmpSelect` takes `dropdownItems` as `{ id, alias }`; `AmpButton` content is `children`) — see "API differences that bite".
- **All text via `AmpTypography`.** Default body text is `variant="body-sm"`.
- **Layout via `AmpStack` / `AmpGrid` / `AmpBox`** with token props (`gap="md"`, `p="lg"`, `bg="card"`). `style={{…}}` only for what no prop covers.
- **No hardcoded** hex colors, px spacing, `fontSize` or `fontWeight`.
- **Icons:** `<AmpIcon icon={LucideIcon} />` with `lucide-react` components; `AmpFileIcon` for file types; `AmpStatusIcon` for status.
- **Never invent `ps:` classes** — only the ones the package ships exist; anything else silently does nothing.
- **Don't use** PrimeReact, PrimeIcons, shadcn (`components/ui/`), or the mock's own Tailwind classes in new screens.
- **Client components only.** The package has no `"use client"` banner — any file that imports from `@powersphere/shared-tw` must start with `"use client"`.
- List pages follow the canonical layout and filter-bar order (Primary filters → Refresh → spacer → Search → Actions → Export → Advanced filters).
- **Reference page:** `app/shared-tw-example/page.tsx` (`/shared-tw-example`) is a working list screen — header + create button, filter bar, table with chips/status/pagination, dialog, toast. Copy its structure when starting a new list screen.

## Legacy screens

Existing pages were built with PrimeReact (`DataTable`/`Column`/`Dialog`), PrimeIcons, and inline styles with `var(--surface-*)` / `var(--text-color*)` tokens. Don't rewrite them unless asked. Small fixes may keep the existing style; when a section is reworked, migrate the **whole section** to shared-tw — never mix a PrimeReact and a shared-tw version of the same control in one element.

---

## Setup

| What | Where |
|---|---|
| shared-tw package | Vendored tarball `vendor/powersphere-shared-tw-<version>.tgz` (the real registry is private AWS CodeArtifact). Keep the version equal to what `frontend-power-sphere-usa` pins. Update steps are in the style guide. |
| shared-tw stylesheet | `app/layout.tsx` |
| i18next (English) + `AmpSnackbarProvider` | `components/shared-tw-provider.tsx`, mounted in `components/providers.tsx` |
| Theme | Light by default (`next-themes`). shared-tw has no dark theme. |
| Database | Local SQLite (`dev.db`) via Prisma, used by `lib/actions/*`. First run: `pnpm exec prisma migrate deploy && pnpm db:seed`. |

After changing the shared-tw version, restart dev with a clean cache (`rm -rf .next`) — Next doesn't hot-reload CSS from `node_modules`.

## Commands

```bash
pnpm dev        # dev server
pnpm build      # production build (TS errors are ignored by next.config)
pnpm db:seed    # reseed the local SQLite DB
```

---

## Architecture

- **No Redux / Zustand** — local `useState` + context only
- **Mock data only** — no external backend calls; in-memory CRUD, `lib/*-mock.ts`, or the local Prisma DB
- **Global client data** — `useCounterparties()` from `lib/counterparty-context.tsx`
- **No comments** unless the WHY is non-obvious

## Route map

```
app/
  (operations)/
    real-time-operations/   → Daily Log Monitor + Reports Repository
    client-configuration/   → External/Internal client management
    document-repository/    → coming soon
    prospect/               → coming soon
  (market-desk)/
    market-transactions/scheduling/ → ERCOT submission tracking
  (standalone)/
    etrm/                   → ETRM: Reports (M2M, Settlement, Credit) + Standard Trade
    meter-readings/         → Meter readings
    retail-customer/        → coming soon
    demand-response/        → coming soon
    account-manager-console/ → AMC, opened from the header user menu (coming soon)
```
