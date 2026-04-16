"use client"

import React, { useState, useMemo, useCallback } from "react"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts"

// ── Style constants ────────────────────────────────────────────────────────────
const BORDER = "1px solid var(--surface-border)"
const CTRL_H = "30px"

const nativeInput: React.CSSProperties = {
  height: CTRL_H, padding: "0 8px", fontSize: 12, border: BORDER, borderRadius: 6,
  background: "var(--surface-card)", color: "var(--text-color)", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
}
const btnSecondary: React.CSSProperties = {
  background: "none", border: BORDER, borderRadius: 6, fontSize: 12, fontWeight: 600,
  padding: "0 12px", height: CTRL_H, color: "var(--text-color)", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const btnPrimary: React.CSSProperties = {
  background: "#cc1111", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
  padding: "0 16px", height: CTRL_H, color: "#fff", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}

// ── Mock clients & meters ──────────────────────────────────────────────────────
type Signal = { key: string; label: string; feed: string; color: string }
type Client = {
  id: string
  name: string
  shortName: string
  duns: string
  qse: string
  meters: { esiid: string; label: string; signals: Signal[] }[]
}

const CLIENTS: Client[] = [
  {
    id: "jam", name: "JAM DATA LLC", shortName: "JAM DATA", duns: "1184965722400", qse: "QSE-001",
    meters: [
      {
        esiid: "10443720000195685", label: "JAM DATA – Site A",
        signals: [
          { key: "net_mw_jda", label: "Net Load MW – JDA", feed: "SCADA", color: "#cc1111" },
          { key: "net_mw_jdb", label: "Net Load MW – JDB", feed: "SCADA", color: "#374151" },
          { key: "gen_mw",     label: "Generation MW",     feed: "SCADA", color: "#2563eb" },
        ],
      },
      {
        esiid: "10443720000195686", label: "JAM DATA – Site B",
        signals: [
          { key: "net_mw_b",  label: "Net Load MW – B",   feed: "AMI",   color: "#7c3aed" },
          { key: "kvar_b",    label: "kVAR – B",           feed: "AMI",   color: "#0891b2" },
        ],
      },
    ],
  },
  {
    id: "solv", name: "SOLVERDE ENERGY", shortName: "SOLVERDE", duns: "0987654321000", qse: "QSE-002",
    meters: [
      {
        esiid: "10443720000281001", label: "SOLVERDE – Main",
        signals: [
          { key: "net_mw_sv1", label: "Net Load MW – SV1", feed: "SCADA", color: "#cc1111" },
          { key: "net_mw_sv2", label: "Net Load MW – SV2", feed: "SCADA", color: "#374151" },
        ],
      },
    ],
  },
  {
    id: "verdant", name: "VERDANT POWER CO", shortName: "VERDANT", duns: "1122334455000", qse: "QSE-003",
    meters: [
      {
        esiid: "10443720000391010", label: "VERDANT – North",
        signals: [
          { key: "net_mw_vn",  label: "Net Load MW – VN",  feed: "SCADA", color: "#cc1111" },
          { key: "react_vn",   label: "Reactive MW – VN",  feed: "AMI",   color: "#059669" },
        ],
      },
      {
        esiid: "10443720000391011", label: "VERDANT – South",
        signals: [
          { key: "net_mw_vs",  label: "Net Load MW – VS",  feed: "SCADA", color: "#7c3aed" },
        ],
      },
    ],
  },
  {
    id: "nexora", name: "NEXORA INDUSTRIAL", shortName: "NEXORA", duns: "9988776655000", qse: "QSE-001",
    meters: [
      {
        esiid: "10443720000501234", label: "NEXORA – Plant 1",
        signals: [
          { key: "net_mw_n1",  label: "Net Load MW – P1",  feed: "SCADA", color: "#cc1111" },
          { key: "net_mw_n2",  label: "Net Load MW – P2",  feed: "SCADA", color: "#374151" },
          { key: "dem_kw_n",   label: "Demand kW – P1",    feed: "AMI",   color: "#d97706" },
        ],
      },
    ],
  },
]

// ── Data generation ────────────────────────────────────────────────────────────
function seed(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0
  return Math.abs(h)
}

function generateSeries(
  signalKey: string,
  dateStr: string,
  intervalMin: 5 | 15 | 60 | 1440,
): { period: string; value: number; kwh: number }[] {
  const base = (seed(signalKey) % 40) + 30   // 30–70 MW base
  const noise = (seed(signalKey + "n") % 10) + 3
  const intervals = intervalMin === 1440 ? 30 : Math.floor(1440 / intervalMin)
  return Array.from({ length: intervals }, (_, i) => {
    const r = (seed(signalKey + dateStr + i) % 1000) / 1000
    const trend = i > intervals * 0.4 ? (i - intervals * 0.4) * 0.05 : 0
    const value = parseFloat((base + (r - 0.5) * noise + trend).toFixed(2))
    const minutes = i * intervalMin
    let label: string
    if (intervalMin === 1440) {
      const d = new Date(dateStr)
      d.setDate(d.getDate() + i)
      label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } else {
      const h = String(Math.floor(minutes / 60)).padStart(2, "0")
      const m = String(minutes % 60).padStart(2, "0")
      label = `${h}:${m}`
    }
    return { period: label, value, kwh: parseFloat((value * (intervalMin / 60)).toFixed(2)) }
  })
}

function mergeSeriesData(
  activeSignals: Signal[],
  dateStr: string,
  intervalMin: 5 | 15 | 60 | 1440,
) {
  if (activeSignals.length === 0) return []
  const first = generateSeries(activeSignals[0].key, dateStr, intervalMin)
  return first.map((pt, i) => {
    const row: Record<string, number | string> = { period: pt.period }
    activeSignals.forEach(sig => {
      const s = generateSeries(sig.key, dateStr, intervalMin)[i]
      row[sig.key]          = s.value
      row[sig.key + "_kwh"] = s.kwh
    })
    return row
  })
}

// ── Chip / pill helpers ────────────────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px",
      borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: "var(--surface-section)", border: BORDER, color: "var(--text-color)",
    }}>
      {label}
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--text-color-secondary)" }}>
        <i className="pi pi-times" style={{ fontSize: 9 }} />
      </button>
    </span>
  )
}

