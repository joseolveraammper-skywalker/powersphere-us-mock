"use client"

import React, { useState, useRef } from "react"
import { useCounterparties, type Counterparty } from "@/lib/counterparty-context"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Dialog } from "primereact/dialog"
import type { DataTableExpandedRows } from "primereact/datatable"

// ── Types ──────────────────────────────────────────────────────────────────
type UploadedDocument = {
  id: string; name: string; description: string; uploadedBy: string; lastModified: string
}

type Site = {
  id: string; siteName: string; resourceType: string; esiId: string
  address: string; state: string; city: string; zipCode: string; zipCodePlus4: string
  contractStartDate: string; contractEndDate: string; tdsp: string
  realTimeOperations: boolean
  esrAssetCode: string; esrStationVoltage: string; esrTotalLoadAtPod: string; esrInterruptibleLoad: string
  nclrAssetCode: string; nclrStationVoltage: string; nclrStorageCapacity: string; nclrPowerCapacity: string
  nclrProgramEcrs: boolean; nclrProgramRegup: boolean; nclrProgramRegdown: boolean
  nclrProgramRrs: boolean; nclrProgramNonSpin: boolean
}

// ── Constants ──────────────────────────────────────────────────────────────
const MOCK_USER_EMAIL = "admin@powersphere.com"

const clientTypes = [
  { id: "holding",      label: "Holding Company",      icon: "pi pi-building" },
  { id: "ems",          label: "EMS",                  icon: "pi pi-bolt" },
  { id: "independent",  label: "Independent Company",  icon: "pi pi-briefcase" },
  { id: "counterparty", label: "Counterparty",         icon: "pi pi-users" },
]

const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"]
const TX_CITIES = ["Houston","Dallas","Austin","San Antonio","Fort Worth","El Paso","Arlington","Corpus Christi","Plano","Lubbock"]
const QSE_OPTIONS = ["QSE-001","QSE-002","QSE-003","QSE-004","QSE-005"]
const CONTACT_ROLES = ["Executive","Manager","Engineer","Analyst","Operator","Other"]
const DIRECTORY_OPTIONS = ["Directory A","Directory B","Directory C","Directory D"]
const TDSP_OPTIONS = ["Oncor","CenterPoint","AEP Texas Central","AEP Texas North","Texas-New Mexico Power","Sharyland Utilities"]

// ── Style constants ────────────────────────────────────────────────────────
const BORDER = "1px solid var(--surface-border)"

const fLabel: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.06em",
  color: "var(--text-color-secondary)", marginBottom: 4,
}

const nativeInput: React.CSSProperties = {
  width: "100%", padding: "0.375rem 0.5rem", fontSize: 12,
  border: BORDER, borderRadius: 6, background: "var(--surface-card)",
  color: "var(--text-color)", outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
}

const btnPrimary: React.CSSProperties = {
  background: "#cc1111", border: "none", borderRadius: 6, fontSize: 12,
  fontWeight: 600, padding: "0.35rem 0.875rem", color: "#fff",
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
}

const btnSecondary: React.CSSProperties = {
  background: "none", border: BORDER, borderRadius: 6, fontSize: 12,
  fontWeight: 500, padding: "0.35rem 0.75rem", color: "var(--text-color-secondary)",
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
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

// ── Shared atoms ───────────────────────────────────────────────────────────
function FieldGroup({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", ...style }}>
      <label style={fLabel}>{label}</label>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 34, height: 18, borderRadius: 9, border: "none", padding: 2, flexShrink: 0,
        background: checked ? "#cc1111" : "var(--surface-border)",
        cursor: "pointer", display: "inline-flex", alignItems: "center",
        transition: "background 0.2s",
      }}
    >
      <span style={{
        width: 14, height: 14, borderRadius: "50%", background: "#fff", display: "block",
        transform: checked ? "translateX(16px)" : "translateX(0)",
        transition: "transform 0.2s", flexShrink: 0,
      }} />
    </button>
  )
}

