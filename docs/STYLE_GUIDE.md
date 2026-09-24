# PowerSphere US Mock — Style Guide

Mockups in this repo must look and behave like the real **Power Sphere USA** app (`frontend-power-sphere-usa`). To guarantee that, every new screen is built with **`@powersphere/shared-tw`** — the same published Tailwind `Amp*` design system the real app uses — following the same conventions.

This guide is adapted from the real app's `docs/STYLE_GUIDE.md`. The MUI, SCSS, Git-workflow and Sonar parts were dropped because they don't apply to a mock; the component rules are unchanged, so a screen built here can be ported to the real app almost 1:1.

> **Existing screens** (built with PrimeReact + inline styles) are legacy. Leave them alone unless you are asked to change them; when you do rework one, migrate the whole section to shared-tw rather than mixing both.

---

## Start here — golden rules

1. **New screens use `@powersphere/shared-tw`.** Not PrimeReact, not shadcn (`components/ui/`), not hand-rolled `<button style={…}>`. Selection table: [What you need → what to use](#what-you-need--what-to-use).
2. **Don't guess props — look them up.** Exact prop types: `node_modules/@powersphere/shared-tw/dist/components/shared/<Component>/<Component>.d.ts`. Live docs + examples (Ammper network/VPN): Storybook → <https://ddwpdsloingkr.cloudfront.net/>. shared-tw `Amp*` are **not** drop-in swaps for MUI/PrimeReact namesakes — check [API differences that bite](#api-differences-that-bite) first.
3. **Never hardcode** hex colors, `px` spacing, or inline `fontSize`/`fontWeight`; use tokens (`bg="card"`, `gap="md"`, `<AmpTypography variant="…">`).
4. **All text goes through `AmpTypography`** — no bare styled `<p>`/`<span>`/`<h*>`.
5. **Layout is `AmpStack` / `AmpGrid` / `AmpBox`.** `style={{…}}` is the escape hatch for what no prop covers. **Never reach for a `ps:` utility class the package doesn't already ship** — it silently does nothing ([why](#you-cannot-invent-ps-classes)).
6. **Icons are `<AmpIcon icon={LucideIcon} />`** (a `lucide-react` component, not a string); file-type icons use `AmpFileIcon`; status glyphs use `AmpStatusIcon`.
7. **shared-tw components only render inside client components.** The package has no `"use client"` banner, so any file importing from `@powersphere/shared-tw` must start with `"use client"` (or be imported by one).
8. **Mock data only.** Keep data in local `useState` / context or `lib/*-mock.ts` files; no backend calls.

---

## Setup (already done — for reference)

| What | Where |
|---|---|
| Package | `vendor/powersphere-shared-tw-<version>.tgz`, installed via `file:` in `package.json` (the registry is private AWS CodeArtifact, so the tarball is vendored) |
| Stylesheet | `app/layout.tsx` → `import '@powersphere/shared-tw/styles.css'` |
| i18n + snackbars | `components/shared-tw-provider.tsx` — initializes i18next in English, registers shared-tw's translations, mounts `AmpSnackbarProvider` |
| Theme | Light by default (`components/providers.tsx`). shared-tw has no dark theme. |
| Reference page | `app/shared-tw-example/page.tsx` → <http://localhost:3000/shared-tw-example>. A working list screen using the patterns below — start new screens from it. |

**Updating the package:** in `frontend-power-sphere-usa` (after installing the new version there) run
`npm pack node_modules/@powersphere/shared-tw --pack-destination <mock>/vendor`, then here `pnpm add ./vendor/powersphere-shared-tw-<version>.tgz`, delete the old tarball, and restart dev with a clean cache (`rm -rf .next`) — Next doesn't hot-reload CSS from `node_modules`. Keep the version equal to what `frontend-power-sphere-usa` pins so mockups match production.

---

## A. Typography — `AmpTypography` (mandatory)

**Every** piece of user-facing text renders through `AmpTypography`. Never put styled text in a bare `<div>` / `<span>` / `<p>`, never inline `fontSize` / `fontWeight`.

**Variants** (px / default weight): `display-1` (56/bold) · `display-2` (40/bold) · `h1` (32/semibold) · `h2` (24/semibold) · `h3` (20/semibold) · `body-lg` (18) · `body` (16) · `body-sm` (14) · `label` (14/medium) · `caption` (12) · `footnote` (11) · `metric` (24/semibold).
Other props: `color` (`default | muted | primary | destructive | success | inherit`), `weight` (`normal | medium | semibold | bold`), `align`, `as` (override the tag), `truncate`.

| Use for | Variant |
|---|---|
| Page title | `h2` |
| Modal / major section title | `h3` |
| Sub-section title | `body` + `weight="semibold"` |
| Form section header, table-ish headers | `body-sm` + `weight="semibold"` |
| Default body text | `body-sm` |
| Helper / secondary text | `caption` (+ `color="muted"`) |
| Footnotes, timestamps, cell meta | `footnote` |
| Big KPI number | `metric` |

**Gotchas:**
- **`body` is 16px** — the app's default body text is `body-sm` (14px).
- **`caption` and `footnote` render as `<span>` (inline).** Two of them inside an `AmpBox` run together on one line. Put them in an `AmpStack` (flex column blockifies them) or pass `as="div"`.
- **No spacing props on `AmpTypography`.** Wrap it in an `AmpBox mb="md"` etc.

```tsx
<AmpTypography variant="h2">Scheduling</AmpTypography>
<AmpTypography variant="body-sm" weight="semibold">Section title</AmpTypography>
<AmpTypography variant="caption" color="muted">Helper text</AmpTypography>

// ❌ one line — AmpBox is a div, both variants are spans
<AmpBox><AmpTypography variant="footnote">{ts}</AmpTypography><AmpTypography variant="caption">{msg}</AmpTypography></AmpBox>
// ✅
<AmpStack gap="none"><AmpTypography variant="footnote">{ts}</AmpTypography><AmpTypography variant="caption">{msg}</AmpTypography></AmpStack>
```

---

## B. What you need → what to use

All imported from **`@powersphere/shared-tw`**.

| You need… | Use | Don't use |
|---|---|---|
| **Any text** | **`AmpTypography`** | styled `<p>`/`<span>`/`<h*>` |
| A data table | `AmpDataTable` + `AmpDataTablePagination` | PrimeReact `DataTable`, `<table>` |
| A heat-map / matrix table | `AmpHeatMapTable` | hand-colored cells |
| A status indicator (done / pending / error / warning) | `AmpStatusIcon` | a hand-colored icon or dot |
| A modal / dialog / confirmation | `AmpDialog` | PrimeReact `Dialog` |
| A loading spinner / progress bar | `AmpProgress variant="circular" \| "linear"` | custom spinners |
| A generic icon | `AmpIcon icon={LucideIcon}` | PrimeIcons, bare `<svg>` |
| A file-extension icon (pdf / xls / csv …) | `AmpFileIcon` | a generic file glyph |
| A tag / label chip | `AmpChip` | a styled `<span>` pill |
| A dropdown select | `AmpSelect` | native `<select>` |
| A multi-select | `AmpMultiSelect` | checkbox lists |
| A segmented single-choice control | `AmpButtonGroup` | hand-rolled toggle `<button>`s |
| An inline banner / notice | `AmpAlert` | a bordered, tinted `<div>` |
| A collapsible advanced-filter panel | `AmpAdvancedFilters` + `AmpAdvancedFiltersIcon` | custom collapse |
| A search box | `AmpSearchInput` | native `<input>` |
| Text / number / textarea input | `AmpTextInput` / `AmpTextArea` | native `<input>` |
| Checkbox / radio / toggle | `AmpCheckbox` / `AmpRadioGroup` + `AmpRadio` / `AmpSwitch` | native inputs |
| A date / range picker | `AmpDayPicker` / `AmpDayRangePicker` (+ month / year / time variants) | native date inputs |
| A file-upload field | `AmpFileUploader` / `AmpImageUploader` | raw `<input type="file">` |
| A file preview | `AmpSpreadsheetViewer` / `AmpDocxViewer` / `AmpPDFModal` | `<iframe>` in a dialog |
| A card / panel | `AmpCard` | bordered `<div>` |
| KPI tiles | `AmpKpiCard` / `AmpKpiGroup`, `AmpStatProgress` | hand-built tiles |
| Charts | `AmpLineChart`, `AmpBarChart`, `AmpAreaChart`, `AmpPieChart`, `AmpComposedChart`, `AmpStackGroupBarChart`, `AmpWaterfallChart`, … | raw recharts |
| Chart + table in sync | `AmpSyncedChartTable` | wiring hover state by hand |
| A flex layout | `AmpStack` | `<div style={{ display: 'flex' }}>` |
| A column grid | `AmpGrid` (+ `AmpGridItem`) | CSS grid by hand |
| A generic container / spacing wrapper | `AmpBox` | `<div style={…}>` |
| Tabs | `AmpTabs` | button-row tab bars |
| Accordion / collapse | `AmpAccordion` / `AmpCollapse` | custom disclosure |
| Stepper | `AmpStepperNav` | custom steps |
| A tooltip | `AmpTooltip` | `title=` attributes |
| A button | `AmpButton` | `<button style={…}>` |
| A split / actions button | `AmpActionsButton` | custom menu button |
| A refresh control | `AmpRefetchIcon` | button + refresh icon |
| A toast | `useAmpSnackbar()` (provider already mounted) | custom toasts |
| A schema-driven form | `AmpDynamicForm` | — |

If shared-tw is missing something you genuinely need, build the smallest thing possible from `AmpBox` / `AmpStack` / `AmpTypography` and flag it — it's a candidate for the library.

---

## C. API differences that bite

These are **not** drop-in swaps for the MUI/PrimeReact components with the same names:

- **`AmpButton`** — content via **`children`**; `leftIcon`/`rightIcon` take a **ReactNode** (e.g. `<AmpIcon icon={Plus} />`); `loading`; `tooltip`. `variant`: `primary | secondary | destructive | outline | ghost | link`; `size`: `default | sm | lg | icon`.
- **`AmpSelect`** — options via **`dropdownItems`** as **`{ id, alias }`** (`id` = value, `alias` = label). ⚠️ The `data` prop is in the typings but **not wired** — using it leaves the dropdown empty. `onChange` receives the **value** (string), not an event.
- **`AmpMultiSelect`** — same `dropdownItems` shape, `value` is `string[]`, built-in select-all row (`selectAllLabel`) and collapsed label (`allSelectedLabel`). ⚠️ `onChange` is typed `(value: string)` but fires with `string[]`:
  ```tsx
  const asMultiChange = (h: (ids: string[]) => void) => h as unknown as (v: string) => void
  <AmpMultiSelect … onChange={asMultiChange((ids) => setSelected(ids))} />
  ```
- **`AmpButtonGroup`** — `items` as `{ value, label, disabled? }` (`label` is a ReactNode) + `value` / `onChange(value)`.
- **`AmpAlert`** — `color` (semantic), `title`, `children`, optional **`action`** slot, `dismissible`.
- **`AmpDayRangePicker`** (and other range pickers) — **`value={{ from, to }}`** (use `undefined`, not `null`) + **`onChange(range)`**; bound with `minStartDate`/`maxStartDate`/`minEndDate`/`maxEndDate`.
- **`AmpSearchInput`** — `value` + debounced **`onSearch(value)`** + required **`name`**. Full-width by default → wrap in a width-bounded `AmpBox`.
- **`AmpActionsButton`** — options `{ value, label, disabled? }`; single mode fires **`onSelect(value)`**; use a static `label`.
- **`AmpRefetchIcon`** — `onClick` + `loading` (spins) + `tooltip`.
- **`AmpIcon`** — **`icon={LucideIcon}`** (component), never a string.
- **`AmpDialog` `maxWidth`** is narrower than MUI's: `sm` 384px · `md` 512px · `lg` 672px · `xl` 896px. Wider → `fullScreen` or `className`. It does **not** close on backdrop click — opt in with `closeOnBackdropClick` for read-only dialogs only.
- **`AmpDataTable`** — no per-row styling and no `getRowId`. Move row-level signals into a cell (chip / status icon).

### You cannot invent `ps:` classes

Tailwind runs inside the shared-tw repo only. Its `styles.css` contains just the utilities the package itself uses (a few hundred, not all of Tailwind). A `ps:` class that the package doesn't already ship produces **no CSS at all** — no error, no style.

```tsx
<AmpStack className="ps:overflow-x-auto">   // ❌ dead — class doesn't ship
<AmpBox overflow="auto">                    // ✅ use the props
```

1. **Use the component's props** — that's the contract. (`AmpStack` has no `overflow`; wrap it in an `AmpBox` that does.)
2. If no prop exists, use `style={{…}}` as the escape hatch.
3. Check whether a class ships before debugging it: `grep -F 'ps\:overflow-x-auto' node_modules/@powersphere/shared-tw/dist/styles.css` (use `-F`; the selector has a literal backslash).

The mock's own Tailwind (unprefixed classes, `app/globals.css`) belongs to the legacy screens — don't use it on shared-tw screens.

---

## D. Component playbook

### Tables — `AmpDataTable` + `AmpDataTablePagination`

You own a TanStack `useReactTable` (core + sorted + paginated), feed the **current page's** rows to `AmpDataTable`, and bind `AmpDataTablePagination` to the **same** table instance.

```tsx
"use client"
import { useState } from "react"
import {
  getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState,
} from "@tanstack/react-table"
import { AmpDataTable, AmpDataTablePagination } from "@powersphere/shared-tw"

const [sorting, setSorting] = useState<SortingState>([])
const table = useReactTable({
  data: rows,
  columns,
  state: { sorting },
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: { pagination: { pageSize: 10 } },
})
const pageData = table.getRowModel().rows.map((r) => r.original)

<AmpDataTable
  columns={columns}
  data={pageData}
  isLoading={isLoading}                  // built-in skeleton — never overlay a spinner
  emptyMessage="No records found"
  enableSorting
  sorting={sorting}
  onSortingChange={setSorting}
  renderSubComponent={renderSubComponent} // expandable nested row
  getRowCanExpand={(row) => row.original.children.length > 0}
  expandedRowPadded                       // always, when the sub-row is a table/panel
/>
<AmpDataTablePagination table={table} pageSizeOptions={[5, 10, 20, 50]} />
```

- **Density** defaults to `dense`; `density="comfortable"` for roomier rows.
- **Row selection** → `enableRowSelection` injects a checkbox column.
- **Column widths** → `size` on the column def.
- **Grouped (two-tier) headers** → nest a `columns` array inside a `ColumnDef`; `AmpDataTable` emits real `colSpan`/`rowSpan`. Never fake a group header with a pixel-matched `<div>`.
- **Row actions in nested levels** → publish handlers once through a React context next to the top-level table instead of drilling props.

### Status — `AmpStatusIcon`

```tsx
<AmpStatusIcon status={row.sent ? "done" : "pending"} size="md" tooltipLabel="Sent" />

// richer tooltip → suppress the built-in one
<AmpTooltip content={detail}>
  <span style={{ display: "inline-flex" }}><AmpStatusIcon status={status} size="md" hideTooltip /></span>
</AmpTooltip>
```

### Modals — `AmpDialog`

All dialogs (forms **and** confirmations): `open` / `onClose`, `title`, `maxWidth`, `fullWidth`, and a **`footer`** slot — Cancel = `ghost`, primary action = `primary` (or `destructive` for delete), `loading` on the async button.

```tsx
<AmpDialog
  open={open}
  onClose={onCancel}
  title="Edit counterparty"
  maxWidth="xl"
  fullWidth
  footer={
    <>
      <AmpButton variant="ghost" onClick={onCancel}>Cancel</AmpButton>
      <AmpButton variant="primary" onClick={onSave} disabled={!canSave} loading={isSaving}>Save</AmpButton>
    </>
  }
>
  {/* body */}
</AmpDialog>
```

Confirmation = same component, `maxWidth="sm"`, `destructive` primary button.

### Loaders — `AmpProgress`

| Context | `size` |
|---|---|
| Inline action icon (table cell / row) | `xs` |
| Filter-bar / modal-body loader | `sm` |
| Full-panel / file-viewer loader | `lg` |

`variant="linear"` for bars (`value` 0–100 for determinate). **Tables** use their skeleton (`isLoading`), not a spinner.

### Icons — `AmpIcon` / `AmpFileIcon` / `AmpStatusIcon`

Use the **same lucide icon for the same action everywhere**. In tables/toolbars render each as `AmpIcon size="sm"` inside `<AmpButton variant="ghost" size="icon" tooltip=… aria-label=…>`.

| Action | Icon (`lucide-react`) | Color |
|---|---|---|
| Create / Add | `Plus` (as a button `leftIcon`) | default |
| Edit | `Pencil` | default |
| Delete / Remove | `Trash2` | **`destructive`** — the only red action |
| Approve / Confirm | `ClipboardCheck` (plain confirm: `Check`) | default |
| Execute / Re-run | `RefreshCw` | default |
| Close / Dismiss | `X` | default |
| Download | `Download` (or make the `AmpFileIcon` the button) | default |
| View / Preview | `Eye` | default |
| Refresh a list | **`AmpRefetchIcon`** | — |

```tsx
import { Pencil, Plus, Trash2 } from "lucide-react"

<AmpButton variant="ghost" size="icon" tooltip="Edit" aria-label="Edit" onClick={onEdit}>
  <AmpIcon icon={Pencil} size="sm" />
</AmpButton>
<AmpIcon icon={Trash2} size="sm" color="destructive" />
<AmpButton variant="primary" leftIcon={<AmpIcon icon={Plus} />} onClick={onCreate}>Create</AmpButton>

<AmpFileIcon extension="pdf" size="sm" />
<AmpFileIcon fileName="march-report.xlsx" />
```

Never a bare clickable `<svg>`; never tint icons other than Delete.

### Chips, switches, selects, uploads

**Chip color — semantic or accent?** Semantic (`warning`, `destructive`, `success`, `info`) when the chip says something is *in a state*; accent (`green`, `blue`, `orange`, `rose`, `gray`) when it's one of several *categories*. Keep the value → color map in one constant so every screen badges the same concept identically.

```tsx
<AmpChip color="success">Approved</AmpChip>

<AmpSwitch name={`enabled-${id}`} value={enabled} onChange={onToggle} />

<AmpSelect
  name="market" label="Market" value={market}
  dropdownItems={markets.map((m) => ({ id: m.value, alias: m.label }))}
  onChange={(v) => setMarket(v)}
/>

<AmpFileUploader
  name="file" value={file ? [file] : null}
  onChangeFile={(files) => setFile(files?.[0] ?? null)}
  acceptedTypes={[".xls", ".xlsx", ".pdf", ".csv"]}
  multiple={false}
  maxSize={10 * 1024 * 1024}
/>
```

### Date pickers

| Select… | Use |
|---|---|
| a single day / range of days | `AmpDayPicker` / `AmpDayRangePicker` |
| a single month / range of months | `AmpMonthPicker` / `AmpMonthRangePicker` |
| a single year / range of years | `AmpYearPicker` / `AmpYearRangePicker` |
| a time / time range | `AmpTimePicker` / `AmpTimeRangePicker` |

Single: `value={date}` + `onChange(date)`. Range: `value={{ from, to }}` + `onChange(range)`. Every picker takes `name` + `label`. Display format follows the i18n language (English → `MM/dd/yyyy`).

### Toasts — `useAmpSnackbar`

The provider is mounted globally. The hook returns per-severity helpers — **not** notistack's `enqueueSnackbar`:

```tsx
const notify = useAmpSnackbar()
notify.success("Trade saved")
notify.error("Upload failed", { title: "Error" })
// also: warning, info, show, dismiss(key?)
```

---

## E. Layout — `AmpStack` / `AmpGrid` / `AmpBox`

Props are **tokens** (`gap="md"`, `p="lg"`, `bg="card"`), a raw **number → px**, or any CSS string. Flow props (`direction`/`align`/`justify`/`wrap`/`gap`, grid `cols`/`span`, `display`) accept a responsive `{ xs, sm, md, lg, xl }` object.

```tsx
<AmpStack direction="row" align="center" justify="between" gap="md" p="md">…</AmpStack>

<AmpGrid cols={{ xs: 1, sm: 2 }} gap="md"><Field /><Field /></AmpGrid>

<AmpGrid cols={12} gap="md">
  <AmpGridItem span={{ xs: 12, sm: 4 }}>…</AmpGridItem>
  <AmpGridItem span={{ xs: 12, sm: 8 }}>…</AmpGridItem>
</AmpGrid>

<AmpBox p="md" bg="card" border rounded="md">…</AmpBox>
```

| CSS idea | Prop |
|---|---|
| flex direction / align-items / justify-content | `direction` / `align` / `justify` |
| gap / padding / margin | `gap` / `p`, `px`, `py`… / `m`, `mb`… |
| flex-wrap | `wrap="wrap"` |
| width / min / max | `w` / `minW` / `maxW` |
| border / radius / background | `border` / `rounded` / `bg` |
| ellipsis | `truncate` |
| text-align | `textAlign` |
| position + offsets + z-index | `position` + `top`/`left`/… + `zIndex` |
| responsive hide | `display={{ xs: "none", md: "block" }}` |
| anything else | `style={{ … }}` |

**Spacing tokens** (8-pt grid): `none`=0 · `xs`=4 · `sm`=8 · `md`=16 · `lg`=24 · `xl`=32 · `2xl`=48.
**Breakpoints:** `sm`=640 · `md`=768 · `lg`=1024 · `xl`=1280.

**Gotcha — `grow` is `flex-grow: 1` only.** When a flex child must fill the leftover space regardless of its content, use `<AmpBox grow minW={0} style={{ flexBasis: 0 }}>`.

### Page layout (list / table pages)

```
┌─ Page ─────────────────────────────────────────────────────────────┐
│  Header: [Title] ───────────────────────────────── [Action buttons] │
│  Filter bar:                                                        │
│   [Primary filters] [Refresh] ── [Search] [Actions] [Export] [Adv ⌄] │
│  Advanced filters (collapsible, 3-col grid)                         │
│  Table                                                              │
│  Pagination (right-aligned)                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Filter bar order (canonical, left → right)

1. **Primary filters** — date range, account, market, …
2. **Refresh** — `AmpRefetchIcon`
3. *(spacer)*
4. **Search** — `AmpSearchInput` (width-bounded)
5. **Actions** — `AmpActionsButton` (single mode, static label, `loading` while running)
6. **Export**
7. **Advanced filters** — `AmpAdvancedFiltersIcon` opening `AmpAdvancedFilters`

Don't put Search first. Don't move Refresh to the right.

**Alignment:** shared-tw inputs are 40px tall with the **label above**. Align the row with `align="end"` so input boxes line up with buttons, and wrap bare controls that aren't 40px (the refetch icon, a spinner) in a 40px-tall centered box.

```tsx
<AmpStack direction="row" align="end" gap="md" wrap="wrap">
  <AmpBox minW={280}>
    <AmpDayRangePicker
      name="period" label="Time Period"
      value={{ from: start, to: end }}
      onChange={(r) => { setStart(r?.from); setEnd(r?.to) }}
    />
  </AmpBox>
  <AmpBox minW={160}>
    <AmpSelect name="show" label="Show" value={show}
      dropdownItems={opts.map((o) => ({ id: o.value, alias: o.label }))}
      onChange={setShow} />
  </AmpBox>
  <AmpStack h={40} justify="center">
    <AmpRefetchIcon onClick={refetch} loading={isFetching} tooltip="Refresh" />
  </AmpStack>
  <AmpBox grow minW={16} />
  <AmpBox w={320}>
    <AmpSearchInput name="search" value={q} onSearch={setQ} placeholder="Filter…" />
  </AmpBox>
  <AmpActionsButton multiple={false} label="Select action" options={actions} onSelect={onAction} />
  <AmpButton variant="primary" leftIcon={<AmpIcon icon={Plus} />} onClick={onCreate}>Create</AmpButton>
</AmpStack>
```

### Form layout

- Fields in `<AmpStack gap="md">`; side-by-side fields in `<AmpGrid cols={{ xs: 1, sm: 2 }} gap="md">`.
- Section header: `<AmpTypography variant="body-sm" weight="semibold">`.
- Between sections: `gap="lg"`.
- Footer buttons in `AmpDialog`'s `footer`, right-aligned: Cancel (`ghost`) then Save (`primary`, `loading`).
- Required fields: the input's `required` prop — never a hand-made asterisk.

---

## F. Text & language

The real app translates every string (en + es). For mockups, **English literals are fine** — but keep repeated labels and value → color/status maps in one constant per feature so they're easy to lift into locale files when a screen is ported. shared-tw's own labels (pagination, pickers, dismiss…) are already English via `components/shared-tw-provider.tsx`.

---

## Definition of done for a mock screen

- [ ] Built from `@powersphere/shared-tw` — no PrimeReact, no `components/ui/`, no hand-rolled controls
- [ ] All text via `AmpTypography`; no hardcoded hex, `px` spacing, `fontSize` or `fontWeight`
- [ ] No invented `ps:` classes
- [ ] List pages follow the page layout and filter-bar order
- [ ] Opened in the browser and clicked through (dialogs, sorting, pagination, pickers)
