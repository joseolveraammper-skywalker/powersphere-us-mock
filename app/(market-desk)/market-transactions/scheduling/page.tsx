"use client"

import { useState, useMemo } from "react"
import { useCounterparties } from "@/lib/counterparty-context"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import type { DataTableExpandedRows } from "primereact/datatable"

// ── Mock data ─────────────────────────────────────────────────────────────
const mockTransactions = [
  { id: 1,  entity: "QSE", resourceId: "ARTEMIS",   counterpartyId: "1", submissionType: "DAM EOO",      submissionDate: "2026-03-26", status: "Confirmed", details: "Submission 1"  },
  { id: 2,  entity: "QSE", resourceId: "ARTEMIS",   counterpartyId: "2", submissionType: "DAM EB",       submissionDate: "2026-03-26", status: "Validated", details: "Submission 2"  },
  { id: 3,  entity: "QSE", resourceId: "ARTEMIS",   counterpartyId: "3", submissionType: "COP",          submissionDate: "2026-03-25", status: "Confirmed", details: "Submission 3"  },
  { id: 4,  entity: "QSE", resourceId: "KRNCH_LD1", counterpartyId: "4", submissionType: "PTP Bids",     submissionDate: "2026-03-26", status: "Confirmed", details: "Submission 4"  },
  { id: 5,  entity: "QSE", resourceId: "KRNCH_LD1", counterpartyId: "5", submissionType: "TPO",          submissionDate: "2026-03-25", status: "Validated", details: "Submission 5"  },
  { id: 6,  entity: "SQ1", resourceId: "SGSA_ESR1", counterpartyId: "6", submissionType: "COP",          submissionDate: "2026-03-26", status: "Confirmed", details: "Submission 6"  },
  { id: 7,  entity: "SQ1", resourceId: "SGSA_ESR1", counterpartyId: "7", submissionType: "DAM EOO",      submissionDate: "2026-03-24", status: "Validated", details: "Submission 7"  },
  { id: 8,  entity: "SQ2", resourceId: "AMMPERUSA", counterpartyId: "8", submissionType: "Energy Trades", submissionDate: "2026-03-26", status: "Confirmed", details: "Submission 8"  },
  { id: 9,  entity: "SQ3", resourceId: "AMMPERUSA", counterpartyId: "9", submissionType: "COP",          submissionDate: "2026-03-25", status: "Validated", details: "Submission 9"  },
  { id: 10, entity: "SQ4", resourceId: "ARTEMIS",   counterpartyId: "1", submissionType: "ASO",          submissionDate: "2026-03-26", status: "Confirmed", details: "Submission 10" },
]

const SUBMISSION_TYPES = ["DAM EOO", "DAM EB", "PTP Bids", "COP", "TPO", "ASO", "Energy Trades"]
const ENTITIES    = ["QSE", "SQ1", "SQ2", "SQ3", "SQ4"]
const RESOURCE_IDS = ["ARTEMIS", "KRNCH_LD1", "SGSA_ESR1", "AMMPERUSA"]

type EntityRow   = { entity: string; resourceCount: number; submissionCount: number }
type ResourceRow = { resourceId: string; submissions: typeof mockTransactions }

// ── Style constants ───────────────────────────────────────────────────────
const BORDER = "1px solid var(--surface-border)"
const CTRL_H = "30px"

const nativeInput: React.CSSProperties = {
  height: CTRL_H, padding: "0 0.5rem", fontSize: 12,
  border: BORDER, borderRadius: 6, background: "var(--surface-card)",
  color: "var(--text-color)", outline: "none", fontFamily: "inherit",
  boxSizing: "border-box",
}

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

// ── Status pill ───────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const confirmed = status === "Confirmed"
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "0.2rem 0.55rem", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: confirmed ? "rgba(45,122,45,0.10)" : "rgba(37,99,235,0.10)",
      color: confirmed ? "#2d7a2d" : "#2563eb",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: confirmed ? "#2d7a2d" : "#2563eb", flexShrink: 0 }} />
      {status}
    </span>
  )
}

// ── Submission type badge ─────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const isEnergy = type === "Energy Trades"
  const isCOP    = type === "COP"
  const bg    = isEnergy ? "rgba(45,122,45,0.10)"  : isCOP ? "rgba(37,99,235,0.10)"  : "rgba(100,100,100,0.08)"
  const color = isEnergy ? "#2d7a2d"               : isCOP ? "#2563eb"               : "var(--text-color-secondary)"
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "0.2rem 0.55rem", borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: bg, color,
    }}>
      {type}
    </span>
  )
}

