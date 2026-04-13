"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import type { DataTableExpandedRows } from "primereact/datatable"
import { useCounterparties } from "@/lib/counterparty-context"

// ── Style constants ───────────────────────────────────────────────────────────
const BORDER = "1px solid var(--surface-border)"
const CTRL_H = "30px"

const nativeInput: React.CSSProperties = {
  height: CTRL_H, padding: "0 8px", fontSize: 12, border: BORDER, borderRadius: 6,
  background: "var(--surface-card)", color: "var(--text-color)", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
}
const nativeSelect: React.CSSProperties = { ...nativeInput, cursor: "pointer" }
const btnPrimary: React.CSSProperties = {
  background: "#cc1111", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
  padding: "0 14px", height: CTRL_H, color: "#fff", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const btnSecondary: React.CSSProperties = {
  background: "none", border: BORDER, borderRadius: 6, fontSize: 12,
  padding: "0 12px", height: CTRL_H, color: "var(--text-color)", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const thStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
  color: "var(--text-color-secondary)", background: "var(--surface-card)",
  borderBottom: BORDER, padding: "0.5rem 0.75rem",
}
const tdStyle: React.CSSProperties = {
  fontSize: 12, color: "var(--text-color)", padding: "0.5rem 0.75rem",
  borderBottom: BORDER, borderTop: "none", borderLeft: "none", borderRight: "none",
}

// ── Types ─────────────────────────────────────────────────────────────────────
type SendStatus = "done" | "pending" | "none"

type Invoice = {
  id: string
  name: string
  counterparty?: string
  receivedDate: string
  period: string
  fileSize: string
  postedOnMis: boolean
  sentToSap: boolean
  downloaded: boolean
  extractData: boolean
  billCheck: boolean
  sendToSap: SendStatus
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const WR_MOCK: Invoice[] = [
  { id: "w1",  name: "SETTLEMENT/13087",         receivedDate: "03/31/2026", period: "Mar 2026", fileSize: "2.4 MB", postedOnMis: false, sentToSap: false, downloaded: true, extractData: true,  billCheck: true,  sendToSap: "pending" },
  { id: "w2",  name: "SUI/21119",                receivedDate: "03/31/2026", period: "Mar 2026", fileSize: "1.1 MB", postedOnMis: false, sentToSap: false, downloaded: true, extractData: true,  billCheck: true,  sendToSap: "done"    },
  { id: "w3",  name: "CRRBALANCING/11101",       receivedDate: "03/30/2026", period: "Mar 2026", fileSize: "0.8 MB", postedOnMis: false, sentToSap: false, downloaded: true, extractData: true,  billCheck: true,  sendToSap: "done"    },
  { id: "w4",  name: "CRRAUCTION/11110",         receivedDate: "03/30/2026", period: "Mar 2026", fileSize: "1.3 MB", postedOnMis: false, sentToSap: false, downloaded: true, extractData: true,  billCheck: true,  sendToSap: "done"    },
  { id: "w5",  name: "CARD/11109",               receivedDate: "03/29/2026", period: "Mar 2026", fileSize: "0.5 MB", postedOnMis: false, sentToSap: false, downloaded: true, extractData: true,  billCheck: true,  sendToSap: "done"    },
  { id: "w6",  name: "SECURITIZATIONDEFAULT/23273", receivedDate: "03/29/2026", period: "Mar 2026", fileSize: "0.9 MB", postedOnMis: false, sentToSap: false, downloaded: true, extractData: true, billCheck: true, sendToSap: "done"   },
  { id: "w7",  name: "NETTING/5042",             receivedDate: "03/28/2026", period: "Mar 2026", fileSize: "1.7 MB", postedOnMis: false, sentToSap: false, downloaded: true, extractData: false, billCheck: false, sendToSap: "none"    },
  { id: "w8",  name: "ENERGYONLY/8821",          receivedDate: "03/28/2026", period: "Mar 2026", fileSize: "2.1 MB", postedOnMis: false, sentToSap: false, downloaded: true, extractData: false, billCheck: false, sendToSap: "none"    },
  { id: "w9",  name: "SETTLEMENT/13086",         receivedDate: "02/28/2026", period: "Feb 2026", fileSize: "2.4 MB", postedOnMis: true,  sentToSap: true,  downloaded: true, extractData: true,  billCheck: true,  sendToSap: "done"    },
  { id: "w10", name: "SUI/21118",                receivedDate: "02/28/2026", period: "Feb 2026", fileSize: "1.1 MB", postedOnMis: true,  sentToSap: true,  downloaded: true, extractData: true,  billCheck: true,  sendToSap: "done"    },
]

const ETRM_MOCK: Invoice[] = [
  { id: "e1", name: "ETRM-STD/2026-031", counterparty: "EDF",   receivedDate: "03/31/2026", period: "Mar 2026", fileSize: "0.6 MB", postedOnMis: false, sentToSap: false, downloaded: true, extractData: true,  billCheck: true,  sendToSap: "done" },
  { id: "e2", name: "ETRM-STD/2026-032", counterparty: "SHELL", receivedDate: "03/31/2026", period: "Mar 2026", fileSize: "0.4 MB", postedOnMis: false, sentToSap: false, downloaded: true, extractData: true,  billCheck: false, sendToSap: "none" },
  { id: "e3", name: "ETRM-FIN/2026-014", counterparty: "EDF",   receivedDate: "03/30/2026", period: "Mar 2026", fileSize: "0.7 MB", postedOnMis: false, sentToSap: false, downloaded: true, extractData: true,  billCheck: true,  sendToSap: "pending" },
  { id: "e4", name: "ETRM-SWP/2026-008", counterparty: "SHELL", receivedDate: "03/28/2026", period: "Mar 2026", fileSize: "0.3 MB", postedOnMis: false, sentToSap: false, downloaded: true, extractData: false, billCheck: false, sendToSap: "none" },
  { id: "e5", name: "ETRM-STD/2026-029", counterparty: "EDF",   receivedDate: "02/28/2026", period: "Feb 2026", fileSize: "0.6 MB", postedOnMis: true,  sentToSap: true,  downloaded: true, extractData: true,  billCheck: true,  sendToSap: "done" },
]

const ERCOT_ENTITIES = ["QSE-001 (AMMPERUSA)", "QSE-002 (FRMN)", "QSE-003 (LNCLN)"]
const WR_REPORT_TYPES = ["SETTLEMENT", "SUI", "CRRBALANCING", "CRRAUCTION", "CARD", "SECURITIZATIONDEFAULT", "NETTING", "ENERGYONLY"]
const ETRM_REPORT_TYPES = ["ETRM-STD", "ETRM-FIN", "ETRM-SWP", "ETRM-OPT"]

// ── Sub-components ────────────────────────────────────────────────────────────
function CheckCell({ value }: { value: boolean }) {
  if (!value) return <span style={{ color: "var(--text-color-secondary)", fontSize: 12 }}>—</span>
  return <i className="pi pi-check" style={{ color: "#16a34a", fontSize: 14 }} />
}

function SendToSapCell({ status }: { status: SendStatus }) {
  if (status === "done")    return <i className="pi pi-check" style={{ color: "#16a34a", fontSize: 14 }} />
  if (status === "pending") return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 16, height: 16, borderRadius: "50%", border: "2px solid #9ca3af",
    }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#9ca3af" }} />
    </span>
  )
  return <span style={{ color: "var(--text-color-secondary)", fontSize: 12 }}>—</span>
}