function StatusPill({ status }: { status: string }) {
  const active = status === "Active"
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: active ? "rgba(45,122,45,0.10)" : "rgba(100,100,100,0.10)",
      color: active ? "#2d7a2d" : "var(--text-color-secondary)",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? "#2d7a2d" : "var(--text-color-secondary)", flexShrink: 0 }} />
      {status}
    </span>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ClientConfigurationPage() {
  const { counterparties, addCounterparty, updateCounterparty, deleteCounterparty } = useCounterparties()
  const [activeTab, setActiveTab] = useState(0)
  const [participantType, setParticipantType] = useState<"market" | "non-participant">("market")
  const [selectedClientType, setSelectedClientType] = useState<string>("counterparty")
  const [expandedSites, setExpandedSites] = useState<string[]>([])

  const emptyForm = buildEmptyForm()
  const [formData, setFormData] = useState(emptyForm)

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith("programs.")) {
      const key = field.replace("programs.", "")
      setFormData(prev => ({ ...prev, programs: { ...prev.programs, [key]: value } }))
    } else if (field.startsWith("marketTransactionsOptions.")) {
      const key = field.replace("marketTransactionsOptions.", "")
      setFormData(prev => ({ ...prev, marketTransactionsOptions: { ...prev.marketTransactionsOptions, [key]: value } }))
    } else if (field.startsWith("energyTradesConfig.")) {
      const key = field.replace("energyTradesConfig.", "")
      setFormData(prev => ({ ...prev, energyTradesConfig: { ...prev.energyTradesConfig, [key]: value } }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = () => {
    if (!formData.name) return
    addCounterparty({
      name: formData.name, address: formData.address,
      counterparty: formData.energyTradesConfig.counterparty || formData.counterparty,
      clientId: formData.energyTradesConfig.clientId || formData.clientId,
      misShortname: formData.energyTradesConfig.misShortname || formData.misShortname,
      directoryName: formData.contactName || formData.directoryName,
      directoryEmail: formData.contactEmail || formData.directoryEmail,
      directoryPhone: formData.contactPhone || formData.directoryPhone,
      status: formData.energyTradesConfig.status ? "Active" : "Inactive",
      createdBy: "Current User",
      documents: formData.uploadedDocuments,
    })
    setFormData(buildEmptyForm())
    setExpandedSites([])
  }

  const tabs = [
    { label: "Client Board",        icon: "pi pi-users" },
    { label: "Client Registration", icon: "pi pi-user-plus" },
  ]

  return (
    <DashboardLayout pageTitle="Client Configuration">
      {/* ── Underline Tab Bar ── */}
      <div style={{ display: "flex", alignItems: "flex-end", borderBottom: BORDER, marginBottom: "1.5rem" }}>
        {tabs.map((tab, i) => {
          const active = activeTab === i
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.65rem 1.1rem",
                background: "transparent", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? "#cc1111" : "var(--text-color-secondary)",
                borderBottom: active ? "2px solid #cc1111" : "2px solid transparent",
                marginBottom: -1, outline: "none", whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}
            >
              <i className={tab.icon} style={{ fontSize: 12 }} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 0 && (
        <ClientBoardTab
          counterparties={counterparties}
          onDelete={deleteCounterparty}
          onUpdate={updateCounterparty}
        />
      )}

      {activeTab === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Participant type pills */}
          <div style={{ display: "flex", gap: 8 }}>
            {(["market", "non-participant"] as const).map(pt => (
              <button
                key={pt}
                onClick={() => setParticipantType(pt)}
                style={{
                  padding: "0.3rem 1rem", borderRadius: 999, fontSize: 12, fontWeight: 500,
                  background: participantType === pt ? "#cc1111" : "var(--surface-card)",
                  color: participantType === pt ? "#fff" : "var(--text-color-secondary)",
                  border: `1px solid ${participantType === pt ? "#cc1111" : "var(--surface-border)"}`,
                  cursor: "pointer",
                }}
              >
                {pt === "market" ? "Market participant" : "Non-participant"}
              </button>
            ))}
          </div>

          {participantType === "market" && (
            <ClientRegistrationTab
              selectedClientType={selectedClientType}
              onClientTypeChange={setSelectedClientType}
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              setFormData={setFormData}
              expandedSites={expandedSites}
              setExpandedSites={setExpandedSites}
            />
          )}
          {participantType === "non-participant" && <NonParticipantRegistrationTab />}
        </div>
      )}
    </DashboardLayout>
  )
}

// ── Client Board Tab ───────────────────────────────────────────────────────
function ClientBoardTab({
  counterparties, onDelete, onUpdate,
}: { counterparties: Counterparty[]; onDelete: (id: string) => void; onUpdate: (c: Counterparty) => void }) {
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>({})
  const [editingClient, setEditingClient] = useState<Counterparty | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const handleEditSave = () => {
    if (editingClient) { onUpdate(editingClient); setEditModalOpen(false); setEditingClient(null) }
  }

  const setField = (field: keyof Counterparty, value: string) => {
    if (editingClient) setEditingClient({ ...editingClient, [field]: value })
  }

  // ── Column bodies ──
  const nameBody = (cp: Counterparty) => (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-color)" }}>{cp.name}</div>
      <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginTop: 1 }}>{cp.address}</div>
    </div>
  )
  const contactBody = (cp: Counterparty) => (
    <div>
      <div style={{ fontSize: 13, color: "var(--text-color)" }}>{cp.directoryName}</div>
      <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginTop: 1 }}>{cp.directoryEmail}</div>
    </div>
  )
  const statusBody = (cp: Counterparty) => <StatusPill status={cp.status} />
  const actionsBody = (cp: Counterparty) => (
    <div style={{ display: "flex", gap: 4 }}>
      <button
        title="Edit"
        onClick={() => { setEditingClient({ ...cp }); setEditModalOpen(true) }}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color-secondary)", padding: "3px 5px", borderRadius: 4, display: "flex", alignItems: "center" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#cc1111"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-color-secondary)"}
      >
        <i className="pi pi-pencil" style={{ fontSize: 12 }} />
      </button>
      <button
        title="Delete"
        onClick={() => onDelete(cp.id)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color-secondary)", padding: "3px 5px", borderRadius: 4, display: "flex", alignItems: "center" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#cc1111"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-color-secondary)"}
      >
        <i className="pi pi-trash" style={{ fontSize: 12 }} />
      </button>
    </div>
  )

  const expansionTemplate = (cp: Counterparty) => (
    <div style={{ padding: "1rem 1.25rem", background: "var(--surface-ground)", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Audit */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)", marginBottom: 8 }}>Audit Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[["Created By", cp.createdBy], ["Created On", cp.createdOn], ["Modified By", cp.modifiedBy], ["Last Modified", cp.lastModifiedOn]].map(([label, val]) => (
            <div key={label} style={{ padding: "0.5rem 0.625rem", borderRadius: 6, border: BORDER, background: "var(--surface-card)" }}>
              <div style={{ fontSize: 10, color: "var(--text-color-secondary)", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-color)" }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Documents */}
      {cp.documents && cp.documents.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)", marginBottom: 8 }}>Documents</div>
          <div style={{ borderRadius: 8, overflow: "hidden", border: BORDER }}>
            <DataTable value={cp.documents} size="small" style={{ background: "var(--surface-card)" }}
              pt={{ thead: { style: { background: "var(--surface-card)" } }, tbody: { style: { background: "var(--surface-card)" } }, column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } } }}>
              <Column header="Document" body={(d: UploadedDocument) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="pi pi-file" style={{ fontSize: 12, color: "var(--text-color-secondary)" }} />
                  <span style={{ fontSize: 12 }}>{d.name}</span>
                </div>
              )} />
              <Column field="description" header="Description" />
              <Column field="uploadedBy" header="Uploaded By" />
              <Column field="lastModified" header="Last Modified" />
            </DataTable>
          </div>
        </div>
      )}
    </div>
  )

  const activeCount = counterparties.filter(c => c.status === "Active").length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Edit Modal */}
      <Dialog
        header={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(204,17,17,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="pi pi-pencil" style={{ fontSize: 11, color: "#cc1111" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-color)" }}>Edit Client</span>
          </div>
        }
        visible={editModalOpen}
        onHide={() => setEditModalOpen(false)}
        style={{ width: 680 }}
        modal
        pt={{
          header: { style: { borderBottom: BORDER, padding: "0.75rem 1rem" } },
          content: { style: { padding: "1rem" } },
        }}
      >
        {editingClient && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Status toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0.875rem", borderRadius: 8, background: "var(--surface-section)", border: BORDER }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-color)" }}>Client Status</div>
                <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginTop: 2 }}>Toggle to activate or deactivate</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Inactive</span>
                <Toggle
                  checked={editingClient.status === "Active"}
                  onChange={v => setEditingClient({ ...editingClient, status: v ? "Active" : "Inactive" })}
                />
                <span style={{ fontSize: 11, fontWeight: 600, color: editingClient.status === "Active" ? "#cc1111" : "var(--text-color-secondary)" }}>Active</span>
              </div>
            </div>

            {/* Company info */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)", marginBottom: 8 }}>Company Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FieldGroup label="Company Name">
                  <input value={editingClient.name} onChange={e => setField("name", e.target.value)} style={nativeInput} />
                </FieldGroup>
                <FieldGroup label="Address">
                  <input value={editingClient.address} onChange={e => setField("address", e.target.value)} style={nativeInput} />
                </FieldGroup>
              </div>
            </div>

            {/* Energy trades */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)", marginBottom: 8 }}>Energy Trades Configuration</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <FieldGroup label="Client ID">
                  <input value={editingClient.clientId} onChange={e => setField("clientId", e.target.value)} style={nativeInput} />
                </FieldGroup>
                <FieldGroup label="Counterparty">
                  <input value={editingClient.counterparty} onChange={e => setField("counterparty", e.target.value)} style={nativeInput} />
                </FieldGroup>
                <FieldGroup label="MIS Shortname">
                  <input value={editingClient.misShortname} onChange={e => setField("misShortname", e.target.value)} style={nativeInput} />
                </FieldGroup>
              </div>
            </div>

            {/* Contact */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)", marginBottom: 8 }}>Contact Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <FieldGroup label="Contact Name">
                  <input value={editingClient.directoryName} onChange={e => setField("directoryName", e.target.value)} style={nativeInput} />
                </FieldGroup>
                <FieldGroup label="Contact Email">
                  <input value={editingClient.directoryEmail} onChange={e => setField("directoryEmail", e.target.value)} style={nativeInput} />
                </FieldGroup>
                <FieldGroup label="Contact Phone">
                  <input value={editingClient.directoryPhone} onChange={e => setField("directoryPhone", e.target.value)} style={nativeInput} />
                </FieldGroup>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: "0.5rem", borderTop: BORDER }}>
              <button style={btnSecondary} onClick={() => setEditModalOpen(false)}>Cancel</button>
              <button style={btnPrimary} onClick={handleEditSave}>
                <i className="pi pi-check" style={{ fontSize: 11 }} />
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* KPI bar */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: "1rem", padding: "0.5rem 0.875rem", borderRadius: 10, background: "var(--surface-card)", border: BORDER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(204,17,17,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="pi pi-users" style={{ fontSize: 12, color: "#cc1111" }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)", lineHeight: 1 }}>Counterparties</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-color)", lineHeight: 1.2 }}>{counterparties.length}</div>
          </div>
        </div>
        <div style={{ width: 1, height: 24, background: "var(--surface-border)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="pi pi-check-circle" style={{ fontSize: 11, color: "#2d7a2d" }} />
          <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Active</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#2d7a2d" }}>{activeCount}</span>
        </div>
        <div style={{ width: 1, height: 24, background: "var(--surface-border)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="pi pi-minus-circle" style={{ fontSize: 11, color: "var(--text-color-secondary)" }} />
          <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Inactive</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-color-secondary)" }}>{counterparties.length - activeCount}</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: BORDER }}>
        <DataTable
          value={counterparties}
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={e => setExpandedRows(e.data as DataTableExpandedRows)}
          rowExpansionTemplate={expansionTemplate}
          size="small"
          emptyMessage="No counterparties registered yet. Go to Client Registration to add one."
          style={{ background: "var(--surface-card)" }}
          pt={{
            thead: { style: { background: "var(--surface-card)" } },
            tbody: { style: { background: "var(--surface-card)" } },
            column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } },
          }}
        >
          <Column expander style={{ width: "2.5rem" }} />
          <Column header="Name" body={nameBody} sortable sortField="name" style={{ minWidth: 200 }} />
          <Column field="clientId" header="Client ID" style={{ fontFamily: "monospace", fontSize: 12, width: 120 }} />
          <Column field="misShortname" header="MIS Shortname" style={{ fontFamily: "monospace", fontSize: 12, width: 130 }} />
          <Column header="Contact" body={contactBody} style={{ minWidth: 180 }} />
          <Column header="Status" body={statusBody} style={{ width: 100 }} />
          <Column header="" body={actionsBody} style={{ width: 90 }} />
        </DataTable>
      </div>
    </div>
  )
}

