"use client"

import { useState, useMemo, forwardRef, useImperativeHandle } from "react"

export type DailyLogHandle = { triggerShiftLogout: () => void }
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Dialog } from "primereact/dialog"
import { InputText } from "primereact/inputtext"
import { Dropdown } from "primereact/dropdown"

// ── Types ──────────────────────────────────────────────────────────────────
type DetailRow = { ts: string; operator: string; note: string }
type Log = {
  id: number; operator: string; customer: string; asset: string
  event: string; begin: string; restore: string; duration: string
  severity: "high" | "medium" | "low"; details: DetailRow[]
}
type Warning = { key: string; label: string; count: number }

// ── Seed data (from RTOMonitorMock/backend/data/logs.js) ───────────────────
const SEED_LOGS: Log[] = [
  {
    id: 1, operator: "MROD", customer: "Satokie", asset: "KRNCH_LD1",
    event: "Turbine T-12 offline – bearing overheat",
    begin: "03/10/2026 08:15", restore: "03/10/2026 14:30", duration: "6h 15m", severity: "high",
    details: [
      { ts: "03/10/2026 08:20", operator: "MROD", note: "Bearing temperature exceeded 120 °C. Turbine shut down automatically." },
      { ts: "03/10/2026 09:00", operator: "MROD", note: "Maintenance crew dispatched to site." },
      { ts: "03/10/2026 14:30", operator: "MROD", note: "Turbine restored after bearing replacement. WO-2026-0341." },
    ],
  },
  {
    id: 2, operator: "LCHE", customer: "NW Groupe", asset: "SGSA_ESR1",
    event: "Load curtailment request from ERCOT",
    begin: "03/10/2026 11:45", restore: "03/10/2026 13:00", duration: "1h 15m", severity: "medium",
    details: [
      { ts: "03/10/2026 11:45", operator: "LCHE", note: "ERCOT issued emergency curtailment. 4 MW shed across circuits." },
      { ts: "03/10/2026 13:00", operator: "LCHE", note: "Full compliance confirmed. ERC-2026-0088." },
    ],
  },
  {
    id: 3, operator: "APAT", customer: "Bitgas", asset: "KRNCH_LD1",
    event: "Scheduled DR event – morning peak",
    begin: "03/10/2026 06:00", restore: "03/10/2026 09:00", duration: "3h 00m", severity: "low",
    details: [
      { ts: "03/10/2026 06:00", operator: "APAT", note: "Pre-scheduled demand response window initiated. 1.2 MW reduced." },
      { ts: "03/10/2026 09:00", operator: "APAT", note: "Performance within contract targets. DR-2026-0122." },
    ],
  },
  {
    id: 4, operator: "JWIL", customer: "Satokie", asset: "SGSA_ESR1",
    event: "Emergency shutdown – fuel pressure drop",
    begin: "03/09/2026 22:30", restore: "03/10/2026 04:15", duration: "5h 45m", severity: "high",
    details: [
      { ts: "03/09/2026 22:32", operator: "JWIL", note: "Fuel supply pressure dropped to 18 PSI (min 25 PSI). Safety interlock triggered." },
      { ts: "03/09/2026 23:00", operator: "JWIL", note: "Root cause: upstream valve failure. Technician dispatched." },
      { ts: "03/10/2026 04:15", operator: "JWIL", note: "Valve replaced. Unit restored to service. EMR-2026-0019." },
    ],
  },
  {
    id: 5, operator: "SKIM", customer: "NW Groupe", asset: "KRNCH_LD1",
    event: "Inverter communication loss – String 4",
    begin: "03/10/2026 14:00", restore: "03/10/2026 15:30", duration: "1h 30m", severity: "medium",
    details: [
      { ts: "03/10/2026 14:05", operator: "SKIM", note: "Modbus communication timeout on String 4 inverter detected." },
      { ts: "03/10/2026 15:30", operator: "SKIM", note: "Remote reset resolved issue. No generation loss. CM-2026-0567." },
    ],
  },
  {
    id: 6, operator: "RMAR", customer: "Bitgas", asset: "SGSA_ESR1",
    event: "HVAC system optimization event",
    begin: "03/10/2026 16:30", restore: "03/10/2026 18:00", duration: "1h 30m", severity: "low",
    details: [
      { ts: "03/10/2026 16:30", operator: "RMAR", note: "Automated flex event triggered by VPP platform. Cooling setpoint raised 2 °F." },
      { ts: "03/10/2026 18:00", operator: "RMAR", note: "Event completed. Occupant comfort maintained. OPT-2026-0203." },
    ],
  },
]

