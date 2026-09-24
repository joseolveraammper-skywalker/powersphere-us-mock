"use client"

import React, { useState, useMemo } from "react"
import { DataTable, DataTableExpandedRows } from "primereact/datatable"
import { Column } from "primereact/column"
import { Dialog } from "primereact/dialog"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import type { CustomerContract } from "@/lib/retail-customer-mock"
import { useAccountManager } from "@/lib/account-manager-context"

const BORDER = "1px solid var(--surface-border)"
const CTRL_H = "30px"

const nativeInput: React.CSSProperties = {
  height: CTRL_H, padding: "0 0.5rem", fontSize: 12, border: BORDER, borderRadius: 6,
  background: "var(--surface-card)", color: "var(--text-color)", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
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

// ── Tabs ───────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "contracts", label: "Customers and Contracts", icon: "pi pi-users" },
  { key: "ledger",    label: "Customer Ledger",         icon: "pi pi-book" },
  { key: "payments",  label: "Payment Monitor",         icon: "pi pi-credit-card" },
  { key: "bills",     label: "Bills/Statements",        icon: "pi pi-file" },
  { key: "usage",     label: "Usage",                   icon: "pi pi-chart-bar" },
  { key: "forms",     label: "Forms",                   icon: "pi pi-list" },
] as const
type TabKey = typeof TABS[number]["key"]

// ── Page ───────────────────────────────────────────────────────────────────────
export default function RetailCustomerPage() {
  const [active, setActive] = useState<TabKey>("contracts")

  return (
    <DashboardLayout title="Retail Customer">
      <div style={{ display: "flex", gap: 0, borderBottom: BORDER, marginBottom: 20 }}>
        {TABS.map(tab => (
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

      {active === "contracts" ? (
        <CustomersAndContracts />
      ) : (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", height: 256,
          fontSize: 13, color: "var(--text-color-secondary)",
        }}>
          {TABS.find(t => t.key === active)?.label} — coming soon
        </div>
      )}
    </DashboardLayout>
  )
}

// ── Customers and Contracts ────────────────────────────────────────────────────
function CustomersAndContracts() {
  const { retailCustomers } = useAccountManager()
  const [filter, setFilter] = useState("")
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | undefined>(undefined)
  const [contractPreview, setContractPreview] = useState<CustomerContract | null>(null)

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return retailCustomers
    return retailCustomers.filter(c =>
      c.customerName.toLowerCase().includes(q) ||
      c.contractNumber.toLowerCase().includes(q) ||
      c.facilities.some(f =>
        f.facilityNumber.includes(q) || f.serviceAddress.toLowerCase().includes(q)
      )
    )
  }, [filter, retailCustomers])

  const reset = () => {
    setFilter("")
    setExpandedRows(undefined)
  }

  const facilitiesTemplate = (c: CustomerContract) => (
    <div style={{ padding: "12px 16px 16px", background: "rgba(204,17,17,0.04)" }}>
      <div style={{ background: "var(--surface-card)", border: BORDER, borderRadius: 8, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-color)" }}>Facilities Information</span>
          <span style={{
            padding: "1px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: "rgba(37,99,235,0.10)", color: "#2563eb",
          }}>
            {c.facilities.length}
          </span>
        </div>
        <DataTable
          value={c.facilities}
          dataKey="facilityNumber"
          size="small"
          style={{ background: "var(--surface-card)" }}
          pt={{
            thead: { style: { background: "var(--surface-card)" } },
            tbody: { style: { background: "var(--surface-card)" } },
            column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } },
          }}
        >
          <Column field="facilityNumber" header="Facility Number" style={{ fontFamily: "monospace" }} />
          <Column field="serviceAddress" header="Service Address" />
          <Column field="meterStartDate" header="Meter Start Date" />
          <Column field="meterEndDate" header="Estimated Meter End Date" />
          <Column field="contractNumber" header="Contract Number" />
        </DataTable>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
        <button onClick={reset} title="Reset" style={{ ...btnSecondary, height: CTRL_H, padding: "0 10px" }}>
          <i className="pi pi-refresh" style={{ fontSize: 12 }} />
        </button>
        <div style={{ position: "relative" }}>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter..."
            style={{ ...nativeInput, width: 260, paddingRight: 28 }}
          />
          <i className="pi pi-search" style={{
            position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
            fontSize: 12, color: "var(--text-color-secondary)", pointerEvents: "none",
          }} />
        </div>
      </div>

      <div style={{ border: BORDER, borderRadius: 12, overflow: "hidden" }}>
        <DataTable
          value={rows}
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={e => setExpandedRows(e.data as DataTableExpandedRows)}
          rowExpansionTemplate={facilitiesTemplate}
          size="small"
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          emptyMessage="No customers match the current filter."
          style={{ background: "var(--surface-card)" }}
          pt={{
            thead: { style: { background: "var(--surface-card)" } },
            tbody: { style: { background: "var(--surface-card)" } },
            column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } },
            paginator: { root: { style: { borderTop: BORDER, fontSize: 12, padding: "4px 12px", background: "var(--surface-card)" } } },
          }}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column field="customerName" header="Customer Name" sortable
            body={(c: CustomerContract) => (
              <span style={{ fontWeight: 600, color: "var(--text-color)" }}>{c.customerName}</span>
            )} />
          <Column field="contractNumber" header="Contract Number" sortable />
          <Column field="executionDate" header="Contract Execution Date" />
          <Column field="startDate" header="Contract Start Date" />
          <Column field="endDate" header="Contract End Date" />
          <Column header="Contract" style={{ width: 90, textAlign: "center" }}
            body={(c: CustomerContract) => (
              <button
                onClick={() => setContractPreview(c)}
                title={`View ${c.contractNumber}.pdf`}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex" }}
              >
                <i className="pi pi-file-pdf" style={{ fontSize: 18, color: "#cc1111" }} />
              </button>
            )} />
        </DataTable>
      </div>

      <Dialog
        visible={!!contractPreview}
        onHide={() => setContractPreview(null)}
        header={contractPreview ? `${contractPreview.contractNumber}.pdf` : ""}
        style={{ width: 640 }}
        modal
        dismissableMask
      >
        {contractPreview && <ContractPreview contract={contractPreview} />}
      </Dialog>
    </div>
  )
}

