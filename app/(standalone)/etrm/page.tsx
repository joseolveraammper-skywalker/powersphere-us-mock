"use client"

import React, { useState, useRef, useMemo, useEffect } from "react"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Dialog } from "primereact/dialog"
import type { DataTableExpandedRows } from "primereact/datatable"
import { useCounterparties } from "@/lib/counterparty-context"
import { ETRM_INVOICE_DATA } from "@/lib/etrm-invoice-mock"

const MOCK_USER_EMAIL = "admin@powersphere.com"
const BORDER = "1px solid var(--surface-border)"
const CTRL_H = "30px"

const nativeInput: React.CSSProperties = {
  height: CTRL_H, padding: "0 8px", fontSize: 12, border: BORDER, borderRadius: 6,
  background: "var(--surface-card)", color: "var(--text-color)", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box", width: "100%",
}
const nativeSelect: React.CSSProperties = { ...nativeInput, cursor: "pointer" }
const btnPrimary: React.CSSProperties = {
  background: "#cc1111", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
  padding: "0.35rem 0.875rem", color: "#fff", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const btnSecondary: React.CSSProperties = {
  background: "none", border: BORDER, borderRadius: 6, fontSize: 12, fontWeight: 600,
  padding: "0.35rem 0.875rem", color: "var(--text-color)", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const btnSuccess: React.CSSProperties = {
  background: "#2d7a2d", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
  padding: "0.35rem 0.875rem", color: "#fff", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const btnDanger: React.CSSProperties = {
  background: "none", border: "1px solid #dc2626", borderRadius: 6, fontSize: 12, fontWeight: 600,
  padding: "0.35rem 0.875rem", color: "#dc2626", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const thStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, padding: "8px 12px",
  background: "var(--surface-section)", color: "var(--text-color-secondary)",
}
const tdStyle: React.CSSProperties = { fontSize: 12, padding: "8px 12px" }

// ── Types ────────────────────────────────────────────────────────────────────
type UploadedDocument = { id: string; name: string; description: string; uploadedBy: string; lastModified: string }
type Trade = {
  id: string; tradeName: string; tradeDate: string; tradeType: string; commodity: string
  qse: string; duns: string; portfolio: string; productType: string; strategy: string
  counterParty: string; sleeveCounterparty: string; broker: string; brokerageFee: string
  brokerageFeeUom: string; status: "Draft" | "Pending Approval" | "Approved" | "Rejected"
  documents?: UploadedDocument[]
}

// ── Options ──────────────────────────────────────────────────────────────────
const TRADE_TYPE_OPTIONS = ["Physical", "Financial", "Option", "Swap", "Forward"]
const COMMODITY_OPTIONS = ["Power", "Natural Gas", "Crude Oil", "Coal", "Renewable Energy Credits"]
const QSE_OPTIONS = ["QSE-001", "QSE-002", "QSE-003", "QSE-004", "QSE-005"]
const PORTFOLIO_OPTIONS = ["Trading Book A", "Trading Book B", "Hedging Portfolio", "Speculation Portfolio"]
const PRODUCT_TYPE_OPTIONS = ["Day Ahead", "Real Time", "Term", "Balancing"]
const STRATEGY_OPTIONS = ["Arbitrage", "Hedging", "Speculation", "Market Making"]
const BROKER_OPTIONS = ["Tradition", "ICAP", "BGC", "GFI", "Tullett Prebon"]
const BROKERAGE_FEE_UOM_OPTIONS = ["$/MWh", "$/MMBtu", "Flat Fee", "% of Notional"]

function generateTradeName(tradeDate: string, seq: number): string {
  const parts = tradeDate.split("-")
  if (parts.length !== 3) return `- - - - ${tradeDate} - ${tradeDate} - - - - ${String(seq).padStart(3, "0")}`
  const d = `${parts[1]}/${parts[2]}/${parts[0]}`
  return `- - - - ${d} - ${d} - - - - ${String(seq).padStart(3, "0")}`
}

const initialTrades: Trade[] = [
  { id: "1", tradeName: "- - - - 03/20/2026 - 03/20/2026 - - - - 001", tradeDate: "2026-03-20", tradeType: "Physical", commodity: "Power", qse: "QSE-001", duns: "123456789", portfolio: "Trading Book A", productType: "Day Ahead", strategy: "Arbitrage", counterParty: "EDF", sleeveCounterparty: "", broker: "Tradition", brokerageFee: "0.05", brokerageFeeUom: "$/MWh", status: "Approved" },
  { id: "2", tradeName: "- - - - 03/22/2026 - 03/22/2026 - - - - 002", tradeDate: "2026-03-22", tradeType: "Financial", commodity: "Natural Gas", qse: "QSE-002", duns: "987654321", portfolio: "Hedging Portfolio", productType: "Term", strategy: "Hedging", counterParty: "SHELL", sleeveCounterparty: "ENGIE", broker: "ICAP", brokerageFee: "0.02", brokerageFeeUom: "$/MMBtu", status: "Pending Approval" },
  { id: "3", tradeName: "- - - - 03/24/2026 - 03/24/2026 - - - - 003", tradeDate: "2026-03-24", tradeType: "Swap", commodity: "Power", qse: "QSE-003", duns: "456789123", portfolio: "Trading Book B", productType: "Real Time", strategy: "Market Making", counterParty: "VISTRA", sleeveCounterparty: "", broker: "BGC", brokerageFee: "100", brokerageFeeUom: "Flat Fee", status: "Draft" },
]

// ── Sub-components ───────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", paddingTop: 8, marginBottom: 20 }}>
      <div style={{
        position: "absolute", top: 0, left: 16, padding: "0 8px", zIndex: 1,
        fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
        background: "var(--surface-ground)", color: "#cc1111",
      }}>{title}</div>
      <div style={{
        border: BORDER, borderRadius: 8, padding: 20, background: "var(--surface-card)",
        display: "flex", flexDirection: "column", gap: 16,
      }}>{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: "var(--text-color-secondary)" }}>{label}</label>
      {children}
    </div>
  )
}

function StatusPill({ status }: { status: Trade["status"] }) {
  const map: Record<Trade["status"], { bg: string; color: string }> = {
    "Approved":         { bg: "#dcfce7", color: "#166534" },
    "Rejected":         { bg: "#fee2e2", color: "#991b1b" },
    "Pending Approval": { bg: "#fef9c3", color: "#854d0e" },
    "Draft":            { bg: "var(--surface-section)", color: "var(--text-color-secondary)" },
  }
  const s = map[status]
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px",
      borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
      {status}
    </span>
  )
}

// ── Reports mock data ─────────────────────────────────────────────────────────
type ApprovalStatus = "pending" | "approved" | "rejected"
type ReportContract = {
  id: string; name: string; contractType: "Physical" | "Financial"
  mwh: number; settlement: number; sleeveFee: number; total: number; fixedPlusSleeve: number; avgMarketPrice: number | null; floatingPrice: number | null
  invoiceArrived: boolean; approvalStatus: ApprovalStatus; sapStatus: "pending" | "sent" | "failed"
  rejectNote?: string
}
type ReportGroup = { counterParty: string; contracts: ReportContract[] }

