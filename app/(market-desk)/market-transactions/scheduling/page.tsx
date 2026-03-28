"use client"

import { useState, useMemo } from "react"
import { useCounterparties } from "@/lib/counterparty-context"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Button } from "primereact/button"
import { InputText } from "primereact/inputtext"
import { Dropdown } from "primereact/dropdown"
import { Tag } from "primereact/tag"
import type { DataTableExpandedRows } from "primereact/datatable"

// ── Mock data ────────────────────────────────────────────────────
const mockTransactions = [
  { id: 1, entity: "QSE", resourceId: "ARTEMIS", counterpartyId: "1", submissionType: "DAM EOO", submissionDate: "2026-03-26", status: "Confirmed", details: "Submission 1" },
  { id: 2, entity: "QSE", resourceId: "ARTEMIS", counterpartyId: "2", submissionType: "DAM EB", submissionDate: "2026-03-26", status: "Validated", details: "Submission 2" },
  { id: 3, entity: "QSE", resourceId: "ARTEMIS", counterpartyId: "3", submissionType: "COP", submissionDate: "2026-03-25", status: "Confirmed", details: "Submission 3" },
  { id: 4, entity: "QSE", resourceId: "KRNCH_LD1", counterpartyId: "4", submissionType: "PTP Bids", submissionDate: "2026-03-26", status: "Confirmed", details: "Submission 4" },
  { id: 5, entity: "QSE", resourceId: "KRNCH_LD1", counterpartyId: "5", submissionType: "TPO", submissionDate: "2026-03-25", status: "Validated", details: "Submission 5" },
  { id: 6, entity: "SQ1", resourceId: "SGSA_ESR1", counterpartyId: "6", submissionType: "COP", submissionDate: "2026-03-26", status: "Confirmed", details: "Submission 6" },
  { id: 7, entity: "SQ1", resourceId: "SGSA_ESR1", counterpartyId: "7", submissionType: "DAM EOO", submissionDate: "2026-03-24", status: "Validated", details: "Submission 7" },
  { id: 8, entity: "SQ2", resourceId: "AMMPERUSA", counterpartyId: "8", submissionType: "Energy Trades", submissionDate: "2026-03-26", status: "Confirmed", details: "Submission 8" },
  { id: 9, entity: "SQ3", resourceId: "AMMPERUSA", counterpartyId: "9", submissionType: "COP", submissionDate: "2026-03-25", status: "Validated", details: "Submission 9" },
  { id: 10, entity: "SQ4", resourceId: "ARTEMIS", counterpartyId: "1", submissionType: "ASO", submissionDate: "2026-03-26", status: "Confirmed", details: "Submission 10" },
]

const SUBMISSION_TYPES = ["DAM EOO", "DAM EB", "PTP Bids", "COP", "TPO", "ASO", "Energy Trades"]
const ENTITIES = ["QSE", "SQ1", "SQ2", "SQ3", "SQ4"]
const RESOURCE_IDS = ["ARTEMIS", "KRNCH_LD1", "SGSA_ESR1", "AMMPERUSA"]

// Entity-level rows for the outer DataTable
type EntityRow = { entity: string; resourceCount: number; submissionCount: number }

// Resource-level rows for the inner DataTable
type ResourceRow = { resourceId: string; submissions: typeof mockTransactions }