function ContractPreview({ contract }: { contract: CustomerContract }) {
  const field = (label: string, value: string) => (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e", marginTop: 2 }}>{value}</div>
    </div>
  )

  return (
    <div style={{ background: "var(--surface-section)", padding: 16, borderRadius: 8 }}>
      <div style={{
        background: "#ffffff", color: "#1a1a2e", borderRadius: 4, padding: "28px 32px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)", fontSize: 12, lineHeight: 1.6,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #cc1111", paddingBottom: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#cc1111" }}>Ammper Power</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Retail Electricity Service Agreement</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#6b7280" }}>
            Contract No.<br />
            <strong style={{ color: "#1a1a2e" }}>{contract.contractNumber}</strong>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {field("Customer", contract.customerName)}
          {field("Execution Date", contract.executionDate)}
          {field("Term Start", contract.startDate)}
          {field("Term End", contract.endDate)}
        </div>

        <p style={{ margin: "0 0 12px" }}>
          This Agreement sets forth the terms under which Ammper Power will supply retail electric service to the
          Customer for the facilities listed below within the ERCOT market, for the term stated above.
        </p>

        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Schedule A — Facilities ({contract.facilities.length})</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr>
              {["ESI ID", "Service Address"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "4px 6px", borderBottom: "1px solid #d1d5db", color: "#6b7280", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contract.facilities.map(f => (
              <tr key={f.facilityNumber}>
                <td style={{ padding: "4px 6px", borderBottom: "1px solid #eef0f3", fontFamily: "monospace" }}>{f.facilityNumber}</td>
                <td style={{ padding: "4px 6px", borderBottom: "1px solid #eef0f3" }}>{f.serviceAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
