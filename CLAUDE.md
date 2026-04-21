# PowerSphere — Claude Code Rules

This is a Next.js 16 App Router project (React 19, TypeScript 5.7) for an enterprise energy operations platform. These rules are **non-negotiable** and must be followed in every file, every session, without exception.

---

## Style: Inline styles only

- **NEVER use Tailwind `className`** (e.g. `className="flex gap-4 text-sm"` is forbidden)
- **NEVER use CSS modules** (`.module.css` files)
- All styling must be done via the `style` prop with inline style objects

---

## Icons: PrimeIcons only

- **NEVER import from `lucide-react`** (e.g. `import { FileText } from "lucide-react"` is forbidden)
- Use PrimeIcons exclusively: `<i className="pi pi-[name]" />`

---

## PrimeReact: DataTable, Column, Dialog ONLY

These are the **only** PrimeReact components allowed:
```ts
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Dialog } from "primereact/dialog"
```

**NEVER import or use any of the following PrimeReact components:**
- `Button` — use native `<button style={...}>`
- `InputText` — use native `<input style={...}>`
- `Dropdown` — use native `<select style={...}>`
- `Tag` — use a `<span>` with inline styles
- `InputSwitch` — use a native `<input type="checkbox">` styled manually
- `Checkbox` — use a native `<input type="checkbox">` styled manually
- `TabView` / `TabPanel` — build tab bars with native `<button>` elements

---

## Standard style constants

Define these at the top of every file that needs them (copy exactly):

```ts
const BORDER = "1px solid var(--surface-border)"
const CTRL_H = "30px"

const nativeInput: React.CSSProperties = {
  height: CTRL_H, padding: "0 0.5rem", fontSize: 12, border: BORDER, borderRadius: 6,
  background: "var(--surface-card)", color: "var(--text-color)", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
}
const nativeSelect: React.CSSProperties = { ...nativeInput, cursor: "pointer" }

const btnPrimary: React.CSSProperties = {
  background: "#cc1111", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
  padding: "0.35rem 0.875rem", color: "#fff", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const btnSecondary: React.CSSProperties = {
  background: "none", border: BORDER, borderRadius: 6, fontSize: 12, fontWeight: 500,
  padding: "0.35rem 0.875rem", color: "var(--text-color)", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}

const thStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, padding: "8px 12px",
  background: "var(--surface-section)", color: "var(--text-color-secondary)",
}
const tdStyle: React.CSSProperties = { fontSize: 12, padding: "8px 12px" }
```

---

## CSS tokens (always use these — never hardcode background/text colors)

| Token | Usage |
|---|---|
| `var(--surface-card)` | Card and input backgrounds |
| `var(--surface-section)` | Secondary / nested backgrounds |
| `var(--surface-ground)` | Page background |
| `var(--surface-border)` | All borders |
| `var(--surface-hover)` | Hover state backgrounds |
| `var(--text-color)` | Primary text |
| `var(--text-color-secondary)` | Muted / label text |

### Brand colors
- **Brand red:** `#cc1111` — primary buttons, active states, highlights
- **Success green:** `#2d7a2d`
- **Warning/pending:** `#b45309`
- **Info blue:** `#2563eb`

---

## Recurring UI patterns

### Tab bar
```tsx
<div style={{ display: "flex", gap: 0, borderBottom: BORDER, marginBottom: 20 }}>
  {tabs.map(tab => (
    <button key={tab.key} onClick={() => setActive(tab.key)} style={{
      padding: "0.5rem 1rem", fontSize: 12, fontWeight: active === tab.key ? 600 : 400,
      border: "none", borderBottom: active === tab.key ? "2px solid #cc1111" : "2px solid transparent",
      background: "none", cursor: "pointer", color: active === tab.key ? "#cc1111" : "var(--text-color-secondary)",
      display: "inline-flex", alignItems: "center", gap: 6,
    }}>
      <i className={tab.icon} style={{ fontSize: 12 }} />
      {tab.label}
    </button>
  ))}
</div>
```

### Status pill (no PrimeReact Tag)
```tsx
<span style={{
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
  background: "#dcfce7", color: "#166534",
}}>
  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#166534" }} />
  Active
</span>
```

### Active nav state
```ts
borderLeft: "2px solid #cc1111"
background: "rgba(204,17,17,0.08)"
color: "#cc1111"
```

---

## Architecture

- **No Redux / Zustand** — local `useState` + context only
- **Mock data only** — no backend calls, in-memory CRUD
- **Global client data** — `useCounterparties()` from `lib/counterparty-context.tsx`
- **Dark mode default** — `next-themes`, dark is default
- **No comments** unless the WHY is non-obvious

---

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
```