export default function SchedulingPage() {
  const { counterparties } = useCounterparties()

  const [selectedSubmissionType, setSelectedSubmissionType] = useState<string | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<string>("all")
  const [selectedResourceId, setSelectedResourceId] = useState<string>("all")
  const [selectedCounterparty, setSelectedCounterparty] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState("2026-03-01")
  const [endDate, setEndDate] = useState("2026-03-31")
  const [expandedEntityRows, setExpandedEntityRows] = useState<DataTableExpandedRows>({})
  const [expandedResourceRows, setExpandedResourceRows] = useState<Record<string, DataTableExpandedRows>>({})

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
        if (statusFilter === "active" && cp?.status !== "Active") return false
        if (statusFilter === "inactive" && cp?.status !== "Inactive") return false
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (![tx.entity, tx.resourceId, tx.submissionType, tx.status, tx.details].some(s => s.toLowerCase().includes(q))) return false
      }
      return true
    })
  }, [selectedSubmissionType, selectedEntity, selectedResourceId, selectedCounterparty, statusFilter, searchQuery, startDate, endDate, counterparties, isEnergyTradesSelected])

  // Build flat entity-level rows
  const entityRows: EntityRow[] = useMemo(() => {
    const grouped: Record<string, typeof mockTransactions> = {}
    filteredTransactions.forEach(tx => {
      if (!grouped[tx.entity]) grouped[tx.entity] = []
      grouped[tx.entity].push(tx)
    })
    return Object.entries(grouped).map(([entity, txs]) => ({
      entity,
      resourceCount: new Set(txs.map(t => t.resourceId)).size,
      submissionCount: txs.length,
    }))
  }, [filteredTransactions])

  // Get resource rows for a given entity
  const getResourceRows = (entity: string): ResourceRow[] => {
    const grouped: Record<string, typeof mockTransactions> = {}
    filteredTransactions.filter(tx => tx.entity === entity).forEach(tx => {
      if (!grouped[tx.resourceId]) grouped[tx.resourceId] = []
      grouped[tx.resourceId].push(tx)
    })
    return Object.entries(grouped).map(([resourceId, submissions]) => ({ resourceId, submissions }))
  }

  // ── Column templates ──────────────────────────────────────────
  const submissionTypeBody = (tx: typeof mockTransactions[0]) => (
    <Tag
      value={tx.submissionType}
      severity={tx.submissionType === "COP" ? "info" : tx.submissionType === "Energy Trades" ? "success" : "secondary"}
    />
  )

  const statusBody = (tx: typeof mockTransactions[0]) => (
    <Tag value={tx.status} severity={tx.status === "Confirmed" ? "success" : "info"} />
  )

  const actionsBody = () => (
    <Button icon="pi pi-ellipsis-v" rounded text size="small" />
  )

  // Expansion for entity → shows resource DataTable
  const entityExpansionTemplate = (row: EntityRow) => {
    const resourceRows = getResourceRows(row.entity)
    const entityExpandedRows = expandedResourceRows[row.entity] || {}

    const resourceExpansionTemplate = (rRow: ResourceRow) => (
      <div className="pl-8 py-2" style={{ background: "var(--surface-ground)" }}>
        <DataTable value={rRow.submissions} size="small" showGridlines={false}
          style={{ background: "var(--surface-card)" }}>
          <Column field="details" header="Details" />
          <Column field="resourceId" header="Resource" />
          <Column header="Type" body={submissionTypeBody} style={{ width: "140px" }} />
          <Column field="submissionDate" header="Date" style={{ width: "120px", fontFamily: "monospace", fontSize: "0.75rem" }} />
          <Column header="Status" body={statusBody} style={{ width: "110px" }} />
          <Column header="" body={actionsBody} style={{ width: "50px" }} />
        </DataTable>
      </div>
    )

    return (
      <div className="pl-6 py-2" style={{ background: "var(--surface-section)" }}>
        <DataTable
          value={resourceRows}
          dataKey="resourceId"
          expandedRows={entityExpandedRows}
          onRowToggle={e => setExpandedResourceRows(prev => ({ ...prev, [row.entity]: e.data as DataTableExpandedRows }))}
          rowExpansionTemplate={resourceExpansionTemplate}
          size="small"
          style={{ background: "var(--surface-card)" }}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column field="resourceId" header="Resource ID"
            body={(r: ResourceRow) => <span className="font-mono text-sm font-semibold">{r.resourceId}</span>} />
          <Column header="Submissions"
            body={(r: ResourceRow) => (
              <span className="text-sm" style={{ color: "var(--text-color-secondary)" }}>{r.submissions.length} submission(s)</span>
            )} />
        </DataTable>
      </div>
    )
  }

  const entityOptions = [{ label: "All", value: "all" }, ...ENTITIES.map(e => ({ label: e, value: e }))]
  const resourceOptions = [{ label: "All", value: "all" }, ...RESOURCE_IDS.map(r => ({ label: r, value: r }))]
  const cpOptions = [{ label: "All", value: "all" }, ...availableCounterparties.map(c => ({ label: c.name, value: c.id }))]

  return (
    <DashboardLayout pageTitle="Market Transactions">
      {/* ERCOT badge + breadcrumb */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl font-black" style={{ color: "#cc1111" }}>ERCOT</span>
        <span style={{ color: "var(--surface-border)" }}>/</span>
        <span className="text-sm" style={{ color: "var(--text-color-secondary)" }}>Market Transactions</span>
      </div>

      {/* Submission type ribbon */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-4 border-b" style={{ borderColor: "var(--surface-border)" }}>
        {SUBMISSION_TYPES.map(type => (
          <button
            key={type}
            onClick={() => {
              const next = selectedSubmissionType === type ? null : type
              setSelectedSubmissionType(next)
              if (type === "Energy Trades" && next === null) {
                setSelectedCounterparty("all")
                setStatusFilter("all")
              }
            }}
            className="px-4 py-2 text-sm font-medium whitespace-nowrap transition-all border-b-2"
            style={{
              color: selectedSubmissionType === type ? "#cc1111" : "var(--text-color-secondary)",
              borderBottomColor: selectedSubmissionType === type ? "#cc1111" : "transparent",
              background: selectedSubmissionType === type ? "rgba(204,17,17,0.06)" : "transparent",
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor: "var(--surface-border)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: "var(--text-color-secondary)" }}>Entity:</span>
          <Dropdown value={selectedEntity} options={entityOptions} onChange={e => setSelectedEntity(e.value)} style={{ width: "120px" }} />
        </div>

        {!isEnergyTradesSelected && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: "var(--text-color-secondary)" }}>Resource:</span>
            <Dropdown value={selectedResourceId} options={resourceOptions} onChange={e => setSelectedResourceId(e.value)} style={{ width: "140px" }} />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: "var(--text-color-secondary)" }}>Date Range:</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="px-2 py-1.5 rounded border text-sm"
            style={{ background: "var(--surface-card)", borderColor: "var(--surface-border)", color: "var(--text-color)" }} />
          <span style={{ color: "var(--text-color-secondary)", fontSize: 12 }}>to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="px-2 py-1.5 rounded border text-sm"
            style={{ background: "var(--surface-card)", borderColor: "var(--surface-border)", color: "var(--text-color)" }} />
        </div>

        <div className="flex-1" />

        {isEnergyTradesSelected && (
          <>
            {/* Three-position status toggle */}
            <div className="flex items-center rounded-full p-1 gap-1"
              style={{ background: "var(--surface-section)" }}>
              {(["all", "active", "inactive"] as const).map(pos => (
                <button
                  key={pos}
                  onClick={() => setStatusFilter(pos)}
                  className="px-3 py-1 text-xs font-medium rounded-full transition-all capitalize"
                  style={{
                    background: statusFilter === pos ? "var(--surface-card)" : "transparent",
                    color: statusFilter === pos ? "#cc1111" : "var(--text-color-secondary)",
                    boxShadow: statusFilter === pos ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                  }}
                >
                  {pos}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: "var(--text-color-secondary)" }}>Counterparty:</span>
              <Dropdown value={selectedCounterparty} options={cpOptions} onChange={e => setSelectedCounterparty(e.value)} style={{ width: "180px" }} />
            </div>
          </>
        )}

        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..." style={{ width: "200px" }} />
        </span>

        <Button icon="pi pi-ellipsis-v" outlined size="small" />
      </div>

      {/* Entity-level DataTable */}
      <DataTable
        value={entityRows}
        dataKey="entity"
        expandedRows={expandedEntityRows}
        onRowToggle={e => setExpandedEntityRows(e.data as DataTableExpandedRows)}
        rowExpansionTemplate={entityExpansionTemplate}
        stripedRows
        size="small"
        emptyMessage="No transactions match the current filters."
      >
        <Column expander style={{ width: "3rem" }} />
        <Column field="entity" header="Entity"
          body={(r: EntityRow) => <span className="font-semibold">{r.entity}</span>} />
        <Column header="Resources"
          body={(r: EntityRow) => (
            <span className="text-sm" style={{ color: "var(--text-color-secondary)" }}>{r.resourceCount} resource(s)</span>
          )} />
        <Column header="Total Submissions"
          body={(r: EntityRow) => (
            <Tag value={`${r.submissionCount}`} severity="info" />
          )} />
      </DataTable>
    </DashboardLayout>
  )
}
