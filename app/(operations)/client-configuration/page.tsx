"use client"

import React, { useState, useRef } from "react"
import { useCounterparties, type Counterparty } from "@/lib/counterparty-context"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Button } from "primereact/button"
import { InputText } from "primereact/inputtext"
import { Dropdown } from "primereact/dropdown"
import { Dialog } from "primereact/dialog"
import { Tag } from "primereact/tag"
import { InputSwitch } from "primereact/inputswitch"
import { Checkbox } from "primereact/checkbox"
import { TabView, TabPanel } from "primereact/tabview"
import type { DataTableExpandedRows } from "primereact/datatable"
import { Building2, Zap, Building, Users, FileText, X } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────
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

const MOCK_USER_EMAIL = "admin@powersphere.com"

const clientTypes = [
  { id: "holding", label: "Holding company", icon: Building2 },
  { id: "ems", label: "EMS", icon: Zap },
  { id: "independent", label: "Independent Company", icon: Building },
  { id: "counterparty", label: "Counterparty", icon: Users },
]

const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"]
const TX_CITIES = ["Houston","Dallas","Austin","San Antonio","Fort Worth","El Paso","Arlington","Corpus Christi","Plano","Lubbock"]
const QSE_OPTIONS = ["QSE-001","QSE-002","QSE-003","QSE-004","QSE-005"]
const CONTACT_ROLES = ["Executive","Manager","Engineer","Analyst","Operator","Other"]
const DIRECTORY_OPTIONS = ["Directory A","Directory B","Directory C","Directory D"]