const REPORT_DATA: ReportGroup[] = [
  {
    counterParty: "EDF",
    contracts: [
      { id: "e1", name: "174 Power - QSE - 2026-01-01-2026-12-31, 7x24, Real-Time",    contractType: "Physical",  mwh: 1440,   settlement: -75801.60,  sleeveFee: 0,      total: -75801.60,  fixedPlusSleeve: 52.64,  avgMarketPrice: null,  floatingPrice: null,    invoiceArrived: true,  approvalStatus: "approved", sapStatus: "sent"    },
    ],
  },
  {
    counterParty: "ENGIE",
    contracts: [
      { id: "n1", name: "997 Power - QSE - 2026-03-01-2026-04-30, 5x16, Real-Time",    contractType: "Financial", mwh: -1760,  settlement: 14031.78,   sleeveFee: -880,   total: 13151.78,   fixedPlusSleeve: 36.75,  avgMarketPrice: 28.28, floatingPrice: -8.47,   invoiceArrived: true,  approvalStatus: "approved", sapStatus: "sent"    },
      { id: "n2", name: "996 Power - QSE - 2026-03-01-2026-04-30, 5x16, Real-Time",    contractType: "Financial", mwh: -1280,  settlement: 12086.85,   sleeveFee: -640,   total: 11446.85,   fixedPlusSleeve: 34.00,  avgMarketPrice: 24.06, floatingPrice: -9.94,   invoiceArrived: true,  approvalStatus: "pending",  sapStatus: "pending" },
      { id: "n3", name: "731 Power - QSE - 2025-05-01-2026-04-30, 7x8, Day-Ahead",     contractType: "Financial", mwh: 300,    settlement: -13387.40,  sleeveFee: 0,      total: -13387.40,  fixedPlusSleeve: 145.00, avgMarketPrice: 40.02, floatingPrice: -102.98, invoiceArrived: true,  approvalStatus: "rejected", sapStatus: "pending" },
      { id: "n4", name: "1001 Power - QSE - 2026-03-01-2026-04-30, 2x16, Real-Time",   contractType: "Financial", mwh: -640,   settlement: 6043.42,    sleeveFee: -320,   total: 5723.42,    fixedPlusSleeve: 34.00,  avgMarketPrice: 24.06, floatingPrice: -9.94,   invoiceArrived: true,  approvalStatus: "pending",  sapStatus: "pending" },
      { id: "n5", name: "566 Power - QSE - 2026-01-01-2026-12-31, 7x24, Real-Time",    contractType: "Physical",  mwh: 2400,   settlement: -133152.00, sleeveFee: -600,   total: -133752.00, fixedPlusSleeve: 55.73,  avgMarketPrice: null,  floatingPrice: null,    invoiceArrived: false, approvalStatus: "pending",  sapStatus: "pending" },
      { id: "n6", name: "960 Power - QSE - 2026-03-01-2026-04-30, 7x8, Real-Time",     contractType: "Financial", mwh: 3520,   settlement: -20143.56,  sleeveFee: -1760,  total: -21903.56,  fixedPlusSleeve: 34.00,  avgMarketPrice: 28.28, floatingPrice: -6.22,   invoiceArrived: true,  approvalStatus: "approved", sapStatus: "pending" },
      { id: "n7", name: "995 Power - QSE - 2026-04-01-2026-03-31, 5x16, Real-Time",    contractType: "Financial", mwh: -1760,  settlement: 16231.78,   sleeveFee: -880,   total: 15351.78,   fixedPlusSleeve: 38.00,  avgMarketPrice: 28.28, floatingPrice: -9.72,   invoiceArrived: true,  approvalStatus: "pending",  sapStatus: "pending" },
    ],
  },
  {
    counterParty: "VISTRA",
    contracts: [
      { id: "v1", name: "203 Power - QSE - 2026-01-01-2026-12-31, 7x24, Real-Time",    contractType: "Physical",  mwh: 720,    settlement: -38400.00,  sleeveFee: 0,      total: -38400.00,  fixedPlusSleeve: 28.10,  avgMarketPrice: null,  floatingPrice: null,    invoiceArrived: true,  approvalStatus: "pending",  sapStatus: "pending" },
    ],
  },
  {
    counterParty: "SHELL",
    contracts: [
      { id: "s1", name: "441 Power - QSE - 2026-03-01-2026-04-30, 5x16, Real-Time",    contractType: "Financial", mwh: -880,   settlement: 7215.60,    sleeveFee: -440,   total: 6775.60,    fixedPlusSleeve: 18.50,  avgMarketPrice: 24.06, floatingPrice: -9.94,   invoiceArrived: true,  approvalStatus: "pending",  sapStatus: "pending" },
    ],
  },
]

const ALL_COUNTERPARTIES = REPORT_DATA.map(g => g.counterParty)

type ColKey = "mwh" | "settlement" | "sleeveFee" | "total" | "fixedPlusSleeve" | "avgMarketPrice" | "floatingPrice" | "invoice" | "approval" | "sap"
const SETTLEMENT_COLS: { key: ColKey; label: string; width: number; align: "right" | "center" | "left"; required?: boolean }[] = [
  { key: "mwh",             label: "MWh",                      width: 100, align: "right"  },
  { key: "settlement",      label: "Settlement",               width: 120, align: "right"  },
  { key: "sleeveFee",       label: "Sleeve Fee",               width: 110, align: "right"  },
  { key: "total",           label: "Total",                    width: 120, align: "right"  },
  { key: "fixedPlusSleeve", label: "Fixed Price + Sleeve Fee", width: 160, align: "right"  },
  { key: "avgMarketPrice",  label: "Avg. Market Price",        width: 130, align: "right"  },
  { key: "floatingPrice",   label: "Floating Price",           width: 120, align: "right"  },
  { key: "invoice",         label: "Invoice",                  width: 60,  align: "center", required: true },
  { key: "approval",        label: "Status",                   width: 60,  align: "center", required: true },
  { key: "sap",             label: "SAP",                      width: 60,  align: "center", required: true },
]

function fmt(n: number): string {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n < 0 ? `-$${abs}` : `$${abs}`
}

function MoneyCell({ value }: { value: number }) {
  return (
    <span style={{ color: value < 0 ? "#dc2626" : "var(--text-color)", fontSize: 12 }}>
      {fmt(value)}
    </span>
  )
}

// ── Status icon cell ──────────────────────────────────────────────────────────
function PendingDots() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#9ca3af" }} />
      ))}
    </span>
  )
}

function ClickTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [open])
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center" }}
      >
        {children}
      </button>
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          background: "#1f2937", color: "#fff", fontSize: 11, padding: "5px 8px", borderRadius: 5,
          whiteSpace: "normal", zIndex: 9999, boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          maxWidth: 260, textAlign: "center", lineHeight: 1.5, width: "max-content",
        }}>
          {text}
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
            borderTop: "5px solid #1f2937",
          }} />
        </div>
      )}
    </div>
  )
}

function StatusIcon({ value, type, tooltip }: { value: boolean | ApprovalStatus | "pending" | "sent" | "failed"; type: "arrived" | "approval" | "sap"; tooltip: string }) {
  let icon: React.ReactNode
  if (type === "arrived") {
    icon = value
      ? <i className="pi pi-check" style={{ color: "#16a34a", fontSize: 13, fontWeight: 700 }} />
      : <PendingDots />
  } else if (type === "approval") {
    if (value === "approved") icon = <i className="pi pi-check" style={{ color: "#16a34a", fontSize: 13, fontWeight: 700 }} />
    else if (value === "rejected") icon = <i className="pi pi-times" style={{ color: "#dc2626", fontSize: 13, fontWeight: 700 }} />
    else icon = <PendingDots />
  } else {
    if (value === "sent")   icon = <i className="pi pi-check" style={{ color: "#16a34a", fontSize: 13, fontWeight: 700 }} />
    else if (value === "failed") icon = <i className="pi pi-times" style={{ color: "#dc2626", fontSize: 13, fontWeight: 700 }} />
    else icon = <PendingDots />
  }
  return <ClickTooltip text={tooltip}>{icon}</ClickTooltip>
}