function ClearableSelect({
  value, onChange, options, placeholder,
}: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", border: BORDER, borderRadius: 6, height: CTRL_H, background: "var(--surface-card)", overflow: "hidden" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ height: "100%", border: "none", background: "transparent", fontSize: 12, color: "var(--text-color)", outline: "none", padding: "0 4px 0 8px", cursor: "pointer", fontFamily: "inherit" }}
      >
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {value && (
        <button onClick={() => onChange("")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 6px", color: "var(--text-color-secondary)", fontSize: 11, display: "flex", alignItems: "center" }}>
          <i className="pi pi-times" style={{ fontSize: 10 }} />
        </button>
      )}
    </div>
  )
}

// ── Invoice Table ─────────────────────────────────────────────────────────────
function InvoiceTable({
  invoices,
  reportTypeOptions,
  kpiTotal,
  kpiSent,
  showCounterpartyFilter = false,
  counterpartyOptions = [],
}: {
  invoices: Invoice[]
  reportTypeOptions: string[]
  kpiTotal: number
  kpiSent: number
  showCounterpartyFilter?: boolean
  counterpartyOptions?: string[]
}) {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
  const lastOfMonth  = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0]

  const [dateFrom,     setDateFrom]     = useState(firstOfMonth)
  const [dateTo,       setDateTo]       = useState(lastOfMonth)
  const [entityFilter, setEntityFilter] = useState("")
  const [typeFilter,   setTypeFilter]   = useState("")
  const [cpFilter,     setCpFilter]     = useState("")
  const [textFilter,   setTextFilter]   = useState("")
  const [selected,     setSelected]     = useState<Invoice[]>([])
  const [expanded,     setExpanded]     = useState<DataTableExpandedRows>({})
  const [actionOpen,   setActionOpen]   = useState(false)
  const actionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) setActionOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (typeFilter && !inv.name.startsWith(typeFilter)) return false
      if (cpFilter   && inv.counterparty !== cpFilter)    return false
      if (textFilter && !inv.name.toLowerCase().includes(textFilter.toLowerCase())) return false
      return true
    })
  }, [invoices, typeFilter, cpFilter, textFilter])

  const kpiPct = kpiTotal ? ((kpiSent / kpiTotal) * 100).toFixed(1) : "0.0"

  const expansionTemplate = (inv: Invoice) => (
    <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, background: "var(--surface-section)" }}>
      {([
        ["Received Date", inv.receivedDate],
        ["Invoice Period", inv.period],
        ["File Size", inv.fileSize],
        ["XML Reference", inv.name + ".xml"],
      ] as [string, string][]).map(([label, val]) => (
        <div key={label}>
          <p style={{ fontSize: 11, color: "var(--text-color-secondary)", margin: "0 0 2px" }}>{label}</p>
          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-color)", margin: 0 }}>{val}</p>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>

        {/* Left: filters */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
          {/* Time period */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-color-secondary)" }}>Time Period</label>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...nativeInput, width: 130 }} />
              <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>–</span>
              <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={{ ...nativeInput, width: 130 }} />
            </div>
          </div>

          {/* Filter by Entity */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-color-secondary)" }}>Filter by Entity</label>
            <ClearableSelect value={entityFilter} onChange={setEntityFilter} options={ERCOT_ENTITIES} placeholder="All" />
          </div>

          {/* Filter by Report Type */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-color-secondary)" }}>Filter by Report Type</label>
            <ClearableSelect value={typeFilter} onChange={setTypeFilter} options={reportTypeOptions} placeholder="All" />
          </div>

          {/* Counterparty filter (ETRM only) */}
          {showCounterpartyFilter && (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-color-secondary)" }}>Counterparty</label>
              <ClearableSelect value={cpFilter} onChange={setCpFilter} options={counterpartyOptions} placeholder="All" />
            </div>
          )}

          {/* Refresh */}
          <button style={{ ...btnSecondary, width: CTRL_H, padding: 0, justifyContent: "center" }}>
            <i className="pi pi-refresh" style={{ fontSize: 13 }} />
          </button>
        </div>

        {/* Right: KPI + SELECT ACTION */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Sent Invoices KPI */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 200 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-color-secondary)" }}>Sent Invoices</span>
              <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Total: {kpiTotal}</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "var(--surface-border)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 4, background: "#16a34a", width: `${kpiPct}%`, transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-color)", marginRight: 4 }}>{kpiPct}%</span>
              ({kpiSent} of {kpiTotal}) invoices sent
            </div>
          </div>

          {/* SELECT ACTION split button */}
          <div ref={actionRef} style={{ position: "relative" }}>
            <div style={{ display: "flex", border: "1px solid #cc1111", borderRadius: 6, overflow: "hidden" }}>
              <button
                onClick={() => setActionOpen(o => !o)}
                style={{ background: "none", border: "none", height: CTRL_H, padding: "0 12px", fontSize: 11, fontWeight: 700, color: "#cc1111", cursor: "pointer", letterSpacing: "0.05em" }}
              >
                SELECT ACTION
              </button>
              <button
                onClick={() => setActionOpen(o => !o)}
                style={{ background: "none", border: "none", borderLeft: "1px solid #cc1111", height: CTRL_H, padding: "0 8px", cursor: "pointer", display: "flex", alignItems: "center", color: "#cc1111" }}
              >
                <i className="pi pi-chevron-down" style={{ fontSize: 10 }} />
              </button>
            </div>
            {actionOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 100, background: "var(--surface-card)", border: BORDER, borderRadius: 6, minWidth: 180, boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
                {["Send All to SAP", "Download All", "Extract All", "Export CSV"].map(action => (
                  <button key={action} onClick={() => setActionOpen(false)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "8px 14px", fontSize: 12, cursor: "pointer", color: "var(--text-color)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-section)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Text filter */}
      <div style={{ position: "relative", marginBottom: 14, width: 260 }}>
        <i className="pi pi-search" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-color-secondary)" }} />
        <input
          value={textFilter}
          onChange={e => setTextFilter(e.target.value)}
          placeholder="Filter ..."
          style={{ ...nativeInput, width: "100%", paddingLeft: 30 }}
        />
      </div>

      {/* Table */}
      <DataTable
        value={filtered}
        dataKey="id"
        selectionMode="multiple"
        selection={selected}
        onSelectionChange={e => setSelected(e.value as Invoice[])}
        expandedRows={expanded}
        onRowToggle={e => setExpanded(e.data as DataTableExpandedRows)}
        rowExpansionTemplate={expansionTemplate}
        size="small"
        stripedRows
        emptyMessage="No invoices found."
        pt={{ column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } } }}
      >
        <Column selectionMode="multiple" style={{ width: "3rem" }} />
        <Column expander style={{ width: "3rem" }} />
        <Column field="name" header="Invoice Name" style={{ fontFamily: "monospace", minWidth: 220 }} />
        <Column header="Posted (on MIS)" body={(r: Invoice) => <CheckCell value={r.postedOnMis} />} style={{ width: 130, textAlign: "center" }} />
        <Column header="Sent to SAP"     body={(r: Invoice) => <CheckCell value={r.sentToSap} />}   style={{ width: 110, textAlign: "center" }} />
        <Column header="Downloaded"      body={(r: Invoice) => <CheckCell value={r.downloaded} />}  style={{ width: 110, textAlign: "center" }} />
        <Column header="Extract Data"    body={(r: Invoice) => <CheckCell value={r.extractData} />} style={{ width: 110, textAlign: "center" }} />
        <Column header="Bill Check"      body={(r: Invoice) => <CheckCell value={r.billCheck} />}   style={{ width: 100, textAlign: "center" }} />
        <Column header="Send to SAP"     body={(r: Invoice) => <SendToSapCell status={r.sendToSap} />} style={{ width: 100, textAlign: "center" }} />
      </DataTable>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DocumentRepositoryPage() {
  const [mainTab,   setMainTab]   = useState<"repository" | "scheduled" | "config">("repository")
  const [repoTab,   setRepoTab]   = useState<"ercot" | "spp" | "pjm">("ercot")
  const [ercotChip, setErcotChip] = useState<"wr" | "etrm" | "ers">("wr")

  const { counterparties } = useCounterparties()
  const counterpartyOptions = useMemo(
    () => counterparties.filter(c => c.clientType === "counterparty").map(c => c.counterparty).filter(Boolean) as string[],
    [counterparties]
  )

  const mainTabs = [
    { key: "repository" as const, label: "Repository" },
    { key: "scheduled"  as const, label: "Scheduled Executions" },
    { key: "config"     as const, label: "Configuration" },
  ]
  const repoTabs = [
    { key: "ercot" as const, label: "ERCOT" },
    { key: "spp"   as const, label: "SPP" },
    { key: "pjm"   as const, label: "PJM" },
  ]
  const ercotChips = [
    { key: "wr"   as const, label: "W/R Invoices" },
    { key: "etrm" as const, label: "ETRM Invoices" },
    { key: "ers"  as const, label: "ERS Documents" },
  ]

  return (
    <DashboardLayout pageTitle="Document Repository">

      {/* Main tabs */}
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

      {/* ── Repository ──────────────────────────────────────────────────────── */}
      {mainTab === "repository" && (
        <>
          {/* Repo sub-tabs (ERCOT / SPP / PJM) — market selector, must stand out */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {repoTabs.map(t => {
              const active = repoTab === t.key
              return (
                <button key={t.key} onClick={() => setRepoTab(t.key)} style={{
                  cursor: "pointer", padding: "6px 22px", fontSize: 13, fontWeight: 700,
                  letterSpacing: "0.04em", borderRadius: 6,
                  border: active ? "2px solid #cc1111" : `2px solid var(--surface-border)`,
                  background: active ? "#cc1111" : "var(--surface-card)",
                  color: active ? "#fff" : "var(--text-color-secondary)",
                  boxShadow: active ? "0 2px 8px rgba(204,17,17,0.25)" : "none",
                  transition: "all 0.15s",
                }}>{t.label}</button>
              )
            })}
          </div>

          {/* ── ERCOT ── */}
          {repoTab === "ercot" && (
            <>
              {/* Chips */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {ercotChips.map(c => (
                  <button key={c.key} onClick={() => setErcotChip(c.key)} style={{
                    padding: "4px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: BORDER,
                    background: ercotChip === c.key ? "var(--surface-card)" : "transparent",
                    color: "var(--text-color)",
                    boxShadow: ercotChip === c.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                    fontWeight: ercotChip === c.key ? 600 : 400,
                  }}>{c.label}</button>
                ))}
              </div>

              {ercotChip === "wr" && (
                <InvoiceTable
                  invoices={WR_MOCK}
                  reportTypeOptions={WR_REPORT_TYPES}
                  kpiTotal={239}
                  kpiSent={238}
                />
              )}

              {ercotChip === "etrm" && (
                <InvoiceTable
                  invoices={ETRM_MOCK}
                  reportTypeOptions={ETRM_REPORT_TYPES}
                  kpiTotal={24}
                  kpiSent={21}
                  showCounterpartyFilter
                  counterpartyOptions={counterpartyOptions}
                />
              )}

              {ercotChip === "ers" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, fontSize: 13, color: "var(--text-color-secondary)" }}>
                  ERS Documents — coming soon
                </div>
              )}
            </>
          )}

          {repoTab === "spp" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, fontSize: 13, color: "var(--text-color-secondary)" }}>
              SPP — coming soon
            </div>
          )}

          {repoTab === "pjm" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, fontSize: 13, color: "var(--text-color-secondary)" }}>
              PJM — coming soon
            </div>
          )}
        </>
      )}

      {/* ── Scheduled Executions ─────────────────────────────────────────────── */}
      {mainTab === "scheduled" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, fontSize: 13, color: "var(--text-color-secondary)" }}>
          Scheduled Executions — coming soon
        </div>
      )}

      {/* ── Configuration ────────────────────────────────────────────────────── */}
      {mainTab === "config" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, fontSize: 13, color: "var(--text-color-secondary)" }}>
          Configuration — coming soon
        </div>
      )}

    </DashboardLayout>
  )
}