// ── Shared field helpers ────────────────────────────────────────
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-color-secondary)" }}>{label}</label>
      {children}
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────
export default function ClientConfigurationPage() {
  const { counterparties, addCounterparty, updateCounterparty, deleteCounterparty } = useCounterparties()

  const [participantType, setParticipantType] = useState<"market" | "non-participant">("market")
  const [selectedClientType, setSelectedClientType] = useState<string>("counterparty")
  const [expandedSites, setExpandedSites] = useState<string[]>([])

  const emptyForm = {
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
    setFormData(emptyForm)
    setExpandedSites([])
  }

  return (
    <DashboardLayout title="Client Configuration">
      <TabView>
        {/* ── Client Board ── */}
        <TabPanel header="Client Board">
          <ClientBoardTab
            counterparties={counterparties}
            onDelete={deleteCounterparty}
            onUpdate={updateCounterparty}
          />
        </TabPanel>

        {/* ── Client Registration ── */}
        <TabPanel header="Client Registration">
          <div className="space-y-4">
            {/* Participant type chips */}
            <div className="flex gap-2">
              {(["market", "non-participant"] as const).map(pt => (
                <button
                  key={pt}
                  onClick={() => setParticipantType(pt)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                  style={{
                    background: participantType === pt ? "#cc1111" : "var(--surface-card)",
                    color: participantType === pt ? "#fff" : "var(--text-color-secondary)",
                    border: `1px solid ${participantType === pt ? "#cc1111" : "var(--surface-border)"}`,
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
        </TabPanel>
      </TabView>
    </DashboardLayout>
  )
}

// ── Client Board Tab ────────────────────────────────────────────
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

  // ── Column templates ──
  const nameBody = (cp: Counterparty) => (
    <div>
      <div className="font-medium text-sm" style={{ color: "var(--text-color)" }}>{cp.name}</div>
      <div className="text-xs" style={{ color: "var(--text-color-secondary)" }}>{cp.address}</div>
    </div>
  )
  const contactBody = (cp: Counterparty) => (
    <div>
      <div className="text-sm" style={{ color: "var(--text-color)" }}>{cp.directoryName}</div>
      <div className="text-xs" style={{ color: "var(--text-color-secondary)" }}>{cp.directoryEmail}</div>
    </div>
  )
  const statusBody = (cp: Counterparty) => (
    <Tag value={cp.status} severity={cp.status === "Active" ? "success" : "secondary"} />
  )
  const actionsBody = (cp: Counterparty) => (
    <div className="flex gap-1">
      <Button icon="pi pi-pencil" rounded text size="small" tooltip="Edit"
        onClick={() => { setEditingClient({ ...cp }); setEditModalOpen(true) }} />
      <Button icon="pi pi-trash" rounded text severity="danger" size="small" tooltip="Delete"
        onClick={() => onDelete(cp.id)} />
    </div>
  )
  const expansionTemplate = (cp: Counterparty) => (
    <div className="p-4 space-y-4" style={{ background: "var(--surface-section)" }}>
      {/* Audit */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-color-secondary)" }}>Audit Information</p>
        <div className="grid grid-cols-4 gap-3">
          {[["Created By", cp.createdBy], ["Created On", cp.createdOn], ["Modified By", cp.modifiedBy], ["Last Modified", cp.lastModifiedOn]].map(([label, val]) => (
            <div key={label} className="p-2 rounded border" style={{ borderColor: "var(--surface-border)", background: "var(--surface-card)" }}>
              <p className="text-xs" style={{ color: "var(--text-color-secondary)" }}>{label}</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-color)" }}>{val}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Documents */}
      {cp.documents && cp.documents.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-color-secondary)" }}>Documents</p>
          <DataTable value={cp.documents} size="small" style={{ background: "var(--surface-card)" }}>
            <Column header="Document" body={(d: UploadedDocument) => (
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" style={{ color: "var(--text-color-secondary)" }} />
                <span className="text-sm">{d.name}</span>
              </div>
            )} />
            <Column field="description" header="Description" />
            <Column field="uploadedBy" header="Uploaded By" />
            <Column field="lastModified" header="Last Modified" />
          </DataTable>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Edit Modal */}
      <Dialog header="Edit Client" visible={editModalOpen} onHide={() => setEditModalOpen(false)}
        style={{ width: "700px" }} modal>
        {editingClient && (
          <div className="space-y-5 pt-2">
            {/* Status toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg"
              style={{ background: "var(--surface-section)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-color)" }}>Client Status</p>
                <p className="text-xs" style={{ color: "var(--text-color-secondary)" }}>Toggle to activate or deactivate</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ color: "var(--text-color-secondary)" }}>Inactive</span>
                <InputSwitch
                  checked={editingClient.status === "Active"}
                  onChange={e => setEditingClient({ ...editingClient, status: e.value ? "Active" : "Inactive" })}
                />
                <span className="text-sm font-medium" style={{ color: editingClient.status === "Active" ? "#cc1111" : "var(--text-color-secondary)" }}>Active</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-color-secondary)" }}>Company Information</p>
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Company Name">
                  <InputText value={editingClient.name} onChange={e => setField("name", e.target.value)} className="w-full" />
                </FieldGroup>
                <FieldGroup label="Address">
                  <InputText value={editingClient.address} onChange={e => setField("address", e.target.value)} className="w-full" />
                </FieldGroup>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-color-secondary)" }}>Energy Trades Configuration</p>
              <div className="grid grid-cols-3 gap-4">
                <FieldGroup label="Client ID">
                  <InputText value={editingClient.clientId} onChange={e => setField("clientId", e.target.value)} className="w-full" />
                </FieldGroup>
                <FieldGroup label="Counterparty">
                  <InputText value={editingClient.counterparty} onChange={e => setField("counterparty", e.target.value)} className="w-full" />
                </FieldGroup>
                <FieldGroup label="MIS Shortname">
                  <InputText value={editingClient.misShortname} onChange={e => setField("misShortname", e.target.value)} className="w-full" />
                </FieldGroup>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-color-secondary)" }}>Contact Information</p>
              <div className="grid grid-cols-3 gap-4">
                <FieldGroup label="Contact Name">
                  <InputText value={editingClient.directoryName} onChange={e => setField("directoryName", e.target.value)} className="w-full" />
                </FieldGroup>
                <FieldGroup label="Contact Email">
                  <InputText value={editingClient.directoryEmail} onChange={e => setField("directoryEmail", e.target.value)} className="w-full" />
                </FieldGroup>
                <FieldGroup label="Contact Phone">
                  <InputText value={editingClient.directoryPhone} onChange={e => setField("directoryPhone", e.target.value)} className="w-full" />
                </FieldGroup>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button label="Cancel" outlined onClick={() => setEditModalOpen(false)} />
              <Button label="Save Changes" icon="pi pi-check" onClick={handleEditSave} />
            </div>
          </div>
        )}
      </Dialog>

      {/* Stats */}
      <div className="flex items-center gap-3 p-4 rounded-lg border"
        style={{ background: "var(--surface-card)", borderColor: "var(--surface-border)" }}>
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "rgba(204,17,17,0.1)" }}>
          <Users className="h-6 w-6" style={{ color: "#cc1111" }} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-color-secondary)" }}>Registered Counterparties</p>
          <p className="text-2xl font-bold" style={{ color: "#cc1111" }}>{counterparties.length}</p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        value={counterparties}
        dataKey="id"
        expandedRows={expandedRows}
        onRowToggle={e => setExpandedRows(e.data as DataTableExpandedRows)}
        rowExpansionTemplate={expansionTemplate}
        stripedRows
        size="small"
        emptyMessage="No counterparties registered yet. Go to Client Registration to add one."
      >
        <Column expander style={{ width: "3rem" }} />
        <Column header="Name" body={nameBody} sortable sortField="name" style={{ minWidth: "200px" }} />
        <Column field="clientId" header="Client ID" style={{ fontFamily: "monospace", fontSize: "0.75rem", width: "120px" }} />
        <Column field="misShortname" header="MIS Shortname" style={{ fontFamily: "monospace", fontSize: "0.75rem", width: "130px" }} />
        <Column header="Contact" body={contactBody} style={{ minWidth: "180px" }} />
        <Column header="Status" body={statusBody} style={{ width: "100px" }} />
        <Column header="Actions" body={actionsBody} style={{ width: "100px" }} />
      </DataTable>
    </div>
  )
}

// ── Non-participant Tab ─────────────────────────────────────────
function NonParticipantRegistrationTab() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [operatorData, setOperatorData] = useState({ operatorName: "", email: "", phoneNumber: "", operatorId: "" })

  const handleSubmit = () => {
    if (!operatorData.operatorName || !operatorData.operatorId) return
    setOperatorData({ operatorName: "", email: "", phoneNumber: "", operatorId: "" })
  }

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-lg border" style={{ background: "var(--surface-card)", borderColor: "var(--surface-border)" }}>
        <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-color)" }}>Create non-participant</h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-color-secondary)" }}>Select type</p>
        <div className="grid grid-cols-4 gap-3">
          {[{ id: "operator", label: "Operator", icon: Users }].map(t => (
            <button key={t.id} onClick={() => setSelectedType(t.id)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all"
              style={{
                borderColor: selectedType === t.id ? "#cc1111" : "var(--surface-border)",
                background: selectedType === t.id ? "rgba(204,17,17,0.06)" : "transparent",
              }}>
              <t.icon className="h-5 w-5" style={{ color: selectedType === t.id ? "#cc1111" : "var(--text-color-secondary)" }} />
              <span className="text-xs" style={{ color: selectedType === t.id ? "#cc1111" : "var(--text-color-secondary)", fontWeight: selectedType === t.id ? 600 : 400 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedType === "operator" && (
        <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--surface-card)", borderColor: "var(--surface-border)" }}>
          <FieldGroup label="Operator Name *">
            <InputText value={operatorData.operatorName} onChange={e => setOperatorData(p => ({ ...p, operatorName: e.target.value }))} className="w-full" />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Email">
              <InputText value={operatorData.email} onChange={e => setOperatorData(p => ({ ...p, email: e.target.value }))} className="w-full" />
            </FieldGroup>
            <FieldGroup label="Phone Number">
              <InputText value={operatorData.phoneNumber} onChange={e => setOperatorData(p => ({ ...p, phoneNumber: e.target.value }))} className="w-full" />
            </FieldGroup>
          </div>
          <FieldGroup label="Operator ID *">
            <InputText value={operatorData.operatorId} onChange={e => setOperatorData(p => ({ ...p, operatorId: e.target.value }))} style={{ width: "256px" }} />
          </FieldGroup>
          <div className="flex justify-end pt-2">
            <Button label="Register Operator" icon="pi pi-check" onClick={handleSubmit} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Client Registration Tab ─────────────────────────────────────
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

  // Flags reserved for program section (future use)
  // isDemandResponseDisabled = isCounterparty || isEMS
  // isAncillaryServicesDisabled = isCounterparty || isHoldingCompany || isEMS

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

  const stateOptions = US_STATES.map(s => ({ label: s, value: s }))
  const cityOptions = TX_CITIES.map(c => ({ label: c, value: c }))
  const qseOptions = QSE_OPTIONS.map(q => ({ label: q, value: q }))
  const roleOptions = CONTACT_ROLES.map(r => ({ label: r, value: r }))
  const directoryOptions = DIRECTORY_OPTIONS.map(d => ({ label: d, value: d }))

  return (
    <div className="space-y-4">
      {/* Upload doc modal */}
      <Dialog header="Upload Document" visible={uploadModalOpen} onHide={() => setUploadModalOpen(false)} style={{ width: "500px" }} modal>
        <div className="space-y-4 pt-2">
          <FieldGroup label="Description (optional)">
            <InputText value={pendingDescription} onChange={e => setPendingDescription(e.target.value)} className="w-full" placeholder="Enter description" />
          </FieldGroup>
          <input ref={fileInputRef} type="file" className="hidden" onChange={e => { if (e.target.files) setPendingFile(e.target.files[0]) }} />
          <Button label="Select File" icon="pi pi-folder-open" outlined onClick={() => fileInputRef.current?.click()} />
          {pendingFile && (
            <div className="flex items-center gap-2 p-2 rounded border" style={{ borderColor: "var(--surface-border)", background: "var(--surface-section)" }}>
              <FileText className="h-4 w-4" style={{ color: "#cc1111" }} />
              <span className="text-sm flex-1" style={{ color: "var(--text-color)" }}>{pendingFile.name}</span>
              <button onClick={() => setPendingFile(null)}><X className="h-3.5 w-3.5" style={{ color: "var(--text-color-secondary)" }} /></button>
            </div>
          )}
          {formData.uploadedDocuments.length > 0 && (
            <DataTable value={formData.uploadedDocuments} size="small">
              <Column header="Document" body={(d: UploadedDocument) => (
                <div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /><span>{d.name}</span></div>
              )} />
              <Column field="description" header="Description" />
              <Column field="uploadedBy" header="Uploaded By" />
              <Column field="lastModified" header="Modified" />
              <Column header="" body={(d: UploadedDocument) => (
                <Button icon="pi pi-times" rounded text severity="danger" size="small" onClick={() => handleRemoveDocument(d.id)} />
              )} style={{ width: "50px" }} />
            </DataTable>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button label="Add Document" icon="pi pi-plus" onClick={handleAddDocument} disabled={!pendingFile} />
          </div>
        </div>
      </Dialog>

      {/* Client type picker */}
      <div className="p-5 rounded-lg border" style={{ background: "var(--surface-card)", borderColor: "var(--surface-border)" }}>
        <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-color)" }}>Create client</h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-color-secondary)" }}>Select company type</p>
        <div className="grid grid-cols-4 gap-3">
          {clientTypes.map(t => (
            <button key={t.id} onClick={() => onClientTypeChange(t.id)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all"
              style={{
                borderColor: selectedClientType === t.id ? "#cc1111" : "var(--surface-border)",
                background: selectedClientType === t.id ? "rgba(204,17,17,0.06)" : "transparent",
              }}>
              <t.icon className="h-5 w-5" style={{ color: selectedClientType === t.id ? "#cc1111" : "var(--text-color-secondary)" }} />
              <span className="text-xs text-center" style={{ color: selectedClientType === t.id ? "#cc1111" : "var(--text-color-secondary)", fontWeight: selectedClientType === t.id ? 600 : 400 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Registration form */}
      <div className="p-5 rounded-lg border space-y-5" style={{ background: "var(--surface-card)", borderColor: "var(--surface-border)" }}>
        <FieldGroup label="Company Name">
          <InputText value={formData.name} onChange={e => onInputChange("name", e.target.value)} className="w-full" placeholder="Enter company name" />
        </FieldGroup>
        <FieldGroup label="Short Company Name">
          <InputText value={formData.shortName} onChange={e => onInputChange("shortName", e.target.value)} className="w-full" placeholder="Short name" />
        </FieldGroup>
        <FieldGroup label="Address">
          <InputText value={formData.address} onChange={e => onInputChange("address", e.target.value)} className="w-full" placeholder="Street address" />
        </FieldGroup>

        <div className="flex flex-wrap gap-4">
          <FieldGroup label="State">
            <Dropdown value={formData.state} options={stateOptions} onChange={e => onInputChange("state", e.value)} placeholder="State" style={{ width: "160px" }} />
          </FieldGroup>
          <FieldGroup label="City">
            <Dropdown value={formData.city} options={cityOptions} onChange={e => onInputChange("city", e.value)} placeholder="City" style={{ width: "160px" }} />
          </FieldGroup>
          <FieldGroup label="Zip Code">
            <InputText value={formData.zipCode} onChange={e => onInputChange("zipCode", e.target.value)} style={{ width: "100px" }} placeholder="00000" />
          </FieldGroup>
          <FieldGroup label="Zip +4">
            <InputText value={formData.zipCodePlus4} onChange={e => onInputChange("zipCodePlus4", e.target.value)} style={{ width: "80px" }} placeholder="0000" />
          </FieldGroup>
        </div>

        {!isCounterparty && (
          <FieldGroup label="MWH">
            <InputText value={formData.mwh} onChange={e => onInputChange("mwh", e.target.value)} style={{ width: "200px" }} placeholder="0.00" />
          </FieldGroup>
        )}

        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="Contact Name">
            <InputText value={formData.contactName} onChange={e => onInputChange("contactName", e.target.value)} className="w-full" />
          </FieldGroup>
          <FieldGroup label="Contact Email">
            <InputText value={formData.contactEmail} onChange={e => onInputChange("contactEmail", e.target.value)} className="w-full" />
          </FieldGroup>
          <FieldGroup label="Contact Phone">
            <InputText value={formData.contactPhone} onChange={e => onInputChange("contactPhone", e.target.value)} className="w-full" />
          </FieldGroup>
        </div>

        <div className="flex gap-4">
          <FieldGroup label="Contact Role">
            <Dropdown value={formData.contactRole} options={roleOptions} onChange={e => onInputChange("contactRole", e.value)} placeholder="Select role" style={{ width: "180px" }} />
          </FieldGroup>
          {formData.contactRole === "Other" && (
            <FieldGroup label="Other Role">
              <InputText value={formData.contactOtherRole} onChange={e => onInputChange("contactOtherRole", e.target.value)} style={{ width: "200px" }} />
            </FieldGroup>
          )}
        </div>

        {!isCounterparty && (
          <div className="grid grid-cols-3 gap-4">
            <FieldGroup label="QSE">
              <Dropdown value={formData.qse} options={qseOptions} onChange={e => onInputChange("qse", e.value)} placeholder="Select QSE" className="w-full" />
            </FieldGroup>
            <FieldGroup label="Resource Names">
              <InputText value={formData.resourceNames} onChange={e => onInputChange("resourceNames", e.target.value)} className="w-full" />
            </FieldGroup>
            <FieldGroup label="Resource IDs">
              <InputText value={formData.resourceIds} onChange={e => onInputChange("resourceIds", e.target.value)} className="w-full" />
            </FieldGroup>
          </div>
        )}

        <FieldGroup label="Directory">
          <Dropdown value={formData.directory} options={directoryOptions} onChange={e => onInputChange("directory", e.value)} placeholder="Select directory" className="w-full" />
        </FieldGroup>

        {/* Documents */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
            Documents {formData.uploadedDocuments.length > 0 && <span style={{ color: "#cc1111" }}>({formData.uploadedDocuments.length})</span>}
          </span>
          <Button label="Upload Files" icon="pi pi-upload" outlined size="small" onClick={() => setUploadModalOpen(true)} />
        </div>

        {/* Sites */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: "var(--text-color)" }}>Sites ({formData.sites.length})</span>
            <Button label="Add Site" icon="pi pi-plus" outlined size="small" onClick={addSite} disabled={isEMS} />
          </div>

          {formData.sites.map(site => {
            const isExpanded = expandedSites.includes(site.id)
            return (
              <div key={site.id} className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--surface-border)" }}>
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
                  style={{ background: "var(--surface-section)" }}
                  onClick={() => setExpandedSites(prev => isExpanded ? prev.filter(id => id !== site.id) : [...prev, site.id])}>
                  <div className="flex items-center gap-2">
                    <i className={`pi pi-chevron-${isExpanded ? "down" : "right"} text-xs`} style={{ color: "var(--text-color-secondary)" }} />
                    <span className="text-sm font-medium" style={{ color: "var(--text-color)" }}>{site.siteName || "New Site"}</span>
                    {site.esiId && <span className="text-xs font-mono" style={{ color: "var(--text-color-secondary)" }}>ESI: {site.esiId}</span>}
                  </div>
                  <Button icon="pi pi-trash" rounded text severity="danger" size="small"
                    onClick={e => { e.stopPropagation(); removeSite(site.id) }} />
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-4" style={{ background: "var(--surface-card)" }}>
                    <div className="grid grid-cols-3 gap-4">
                      <FieldGroup label="Site Name">
                        <InputText value={site.siteName} onChange={e => updateSite(site.id, "siteName", e.target.value)} className="w-full" />
                      </FieldGroup>
                      <FieldGroup label="Resource Type">
                        <Dropdown value={site.resourceType}
                          options={[{label:"ESR",value:"ESR"},{label:"NCLR",value:"NCLR"},{label:"GEN",value:"GEN"}]}
                          onChange={e => updateSite(site.id, "resourceType", e.value)} placeholder="Select type" className="w-full" />
                      </FieldGroup>
                      <FieldGroup label="ESI ID">
                        <InputText value={site.esiId} onChange={e => updateSite(site.id, "esiId", e.target.value)} className="w-full" />
                      </FieldGroup>
                    </div>

                    <div className="flex items-center gap-3">
                      <InputSwitch checked={site.realTimeOperations}
                        onChange={e => updateSite(site.id, "realTimeOperations", e.value)} />
                      <label className="text-sm" style={{ color: "var(--text-color)" }}>Real Time Operations</label>
                    </div>

                    {site.resourceType === "ESR" && (
                      <div className="grid grid-cols-2 gap-4 p-3 rounded border" style={{ borderColor: "var(--surface-border)", background: "var(--surface-section)" }}>
                        <FieldGroup label="Asset Code"><InputText value={site.esrAssetCode} onChange={e => updateSite(site.id, "esrAssetCode", e.target.value)} className="w-full" /></FieldGroup>
                        <FieldGroup label="Station Voltage"><InputText value={site.esrStationVoltage} onChange={e => updateSite(site.id, "esrStationVoltage", e.target.value)} className="w-full" /></FieldGroup>
                        <FieldGroup label="Total Load at POD"><InputText value={site.esrTotalLoadAtPod} onChange={e => updateSite(site.id, "esrTotalLoadAtPod", e.target.value)} className="w-full" /></FieldGroup>
                        <FieldGroup label="Interruptible Load"><InputText value={site.esrInterruptibleLoad} onChange={e => updateSite(site.id, "esrInterruptibleLoad", e.target.value)} className="w-full" /></FieldGroup>
                      </div>
                    )}

                    {site.resourceType === "NCLR" && (
                      <div className="p-3 rounded border space-y-3" style={{ borderColor: "var(--surface-border)", background: "var(--surface-section)" }}>
                        <div className="grid grid-cols-2 gap-4">
                          <FieldGroup label="Asset Code"><InputText value={site.nclrAssetCode} onChange={e => updateSite(site.id, "nclrAssetCode", e.target.value)} className="w-full" /></FieldGroup>
                          <FieldGroup label="Station Voltage"><InputText value={site.nclrStationVoltage} onChange={e => updateSite(site.id, "nclrStationVoltage", e.target.value)} className="w-full" /></FieldGroup>
                          <FieldGroup label="Storage Capacity"><InputText value={site.nclrStorageCapacity} onChange={e => updateSite(site.id, "nclrStorageCapacity", e.target.value)} className="w-full" /></FieldGroup>
                          <FieldGroup label="Power Capacity"><InputText value={site.nclrPowerCapacity} onChange={e => updateSite(site.id, "nclrPowerCapacity", e.target.value)} className="w-full" /></FieldGroup>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {[["nclrProgramEcrs","ECRS"],["nclrProgramRegup","Reg Up"],["nclrProgramRegdown","Reg Down"],["nclrProgramRrs","RRS"],["nclrProgramNonSpin","Non-Spin"]].map(([key,label]) => (
                            <div key={key} className="flex items-center gap-2">
                              <Checkbox inputId={`${site.id}-${key}`} checked={(site as Record<string, boolean|string>)[key] as boolean}
                                onChange={e => updateSite(site.id, key as keyof Site, e.checked ?? false)} />
                              <label htmlFor={`${site.id}-${key}`} className="text-sm" style={{ color: "var(--text-color)" }}>{label}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "var(--surface-border)" }}>
          <Button label="Register Client" icon="pi pi-check" onClick={onSubmit} disabled={!formData.name} />
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────
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