// ── ETRM Reports ──────────────────────────────────────────────────────────────
function ETRMReports() {
  const [reportChip, setReportChip] = useState<"m2m" | "settlement" | "credit">("settlement")
  const [month, setMonth] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
  const [selectedCPs, setSelectedCPs] = useState<string[]>(ALL_COUNTERPARTIES)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(REPORT_DATA.map(g => g.counterParty)))
  const [tradeTypeFilter, setTradeTypeFilter] = useState<"All" | "Financial" | "Physical">("All")
  const [collapsedSubgroups, setCollapsedSubgroups] = useState<Set<string>>(new Set())

  const toggleSubgroup = (key: string) =>
    setCollapsedSubgroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  const [actionOpen, setActionOpen]   = useState(false)
  const [colsOpen,   setColsOpen]     = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectNote, setRejectNote]   = useState("")
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
  // contracts state (mutable for approve/reject)
  const [contracts, setContracts] = useState<ReportContract[]>(() =>
    REPORT_DATA.flatMap(g => g.contracts)
  )
  const invoiceByContractId = useMemo(
    () => new Map(ETRM_INVOICE_DATA.map(r => [r.contractId, r])),
    []
  )
  // selected contract IDs (individual level only)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [invoiceValidationOpen, setInvoiceValidationOpen] = useState(false)
  // visible columns
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(
    () => new Set(SETTLEMENT_COLS.map(c => c.key))
  )
  const actionRef = useRef<HTMLDivElement>(null)
  const colsRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) setActionOpen(false)
      if (colsRef.current   && !colsRef.current.contains(e.target as Node))   setColsOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const reportChips = [
    { key: "m2m" as const,        label: "Mark to Market(M2M)" },
    { key: "settlement" as const, label: "Settlement Report" },
    { key: "credit" as const,     label: "Credit & Collateral" },
  ]

  const toggleCP = (cp: string) =>
    setSelectedCPs(prev => prev.includes(cp) ? prev.filter(x => x !== cp) : [...prev, cp])

  // Derive group rows from mutable contracts state
  const filteredGroups = useMemo(() =>
    REPORT_DATA
      .filter(g => selectedCPs.includes(g.counterParty))
      .map(g => ({ ...g, contracts: contracts.filter(c => g.contracts.some(oc => oc.id === c.id)) })),
    [selectedCPs, contracts]
  )

  const groupRows = filteredGroups.map(g => ({
    counterParty: g.counterParty,
    contracts: g.contracts,
    mwh:             g.contracts.reduce((s, c) => s + c.mwh, 0),
    settlement:      g.contracts.reduce((s, c) => s + c.settlement, 0),
    sleeveFee:       g.contracts.reduce((s, c) => s + c.sleeveFee, 0),
    total:           g.contracts.reduce((s, c) => s + c.total, 0),
    fixedPlusSleeve: g.contracts.reduce((s, c) => s + c.fixedPlusSleeve, 0),
  }))

  // KPIs derived from contracts state
  const kpiApproved = contracts.filter(c => c.approvalStatus === "approved").length
  const kpiRejected = contracts.filter(c => c.approvalStatus === "rejected").length

  // Selection helpers
  const groupContractIds = (cp: string) =>
    (REPORT_DATA.find(g => g.counterParty === cp)?.contracts ?? []).map(c => c.id)

  const groupChecked = (cp: string): boolean | "indeterminate" => {
    const ids = groupContractIds(cp)
    const selCount = ids.filter(id => selectedIds.has(id)).length
    if (selCount === 0) return false
    if (selCount === ids.length) return true
    return "indeterminate"
  }

  const toggleGroupSelection = (cp: string) => {
    const ids = groupContractIds(cp)
    const allSelected = ids.every(id => selectedIds.has(id))
    setSelectedIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id))
      return next
    })
  }

  const toggleContractSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Actions
  const handleApproveSelected = () => {
    setContracts(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, approvalStatus: "approved" } : c))
    setSelectedIds(new Set())
    setActionOpen(false)
  }

  const handleRejectOpen = () => {
    // Only one individual contract selected
    if (selectedIds.size !== 1) return
    setRejectTargetId([...selectedIds][0])
    setRejectNote("")
    setRejectModal(true)
    setActionOpen(false)
  }

  const handleRejectConfirm = () => {
    if (!rejectNote.trim() || !rejectTargetId) return
    setContracts(prev => prev.map(c => c.id === rejectTargetId ? { ...c, approvalStatus: "rejected", rejectNote: rejectNote.trim() } : c))
    setSelectedIds(new Set())
    setRejectModal(false)
    setRejectTargetId(null)
    setRejectNote("")
  }

  // Reject is only enabled when exactly 1 individual contract is selected
  const canReject = selectedIds.size === 1

  const toggleCol = (key: ColKey) =>
    setVisibleCols(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

  type GroupRow = typeof groupRows[0]
  const renderGroupCell = (r: GroupRow, key: ColKey): React.ReactNode => {
    switch (key) {
      case "mwh":             return <div style={{ textAlign: "right" }}><span style={{ fontWeight: 700 }}>{r.mwh.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
      case "settlement":      return <div style={{ textAlign: "right" }}><MoneyCell value={r.settlement} /></div>
      case "sleeveFee":       return <div style={{ textAlign: "right" }}><MoneyCell value={r.sleeveFee} /></div>
      case "total":           return <div style={{ textAlign: "right" }}><MoneyCell value={r.total} /></div>
      case "fixedPlusSleeve": return <div style={{ textAlign: "right" }}><MoneyCell value={r.fixedPlusSleeve} /></div>
      case "avgMarketPrice":  return <div style={{ textAlign: "right" }}><span style={{ color: "var(--text-color-secondary)" }}>—</span></div>
      case "floatingPrice":   return <div style={{ textAlign: "right" }}><span style={{ color: "var(--text-color-secondary)" }}>—</span></div>
      default:                return null
    }
  }

  const renderContractCell = (c: ReportContract, key: ColKey): React.ReactNode => {
    switch (key) {
      case "mwh":             return <div style={{ textAlign: "right" }}>{c.mwh.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
      case "settlement":      return <div style={{ textAlign: "right" }}><MoneyCell value={c.settlement} /></div>
      case "sleeveFee":       return <div style={{ textAlign: "right" }}><MoneyCell value={c.sleeveFee} /></div>
      case "total":           return <div style={{ textAlign: "right" }}><MoneyCell value={c.total} /></div>
      case "fixedPlusSleeve": return <div style={{ textAlign: "right" }}><MoneyCell value={c.fixedPlusSleeve} /></div>
      case "avgMarketPrice":  return <div style={{ textAlign: "right" }}>
        {c.avgMarketPrice != null ? <span style={{ fontSize: 12 }}>${c.avgMarketPrice.toFixed(2)}</span> : <span style={{ color: "var(--text-color-secondary)" }}>—</span>}
      </div>
      case "floatingPrice":   return <div style={{ textAlign: "right" }}>
        {c.floatingPrice != null ? <MoneyCell value={c.floatingPrice} /> : <span style={{ fontSize: 12, color: "var(--text-color-secondary)" }}>—</span>}
      </div>
      case "invoice":         return <div style={{ display: "flex", justifyContent: "center" }}><StatusIcon value={c.invoiceArrived} type="arrived" tooltip={c.invoiceArrived ? "The PDF Invoice has been downloaded" : "The PDF Invoice has not been received"} /></div>
      case "approval":        return <div style={{ display: "flex", justifyContent: "center" }}><StatusIcon value={c.approvalStatus} type="approval" tooltip={c.approvalStatus === "approved" ? "Approved by mockemail@ammper.com" : c.approvalStatus === "rejected" ? `Rejected by mockemail@ammper.com: ${c.rejectNote ?? ""}` : "Pending validation"} /></div>
      case "sap":             return <div style={{ display: "flex", justifyContent: "center" }}><StatusIcon value={c.sapStatus} type="sap" tooltip={c.sapStatus === "sent" ? "Sent to SAP with ID: 0000035348" : c.sapStatus === "failed" ? "Sending to SAP failed due to error: 429" : "Pending send to SAP"} /></div>
      default:                return null
    }
  }

  const dataVisCols   = SETTLEMENT_COLS.filter(c => !c.required && visibleCols.has(c.key))
  const statusVisCols = SETTLEMENT_COLS.filter(c => c.required)
  const visCols = [...dataVisCols, ...statusVisCols]
  const VAL_COL_W = 90
  const valCols = [
    { key: "val_mw",    label: "Total MW"  },
    { key: "val_total", label: "Total"     },
    { key: "val_rate",  label: "$/MWh"    },
  ]
  const statusW    = statusVisCols.reduce((s, c) => s + c.width, 0)
  const valTotalW  = invoiceValidationOpen ? valCols.length * VAL_COL_W : 0
  // minWidth: fixed cols + at least 80px per toggled data col so the table never collapses
  const minTableWidth = 48 + 48 + 220 + valTotalW + statusW + dataVisCols.length * 80
  const toggleExpand = (cp: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(cp) ? n.delete(cp) : n.add(cp); return n })

  return (
    <div>
      {/* Reject modal */}
      {rejectModal && (() => {
        const target = contracts.find(c => c.id === rejectTargetId)
        const invoice = rejectTargetId ? invoiceByContractId.get(rejectTargetId) : undefined
        return (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseDown={e => { if (e.target === e.currentTarget) { setRejectModal(false); setRejectNote("") } }}
          >
            <div style={{
              background: "var(--surface-card)", borderRadius: 12, width: 500, maxWidth: "92vw",
              display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px 14px", borderBottom: BORDER }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(220,38,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="pi pi-times-circle" style={{ fontSize: 16, color: "#dc2626" }} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-color)" }}>Reject Invoice</span>
                </div>
                <button
                  onClick={() => { setRejectModal(false); setRejectNote("") }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-color-secondary)", display: "flex", alignItems: "center" }}
                >
                  <i className="pi pi-times" style={{ fontSize: 14 }} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Contract summary card */}
                {target && (
                  <div style={{ background: "var(--surface-section)", border: BORDER, borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-color-secondary)" }}>Contract</div>
                    <div style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-color)", fontWeight: 500 }}>{target.name}</div>
                    {invoice && (
                      <div style={{ display: "flex", gap: 20, marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>
                          Invoice: <span style={{ fontWeight: 600, color: "var(--text-color)", fontFamily: "monospace" }}>{invoice.name}</span>
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>
                          Counterparty: <span style={{ fontWeight: 600, color: "var(--text-color)" }}>{target.name.split(" ")[0]}</span>
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>
                          Total: <span style={{ fontWeight: 600, color: invoice.invoiceTotal < 0 ? "#dc2626" : "#16a34a" }}>
                            {(() => { const abs = Math.abs(invoice.invoiceTotal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return invoice.invoiceTotal < 0 ? `-$${abs}` : `$${abs}` })()}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reason */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-color)" }}>Rejection reason <span style={{ color: "#dc2626" }}>*</span></label>
                    <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>{rejectNote.length}/300</span>
                  </div>
                  <textarea
                    value={rejectNote}
                    onChange={e => setRejectNote(e.target.value.slice(0, 300))}
                    rows={4}
                    autoFocus
                    placeholder="Describe why this invoice is being rejected..."
                    style={{
                      padding: "10px 12px", fontSize: 12, border: BORDER, borderRadius: 8,
                      background: "var(--surface-card)", color: "var(--text-color)",
                      outline: "none", fontFamily: "inherit", resize: "none",
                      boxSizing: "border-box", width: "100%", lineHeight: 1.5,
                      transition: "border-color 0.15s",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#dc2626" }}
                    onBlur={e => { e.currentTarget.style.borderColor = "var(--surface-border)" }}
                  />
                  <p style={{ fontSize: 11, color: "var(--text-color-secondary)", margin: 0 }}>
                    This message will be visible in the Status tooltip.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 24px", borderTop: BORDER }}>
                <button
                  onClick={() => { setRejectModal(false); setRejectNote("") }}
                  style={{ ...btnSecondary, height: 36, padding: "0 20px" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={!rejectNote.trim()}
                  style={{
                    height: 36, padding: "0 20px", border: "none", borderRadius: 6,
                    fontSize: 12, fontWeight: 600, cursor: rejectNote.trim() ? "pointer" : "not-allowed",
                    background: rejectNote.trim() ? "#dc2626" : "var(--surface-section)",
                    color: rejectNote.trim() ? "#fff" : "var(--text-color-secondary)",
                    display: "inline-flex", alignItems: "center", gap: 6,
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  <i className="pi pi-times-circle" style={{ fontSize: 12 }} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Report sub-chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {reportChips.map(c => (
          <button key={c.key} onClick={() => setReportChip(c.key)} style={{
            padding: "4px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: BORDER,
            background: reportChip === c.key ? "var(--surface-card)" : "transparent",
            color: "var(--text-color)",
            boxShadow: reportChip === c.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            fontWeight: reportChip === c.key ? 600 : 400,
          }}>{c.label}</button>
        ))}
      </div>

      {(reportChip === "m2m" || reportChip === "credit") && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, fontSize: 13, color: "var(--text-color-secondary)" }}>
          {reportChip === "m2m" ? "Mark to Market" : "Credit & Collateral"} — coming soon
        </div>
      )}

      {reportChip === "settlement" && (
        <>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-color-secondary)" }}>Month</label>
              <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ ...nativeInput, width: 140 }} />
            </div>
            {/* Trade type toggle */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-color-secondary)" }}>Contract Type</label>
              <div style={{ display: "flex", border: BORDER, borderRadius: 6, overflow: "hidden", height: CTRL_H }}>
                {(["All", "Financial", "Physical"] as const).map(opt => (
                  <button key={opt} onClick={() => setTradeTypeFilter(opt)} style={{
                    padding: "0 12px", fontSize: 12, border: "none", cursor: "pointer",
                    fontWeight: tradeTypeFilter === opt ? 600 : 400,
                    background: tradeTypeFilter === opt ? "#cc1111" : "var(--surface-card)",
                    color: tradeTypeFilter === opt ? "#fff" : "var(--text-color-secondary)",
                    borderRight: opt !== "Physical" ? BORDER : "none",
                  }}>{opt}</button>
                ))}
              </div>
            </div>

            {/* Columns picker */}
            <div ref={colsRef} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-color-secondary)" }}>Columns</label>
              <button onClick={() => setColsOpen(o => !o)} style={{ ...btnSecondary, height: CTRL_H, padding: "0 12px", gap: 6 }}>
                <i className="pi pi-table" style={{ fontSize: 11 }} />
                <span style={{ fontSize: 11, fontWeight: 600 }}>{SETTLEMENT_COLS.filter(c => !c.required && visibleCols.has(c.key)).length}/{SETTLEMENT_COLS.filter(c => !c.required).length}</span>
                <i className="pi pi-chevron-down" style={{ fontSize: 9 }} />
              </button>
              {colsOpen && (
                <div style={{
                  position: "absolute", left: 0, top: "calc(100% + 4px)", zIndex: 200,
                  background: "var(--surface-card)", border: BORDER, borderRadius: 6,
                  padding: "6px 0", minWidth: 210, boxShadow: "0 4px 12px rgba(0,0,0,0.14)",
                }}>
                  <div style={{ padding: "4px 14px 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-color-secondary)", borderBottom: BORDER, marginBottom: 4 }}>
                    Show / Hide Columns
                  </div>
                  {SETTLEMENT_COLS.filter(col => !col.required).map(col => (
                    <label key={col.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px", cursor: "pointer" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-section)" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none" }}>
                      <input type="checkbox" checked={visibleCols.has(col.key)} onChange={() => toggleCol(col.key)}
                        style={{ cursor: "pointer", accentColor: "#cc1111", margin: 0 }} />
                      <span style={{ fontSize: 12, color: "var(--text-color)" }}>{col.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-color-secondary)" }}>Counter Party</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, maxWidth: 640 }}>
                {ALL_COUNTERPARTIES.map(cp => {
                  const active = selectedCPs.includes(cp)
                  return (
                    <button key={cp} onClick={() => toggleCP(cp)} style={{
                      display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px",
                      borderRadius: 20, fontSize: 11, cursor: "pointer", border: BORDER,
                      background: active ? "var(--surface-section)" : "transparent",
                      color: active ? "var(--text-color)" : "var(--text-color-secondary)",
                      fontWeight: active ? 500 : 400,
                    }}>
                      {cp}{active && <i className="pi pi-times" style={{ fontSize: 9, opacity: 0.6 }} />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div style={{ borderTop: BORDER, marginBottom: 16 }} />

          {/* KPI + actions row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginBottom: 14 }}>
            {/* KPI tiles */}
            {[
              { label: "Pending validation", value: kpiApproved, color: "#a35116" },
              { label: "Approved",    value: kpiApproved, color: "#16a34a" },
              { label: "Rejected",    value: kpiRejected,  color: "#dc2626" },
            ].map(kpi => (
              <div key={kpi.label} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "4px 14px", border: BORDER, borderRadius: 6, background: "var(--surface-card)", minWidth: 90,
              }}>
                <span style={{ fontSize: 10, color: "var(--text-color-secondary)", whiteSpace: "nowrap" }}>{kpi.label}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: kpi.color, lineHeight: 1.2 }}>{kpi.value}</span>
              </div>
            ))}

            {/* Invoice Validation */}
            <button
              onClick={() => setInvoiceValidationOpen(o => !o)}
              style={{
                ...( invoiceValidationOpen ? { ...btnPrimary, background: "#16a34a", border: "none" } : btnPrimary ),
                height: CTRL_H, padding: "0 14px",
                transition: "background 0.2s",
              }}
            >
              <i className={`pi pi-${invoiceValidationOpen ? "check-circle" : "file-check"}`} style={{ fontSize: 12 }} />
              Invoice validation
            </button>

            {/* SELECT ACTION */}
            <div ref={actionRef} style={{ position: "relative" }}>
              <div style={{ display: "flex", border: "1px solid #cc1111", borderRadius: 6, overflow: "hidden" }}>
                <button onClick={() => setActionOpen(o => !o)} style={{
                  background: "none", border: "none", height: CTRL_H, padding: "0 12px",
                  fontSize: 11, fontWeight: 700, color: "#cc1111", cursor: "pointer", letterSpacing: "0.05em",
                }}>SELECT ACTION</button>
                <button onClick={() => setActionOpen(o => !o)} style={{
                  background: "none", border: "none", borderLeft: "1px solid #cc1111",
                  height: CTRL_H, padding: "0 8px", cursor: "pointer", display: "flex", alignItems: "center", color: "#cc1111",
                }}>
                  <i className="pi pi-chevron-down" style={{ fontSize: 10 }} />
                </button>
              </div>
              {actionOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 100,
                  background: "var(--surface-card)", border: BORDER, borderRadius: 6,
                  minWidth: 180, boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                }}>
                  {[
                    { label: "Check for invoices", action: () => setActionOpen(false), disabled: false },
                    { label: "Approve",             action: handleApproveSelected,      disabled: selectedIds.size === 0 },
                    { label: "Reject",              action: handleRejectOpen,           disabled: !canReject },
                  ].map(({ label, action, disabled }) => (
                    <button key={label} onClick={action} disabled={disabled} style={{
                      display: "block", width: "100%", textAlign: "left", background: "none",
                      border: "none", padding: "8px 14px", fontSize: 12,
                      cursor: disabled ? "not-allowed" : "pointer",
                      color: disabled ? "var(--text-color-secondary)" : "var(--text-color)",
                      opacity: disabled ? 0.5 : 1,
                    }}
                      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "var(--surface-section)" }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none" }}
                    >{label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settlement table — single unified table so all rows share one colgroup */}
          <div style={{ border: BORDER, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
          <div style={{ position: "relative", width: "100%", minWidth: minTableWidth }}>
          <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", borderSpacing: 0 }}>
            <colgroup>
              <col style={{ width: 48 }} />
              <col style={{ width: 48 }} />
              <col style={{ width: 220 }} />
              {/* spacer col always present — absorbs remaining width so fixed cols never get redistributed */}
              <col />
              {dataVisCols.map(col => <col key={col.key} />)}
              {invoiceValidationOpen && valCols.map(vc => <col key={vc.key} style={{ width: VAL_COL_W }} />)}
              {statusVisCols.map(col => <col key={col.key} style={{ width: col.width }} />)}
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle} />
                <th style={thStyle} />
                <th style={{ ...thStyle, textAlign: "left" }}>Counter Party</th>
                <th style={thStyle} />{/* spacer */}
                {dataVisCols.map(col => (
                  <th key={col.key} style={{ ...thStyle, textAlign: col.align }}>{col.label}</th>
                ))}
                {invoiceValidationOpen && valCols.map((vc) => (
                  <th key={vc.key} style={{
                    ...thStyle, textAlign: "right",
                    position: "relative", zIndex: 3, background: "transparent",
                    color: "#15803d",
                  }}>{vc.label}</th>
                ))}
                {statusVisCols.map(col => (
                  <th key={col.key} style={{ ...thStyle, textAlign: col.align }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupRows.length === 0 && (
                <tr><td colSpan={3 + 1 + dataVisCols.length + (invoiceValidationOpen ? valCols.length : 0) + statusVisCols.length} style={{ ...tdStyle, textAlign: "center", color: "var(--text-color-secondary)", padding: 24 }}>
                  No data for selected counterparties.
                </td></tr>
              )}
              {groupRows.map(group => {
                const isExp  = expanded.has(group.counterParty)
                const checked = groupChecked(group.counterParty)
                const showFin = tradeTypeFilter === "All" || tradeTypeFilter === "Financial"
                const showPhy = tradeTypeFilter === "All" || tradeTypeFilter === "Physical"
                const financial = group.contracts.filter(c => c.contractType === "Financial")
                const physical  = group.contracts.filter(c => c.contractType === "Physical")
                const finKey = `${group.counterParty}-financial`
                const phyKey = `${group.counterParty}-physical`
                const finCollapsed = collapsedSubgroups.has(finKey)
                const phyCollapsed = collapsedSubgroups.has(phyKey)
                const grpTd: React.CSSProperties = { ...tdStyle, fontWeight: 700, borderBottom: BORDER }
                const sgTd:  React.CSSProperties = { padding: "4px 12px", background: "var(--surface-section)" }
                const cTdBase: React.CSSProperties = { padding: "6px 12px", fontSize: 12, fontWeight: 400, borderBottom: BORDER }

                const valTd: React.CSSProperties = { position: "relative", zIndex: 3, background: "transparent" }

                const valCells = (ids: string[], calcMwh: number, calcTotal: number, base: React.CSSProperties) => {
                  if (!invoiceValidationOpen) return null
                  const recs = ids.map(id => invoiceByContractId.get(id)).filter(Boolean) as typeof ETRM_INVOICE_DATA
                  const none = recs.length === 0
                  const invMwh   = recs.reduce((s, r) => s + r.invoiceMwh,   0)
                  const invTotal = recs.reduce((s, r) => s + r.invoiceTotal, 0)
                  const invRate  = ids.length === 1 && recs[0] ? recs[0].invoiceRate : null
                  const mwhMatch   = !none && Math.abs(invMwh   - calcMwh)   < 0.05
                  const totalMatch = !none && Math.abs(invTotal - calcTotal) < 0.05
                  const dash = <span style={{ color: "var(--text-color-secondary)" }}>—</span>
                  return <>
                    <td style={{ ...base, ...valTd }}>
                      <div style={{ textAlign: "right", fontSize: 12, color: none ? "var(--text-color-secondary)" : mwhMatch ? "#166534" : "#dc2626", fontWeight: 600 }}>
                        {none ? dash : invMwh.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td style={{ ...base, ...valTd }}>
                      <div style={{ textAlign: "right", fontSize: 12, color: none ? "var(--text-color-secondary)" : totalMatch ? "#166534" : "#dc2626", fontWeight: 600 }}>
                        {none ? dash : (() => { const abs = Math.abs(invTotal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return invTotal < 0 ? `-$${abs}` : `$${abs}` })()}
                      </div>
                    </td>
                    <td style={{ ...base, ...valTd }}>
                      <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-color-secondary)" }}>
                        {invRate != null ? `$${Math.abs(invRate).toFixed(2)}` : dash}
                      </div>
                    </td>
                  </>
                }

                const contractRows = (list: ReportContract[], badgeBg: string, badgeColor: string, badgeLabel: string) =>
                  list.map(c => {
                    const sel = selectedIds.has(c.id)
                    const cTd: React.CSSProperties = { ...cTdBase, background: sel ? "rgba(204,17,17,0.04)" : "var(--surface-card)" }
                    return (
                      <tr key={c.id} onClick={() => toggleContractSelection(c.id)} style={{ cursor: "pointer" }}>
                        <td style={{ ...cTd, borderLeft: sel ? "2px solid rgba(204,17,17,0.4)" : "2px solid transparent" }}>
                          <input type="checkbox" checked={sel} onChange={() => toggleContractSelection(c.id)}
                            onClick={e => e.stopPropagation()} style={{ cursor: "pointer", accentColor: "#cc1111", margin: 0 }} />
                        </td>
                        <td style={cTd} />
                        <td style={{ ...cTd, maxWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                            <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: badgeBg, color: badgeColor }}>{badgeLabel}</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, fontFamily: "monospace", color: "var(--text-color-secondary)" }}>{c.name}</span>
                          </div>
                        </td>
                        <td style={cTd} />{/* spacer */}
                        {dataVisCols.map(col => <td key={col.key} style={cTd}>{renderContractCell(c, col.key)}</td>)}
                        {valCells([c.id], c.mwh, c.total, cTd)}
                        {statusVisCols.map(col => <td key={col.key} style={cTd}>{renderContractCell(c, col.key)}</td>)}
                      </tr>
                    )
                  })

                const subgroupHeader = (key: string, label: string, count: number, collapsed: boolean) => (
                  <tr key={`sg-${key}`}>
                    <td style={sgTd} />
                    <td style={{ ...sgTd, paddingLeft: 8 }}>
                      <button onClick={() => toggleSubgroup(key)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center" }}>
                        <i className={`pi pi-chevron-${collapsed ? "right" : "down"}`} style={{ fontSize: 9, color: "var(--text-color-secondary)" }} />
                      </button>
                    </td>
                    <td colSpan={1 + 1 + dataVisCols.length + (invoiceValidationOpen ? valCols.length : 0) + statusVisCols.length} style={sgTd}>
                      <button onClick={() => toggleSubgroup(key)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-color-secondary)" }}>
                          {label} <span style={{ fontWeight: 400 }}>({count})</span>
                        </span>
                      </button>
                    </td>
                  </tr>
                )

                const subgroupTotalRow = (list: ReportContract[], label: string) => {
                  const sub = {
                    counterParty: label,
                    contracts: list,
                    mwh:             list.reduce((s, c) => s + c.mwh, 0),
                    settlement:      list.reduce((s, c) => s + c.settlement, 0),
                    sleeveFee:       list.reduce((s, c) => s + c.sleeveFee, 0),
                    total:           list.reduce((s, c) => s + c.total, 0),
                    fixedPlusSleeve: list.reduce((s, c) => s + c.fixedPlusSleeve, 0),
                  }
                  const sTd: React.CSSProperties = {
                    padding: "5px 12px", fontSize: 12, fontWeight: 600,
                    background: "var(--surface-section)",
                    borderTop: `1px solid var(--surface-border)`,
                    borderBottom: `1px solid var(--surface-border)`,
                  }
                  return (
                    <tr key={`subtotal-${label}-${group.counterParty}`}>
                      <td style={sTd} />
                      <td style={sTd} />
                      <td style={sTd}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-color-secondary)", fontStyle: "italic" }}>
                          {label} Subtotal
                        </span>
                      </td>
                      <td style={sTd} />
                      {dataVisCols.map(col => <td key={col.key} style={sTd}>{renderGroupCell(sub, col.key)}</td>)}
                      {valCells(sub.contracts.map(c => c.id), sub.mwh, sub.total, sTd)}
                      {statusVisCols.map(col => <td key={col.key} style={sTd} />)}
                    </tr>
                  )
                }

                return (
                  <React.Fragment key={group.counterParty}>
                    {/* Group row */}
                    <tr style={{ background: "var(--surface-card)" }}>
                      <td style={grpTd}>
                        <input type="checkbox"
                          ref={el => { if (el) el.indeterminate = checked === "indeterminate" }}
                          checked={checked === true}
                          onChange={() => toggleGroupSelection(group.counterParty)}
                          style={{ cursor: "pointer", accentColor: "#cc1111" }} />
                      </td>
                      <td style={grpTd}>
                        <button onClick={() => toggleExpand(group.counterParty)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center" }}>
                          <i className={`pi pi-chevron-${isExp ? "down" : "right"}`} style={{ fontSize: 10, color: "var(--text-color-secondary)" }} />
                        </button>
                      </td>
                      <td style={grpTd}><span style={{ fontWeight: 700, fontSize: 13 }}>{group.counterParty}</span></td>
                      <td style={grpTd} />{/* spacer */}
                      {dataVisCols.map(col => <td key={col.key} style={grpTd}>{renderGroupCell(group, col.key)}</td>)}
                      {valCells(group.contracts.map(c => c.id), group.mwh, group.total, grpTd)}
                      {statusVisCols.map(col => <td key={col.key} style={grpTd}>{renderGroupCell(group, col.key)}</td>)}
                    </tr>
                    {/* Expansion */}
                    {isExp && <>
                      {showFin && financial.length > 0 && <>
                        {subgroupHeader(finKey, "Financial", financial.length, finCollapsed)}
                        {!finCollapsed && contractRows(financial, "rgba(124,58,237,0.1)", "#6d28d9", "Financial")}
                        {subgroupTotalRow(financial, "Financial")}
                      </>}
                      {showFin && showPhy && financial.length > 0 && physical.length > 0 && (
                        <tr><td colSpan={3 + 1 + dataVisCols.length + (invoiceValidationOpen ? valCols.length : 0) + statusVisCols.length} style={{ height: 6, background: "var(--surface-section)" }} /></tr>
                      )}
                      {showPhy && physical.length > 0 && <>
                        {subgroupHeader(phyKey, "Physical", physical.length, phyCollapsed)}
                        {!phyCollapsed && contractRows(physical, "rgba(37,99,235,0.1)", "#1d4ed8", "Physical")}
                        {subgroupTotalRow(physical, "Physical")}
                      </>}
                    </>}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>

          {/* Green box overlay — right-anchored at statusW so it always tracks the val columns */}
          {invoiceValidationOpen && (
            <div style={{
              position: "absolute",
              top: 0,
              right: statusW,
              bottom: 0,
              width: valTotalW,
              pointerEvents: "none",
              zIndex: 2,
              border: "2px solid rgba(22,163,74,0.7)",
              borderRadius: 10,
              background: "rgba(220,252,231,0.35)",
            }} />
          )}

          </div>{/* position relative */}
          </div>{/* overflowX auto */}
          </div>{/* border+radius wrapper */}
        </>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ETRMPage() {
  const { activeCounterparties } = useCounterparties()
  const counterpartyList = useMemo(() => {
    const list = activeCounterparties.map(c => c.counterparty).filter(Boolean)
    return list.length ? list : ["EDF", "ENGIE", "Vistra", "Axpo", "Shell"]
  }, [activeCounterparties])

  const [mainTab, setMainTab] = useState<"reports" | "st">("st")
  const [subChip, setSubChip] = useState<"trades" | "deal-entry" | "approvals" | "upload">("deal-entry")

  // Form state
  const [tradeDate, setTradeDate] = useState(() => new Date().toISOString().split("T")[0])
  const [tradeType, setTradeType] = useState("")
  const [commodity, setCommodity] = useState("")
  const [qse, setQse] = useState("")
  const [duns, setDuns] = useState("")
  const [portfolio, setPortfolio] = useState("")
  const [productType, setProductType] = useState("")
  const [strategy, setStrategy] = useState("")
  const [counterParty, setCounterParty] = useState("")
  const [sleeveCounterparty, setSleeveCounterparty] = useState("")
  const [broker, setBroker] = useState("")
  const [brokerageFee, setBrokerageFee] = useState("")
  const [brokerageFeeUom, setBrokerageFeeUom] = useState("")

  const [trades, setTrades] = useState<Trade[]>(initialTrades)
  const [expandedTradeRows, setExpandedTradeRows] = useState<DataTableExpandedRows>({})

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [newDocDescription, setNewDocDescription] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tradeName = useMemo(() => generateTradeName(tradeDate, trades.length + 1), [tradeDate, trades.length])

  const clearForm = () => {
    setTradeType(""); setCommodity(""); setQse(""); setDuns(""); setPortfolio("")
    setProductType(""); setStrategy(""); setCounterParty(""); setSleeveCounterparty("")
    setBroker(""); setBrokerageFee(""); setBrokerageFeeUom("")
  }

  const handleSaveTrade = () => {
    setTrades(prev => [...prev, {
      id: Date.now().toString(), tradeName, tradeDate, tradeType, commodity, qse, duns,
      portfolio, productType, strategy, counterParty, sleeveCounterparty, broker,
      brokerageFee, brokerageFeeUom, status: "Draft", documents: uploadedDocuments,
    }])
    clearForm(); setUploadedDocuments([])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploadedDocuments(prev => [...prev, {
      id: Date.now().toString(), name: files[0].name, description: newDocDescription,
      uploadedBy: MOCK_USER_EMAIL,
      lastModified: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
    }])
    setNewDocDescription("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const pendingTrades = trades.filter(t => t.status === "Pending Approval")

  const mainTabs = [
    { key: "reports" as const, label: "Reports" },
    { key: "st" as const,      label: "Standard Trade (ST)" },
  ]
  const subChips = [
    { key: "trades" as const,     label: "Trades" },
    { key: "deal-entry" as const, label: "Deal Entry" },
    { key: "approvals" as const,  label: "Approvals" },
    { key: "upload" as const,     label: "Upload Files" },
  ]

  return (
    <DashboardLayout pageTitle="ETRM">
      {/* Main tab bar */}
      <div style={{ display: "flex", borderBottom: BORDER, marginBottom: 20 }}>
        {mainTabs.map(t => (
          <button key={t.key} onClick={() => setMainTab(t.key)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "10px 20px",
            fontSize: 13, fontWeight: mainTab === t.key ? 600 : 400,
            color: mainTab === t.key ? "var(--text-color)" : "var(--text-color-secondary)",
            borderBottom: mainTab === t.key ? "2px solid #cc1111" : "2px solid transparent",
            marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {mainTab === "reports" && <ETRMReports />}

      {mainTab === "st" && (
        <>
          {/* Sub chips */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {subChips.map(c => (
              <button key={c.key} onClick={() => setSubChip(c.key)} style={{
                padding: "4px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: BORDER,
                background: subChip === c.key ? "var(--surface-card)" : "transparent",
                color: "var(--text-color)",
                boxShadow: subChip === c.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                fontWeight: subChip === c.key ? 600 : 400,
              }}>{c.label}</button>
            ))}
          </div>

          {/* Deal Entry */}
          {subChip === "deal-entry" && (
            <div>
              <SectionCard title="General">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <Field label="Trade Name">
                    <input value={tradeName} readOnly style={{ ...nativeInput, fontFamily: "monospace", opacity: 0.7 }} />
                  </Field>
                  <Field label="Trade Type">
                    <select value={tradeType} onChange={e => setTradeType(e.target.value)} style={nativeSelect}>
                      <option value="">Trade Type</option>
                      {TRADE_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Commodity">
                    <select value={commodity} onChange={e => setCommodity(e.target.value)} style={nativeSelect}>
                      <option value="">Commodity</option>
                      {COMMODITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <Field label="Trade Date">
                    <input type="date" value={tradeDate} onChange={e => setTradeDate(e.target.value)} style={nativeInput} />
                  </Field>
                  <Field label="QSE">
                    <select value={qse} onChange={e => setQse(e.target.value)} style={nativeSelect}>
                      <option value="">QSE</option>
                      {QSE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="DUNS">
                    <input value={duns} onChange={e => setDuns(e.target.value)} style={nativeInput} placeholder="DUNS number" />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Classification">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <Field label="Portfolio">
                    <select value={portfolio} onChange={e => setPortfolio(e.target.value)} style={nativeSelect}>
                      <option value="">Portfolio</option>
                      {PORTFOLIO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Product Type">
                    <select value={productType} onChange={e => setProductType(e.target.value)} style={nativeSelect}>
                      <option value="">Product Type</option>
                      {PRODUCT_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Strategy">
                    <select value={strategy} onChange={e => setStrategy(e.target.value)} style={nativeSelect}>
                      <option value="">Strategy</option>
                      {STRATEGY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <Field label="Counter Party">
                    <select value={counterParty} onChange={e => setCounterParty(e.target.value)} style={nativeSelect}>
                      <option value="">Counter Party</option>
                      {counterpartyList.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Sleeve Counterparty">
                    <select value={sleeveCounterparty} onChange={e => setSleeveCounterparty(e.target.value)} style={nativeSelect}>
                      <option value="">Sleeve Counterparty</option>
                      {counterpartyList.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Broker">
                    <select value={broker} onChange={e => setBroker(e.target.value)} style={nativeSelect}>
                      <option value="">Broker</option>
                      {BROKER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <Field label="Brokerage Fee">
                    <input value={brokerageFee} onChange={e => setBrokerageFee(e.target.value)} style={nativeInput} placeholder="0.00" />
                  </Field>
                  <Field label="Brokerage Fee (UoM)">
                    <select value={brokerageFeeUom} onChange={e => setBrokerageFeeUom(e.target.value)} style={nativeSelect}>
                      <option value="">Brokerage Fee (UoM)</option>
                      {BROKERAGE_FEE_UOM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
              </SectionCard>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button onClick={clearForm} style={btnSecondary}>Clear</button>
                <button onClick={handleSaveTrade} style={btnPrimary}>
                  <i className="pi pi-save" />Save Trade
                </button>
              </div>
            </div>
          )}

          {/* Trades */}
          {subChip === "trades" && (
            <DataTable
              value={trades} dataKey="id"
              expandedRows={expandedTradeRows}
              onRowToggle={e => setExpandedTradeRows(e.data as DataTableExpandedRows)}
              rowExpansionTemplate={(t: Trade) => (
                <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, background: "var(--surface-section)" }}>
                  {([["QSE", t.qse], ["DUNS", t.duns], ["Portfolio", t.portfolio], ["Product Type", t.productType],
                    ["Strategy", t.strategy], ["Sleeve Counterparty", t.sleeveCounterparty || "—"],
                    ["Broker", t.broker], ["Brokerage Fee", `${t.brokerageFee} ${t.brokerageFeeUom}`]] as [string, string][]).map(([label, val]) => (
                    <div key={label}>
                      <p style={{ fontSize: 11, color: "var(--text-color-secondary)", margin: "0 0 2px" }}>{label}</p>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-color)", margin: 0 }}>{val}</p>
                    </div>
                  ))}
                </div>
              )}
              stripedRows size="small"
              emptyMessage="No trades yet. Use Deal Entry to create one."
              pt={{ column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } } }}
            >
              <Column expander style={{ width: "3rem" }} />
              <Column field="tradeName" header="Trade Name" style={{ fontFamily: "monospace", fontSize: "0.7rem", minWidth: 280 }} />
              <Column field="tradeDate" header="Trade Date" sortable style={{ width: 120 }} />
              <Column field="counterParty" header="Counter Party" sortable style={{ width: 130 }} />
              <Column field="commodity" header="Commodity" sortable style={{ width: 130 }} />
              <Column field="tradeType" header="Type" sortable style={{ width: 100 }} />
              <Column header="Status" body={(t: Trade) => <StatusPill status={t.status} />} style={{ width: 170 }} />
              <Column header="" body={(t: Trade) => (
                <div style={{ display: "flex", gap: 4 }}>
                  <button title="Edit" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color-secondary)", fontSize: 13, padding: 4 }}>
                    <i className="pi pi-pencil" />
                  </button>
                  <button title="Delete" onClick={() => setTrades(prev => prev.filter(x => x.id !== t.id))}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 13, padding: 4 }}>
                    <i className="pi pi-trash" />
                  </button>
                </div>
              )} style={{ width: 80 }} />
            </DataTable>
          )}

          {/* Approvals */}
          {subChip === "approvals" && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <StatusPill status="Pending Approval" />
                <span style={{ fontSize: 12, marginLeft: 8, color: "var(--text-color-secondary)" }}>{pendingTrades.length} pending</span>
              </div>
              <DataTable value={pendingTrades} size="small" stripedRows
                emptyMessage="No trades pending approval."
                pt={{ column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } } }}
              >
                <Column field="tradeName" header="Trade Name" style={{ fontFamily: "monospace", fontSize: "0.7rem", minWidth: 280 }} />
                <Column field="tradeDate" header="Trade Date" style={{ width: 120 }} />
                <Column field="counterParty" header="Counter Party" style={{ width: 130 }} />
                <Column field="commodity" header="Commodity" style={{ width: 130 }} />
                <Column field="tradeType" header="Type" style={{ width: 100 }} />
                <Column header="Actions" body={(t: Trade) => (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setTrades(prev => prev.map(x => x.id === t.id ? { ...x, status: "Approved" } : x))} style={btnSuccess}>
                      <i className="pi pi-check" />Approve
                    </button>
                    <button onClick={() => setTrades(prev => prev.map(x => x.id === t.id ? { ...x, status: "Rejected" } : x))} style={btnDanger}>
                      Reject
                    </button>
                  </div>
                )} style={{ width: 200 }} />
              </DataTable>
            </div>
          )}

          {/* Upload Files */}
          {subChip === "upload" && (
            <div>
              <Dialog header="Upload Document" visible={uploadModalOpen} onHide={() => setUploadModalOpen(false)} style={{ width: 480 }} modal>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
                  <Field label="Description (optional)">
                    <input value={newDocDescription} onChange={e => setNewDocDescription(e.target.value)}
                      style={nativeInput} placeholder="Enter description" />
                  </Field>
                  <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelect} />
                  <button onClick={() => fileInputRef.current?.click()} style={btnSecondary}>
                    <i className="pi pi-folder-open" />Select File
                  </button>
                </div>
              </Dialog>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-color)" }}>Document Repository</span>
                <button onClick={() => setUploadModalOpen(true)} style={btnSecondary}>
                  <i className="pi pi-upload" />Upload Files
                </button>
              </div>

              <DataTable value={uploadedDocuments} size="small" stripedRows
                emptyMessage="No documents uploaded yet."
                pt={{ column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } } }}
              >
                <Column header="Document" body={(d: UploadedDocument) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="pi pi-file" style={{ color: "#cc1111", fontSize: 14 }} />
                    <span style={{ fontSize: 12 }}>{d.name}</span>
                  </div>
                )} />
                <Column field="description" header="Description" />
                <Column field="uploadedBy" header="Uploaded By" />
                <Column field="lastModified" header="Last Modified" />
                <Column header="" body={(d: UploadedDocument) => (
                  <button onClick={() => setUploadedDocuments(prev => prev.filter(x => x.id !== d.id))}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 13, padding: 4 }}>
                    <i className="pi pi-times" />
                  </button>
                )} style={{ width: 50 }} />
              </DataTable>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