function MultiSelectDropdown({
  label, options, selected, onChange,
}: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [open])
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", border: BORDER, borderRadius: 6, background: "var(--surface-card)", minHeight: CTRL_H, padding: "2px 4px 2px 8px", gap: 4, flexWrap: "wrap", cursor: "pointer", minWidth: 160 }}
        onClick={() => setOpen(o => !o)}>
        {selected.length === 0
          ? <span style={{ fontSize: 12, color: "var(--text-color-secondary)", lineHeight: CTRL_H }}>{label}</span>
          : selected.map(s => <Chip key={s} label={s} onRemove={() => toggle(s)} />)
        }
        <div style={{ display: "flex", gap: 4, marginLeft: "auto", padding: "0 2px" }}>
          {selected.length > 0 && (
            <button onClick={e => { e.stopPropagation(); onChange([]) }}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-color-secondary)", padding: 2 }}>
              <i className="pi pi-times" style={{ fontSize: 10 }} />
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-color-secondary)", padding: 2 }}>
            <i className="pi pi-chevron-down" style={{ fontSize: 9 }} />
          </button>
        </div>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
          background: "var(--surface-card)", border: BORDER, borderRadius: 6,
          minWidth: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.14)", maxHeight: 240, overflowY: "auto",
        }}>
          {options.map(opt => (
            <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", cursor: "pointer", fontSize: 12 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-section)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none" }}>
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)}
                style={{ accentColor: "#cc1111", cursor: "pointer", margin: 0 }} />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, showKwh }: {
  active?: boolean; payload?: { name: string; value: number; color: string; dataKey: string }[]
  label?: string; showKwh: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "var(--surface-card)", border: BORDER, borderRadius: 8,
      padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.14)",
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--text-color)" }}>{label}</div>
      {payload.filter(p => !String(p.dataKey).endsWith("_kwh")).map(p => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ color: "var(--text-color-secondary)" }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: "var(--text-color)" }}>{p.value.toFixed(2)} MW</span>
          {showKwh && (
            <span style={{ color: "var(--text-color-secondary)", fontSize: 11 }}>
              ({(payload.find(x => x.dataKey === p.dataKey + "_kwh")?.value ?? 0).toFixed(2)} kWh)
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── KPI tile ──────────────────────────────────────────────────────────────────
function KpiTile({ label, value, unit, sub }: { label: string; value: string; unit: string; sub?: string }) {
  return (
    <div style={{
      border: BORDER, borderRadius: 10, padding: "12px 18px",
      background: "var(--surface-card)", width: 150, flexShrink: 0,
      display: "flex", flexDirection: "column", gap: 2,
    }}>
      <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-color-secondary)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, overflow: "hidden" }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text-color)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
        <span style={{ fontSize: 12, color: "var(--text-color-secondary)", flexShrink: 0 }}>{unit}</span>
      </div>
      {sub && <span style={{ fontSize: 10, color: "var(--text-color-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</span>}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MeterReadingsPage() {
  const today = new Date().toISOString().split("T")[0]

  // Filters
  const [dateStr,       setDateStr]       = useState(today)
  const [selectedCPs,   setSelectedCPs]   = useState<string[]>(["JAM DATA"])
  const [selectedFeeds, setSelectedFeeds] = useState<string[]>(["SCADA"])
  const [selectedSigs,  setSelectedSigs]  = useState<string[]>(["Net Load MW – JDA", "Net Load MW – JDB"])
  const [interval,      setInterval]      = useState<5 | 15 | 60 | 1440>(15)
  const [unit,          setUnit]          = useState<"kW" | "MW">("MW")
  const [showKwh,       setShowKwh]       = useState(true)

  // Derived options from selected clients
  const allClients = CLIENTS.map(c => c.shortName)

  const activeClients = useMemo(
    () => CLIENTS.filter(c => selectedCPs.includes(c.shortName)),
    [selectedCPs]
  )

  const allFeeds = useMemo(() => {
    const feeds = new Set<string>()
    activeClients.forEach(c => c.meters.forEach(m => m.signals.forEach(s => feeds.add(s.feed))))
    return [...feeds]
  }, [activeClients])

  const allSignals = useMemo(() => {
    const sigs = new Map<string, Signal>()
    activeClients.forEach(c =>
      c.meters.forEach(m =>
        m.signals.forEach(s => {
          if (selectedFeeds.length === 0 || selectedFeeds.includes(s.feed)) sigs.set(s.label, s)
        })
      )
    )
    return [...sigs.values()]
  }, [activeClients, selectedFeeds])

  const activeSignals = useMemo(
    () => allSignals.filter(s => selectedSigs.includes(s.label)),
    [allSignals, selectedSigs]
  )

  // Auto-select first signals when client/feed changes and current selection is empty or stale
  React.useEffect(() => {
    const validLabels = new Set(allSignals.map(s => s.label))
    const stillValid = selectedSigs.filter(s => validLabels.has(s))
    if (stillValid.length === 0 && allSignals.length > 0) {
      setSelectedSigs(allSignals.slice(0, 2).map(s => s.label))
    } else if (stillValid.length !== selectedSigs.length) {
      setSelectedSigs(stillValid)
    }
  }, [allSignals]) // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = useMemo(
    () => mergeSeriesData(activeSignals, dateStr, interval),
    [activeSignals, dateStr, interval]
  )

  // KPIs
  const kpis = useMemo(() => {
    if (!chartData.length || activeSignals.length === 0) return null
    const sums = activeSignals.map(sig => {
      const total = chartData.reduce((s, row) => s + (row[sig.key] as number), 0)
      const avg   = total / chartData.length
      const max   = Math.max(...chartData.map(r => r[sig.key] as number))
      const kwh   = chartData.reduce((s, row) => s + (row[sig.key + "_kwh"] as number), 0)
      return { sig, avg, max, kwh }
    })
    const totalKwh = sums.reduce((s, x) => s + x.kwh, 0)
    const avgLoad  = sums.reduce((s, x) => s + x.avg, 0) / sums.length
    const peakLoad = Math.max(...sums.map(x => x.max))
    return { totalKwh, avgLoad, peakLoad }
  }, [chartData, activeSignals])

  const [tableOpen,     setTableOpen]     = useState(true)
  const [hiddenCols,    setHiddenCols]    = useState<Set<string>>(new Set())
  const [colsMenuOpen,  setColsMenuOpen]  = useState(false)
  const colsMenuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!colsMenuOpen) return
    const h = (e: MouseEvent) => { if (colsMenuRef.current && !colsMenuRef.current.contains(e.target as Node)) setColsMenuOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [colsMenuOpen])

  const toggleCol = (key: string) => setHiddenCols(prev => {
    const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n
  })

  const visibleSignals = activeSignals.filter(s => !hiddenCols.has(s.key))

  const displayMultiplier = unit === "kW" ? 1000 : 1
  const displayUnit = unit === "kW" ? "kW" : "MW"

  const formatDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  return (
    <DashboardLayout pageTitle="Meter Readings">
      {/* Main tab */}
      <div style={{ display: "flex", borderBottom: BORDER, marginBottom: 20 }}>
        <button style={{
          background: "none", border: "none", cursor: "pointer", padding: "10px 20px",
          fontSize: 13, fontWeight: 600, color: "var(--text-color)",
          borderBottom: "2px solid #cc1111", marginBottom: -1,
        }}>Resources</button>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>

        {/* Date picker */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-color-secondary)" }}>Time Period</label>
          <div style={{ display: "flex", alignItems: "center", border: BORDER, borderRadius: 6, background: "var(--surface-card)", height: CTRL_H, padding: "0 10px", gap: 8, minWidth: 200 }}>
            <span style={{ fontSize: 12, color: "var(--text-color)" }}>
              {formatDate(dateStr)} – {formatDate(dateStr)}
            </span>
            <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }} />
            <button onClick={() => {
              const el = document.getElementById("mr-date-picker") as HTMLInputElement | null
              el?.showPicker?.()
            }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--text-color-secondary)", marginLeft: "auto" }}>
              <i className="pi pi-calendar" style={{ fontSize: 14 }} />
            </button>
          </div>
          <input
            id="mr-date-picker"
            type="date"
            value={dateStr}
            onChange={e => setDateStr(e.target.value)}
            style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
          />
        </div>

        {/* Customer */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-color-secondary)" }}>Customer</label>
          <MultiSelectDropdown
            label="All clients"
            options={allClients}
            selected={selectedCPs}
            onChange={setSelectedCPs}
          />
        </div>

        {/* Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-color-secondary)" }}>Feed</label>
          <MultiSelectDropdown
            label="All feeds"
            options={allFeeds}
            selected={selectedFeeds}
            onChange={setSelectedFeeds}
          />
        </div>

        {/* Signal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-color-secondary)" }}>Signal</label>
          <MultiSelectDropdown
            label="Select signals"
            options={allSignals.map(s => s.label)}
            selected={selectedSigs}
            onChange={setSelectedSigs}
          />
        </div>

        {/* Refresh + Data Download */}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...btnSecondary, width: CTRL_H, padding: 0, justifyContent: "center" }}>
            <i className="pi pi-refresh" style={{ fontSize: 13 }} />
          </button>
          <button style={{ ...btnPrimary, border: "1px solid #cc1111", background: "none", color: "#cc1111" }}>
            Data Download
          </button>
        </div>
      </div>

      {/* ── Interval + unit controls ──────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        {/* Interval toggle */}
        <div style={{ display: "flex", border: BORDER, borderRadius: 8, overflow: "hidden" }}>
          {([5, 15, 60, 1440] as const).map((iv, idx) => {
            const labels: Record<number, string> = { 5: "5 min", 15: "15 min", 60: "Hourly", 1440: "Daily" }
            const active = interval === iv
            return (
              <button key={iv} onClick={() => setInterval(iv)} style={{
                padding: "6px 18px", fontSize: 12, fontWeight: active ? 700 : 400,
                border: "none", cursor: "pointer",
                borderRight: idx < 3 ? BORDER : "none",
                background: active ? "#cc1111" : "var(--surface-card)",
                color: active ? "#fff" : "var(--text-color)",
                transition: "all 0.15s",
              }}>{labels[iv]}</button>
            )
          })}
        </div>

        {/* Unit + kWh toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* kW / MW */}
          <div style={{ display: "flex", border: BORDER, borderRadius: 8, overflow: "hidden" }}>
            {(["kW", "MW"] as const).map((u, idx) => (
              <button key={u} onClick={() => setUnit(u)} style={{
                padding: "4px 14px", fontSize: 12, fontWeight: unit === u ? 700 : 400,
                border: "none", cursor: "pointer",
                borderRight: idx === 0 ? BORDER : "none",
                background: unit === u ? "#cc1111" : "var(--surface-card)",
                color: unit === u ? "#fff" : "var(--text-color)",
              }}>{u}</button>
            ))}
          </div>

          {/* kWh toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 500, color: "var(--text-color)" }}>
            <span style={{
              width: 36, height: 20, borderRadius: 10, background: showKwh ? "#cc1111" : "var(--surface-border)",
              position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0,
            }} onClick={() => setShowKwh(v => !v)}>
              <span style={{
                position: "absolute", top: 2, left: showKwh ? 18 : 2,
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </span>
            kWh
          </label>
        </div>
      </div>

      {/* ── KPI row ───────────────────────────────────────────────────────────── */}
      {kpis && activeSignals.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <KpiTile label="Avg Load"   value={(kpis.avgLoad  * displayMultiplier).toFixed(1)} unit={displayUnit} sub={formatDate(dateStr)} />
          <KpiTile label="Peak Load"  value={(kpis.peakLoad * displayMultiplier).toFixed(1)} unit={displayUnit} />
          <KpiTile label="Total kWh"  value={kpis.totalKwh.toFixed(0)} unit="kWh" sub={`${activeSignals.length} signal${activeSignals.length > 1 ? "s" : ""}`} />
          <KpiTile label="Signals"    value={String(activeSignals.length)} unit="" sub={activeSignals.map(s => s.feed).filter((v, i, a) => a.indexOf(v) === i).join(" · ")} />
        </div>
      )}

      {/* ── Chart + Table side-by-side ────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, alignItems: "stretch", height: 440 }}>

        {/* ── Collapsible data table ── */}
        {tableOpen && activeSignals.length > 0 && chartData.length > 0 && (
          <div style={{ width: 260, flexShrink: 0, border: BORDER, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--surface-card)" }}>
            {/* Table toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: BORDER, background: "var(--surface-section)", flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-color-secondary)" }}>Raw Data</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {/* Columns picker */}
                <div ref={colsMenuRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setColsMenuOpen(o => !o)}
                    title="Toggle columns"
                    style={{ background: "none", border: BORDER, borderRadius: 5, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-color-secondary)" }}
                  >
                    <i className="pi pi-table" style={{ fontSize: 11 }} />
                  </button>
                  {colsMenuOpen && (
                    <div style={{
                      position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 200,
                      background: "var(--surface-card)", border: BORDER, borderRadius: 6,
                      minWidth: 200, boxShadow: "0 4px 12px rgba(0,0,0,0.14)",
                      padding: "6px 0",
                    }}>
                      <div style={{ padding: "4px 12px 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-color-secondary)", borderBottom: BORDER, marginBottom: 4 }}>
                        Show / Hide Columns
                      </div>
                      {activeSignals.map(sig => (
                        <label key={sig.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-section)" }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none" }}>
                          <input type="checkbox" checked={!hiddenCols.has(sig.key)} onChange={() => toggleCol(sig.key)}
                            style={{ accentColor: "#cc1111", cursor: "pointer", margin: 0 }} />
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: sig.color, flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sig.label}</span>
                        </label>
                      ))}
                      {showKwh && (
                        <>
                          <div style={{ borderTop: BORDER, margin: "4px 0" }} />
                          {activeSignals.map(sig => (
                            <label key={sig.key + "_kwh"} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-section)" }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none" }}>
                              <input type="checkbox" checked={!hiddenCols.has(sig.key + "_kwh")} onChange={() => toggleCol(sig.key + "_kwh")}
                                style={{ accentColor: "#cc1111", cursor: "pointer", margin: 0 }} />
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: sig.color, flexShrink: 0, opacity: 0.4 }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-color-secondary)" }}>{sig.label} (kWh)</span>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* Collapse table button */}
                <button
                  onClick={() => setTableOpen(false)}
                  title="Hide table"
                  style={{ background: "none", border: BORDER, borderRadius: 5, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-color-secondary)" }}
                >
                  <i className="pi pi-chevron-left" style={{ fontSize: 10 }} />
                </button>
              </div>
            </div>

            {/* Scrollable table */}
            <div style={{ overflowY: "auto", overflowX: "auto", flex: 1 }}>
              <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr style={{ background: "var(--surface-section)" }}>
                    <th style={{ padding: "6px 10px", textAlign: "left", borderBottom: BORDER, fontWeight: 600, color: "var(--text-color-secondary)", whiteSpace: "nowrap", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Period
                    </th>
                    {visibleSignals.map(sig => (
                      <React.Fragment key={sig.key}>
                        {!hiddenCols.has(sig.key) && (
                          <th style={{ padding: "6px 10px", textAlign: "right", borderBottom: BORDER, fontWeight: 600, color: "var(--text-color-secondary)", whiteSpace: "nowrap", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: sig.color, flexShrink: 0 }} />
                              {displayUnit}
                            </span>
                          </th>
                        )}
                        {showKwh && !hiddenCols.has(sig.key + "_kwh") && (
                          <th style={{ padding: "6px 10px", textAlign: "right", borderBottom: BORDER, fontWeight: 600, color: "var(--text-color-secondary)", whiteSpace: "nowrap", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            kWh
                          </th>
                        )}
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "var(--surface-card)" : "var(--surface-section)" }}>
                      <td style={{ padding: "5px 10px", borderBottom: BORDER, color: "var(--text-color-secondary)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {row.period as string}
                      </td>
                      {visibleSignals.map(sig => (
                        <React.Fragment key={sig.key}>
                          {!hiddenCols.has(sig.key) && (
                            <td style={{ padding: "5px 10px", borderBottom: BORDER, textAlign: "right", color: "var(--text-color)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                              {((row[sig.key] as number) * displayMultiplier).toFixed(2)}
                            </td>
                          )}
                          {showKwh && !hiddenCols.has(sig.key + "_kwh") && (
                            <td style={{ padding: "5px 10px", borderBottom: BORDER, textAlign: "right", color: "var(--text-color-secondary)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                              {(row[sig.key + "_kwh"] as number).toFixed(2)}
                            </td>
                          )}
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Show-table button when hidden ── */}
        {!tableOpen && (
          <button
            onClick={() => setTableOpen(true)}
            title="Show data table"
            style={{
              width: 32, flexShrink: 0,
              background: "var(--surface-card)", border: BORDER, borderRadius: 12,
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8,
              color: "var(--text-color-secondary)",
              padding: "14px 0",
            }}
          >
            <i className="pi pi-table" style={{ fontSize: 13 }} />
            <i className="pi pi-chevron-right" style={{ fontSize: 9, opacity: 0.5 }} />
          </button>
        )}

        {/* ── Chart ── */}
        <div style={{ flex: 1, minWidth: 0, border: BORDER, borderRadius: 12, background: "var(--surface-card)", padding: "20px 16px 12px", display: "flex", flexDirection: "column" }}>
          {activeSignals.length === 0 || chartData.length === 0 ? (
            <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-color-secondary)", fontSize: 13 }}>
              Select at least one signal to display data.
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: showKwh ? 70 : 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10, fill: "var(--text-color-secondary)" }}
                  tickLine={false}
                  label={{ value: "Period", position: "insideBottom", offset: -10, fontSize: 11, fill: "var(--text-color-secondary)" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: "var(--text-color-secondary)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${(v * displayMultiplier).toFixed(0)}`}
                  label={{ value: displayUnit, angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--text-color-secondary)" }}
                />
                {showKwh && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => v.toFixed(0)}
                    label={{ value: "kWh", angle: 90, position: "insideRight", offset: 10, fontSize: 11, fill: "#6b7280" }}
                  />
                )}
                <Tooltip content={<ChartTooltip showKwh={showKwh} />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={val => String(val)} />
                {activeSignals.map(sig => (
                  <Line
                    key={sig.key}
                    yAxisId="left"
                    type="monotone"
                    dataKey={sig.key}
                    name={sig.label}
                    stroke={sig.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: sig.color }}
                    activeDot={{ r: 5 }}
                  />
                ))}
                {showKwh && activeSignals.map(sig => (
                  <Line
                    key={sig.key + "_kwh"}
                    yAxisId="right"
                    type="monotone"
                    dataKey={sig.key + "_kwh"}
                    name={sig.label + " (kWh)"}
                    stroke={sig.color}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    dot={false}
                    activeDot={{ r: 4 }}
                    legendType="none"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