const OPTIONAL_FIELDS = [
  { key: "customer", label: "Customer",      isEmpty: (v: string) => !v || v === "—" },
  { key: "asset",    label: "Asset",         isEmpty: (v: string) => !v || v === "—" },
  { key: "restore",  label: "Event Restore", isEmpty: (v: string) => !v || v === "—" },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, "0") }

function toLocalDTValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatDT(dtLocal: string) {
  if (!dtLocal) return "—"
  const [date, time] = dtLocal.split("T")
  const [y, m, dd] = date.split("-")
  return `${m}/${dd}/${y} ${time.slice(0, 5)}`
}

function calcDuration(b: string, r: string) {
  if (!b || !r) return "—"
  const diff = new Date(r).getTime() - new Date(b).getTime()
  if (diff <= 0) return "—"
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${pad(m)}m`
}

// ── Shared style constants ─────────────────────────────────────────────────
const CTRL_H = "30px"
const BORDER = "1px solid var(--surface-border)"

const thStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: "uppercase",
  letterSpacing: "0.06em", color: "var(--text-color-secondary)",
  background: "var(--surface-card)", borderBottom: BORDER,
  padding: "0.625rem 0.75rem",
}
const tdStyle: React.CSSProperties = {
  fontSize: 13, color: "var(--text-color)",
  padding: "0.625rem 0.75rem",
  borderBottom: BORDER, borderTop: "none", borderLeft: "none", borderRight: "none",
}
const fieldLabel: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.05em",
  color: "var(--text-color-secondary)", marginBottom: 4,
}
const nativeInput: React.CSSProperties = {
  width: "100%", padding: "0.375rem 0.5rem", fontSize: 12,
  border: BORDER, borderRadius: 6, background: "var(--surface-card)",
  color: "var(--text-color)", outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
}
const ddPt = {
  root: { style: { fontSize: 12, height: CTRL_H, border: BORDER } },
  input: { style: { fontSize: 12, padding: "0 0.5rem", height: "100%", display: "flex", alignItems: "center", minHeight: "unset" } },
  trigger: { style: { width: "1.75rem" } },
  item: { style: { fontSize: 12, padding: "0.375rem 0.75rem" } },
}

// ── Presentational atoms ───────────────────────────────────────────────────
function OperatorBadge({ code }: { code: string }) {
  return (
    <span style={{
      fontFamily: "monospace", fontSize: 11, fontWeight: 700,
      background: "var(--surface-section)", color: "var(--text-color-secondary)",
      padding: "2px 7px", borderRadius: 4, letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>
      {code}
    </span>
  )
}

function SevBadge({ s }: { s: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    high:   { bg: "rgba(217,119,6,0.10)",  color: "#b45309" },
    medium: { bg: "rgba(180,130,0,0.10)",  color: "#a07000" },
    low:    { bg: "rgba(45,122,45,0.10)",  color: "#2d7a2d" },
  }
  const st = map[s] ?? { bg: "rgba(100,100,100,0.1)", color: "#555" }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 8px", borderRadius: 999,
      fontSize: 11, fontWeight: 600, background: st.bg, color: st.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.color, flexShrink: 0 }} />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )
}

function DurationPill({ v }: { v: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "1px 8px",
      background: "var(--surface-section)", borderRadius: 999,
      fontSize: 11, fontWeight: 500, color: "var(--text-color-secondary)",
      fontFamily: "monospace", whiteSpace: "nowrap",
    }}>
      {v}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export const DailyLog = forwardRef<DailyLogHandle>(function DailyLog(_, ref) {
  const [logs, setLogs] = useState<Log[]>(SEED_LOGS)
  const [sessionIds, setSessionIds] = useState<Set<number>>(new Set())
  const [currentLog, setCurrentLog] = useState<Log | null>(null)

  // Panel
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<"form" | "warning">("form")
  const [warnings, setWarnings] = useState<Warning[]>([])

  // Filters
  const [filterCustomer, setFilterCustomer] = useState<string | null>(null)
  const [filterAsset, setFilterAsset]       = useState<string | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null)
  const [filterQuery, setFilterQuery]       = useState("")

  // Entry form
  const [eBegin,      setEBegin]      = useState("")
  const [eRestore,    setERestore]    = useState("")
  const [eDescriptor, setEDescriptor] = useState("")
  const [eSeverity,   setESeverity]   = useState("")
  const [eCustomer,   setECustomer]   = useState("")
  const [eAsset,      setEAsset]      = useState("")

  // Logout
  const [logoutProgress, setLogoutProgress] = useState(false)
  const [logoutSuccess,  setLogoutSuccess]  = useState(false)

  // Modal note
  const [modalNote, setModalNote] = useState("")

  // ── Derived ──
  const filteredLogs = useMemo(() => logs.filter(l => {
    if (filterCustomer && l.customer !== filterCustomer) return false
    if (filterAsset    && l.asset    !== filterAsset)    return false
    if (filterSeverity && l.severity !== filterSeverity) return false
    if (filterQuery) {
      const q = filterQuery.toLowerCase()
      if (!`${l.operator} ${l.customer} ${l.asset} ${l.event}`.toLowerCase().includes(q)) return false
    }
    return true
  }), [logs, filterCustomer, filterAsset, filterSeverity, filterQuery])

  const highCount   = filteredLogs.filter(l => l.severity === "high").length
  const mediumCount = filteredLogs.filter(l => l.severity === "medium").length

  const customerOpts = [...new Set(logs.map(l => l.customer))].map(v => ({ label: v, value: v }))
  const assetOpts    = [...new Set(logs.map(l => l.asset))].map(v => ({ label: v, value: v }))
  const severityOpts = [
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
  ]

  // ── Handlers ──
  const openLogEntry = () => {
    setEBegin(toLocalDTValue(new Date()))
    setERestore(""); setEDescriptor(""); setESeverity(""); setECustomer(""); setEAsset("")
    setPanelMode("form")
    setPanelOpen(true)
  }

  const submitLogEntry = () => {
    if (!eDescriptor.trim() || !eSeverity) return
    const now = new Date()
    const nowStr = `${pad(now.getMonth()+1)}/${pad(now.getDate())}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    const newId = logs.length ? Math.max(...logs.map(l => l.id)) + 1 : 1
    const newLog: Log = {
      id: newId, operator: "MROD",
      customer: eCustomer || "—", asset: eAsset || "—",
      event: eDescriptor.trim(),
      begin: formatDT(eBegin),
      restore: eRestore ? formatDT(eRestore) : "—",
      duration: calcDuration(eBegin, eRestore),
      severity: eSeverity as Log["severity"],
      details: [{ ts: nowStr, operator: "MROD", note: "Entry logged by operator." }],
    }
    setLogs(prev => [newLog, ...prev])
    setSessionIds(prev => new Set([...prev, newId]))
    setPanelOpen(false)
  }

  const getWarnings = (): Warning[] => {
    const sessionLogs = logs.filter(l => sessionIds.has(l.id))
    return OPTIONAL_FIELDS
      .map(f => ({ key: f.key, label: f.label, count: sessionLogs.filter(l => f.isEmpty(l[f.key as keyof Log] as string)).length }))
      .filter(w => w.count > 0)
  }

  const triggerShiftLogout = async () => {
    setLogoutProgress(true)
    await new Promise(r => setTimeout(r, 1500))
    setLogoutProgress(false)
    const warns = getWarnings()
    if (warns.length === 0) {
      setLogoutSuccess(true)
      await new Promise(r => setTimeout(r, 1800))
      setLogoutSuccess(false)
      setSessionIds(new Set()); setLogs(SEED_LOGS)
    } else {
      setWarnings(warns); setPanelMode("warning"); setPanelOpen(true)
    }
  }

  useImperativeHandle(ref, () => ({ triggerShiftLogout }))

  const checkAgain = async () => {
    setPanelOpen(false)
    await new Promise(r => setTimeout(r, 350))
    triggerShiftLogout()
  }

  const addModalNote = () => {
    if (!modalNote.trim() || !currentLog) return
    const now = new Date()
    const ts = `${pad(now.getMonth()+1)}/${pad(now.getDate())}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    const entry: DetailRow = { ts, operator: "—", note: modalNote.trim() }
    setLogs(prev => prev.map(l => l.id === currentLog.id ? { ...l, details: [...l.details, entry] } : l))
    setCurrentLog(prev => prev ? { ...prev, details: [...prev.details, entry] } : null)
    setModalNote("")
  }

  // ── Column body templates ──
  const operatorBody  = (r: Log) => <OperatorBadge code={r.operator} />
  const customerBody  = (r: Log) => (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-color)" }}>{r.customer}</div>
      <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginTop: 1 }}>{r.asset}</div>
    </div>
  )
  const beginBody    = (r: Log) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-color-secondary)", whiteSpace: "nowrap" }}>{r.begin}</span>
  const restoreBody  = (r: Log) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-color-secondary)", whiteSpace: "nowrap" }}>{r.restore}</span>
  const durationBody = (r: Log) => <DurationPill v={r.duration} />
  const severityBody = (r: Log) => <SevBadge s={r.severity} />
  const detailsBody  = (r: Log) => (
    <button
      onClick={() => { setCurrentLog(r); setModalNote("") }}
      title="Event Details"
      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color-secondary)", padding: "2px 4px", borderRadius: 4, display: "flex", alignItems: "center" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#cc1111" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-color-secondary)" }}
    >
      <i className="pi pi-file-edit" style={{ fontSize: 13 }} />
    </button>
  )

  // ── Panel shared button styles ──
  const btnSecondary: React.CSSProperties = {
    background: "none", border: BORDER, borderRadius: 6, fontSize: 12,
    fontWeight: 500, padding: "0.35rem 0.75rem", color: "var(--text-color-secondary)",
    cursor: "pointer",
  }
  const btnPrimary: React.CSSProperties = {
    background: "#cc1111", border: "none", borderRadius: 6, fontSize: 12,
    fontWeight: 600, padding: "0.35rem 0.875rem", color: "#fff", cursor: "pointer",
  }

  return (
    <>
      <style>{`@keyframes _dlFill { from { width:0% } to { width:100% } }`}</style>

      {/* ── Logout feedback (progress bar + success) ── */}
      {(logoutProgress || logoutSuccess) && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginBottom: "0.5rem" }}>
          {logoutSuccess && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: "#2d7a2d" }}>
              <i className="pi pi-check-circle" style={{ fontSize: 12 }} />
              Shift successfully closed
            </span>
          )}
          {logoutProgress && (
            <div style={{ width: 140, height: 2, background: "var(--surface-border)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#cc1111", animation: "_dlFill 1.5s linear forwards" }} />
            </div>
          )}
        </div>
      )}

      {/* ── Event Details Modal ── */}
      <Dialog
        visible={!!currentLog}
        onHide={() => { setCurrentLog(null); setModalNote("") }}
        header={currentLog ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(204,17,17,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="pi pi-book" style={{ fontSize: 12, color: "#cc1111" }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-color)" }}>{currentLog.event}</div>
              <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginTop: 1 }}>
                {currentLog.customer} · {currentLog.asset}
              </div>
            </div>
          </div>
        ) : null}
        style={{ width: 680 }}
        modal
        pt={{
          header:  { style: { borderBottom: BORDER, padding: "0.75rem 1rem" } },
          content: { style: { padding: "1rem" } },
        }}
      >
        {currentLog && (
          <>
            <div style={{ maxHeight: "52vh", overflowY: "auto", borderRadius: 8, border: BORDER }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, position: "sticky", top: 0, width: 160 }}>Timestamp</th>
                    <th style={{ ...thStyle, position: "sticky", top: 0, width: 90  }}>Operator</th>
                    <th style={{ ...thStyle, position: "sticky", top: 0 }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLog.details.map((d, i) => (
                    <tr key={i}>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12, color: "var(--text-color-secondary)", whiteSpace: "nowrap" }}>{d.ts}</td>
                      <td style={tdStyle}><OperatorBadge code={d.operator} /></td>
                      <td style={{ ...tdStyle, lineHeight: 1.5 }}>{d.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", paddingTop: "1rem", borderTop: BORDER }}>
              <input
                value={modalNote}
                onChange={e => setModalNote(e.target.value)}
                placeholder="Add a note to this event…"
                onKeyDown={e => e.key === "Enter" && addModalNote()}
                style={{
                  flex: 1, padding: "0.375rem 0.625rem", fontSize: 12,
                  border: BORDER, borderRadius: 6, background: "var(--surface-card)",
                  color: "var(--text-color)", outline: "none", fontFamily: "inherit",
                }}
              />
              <button
                onClick={addModalNote}
                disabled={!modalNote.trim()}
                style={{
                  background: "#cc1111", border: "none", borderRadius: 6, fontSize: 12,
                  fontWeight: 600, padding: "0.35rem 0.875rem", color: "#fff",
                  cursor: modalNote.trim() ? "pointer" : "not-allowed",
                  opacity: modalNote.trim() ? 1 : 0.4,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <i className="pi pi-plus" style={{ fontSize: 11 }} />
                Add
              </button>
            </div>
          </>
        )}
      </Dialog>

      {/* ── Split layout ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem" }}>

        {/* Table section */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Summary bar */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "1rem", padding: "0.5rem 0.875rem", borderRadius: 10, background: "var(--surface-card)", border: BORDER, marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(204,17,17,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="pi pi-list" style={{ fontSize: 12, color: "#cc1111" }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)", lineHeight: 1 }}>Daily Logs</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-color)", lineHeight: 1.2 }}>{filteredLogs.length}</div>
              </div>
            </div>

            <div style={{ width: 1, height: 24, background: "var(--surface-border)" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <i className="pi pi-exclamation-triangle" style={{ fontSize: 11, color: "#d97706" }} />
              <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>High</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#d97706" }}>{highCount}</span>
            </div>

            <div style={{ width: 1, height: 24, background: "var(--surface-border)" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <i className="pi pi-info-circle" style={{ fontSize: 11, color: "#a07000" }} />
              <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Medium</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#a07000" }}>{mediumCount}</span>
            </div>
          </div>

          {/* Filter bar */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
            <button
              onClick={() => { setFilterCustomer(null); setFilterAsset(null); setFilterSeverity(null); setFilterQuery("") }}
              title="Reset filters"
              style={{ width: CTRL_H, height: CTRL_H, display: "flex", alignItems: "center", justifyContent: "center", border: BORDER, borderRadius: 6, background: "var(--surface-card)", color: "var(--text-color-secondary)", cursor: "pointer", flexShrink: 0 }}
            >
              <i className="pi pi-refresh" style={{ fontSize: 11 }} />
            </button>

            <div style={{ position: "relative", flex: 1, minWidth: 160, height: CTRL_H }}>
              <i className="pi pi-search" style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-color-secondary)", pointerEvents: "none", zIndex: 1 }} />
              <InputText
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                placeholder="Search operator, customer, asset, event…"
                style={{ width: "100%", height: CTRL_H, paddingLeft: "1.85rem", paddingRight: "0.5rem", fontSize: 12, boxSizing: "border-box" }}
              />
            </div>

            <Dropdown value={filterCustomer} options={customerOpts} onChange={e => setFilterCustomer(e.value)} placeholder="Customer" showClear style={{ minWidth: 120 }} pt={ddPt} />
            <Dropdown value={filterAsset}    options={assetOpts}    onChange={e => setFilterAsset(e.value)}    placeholder="Asset"    showClear style={{ minWidth: 110 }} pt={ddPt} />
            <Dropdown value={filterSeverity} options={severityOpts} onChange={e => setFilterSeverity(e.value)} placeholder="Severity" showClear style={{ minWidth: 100 }} pt={ddPt} />

            <button
              onClick={openLogEntry}
              style={{ height: CTRL_H, display: "flex", alignItems: "center", gap: 6, background: "#cc1111", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, padding: "0 0.875rem", cursor: "pointer", flexShrink: 0 }}
            >
              <i className="pi pi-plus" style={{ fontSize: 11 }} />
              Log Entry
            </button>
          </div>

          {/* Table */}
          <div style={{ borderRadius: 16, overflow: "hidden", border: BORDER }}>
            <DataTable
              value={filteredLogs}
              dataKey="id"
              size="small"
              emptyMessage="No log entries match the current filters."
              style={{ background: "var(--surface-card)" }}
              pt={{
                thead: { style: { background: "var(--surface-card)" } },
                tbody: { style: { background: "var(--surface-card)" } },
                column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } },
              }}
            >
              <Column header="Operator"        body={operatorBody}  style={{ width: 100 }} />
              <Column header="Customer / Asset" body={customerBody}  style={{ minWidth: 150 }} />
              <Column field="event" header="Event Descriptor"        style={{ minWidth: 220 }} />
              <Column header="Begin"            body={beginBody}     style={{ width: 140 }} />
              <Column header="Restore"          body={restoreBody}   style={{ width: 140 }} />
              <Column header="Duration"         body={durationBody}  style={{ width: 90 }} />
              <Column header="Severity"         body={severityBody}  style={{ width: 100 }} />
              <Column header=""                 body={detailsBody}   style={{ width: 50 }} />
            </DataTable>
          </div>
        </div>

        {/* ── Slide-out panel ── */}
        <div style={{
          width: panelOpen ? 420 : 0,
          minWidth: panelOpen ? 420 : 0,
          overflow: "hidden",
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)",
          flexShrink: 0,
        }}>
          <div style={{ width: 420, background: "var(--surface-card)", border: BORDER, borderRadius: 12, display: "flex", flexDirection: "column", padding: "1.25rem", gap: "1rem", minHeight: 400 }}>

            {/* Panel header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-color)" }}>
                {panelMode === "form" ? "Log Entry" : "Incomplete Entries"}
              </span>
              <button onClick={() => setPanelOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color-secondary)", padding: 2 }}>
                <i className="pi pi-times" style={{ fontSize: 12 }} />
              </button>
            </div>

            {/* ── Entry form ── */}
            {panelMode === "form" && (
              <>
                <div>
                  <label style={fieldLabel}>Event Begin</label>
                  <input type="datetime-local" value={eBegin} onChange={e => setEBegin(e.target.value)} step="1" style={nativeInput} />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>
                    Event Descriptor <span style={{ color: "#cc1111" }}>*</span>
                  </label>
                  <textarea
                    value={eDescriptor}
                    onChange={e => setEDescriptor(e.target.value)}
                    placeholder="Describe the event…"
                    rows={5}
                    style={{ ...nativeInput, resize: "vertical" }}
                  />
                </div>

                <div>
                  <label style={fieldLabel}>Event Restore</label>
                  <input type="datetime-local" value={eRestore} onChange={e => setERestore(e.target.value)} step="1" style={nativeInput} />
                </div>

                <div>
                  <label style={fieldLabel}>
                    Severity <span style={{ color: "#cc1111" }}>*</span>
                  </label>
                  <select value={eSeverity} onChange={e => setESeverity(e.target.value)} style={nativeInput}>
                    <option value="">Select severity</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <select value={eCustomer} onChange={e => setECustomer(e.target.value)} style={nativeInput}>
                    <option value="">Customer</option>
                    <option>Satokie</option>
                    <option>NW Groupe</option>
                    <option>Bitgas</option>
                  </select>
                  <select value={eAsset} onChange={e => setEAsset(e.target.value)} style={nativeInput}>
                    <option value="">Asset</option>
                    <option>KRNCH_LD1</option>
                    <option>SGSA_ESR1</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "auto", paddingTop: "0.5rem" }}>
                  <button onClick={() => setPanelOpen(false)} style={btnSecondary}>Cancel</button>
                  <button
                    onClick={submitLogEntry}
                    disabled={!eBegin}
                    style={{ ...btnPrimary, opacity: eBegin ? 1 : 0.4, cursor: eBegin ? "pointer" : "not-allowed" }}
                  >
                    Log
                  </button>
                </div>
              </>
            )}

            {/* ── Warning view ── */}
            {panelMode === "warning" && (
              <>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "0.75rem", borderRadius: 8, background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(217,119,6,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <i className="pi pi-exclamation-triangle" style={{ fontSize: 14, color: "#d97706" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-color)" }}>Incomplete Entries</div>
                    <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginTop: 3 }}>Some optional fields were left empty this session.</div>
                  </div>
                </div>

                <div style={{ borderRadius: 8, border: BORDER, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: 70 }}>Count</th>
                        <th style={thStyle}>Missing Field</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warnings.map(w => (
                        <tr key={w.key}>
                          <td style={{ ...tdStyle, fontWeight: 700, color: "#d97706" }}>{w.count}</td>
                          <td style={tdStyle}>{w.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "auto", paddingTop: "0.5rem" }}>
                  <button onClick={() => setPanelOpen(false)} style={btnSecondary}>Cancel</button>
                  <button onClick={checkAgain} style={btnSecondary}>Check again</button>
                  <button onClick={() => { setPanelOpen(false); setSessionIds(new Set()); setLogs(SEED_LOGS) }} style={btnPrimary}>Confirm log out</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
})