export default function SchedulingPage() {
  const { counterparties } = useCounterparties()

  const [selectedSubmissionType, setSelectedSubmissionType] = useState<string | null>(null)
  const [selectedEntity,         setSelectedEntity]         = useState("all")
  const [selectedResourceId,     setSelectedResourceId]     = useState("all")
  const [selectedCounterparty,   setSelectedCounterparty]   = useState("all")
  const [statusFilter,           setStatusFilter]           = useState<"all" | "active" | "inactive">("all")
  const [searchQuery,            setSearchQuery]            = useState("")
  const [startDate,              setStartDate]              = useState("2026-03-01")
  const [endDate,                setEndDate]                = useState("2026-03-31")
  const [expandedEntityRows,     setExpandedEntityRows]     = useState<DataTableExpandedRows>({})
  const [expandedResourceRows,   setExpandedResourceRows]   = useState<Record<string, DataTableExpandedRows>>({})

  const isEnergyTradesSelected = selectedSubmissionType === "Energy Trades"

  const availableCounterparties = useMemo(() => {
    if (statusFilter === "all") return counterparties
    return counterparties.filter(c => statusFilter === "active" ? c.status === "Active" : c.status === "Inactive")
  }, [statusFilter, counterparties])

  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter(tx => {
      const txDate = new Date(tx.submissionDate)
      if (txDate < new Date(startDate) || txDate > new Date(endDate)) return false
      if (selectedSubmissionType && tx.submissionType !== selectedSubmissionType) return false
      if (selectedEntity !== "all" && tx.entity !== selectedEntity) return false
      if (selectedResourceId !== "all" && tx.resourceId !== selectedResourceId) return false
      if (isEnergyTradesSelected && selectedCounterparty !== "all" && tx.counterpartyId !== selectedCounterparty) return false
      if (isEnergyTradesSelected) {
        const cp = counterparties.find(c => c.id === tx.counterpartyId)
        if (statusFilter === "active"   && cp?.status !== "Active")   return false
        if (statusFilter === "inactive" && cp?.status !== "Inactive") return false
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (![tx.entity, tx.resourceId, tx.submissionType, tx.status, tx.details].some(s => s.toLowerCase().includes(q))) return false
      }
      return true
    })
  }, [selectedSubmissionType, selectedEntity, selectedResourceId, selectedCounterparty, statusFilter, searchQuery, startDate, endDate, counterparties, isEnergyTradesSelected])

  // Build entity-level rows
  const entityRows: EntityRow[] = useMemo(() => {
    const grouped: Record<string, typeof mockTransactions> = {}
    filteredTransactions.forEach(tx => {
      if (!grouped[tx.entity]) grouped[tx.entity] = []
      grouped[tx.entity].push(tx)
    })
    return Object.entries(grouped).map(([entity, txs]) => ({
      entity,
      resourceCount:   new Set(txs.map(t => t.resourceId)).size,
      submissionCount: txs.length,
    }))
  }, [filteredTransactions])

  const getResourceRows = (entity: string): ResourceRow[] => {
    const grouped: Record<string, typeof mockTransactions> = {}
    filteredTransactions.filter(tx => tx.entity === entity).forEach(tx => {
      if (!grouped[tx.resourceId]) grouped[tx.resourceId] = []
      grouped[tx.resourceId].push(tx)
    })
    return Object.entries(grouped).map(([resourceId, submissions]) => ({ resourceId, submissions }))
  }

  // KPI counts
  const confirmedCount = filteredTransactions.filter(t => t.status === "Confirmed").length
  const validatedCount = filteredTransactions.filter(t => t.status === "Validated").length

  // ── Column templates ──────────────────────────────────────────────────
  const submissionTypeBody = (tx: typeof mockTransactions[0]) => <TypeBadge type={tx.submissionType} />
  const statusBody         = (tx: typeof mockTransactions[0]) => <StatusPill status={tx.status} />
  const actionsBody        = () => (
    <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color-secondary)", padding: "3px 5px", borderRadius: 4, display: "flex", alignItems: "center" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#cc1111"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-color-secondary)"}
    >
      <i className="pi pi-ellipsis-v" style={{ fontSize: 12 }} />
    </button>
  )

  // Inner DataTable expansion (resource → submissions)
  const entityExpansionTemplate = (row: EntityRow) => {
    const resourceRows = getResourceRows(row.entity)
    const entityExpandedRows = expandedResourceRows[row.entity] || {}

    const resourceExpansionTemplate = (rRow: ResourceRow) => (
      <div style={{ padding: "0.625rem 1.25rem", background: "var(--surface-ground)" }}>
        <div style={{ borderRadius: 8, overflow: "hidden", border: BORDER }}>
          <DataTable
            value={rRow.submissions}
            size="small"
            showGridlines={false}
            style={{ background: "var(--surface-card)" }}
            pt={{
              thead: { style: { background: "var(--surface-card)" } },
              tbody: { style: { background: "var(--surface-card)" } },
              column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } },
            }}
          >
            <Column field="details"        header="Details"  />
            <Column field="resourceId"     header="Resource" style={{ fontFamily: "monospace", fontSize: 12 }} />
            <Column header="Type"          body={submissionTypeBody} style={{ width: 140 }} />
            <Column field="submissionDate" header="Date"     style={{ width: 120, fontFamily: "monospace", fontSize: 12 }} />
            <Column header="Status"        body={statusBody} style={{ width: 120 }} />
            <Column header=""              body={actionsBody} style={{ width: 48 }} />
          </DataTable>
        </div>
      </div>
    )

    return (
      <div style={{ padding: "0.625rem 1.25rem", background: "var(--surface-section)" }}>
        <div style={{ borderRadius: 8, overflow: "hidden", border: BORDER }}>
          <DataTable
            value={resourceRows}
            dataKey="resourceId"
            expandedRows={entityExpandedRows}
            onRowToggle={e => setExpandedResourceRows(prev => ({ ...prev, [row.entity]: e.data as DataTableExpandedRows }))}
            rowExpansionTemplate={resourceExpansionTemplate}
            size="small"
            style={{ background: "var(--surface-card)" }}
            pt={{
              thead: { style: { background: "var(--surface-card)" } },
              tbody: { style: { background: "var(--surface-card)" } },
              column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } },
            }}
          >
            <Column expander style={{ width: "2.5rem" }} />
            <Column field="resourceId" header="Resource ID"
              body={(r: ResourceRow) => (
                <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "var(--text-color)" }}>{r.resourceId}</span>
              )} />
            <Column header="Submissions"
              body={(r: ResourceRow) => (
                <span style={{ fontSize: 12, color: "var(--text-color-secondary)" }}>{r.submissions.length} submission(s)</span>
              )} />
          </DataTable>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout pageTitle="Market Transactions">

      {/* ── ERCOT breadcrumb ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: "#cc1111", letterSpacing: "-0.02em" }}>ERCOT</span>
        <span style={{ color: "var(--surface-border)", fontSize: 16 }}>/</span>
        <span style={{ fontSize: 12, color: "var(--text-color-secondary)" }}>Market Transactions</span>
      </div>

      {/* ── KPI bar ── */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: "1rem", padding: "0.5rem 0.875rem", borderRadius: 10, background: "var(--surface-card)", border: BORDER, marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(204,17,17,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="pi pi-arrow-right-arrow-left" style={{ fontSize: 12, color: "#cc1111" }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)", lineHeight: 1 }}>Transactions</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-color)", lineHeight: 1.2 }}>{filteredTransactions.length}</div>
          </div>
        </div>
        <div style={{ width: 1, height: 24, background: "var(--surface-border)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="pi pi-check-circle" style={{ fontSize: 11, color: "#2d7a2d" }} />
          <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Confirmed</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#2d7a2d" }}>{confirmedCount}</span>
        </div>
        <div style={{ width: 1, height: 24, background: "var(--surface-border)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="pi pi-info-circle" style={{ fontSize: 11, color: "#2563eb" }} />
          <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Validated</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#2563eb" }}>{validatedCount}</span>
        </div>
      </div>

      {/* ── Submission type ribbon ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, overflowX: "auto", borderBottom: BORDER, marginBottom: "1.25rem" }}>
        {SUBMISSION_TYPES.map(type => {
          const active = selectedSubmissionType === type
          return (
            <button
              key={type}
              onClick={() => {
                const next = active ? null : type
                setSelectedSubmissionType(next)
                if (type === "Energy Trades" && next === null) {
                  setSelectedCounterparty("all")
                  setStatusFilter("all")
                }
              }}
              style={{
                padding: "0.55rem 0.875rem", fontSize: 12, fontWeight: active ? 600 : 400,
                whiteSpace: "nowrap", background: "transparent", border: "none",
                borderBottom: `2px solid ${active ? "#cc1111" : "transparent"}`,
                color: active ? "#cc1111" : "var(--text-color-secondary)",
                cursor: "pointer", marginBottom: -1, transition: "color 0.15s",
              }}
            >
              {type}
            </button>
          )
        })}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: BORDER }}>

        {/* Entity filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-color-secondary)" }}>Entity</span>
          <select value={selectedEntity} onChange={e => setSelectedEntity(e.target.value)} style={{ ...nativeInput, width: 110 }}>
            <option value="all">All</option>
            {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {/* Resource filter */}
        {!isEnergyTradesSelected && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-color-secondary)" }}>Resource</span>
            <select value={selectedResourceId} onChange={e => setSelectedResourceId(e.target.value)} style={{ ...nativeInput, width: 140 }}>
              <option value="all">All</option>
              {RESOURCE_IDS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}

        {/* Date range */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-color-secondary)" }}>From</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...nativeInput, width: 136 }} />
          <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>to</span>
          <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)}   style={{ ...nativeInput, width: 136 }} />
        </div>

        <div style={{ flex: 1 }} />

        {/* Energy Trades extras */}
        {isEnergyTradesSelected && (
          <>
            {/* Status toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "3px", borderRadius: 999, background: "var(--surface-section)" }}>
              {(["all", "active", "inactive"] as const).map(pos => (
                <button
                  key={pos}
                  onClick={() => setStatusFilter(pos)}
                  style={{
                    padding: "0.2rem 0.625rem", borderRadius: 999, fontSize: 11, fontWeight: 500,
                    cursor: "pointer", border: "none", textTransform: "capitalize",
                    background: statusFilter === pos ? "var(--surface-card)" : "transparent",
                    color: statusFilter === pos ? "#cc1111" : "var(--text-color-secondary)",
                    boxShadow: statusFilter === pos ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {pos}
                </button>
              ))}
            </div>

            {/* Counterparty filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-color-secondary)" }}>Counterparty</span>
              <select value={selectedCounterparty} onChange={e => setSelectedCounterparty(e.target.value)} style={{ ...nativeInput, width: 180 }}>
                <option value="all">All</option>
                {availableCounterparties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Search */}
        <div style={{ position: "relative", height: CTRL_H }}>
          <i className="pi pi-search" style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-color-secondary)", pointerEvents: "none" }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search…"
            style={{ ...nativeInput, width: 200, paddingLeft: "1.85rem" }}
          />
        </div>
      </div>

      {/* ── Entity-level DataTable ── */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: BORDER }}>
        <DataTable
          value={entityRows}
          dataKey="entity"
          expandedRows={expandedEntityRows}
          onRowToggle={e => setExpandedEntityRows(e.data as DataTableExpandedRows)}
          rowExpansionTemplate={entityExpansionTemplate}
          size="small"
          emptyMessage="No transactions match the current filters."
          style={{ background: "var(--surface-card)" }}
          pt={{
            thead: { style: { background: "var(--surface-card)" } },
            tbody: { style: { background: "var(--surface-card)" } },
            column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } },
          }}
        >
          <Column expander style={{ width: "2.5rem" }} />
          <Column field="entity" header="Entity"
            body={(r: EntityRow) => (
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-color)" }}>{r.entity}</span>
            )} />
          <Column header="Resources"
            body={(r: EntityRow) => (
              <span style={{ fontSize: 12, color: "var(--text-color-secondary)" }}>{r.resourceCount} resource(s)</span>
            )} />
          <Column header="Total Submissions"
            body={(r: EntityRow) => (
              <span style={{
                display: "inline-flex", alignItems: "center",
                padding: "0.2rem 0.6rem", borderRadius: 6, fontSize: 12, fontWeight: 700,
                background: "rgba(37,99,235,0.10)", color: "#2563eb",
              }}>
                {r.submissionCount}
              </span>
            )} />
        </DataTable>
      </div>
    </DashboardLayout>
  )
}