// ── Non-participant Tab ────────────────────────────────────────────────────
function NonParticipantRegistrationTab() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [operatorData, setOperatorData] = useState({ operatorName: "", email: "", phoneNumber: "", operatorId: "" })
  const [moduleAccess, setModuleAccess] = useState({ realTimeOperations: false, reportsRepository: false, cryptocurrencyMiners: false, indirectMarketParticipants: false })

  const toggleModule = (key: keyof typeof moduleAccess) => setModuleAccess(p => ({ ...p, [key]: !p[key] }))

  const handleSubmit = () => {
    if (!operatorData.operatorName || !operatorData.operatorId) return
    setOperatorData({ operatorName: "", email: "", phoneNumber: "", operatorId: "" })
    setModuleAccess({ realTimeOperations: false, reportsRepository: false, cryptocurrencyMiners: false, indirectMarketParticipants: false })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ padding: "1.25rem", borderRadius: 10, border: BORDER, background: "var(--surface-card)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-color)", marginBottom: 4 }}>Create non-participant</div>
        <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginBottom: 16 }}>Select type</div>
        <div style={{ display: "flex", gap: 12 }}>
          {[{ id: "operator", label: "Operator", icon: "pi pi-user" }].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                padding: "1rem 1.5rem", borderRadius: 8, cursor: "pointer",
                border: `2px solid ${selectedType === t.id ? "#cc1111" : "var(--surface-border)"}`,
                background: selectedType === t.id ? "rgba(204,17,17,0.06)" : "transparent",
              }}
            >
              <i className={t.icon} style={{ fontSize: 16, color: selectedType === t.id ? "#cc1111" : "var(--text-color-secondary)" }} />
              <span style={{ fontSize: 12, fontWeight: selectedType === t.id ? 600 : 400, color: selectedType === t.id ? "#cc1111" : "var(--text-color-secondary)" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedType === "operator" && (
        <div style={{ padding: "1.25rem", borderRadius: 10, border: BORDER, background: "var(--surface-card)", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <FieldGroup label="Operator Name *">
            <input value={operatorData.operatorName} onChange={e => setOperatorData(p => ({ ...p, operatorName: e.target.value }))} style={nativeInput} />
          </FieldGroup>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldGroup label="Email">
              <input value={operatorData.email} onChange={e => setOperatorData(p => ({ ...p, email: e.target.value }))} style={nativeInput} />
            </FieldGroup>
            <FieldGroup label="Phone Number">
              <input value={operatorData.phoneNumber} onChange={e => setOperatorData(p => ({ ...p, phoneNumber: e.target.value }))} style={nativeInput} />
            </FieldGroup>
          </div>
          <FieldGroup label="Operator ID *">
            <input value={operatorData.operatorId} onChange={e => setOperatorData(p => ({ ...p, operatorId: e.target.value }))} style={{ ...nativeInput, width: 240 }} />
          </FieldGroup>

          {/* Module Access */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", padding: "0.875rem", borderRadius: 8, border: BORDER, background: "var(--surface-section)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)", marginBottom: 2 }}>Module Access</div>
            <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginBottom: 4 }}>Select which modules this operator can access with their login credentials</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {([
                ["realTimeOperations",        "pi pi-desktop",   "Real Time Operations"],
                ["reportsRepository",         "pi pi-folder",    "Reports Repository"],
                ["cryptocurrencyMiners",      "pi pi-bitcoin",   "Cryptocurrency Miners"],
                ["indirectMarketParticipants","pi pi-users",     "Indirect Market Participants"],
              ] as [keyof typeof moduleAccess, string, string][]).map(([key, icon, label]) => {
                const active = moduleAccess[key]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleModule(key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "0.5rem 0.75rem", borderRadius: 8, cursor: "pointer",
                      border: `1.5px solid ${active ? "#cc1111" : "var(--surface-border)"}`,
                      background: active ? "rgba(204,17,17,0.06)" : "var(--surface-card)",
                      textAlign: "left",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: active ? "rgba(204,17,17,0.12)" : "var(--surface-section)",
                    }}>
                      <i className={icon} style={{ fontSize: 13, color: active ? "#cc1111" : "var(--text-color-secondary)" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "#cc1111" : "var(--text-color)" }}>{label}</span>
                    {active && <i className="pi pi-check" style={{ fontSize: 10, color: "#cc1111", marginLeft: "auto" }} />}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.25rem" }}>
            <button style={{ ...btnPrimary, opacity: (!operatorData.operatorName || !operatorData.operatorId) ? 0.4 : 1 }} onClick={handleSubmit} disabled={!operatorData.operatorName || !operatorData.operatorId}>
              <i className="pi pi-check" style={{ fontSize: 11 }} />
              Register Operator
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Client Registration Tab ────────────────────────────────────────────────
function ClientRegistrationTab({
  selectedClientType, onClientTypeChange, formData, onInputChange, onSubmit, setFormData, expandedSites, setExpandedSites,
}: {
  selectedClientType: string
  onClientTypeChange: (t: string) => void
  formData: ReturnType<typeof buildEmptyForm>
  onInputChange: (field: string, value: string | boolean) => void
  onSubmit: () => void
  setFormData: React.Dispatch<React.SetStateAction<ReturnType<typeof buildEmptyForm>>>
  expandedSites: string[]
  setExpandedSites: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingDescription, setPendingDescription] = useState("")

  const isCounterparty = selectedClientType === "counterparty"
  const isEMS = selectedClientType === "ems"

  const handleAddDocument = () => {
    if (!pendingFile) return
    const now = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
    const newDoc: UploadedDocument = { id: Date.now().toString(), name: pendingFile.name, description: pendingDescription, uploadedBy: MOCK_USER_EMAIL, lastModified: now }
    setFormData(prev => ({ ...prev, uploadedDocuments: [...prev.uploadedDocuments, newDoc] }))
    setPendingFile(null); setPendingDescription("")
  }

  const handleRemoveDocument = (docId: string) => {
    setFormData(prev => ({ ...prev, uploadedDocuments: prev.uploadedDocuments.filter(d => d.id !== docId) }))
  }

  const addSite = () => {
    if (isEMS) return
    const newSite: Site = {
      id: Date.now().toString(), siteName: "", resourceType: "", esiId: "", address: "", state: "", city: "",
      zipCode: "", zipCodePlus4: "", contractStartDate: "", contractEndDate: "", tdsp: "", realTimeOperations: false,
      esrAssetCode: "", esrStationVoltage: "", esrTotalLoadAtPod: "", esrInterruptibleLoad: "",
      nclrAssetCode: "", nclrStationVoltage: "", nclrStorageCapacity: "", nclrPowerCapacity: "",
      nclrProgramEcrs: false, nclrProgramRegup: false, nclrProgramRegdown: false, nclrProgramRrs: false, nclrProgramNonSpin: false,
    }
    setFormData(prev => ({ ...prev, sites: [...prev.sites, newSite] }))
    setExpandedSites(prev => [...prev, newSite.id])
  }

  const updateSite = (siteId: string, field: keyof Site, value: string | boolean) => {
    setFormData(prev => ({ ...prev, sites: prev.sites.map(s => s.id === siteId ? { ...s, [field]: value } : s) }))
  }

  const removeSite = (siteId: string) => {
    setFormData(prev => ({ ...prev, sites: prev.sites.filter(s => s.id !== siteId) }))
    setExpandedSites(prev => prev.filter(id => id !== siteId))
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Upload Document Modal */}
      <Dialog
        header={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(204,17,17,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="pi pi-upload" style={{ fontSize: 11, color: "#cc1111" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-color)" }}>Upload Document</span>
          </div>
        }
        visible={uploadModalOpen}
        onHide={() => setUploadModalOpen(false)}
        style={{ width: 480 }}
        modal
        pt={{
          header: { style: { borderBottom: BORDER, padding: "0.75rem 1rem" } },
          content: { style: { padding: "1rem" } },
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <FieldGroup label="Description (optional)">
            <input value={pendingDescription} onChange={e => setPendingDescription(e.target.value)} placeholder="Enter description" style={nativeInput} />
          </FieldGroup>
          <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={e => { if (e.target.files) setPendingFile(e.target.files[0]) }} />
          <button style={btnSecondary} onClick={() => fileInputRef.current?.click()}>
            <i className="pi pi-folder-open" style={{ fontSize: 11 }} />
            Select File
          </button>
          {pendingFile && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 0.625rem", borderRadius: 6, border: BORDER, background: "var(--surface-section)" }}>
              <i className="pi pi-file" style={{ fontSize: 12, color: "#cc1111" }} />
              <span style={{ fontSize: 12, flex: 1, color: "var(--text-color)" }}>{pendingFile.name}</span>
              <button onClick={() => setPendingFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color-secondary)", padding: 2, display: "flex" }}>
                <i className="pi pi-times" style={{ fontSize: 11 }} />
              </button>
            </div>
          )}
          {formData.uploadedDocuments.length > 0 && (
            <div style={{ borderRadius: 8, overflow: "hidden", border: BORDER }}>
              <DataTable value={formData.uploadedDocuments} size="small" style={{ background: "var(--surface-card)" }}
                pt={{ thead: { style: { background: "var(--surface-card)" } }, tbody: { style: { background: "var(--surface-card)" } }, column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } } }}>
                <Column header="Document" body={(d: UploadedDocument) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="pi pi-file" style={{ fontSize: 11, color: "var(--text-color-secondary)" }} />
                    <span style={{ fontSize: 12 }}>{d.name}</span>
                  </div>
                )} />
                <Column field="description" header="Description" />
                <Column field="uploadedBy" header="Uploaded By" />
                <Column field="lastModified" header="Modified" />
                <Column header="" body={(d: UploadedDocument) => (
                  <button onClick={() => handleRemoveDocument(d.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color-secondary)", padding: 2, display: "flex" }}>
                    <i className="pi pi-times" style={{ fontSize: 11 }} />
                  </button>
                )} style={{ width: 40 }} />
              </DataTable>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: "0.25rem", borderTop: BORDER }}>
            <button style={{ ...btnPrimary, opacity: !pendingFile ? 0.4 : 1, cursor: !pendingFile ? "not-allowed" : "pointer" }} onClick={handleAddDocument} disabled={!pendingFile}>
              <i className="pi pi-plus" style={{ fontSize: 11 }} />
              Add Document
            </button>
          </div>
        </div>
      </Dialog>

      {/* Client type picker */}
      <div style={{ padding: "1.25rem", borderRadius: 10, border: BORDER, background: "var(--surface-card)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-color)", marginBottom: 4 }}>Create client</div>
        <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginBottom: 16 }}>Select company type</div>
        <div style={{ display: "flex", gap: 10 }}>
          {clientTypes.map(t => {
            const active = selectedClientType === t.id
            return (
              <button
                key={t.id}
                onClick={() => onClientTypeChange(t.id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  padding: "0.875rem 0.5rem", borderRadius: 8, cursor: "pointer",
                  border: `2px solid ${active ? "#cc1111" : "var(--surface-border)"}`,
                  background: active ? "rgba(204,17,17,0.06)" : "transparent",
                }}
              >
                <i className={t.icon} style={{ fontSize: 16, color: active ? "#cc1111" : "var(--text-color-secondary)" }} />
                <span style={{ fontSize: 11, textAlign: "center", fontWeight: active ? 600 : 400, color: active ? "#cc1111" : "var(--text-color-secondary)" }}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Registration form */}
      <div style={{ padding: "1.25rem", borderRadius: 10, border: BORDER, background: "var(--surface-card)", display: "flex", flexDirection: "column", gap: "0.875rem" }}>

        {/* Section: Company */}
        <SectionLabel>Company</SectionLabel>
        <FieldGroup label="Company Name">
          <input value={formData.name} onChange={e => onInputChange("name", e.target.value)} placeholder="Enter company name" style={nativeInput} />
        </FieldGroup>
        <FieldGroup label="Short Company Name">
          <input value={formData.shortName} onChange={e => onInputChange("shortName", e.target.value)} placeholder="Short name" style={nativeInput} />
        </FieldGroup>
        <FieldGroup label="Address">
          <input value={formData.address} onChange={e => onInputChange("address", e.target.value)} placeholder="Street address" style={nativeInput} />
        </FieldGroup>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <FieldGroup label="State">
            <select value={formData.state} onChange={e => onInputChange("state", e.target.value)} style={{ ...nativeInput, width: 160 }}>
              <option value="">Select state</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="City">
            <select value={formData.city} onChange={e => onInputChange("city", e.target.value)} style={{ ...nativeInput, width: 160 }}>
              <option value="">Select city</option>
              {TX_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="Zip Code">
            <input value={formData.zipCode} onChange={e => onInputChange("zipCode", e.target.value)} placeholder="00000" style={{ ...nativeInput, width: 100 }} />
          </FieldGroup>
          <FieldGroup label="Zip +4">
            <input value={formData.zipCodePlus4} onChange={e => onInputChange("zipCodePlus4", e.target.value)} placeholder="0000" style={{ ...nativeInput, width: 80 }} />
          </FieldGroup>
        </div>

        {!isCounterparty && (
          <FieldGroup label="MWH">
            <input value={formData.mwh} onChange={e => onInputChange("mwh", e.target.value)} placeholder="0.00" style={{ ...nativeInput, width: 200 }} />
          </FieldGroup>
        )}

        {/* Section: Contact */}
        <SectionLabel>Contact</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <FieldGroup label="Contact Name">
            <input value={formData.contactName} onChange={e => onInputChange("contactName", e.target.value)} style={nativeInput} />
          </FieldGroup>
          <FieldGroup label="Contact Email">
            <input value={formData.contactEmail} onChange={e => onInputChange("contactEmail", e.target.value)} style={nativeInput} />
          </FieldGroup>
          <FieldGroup label="Contact Phone">
            <input value={formData.contactPhone} onChange={e => onInputChange("contactPhone", e.target.value)} style={nativeInput} />
          </FieldGroup>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <FieldGroup label="Contact Role">
            <select value={formData.contactRole} onChange={e => onInputChange("contactRole", e.target.value)} style={{ ...nativeInput, width: 180 }}>
              <option value="">Select role</option>
              {CONTACT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </FieldGroup>
          {formData.contactRole === "Other" && (
            <FieldGroup label="Other Role">
              <input value={formData.contactOtherRole} onChange={e => onInputChange("contactOtherRole", e.target.value)} style={{ ...nativeInput, width: 200 }} />
            </FieldGroup>
          )}
        </div>

        {!isCounterparty && (
          <>
            <SectionLabel>Resources</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FieldGroup label="QSE">
                <select value={formData.qse} onChange={e => onInputChange("qse", e.target.value)} style={nativeInput}>
                  <option value="">Select QSE</option>
                  {QSE_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Resource Names">
                <input value={formData.resourceNames} onChange={e => onInputChange("resourceNames", e.target.value)} style={nativeInput} />
              </FieldGroup>
              <FieldGroup label="Resource IDs">
                <input value={formData.resourceIds} onChange={e => onInputChange("resourceIds", e.target.value)} style={nativeInput} />
              </FieldGroup>
            </div>
          </>
        )}

        <SectionLabel>Directory</SectionLabel>
        <FieldGroup label="Directory">
          <select value={formData.directory} onChange={e => onInputChange("directory", e.target.value)} style={nativeInput}>
            <option value="">Select directory</option>
            {DIRECTORY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </FieldGroup>

        {/* Documents */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.25rem" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-color)" }}>
            Documents
            {formData.uploadedDocuments.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, color: "#cc1111" }}>({formData.uploadedDocuments.length})</span>
            )}
          </span>
          <button style={btnSecondary} onClick={() => setUploadModalOpen(true)}>
            <i className="pi pi-upload" style={{ fontSize: 11 }} />
            Upload Files
          </button>
        </div>

        {/* Sites */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-color)" }}>Sites ({formData.sites.length})</span>
            <button
              style={{ ...btnSecondary, opacity: isEMS ? 0.4 : 1, cursor: isEMS ? "not-allowed" : "pointer" }}
              onClick={addSite}
              disabled={isEMS}
            >
              <i className="pi pi-plus" style={{ fontSize: 11 }} />
              Add Site
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {formData.sites.map(site => {
              const isExpanded = expandedSites.includes(site.id)
              return (
                <div key={site.id} style={{ borderRadius: 8, border: BORDER, overflow: "hidden" }}>
                  {/* Site header */}
                  <div
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "var(--surface-section)", cursor: "pointer" }}
                    onClick={() => setExpandedSites(prev => isExpanded ? prev.filter(id => id !== site.id) : [...prev, site.id])}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <i className={`pi pi-angle-${isExpanded ? "down" : "right"}`} style={{ fontSize: 11, color: "var(--text-color-secondary)" }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-color)" }}>{site.siteName || "New Site"}</span>
                      {site.esiId && <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-color-secondary)" }}>ESI: {site.esiId}</span>}
                    </div>
                    <button
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color-secondary)", padding: 2, display: "flex", alignItems: "center" }}
                      onClick={e => { e.stopPropagation(); removeSite(site.id) }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#cc1111"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-color-secondary)"}
                    >
                      <i className="pi pi-trash" style={{ fontSize: 11 }} />
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ background: "var(--surface-card)", display: "flex", flexDirection: "column" }}>
                      {/* Validation banner */}
                      {site.realTimeOperations && !site.resourceType && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 0.875rem", background: "#cc1111", color: "#fff", fontSize: 12, fontWeight: 500 }}>
                          <i className="pi pi-exclamation-triangle" style={{ fontSize: 12 }} />
                          A resource type must be selected when Real Time Operations is enabled
                        </div>
                      )}

                      <div style={{ padding: "0.875rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {/* Row 1: Site Name, Resource Type, ESI ID */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        <FieldGroup label="Site Name *">
                          <input value={site.siteName} onChange={e => updateSite(site.id, "siteName", e.target.value)} style={nativeInput} />
                        </FieldGroup>
                        <FieldGroup label="Resource Type *">
                          <select value={site.resourceType} onChange={e => updateSite(site.id, "resourceType", e.target.value)} style={nativeInput}>
                            <option value="">Select type</option>
                            <option value="ESR">ESR</option>
                            <option value="NCLR">NCLR</option>
                            <option value="GEN">GEN</option>
                          </select>
                        </FieldGroup>
                        <FieldGroup label="ESI ID">
                          <input value={site.esiId} onChange={e => updateSite(site.id, "esiId", e.target.value)} style={nativeInput} />
                        </FieldGroup>
                      </div>

                      {/* Row 2: Address */}
                      <FieldGroup label="Address">
                        <input value={site.address} onChange={e => updateSite(site.id, "address", e.target.value)} style={nativeInput} />
                      </FieldGroup>

                      {/* Row 3: State, City, Zip Code */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 12 }}>
                        <FieldGroup label="State *">
                          <select value={site.state} onChange={e => updateSite(site.id, "state", e.target.value)} style={nativeInput}>
                            <option value="">Select state</option>
                            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </FieldGroup>
                        <FieldGroup label="City *">
                          <select value={site.city} onChange={e => updateSite(site.id, "city", e.target.value)} style={nativeInput}>
                            <option value="">Select city</option>
                            {TX_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </FieldGroup>
                        <FieldGroup label="Zip Code">
                          <input value={site.zipCode} onChange={e => updateSite(site.id, "zipCode", e.target.value)} placeholder="00000" style={nativeInput} />
                        </FieldGroup>
                      </div>

                      {/* Row 4: Zip+4, Contract Start, Contract End */}
                      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: 12 }}>
                        <FieldGroup label="Zip Code + 4">
                          <input value={site.zipCodePlus4} onChange={e => updateSite(site.id, "zipCodePlus4", e.target.value)} placeholder="0000" style={nativeInput} />
                        </FieldGroup>
                        <FieldGroup label="Contract Start Date *">
                          <input type="date" value={site.contractStartDate} onChange={e => updateSite(site.id, "contractStartDate", e.target.value)} style={nativeInput} />
                        </FieldGroup>
                        <FieldGroup label="Contract End Date *">
                          <input type="date" value={site.contractEndDate} onChange={e => updateSite(site.id, "contractEndDate", e.target.value)} style={nativeInput} />
                        </FieldGroup>
                      </div>

                      {/* Row 5: TDSP */}
                      <FieldGroup label="TDSP">
                        <select value={site.tdsp} onChange={e => updateSite(site.id, "tdsp", e.target.value)} style={{ ...nativeInput, width: 280 }}>
                          <option value="">Select TDSP</option>
                          {TDSP_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </FieldGroup>

                      {/* Real Time Operations */}
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-color)", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={site.realTimeOperations}
                          onChange={e => updateSite(site.id, "realTimeOperations", e.target.checked)}
                          style={{ accentColor: "#cc1111", width: 14, height: 14, cursor: "pointer" }}
                        />
                        <span style={{ fontWeight: site.realTimeOperations ? 600 : 400 }}>Real Time Operations</span>
                      </label>

                      {site.resourceType === "ESR" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0.75rem", borderRadius: 6, border: BORDER, background: "var(--surface-section)" }}>
                          <FieldGroup label="Asset Code"><input value={site.esrAssetCode} onChange={e => updateSite(site.id, "esrAssetCode", e.target.value)} style={nativeInput} /></FieldGroup>
                          <FieldGroup label="Station Voltage"><input value={site.esrStationVoltage} onChange={e => updateSite(site.id, "esrStationVoltage", e.target.value)} style={nativeInput} /></FieldGroup>
                          <FieldGroup label="Total Load at POD"><input value={site.esrTotalLoadAtPod} onChange={e => updateSite(site.id, "esrTotalLoadAtPod", e.target.value)} style={nativeInput} /></FieldGroup>
                          <FieldGroup label="Interruptible Load"><input value={site.esrInterruptibleLoad} onChange={e => updateSite(site.id, "esrInterruptibleLoad", e.target.value)} style={nativeInput} /></FieldGroup>
                        </div>
                      )}

                      {site.resourceType === "NCLR" && (
                        <div style={{ padding: "0.75rem", borderRadius: 6, border: BORDER, background: "var(--surface-section)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <FieldGroup label="Asset Code"><input value={site.nclrAssetCode} onChange={e => updateSite(site.id, "nclrAssetCode", e.target.value)} style={nativeInput} /></FieldGroup>
                            <FieldGroup label="Station Voltage"><input value={site.nclrStationVoltage} onChange={e => updateSite(site.id, "nclrStationVoltage", e.target.value)} style={nativeInput} /></FieldGroup>
                            <FieldGroup label="Storage Capacity"><input value={site.nclrStorageCapacity} onChange={e => updateSite(site.id, "nclrStorageCapacity", e.target.value)} style={nativeInput} /></FieldGroup>
                            <FieldGroup label="Power Capacity"><input value={site.nclrPowerCapacity} onChange={e => updateSite(site.id, "nclrPowerCapacity", e.target.value)} style={nativeInput} /></FieldGroup>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                            {([["nclrProgramEcrs","ECRS"],["nclrProgramRegup","Reg Up"],["nclrProgramRegdown","Reg Down"],["nclrProgramRrs","RRS"],["nclrProgramNonSpin","Non-Spin"]] as [string,string][]).map(([key, label]) => (
                              <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-color)", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={(site as Record<string, boolean | string>)[key] as boolean}
                                  onChange={e => updateSite(site.id, key as keyof Site, e.target.checked)}
                                  style={{ accentColor: "#cc1111", width: 13, height: 13, cursor: "pointer" }}
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Programs */}
        <SectionLabel>Programs</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
          {/* Demand Response */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-color)", marginBottom: 10 }}>Demand Response</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {([["fourCP","4CP"],["ers","ERS"],["edr","EDR"],["clm","CLM"]] as [keyof typeof formData.programs, string][]).map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-color)", cursor: "pointer" }}>
                  <input type="checkbox" checked={formData.programs[key]} onChange={e => onInputChange(`programs.${key}`, e.target.checked)} style={{ accentColor: "#cc1111", width: 13, height: 13, cursor: "pointer" }} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Ancillary Services */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-color)", marginBottom: 10 }}>Ancillary Services</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {([["rrs","RRS"],["ecrs","ECRS"],["regulationService","Regulation Service"],["nonSpinReverseService","Non-Spin Reverse Service"]] as [keyof typeof formData.programs, string][]).map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-color)", cursor: "pointer" }}>
                  <input type="checkbox" checked={formData.programs[key]} onChange={e => onInputChange(`programs.${key}`, e.target.checked)} style={{ accentColor: "#cc1111", width: 13, height: 13, cursor: "pointer" }} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Operational Services */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-color)", marginBottom: 10 }}>Operational Services</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {([["meterReadings","Meter Readings"],["api","API"]] as [keyof typeof formData.programs, string][]).map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-color)", cursor: "pointer" }}>
                  <input type="checkbox" checked={formData.programs[key]} onChange={e => onInputChange(`programs.${key}`, e.target.checked)} style={{ accentColor: "#cc1111", width: 13, height: 13, cursor: "pointer" }} />
                  {label}
                </label>
              ))}
              {/* Market Transactions — has sub-options */}
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: formData.programs.marketTransactions ? 600 : 400, color: "var(--text-color)", cursor: "pointer" }}>
                <input type="checkbox" checked={formData.programs.marketTransactions} onChange={e => onInputChange("programs.marketTransactions", e.target.checked)} style={{ accentColor: "#cc1111", width: 13, height: 13, cursor: "pointer" }} />
                Market Transactions
              </label>
            </div>
          </div>
        </div>

        {/* Market Transactions sub-options */}
        {formData.programs.marketTransactions && (
          <div style={{ padding: "0.875rem 1rem", borderRadius: 8, border: BORDER, background: "var(--surface-section)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)" }}>Market Transactions Options</div>
            <div style={{ display: "flex", gap: 20 }}>
              {([["energyTrades","Energy Trades"],["ptp","PTP"],["tpo","TPO"]] as [keyof typeof formData.marketTransactionsOptions, string][]).map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: formData.marketTransactionsOptions[key] ? 600 : 400, color: "var(--text-color)", cursor: "pointer" }}>
                  <input type="checkbox" checked={formData.marketTransactionsOptions[key]} onChange={e => onInputChange(`marketTransactionsOptions.${key}`, e.target.checked)} style={{ accentColor: "#cc1111", width: 13, height: 13, cursor: "pointer" }} />
                  {label}
                </label>
              ))}
            </div>

            {/* Energy Trades config */}
            {formData.marketTransactionsOptions.energyTrades && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: "0.5rem", borderTop: BORDER }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)" }}>Energy Trades Configuration</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <FieldGroup label="Client ID">
                    <input value={formData.energyTradesConfig.clientId} onChange={e => onInputChange("energyTradesConfig.clientId", e.target.value)} style={nativeInput} />
                  </FieldGroup>
                  <FieldGroup label="Counterparty">
                    <input value={formData.energyTradesConfig.counterparty} onChange={e => onInputChange("energyTradesConfig.counterparty", e.target.value)} style={nativeInput} />
                  </FieldGroup>
                  <FieldGroup label="MIS Shortname">
                    <input value={formData.energyTradesConfig.misShortname} onChange={e => onInputChange("energyTradesConfig.misShortname", e.target.value)} style={nativeInput} />
                  </FieldGroup>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Toggle checked={formData.energyTradesConfig.status} onChange={v => onInputChange("energyTradesConfig.status", v)} />
                  <span style={{ fontSize: 12, color: "var(--text-color)" }}>Active</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: "0.75rem", borderTop: BORDER }}>
          <button
            style={{ ...btnPrimary, opacity: !formData.name ? 0.4 : 1, cursor: !formData.name ? "not-allowed" : "pointer" }}
            onClick={onSubmit}
            disabled={!formData.name}
          >
            <i className="pi pi-check" style={{ fontSize: 11 }} />
            Register Client
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Section label helper ───────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)", paddingTop: "0.25rem", paddingBottom: "0.125rem", borderBottom: BORDER }}>
      {children}
    </div>
  )
}

// ── Empty form factory ─────────────────────────────────────────────────────
function buildEmptyForm() {
  return {
    name: "", shortName: "", address: "", state: "", city: "", zipCode: "", zipCodePlus4: "",
    mwh: "", contactName: "", contactEmail: "", contactPhone: "", contactRole: "", contactOtherRole: "",
    qse: "", resourceNames: "", resourceIds: "", directory: "", counterparty: "", clientId: "",
    misShortname: "", directoryName: "", directoryEmail: "", directoryPhone: "", status: true,
    programs: { fourCP: false, ers: false, edr: false, clm: false, rrs: false, ecrs: false, regulationService: false, nonSpinReverseService: false, meterReadings: false, api: false, marketTransactions: false },
    marketTransactionsOptions: { energyTrades: false, ptp: false, tpo: false },
    energyTradesConfig: { clientId: "", counterparty: "", misShortname: "", status: true },
    uploadedDocuments: [] as UploadedDocument[],
    sites: [] as Site[],
  }
}
