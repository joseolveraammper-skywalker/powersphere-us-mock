"use client"

import React, { useState, useRef, useMemo } from "react"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Button } from "primereact/button"
import { InputText } from "primereact/inputtext"
import { Dropdown } from "primereact/dropdown"
import { Dialog } from "primereact/dialog"
import { Tag } from "primereact/tag"
import { TabView, TabPanel } from "primereact/tabview"
import type { DataTableExpandedRows } from "primereact/datatable"
import { useCounterparties } from "@/lib/counterparty-context"
import { FileText } from "lucide-react"

const MOCK_USER_EMAIL = "admin@powersphere.com"

// ── Types ────────────────────────────────────────────────────────
type UploadedDocument = { id: string; name: string; description: string; uploadedBy: string; lastModified: string }

type Trade = {
  id: string; tradeName: string; tradeDate: string; tradeType: string; commodity: string
  qse: string; duns: string; portfolio: string; productType: string; strategy: string
  counterParty: string; sleeveCounterparty: string; broker: string; brokerageFee: string
  brokerageFeeUom: string; status: "Draft" | "Pending Approval" | "Approved" | "Rejected"
  documents?: UploadedDocument[]
}

// ── Dropdown options ─────────────────────────────────────────────
const opts = (arr: string[]) => arr.map(v => ({ label: v, value: v }))
const TRADE_TYPE_OPTIONS = opts(["Physical", "Financial", "Option", "Swap", "Forward"])
const COMMODITY_OPTIONS = opts(["Power", "Natural Gas", "Crude Oil", "Coal", "Renewable Energy Credits"])
const QSE_OPTIONS = opts(["QSE-001", "QSE-002", "QSE-003", "QSE-004", "QSE-005"])
const PORTFOLIO_OPTIONS = opts(["Trading Book A", "Trading Book B", "Hedging Portfolio", "Speculation Portfolio"])
const PRODUCT_TYPE_OPTIONS = opts(["Day Ahead", "Real Time", "Term", "Balancing"])
const STRATEGY_OPTIONS = opts(["Arbitrage", "Hedging", "Speculation", "Market Making"])
const BROKER_OPTIONS = opts(["Tradition", "ICAP", "BGC", "GFI", "Tullett Prebon"])
const BROKERAGE_FEE_UOM_OPTIONS = opts(["$/MWh", "$/MMBtu", "Flat Fee", "% of Notional"])

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

// ── Field wrapper ────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-color-secondary)" }}>{label}</label>
      {children}
    </div>
  )
}

// ── Section card ────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative pt-4">
      <div className="absolute -top-0 left-4 px-2 text-xs font-bold uppercase tracking-wider z-10"
        style={{ background: "var(--surface-ground)", color: "#cc1111" }}>
        {title}
      </div>
      <div className="rounded-lg border p-5 space-y-5"
        style={{ borderColor: "var(--surface-border)", background: "var(--surface-card)" }}>
        {children}
      </div>
    </div>
  )
}

// ── Status tag ───────────────────────────────────────────────────
function statusSeverity(s: Trade["status"]) {
  if (s === "Approved") return "success" as const
  if (s === "Rejected") return "danger" as const
  if (s === "Pending Approval") return "warning" as const
  return "secondary" as const
}

// ── Main page ────────────────────────────────────────────────────
export default function ETRMPage() {
  const { activeCounterparties } = useCounterparties()
  const counterpartyOptions = useMemo(() => activeCounterparties.map(cp => ({ label: cp.counterparty, value: cp.counterparty })), [activeCounterparties])

  // Trade form state
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const newDoc: UploadedDocument = {
      id: Date.now().toString(), name: files[0].name, description: newDocDescription,
      uploadedBy: MOCK_USER_EMAIL,
      lastModified: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
    }
    setUploadedDocuments(prev => [...prev, newDoc])
    setNewDocDescription("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSaveTrade = () => {
    setTrades(prev => [...prev, {
      id: Date.now().toString(), tradeName, tradeDate, tradeType, commodity, qse, duns,
      portfolio, productType, strategy, counterParty, sleeveCounterparty, broker,
      brokerageFee, brokerageFeeUom, status: "Draft", documents: uploadedDocuments,
    }])
    setTradeType(""); setCommodity(""); setQse(""); setDuns(""); setPortfolio("")
    setProductType(""); setStrategy(""); setCounterParty(""); setSleeveCounterparty("")
    setBroker(""); setBrokerageFee(""); setBrokerageFeeUom(""); setUploadedDocuments([])
  }

  const handleApprove = (id: string) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, status: "Approved" } : t))
  }
  const handleReject = (id: string) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, status: "Rejected" } : t))
  }

  // ── Deal Entry form ──────────────────────────────────────────
  const dealEntryForm = (
    <div className="space-y-6">
      <SectionCard title="General">
        <div className="grid grid-cols-3 gap-5">
          <Field label="Trade Name">
            <InputText value={tradeName} disabled className="w-full font-mono text-xs" />
          </Field>
          <Field label="Trade Type">
            <Dropdown value={tradeType} options={TRADE_TYPE_OPTIONS} onChange={e => setTradeType(e.value)} placeholder="Select type" className="w-full" />
          </Field>
          <Field label="Commodity">
            <Dropdown value={commodity} options={COMMODITY_OPTIONS} onChange={e => setCommodity(e.value)} placeholder="Select commodity" className="w-full" />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-5">
          <Field label="Trade Date">
            <InputText type="date" value={tradeDate} onChange={e => setTradeDate(e.target.value)} className="w-full" />
          </Field>
          <Field label="QSE">
            <Dropdown value={qse} options={QSE_OPTIONS} onChange={e => setQse(e.value)} placeholder="Select QSE" className="w-full" />
          </Field>
          <Field label="DUNS">
            <InputText value={duns} onChange={e => setDuns(e.target.value)} className="w-full" placeholder="DUNS number" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Classification">
        <div className="grid grid-cols-3 gap-5">
          <Field label="Portfolio">
            <Dropdown value={portfolio} options={PORTFOLIO_OPTIONS} onChange={e => setPortfolio(e.value)} placeholder="Select portfolio" className="w-full" />
          </Field>
          <Field label="Product Type">
            <Dropdown value={productType} options={PRODUCT_TYPE_OPTIONS} onChange={e => setProductType(e.value)} placeholder="Select product type" className="w-full" />
          </Field>
          <Field label="Strategy">
            <Dropdown value={strategy} options={STRATEGY_OPTIONS} onChange={e => setStrategy(e.value)} placeholder="Select strategy" className="w-full" />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-5">
          <Field label="Counter Party">
            <Dropdown value={counterParty} options={counterpartyOptions.length ? counterpartyOptions : opts(["EDF","ENGIE","Vistra","Axpo","Shell"])} onChange={e => setCounterParty(e.value)} placeholder="Select counterparty" className="w-full" />
          </Field>
          <Field label="Sleeve Counterparty">
            <Dropdown value={sleeveCounterparty} options={counterpartyOptions.length ? counterpartyOptions : opts(["EDF","ENGIE","Vistra","Axpo","Shell"])} onChange={e => setSleeveCounterparty(e.value)} placeholder="Optional" className="w-full" showClear />
          </Field>
          <Field label="Broker">
            <Dropdown value={broker} options={BROKER_OPTIONS} onChange={e => setBroker(e.value)} placeholder="Select broker" className="w-full" />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-5">
          <Field label="Brokerage Fee">
            <InputText value={brokerageFee} onChange={e => setBrokerageFee(e.target.value)} className="w-full" placeholder="0.00" />
          </Field>
          <Field label="Brokerage Fee UoM">
            <Dropdown value={brokerageFeeUom} options={BROKERAGE_FEE_UOM_OPTIONS} onChange={e => setBrokerageFeeUom(e.value)} placeholder="Select UoM" className="w-full" />
          </Field>
        </div>
      </SectionCard>

      <div className="flex justify-end gap-2">
        <Button label="Clear" outlined onClick={() => { setTradeType(""); setCommodity(""); setQse(""); setDuns(""); setPortfolio(""); setProductType(""); setStrategy(""); setCounterParty(""); setSleeveCounterparty(""); setBroker(""); setBrokerageFee(""); setBrokerageFeeUom("") }} />
        <Button label="Save Trade" icon="pi pi-save" onClick={handleSaveTrade} />
      </div>
    </div>
  )

  // ── Trades table ─────────────────────────────────────────────
  const statusBody = (t: Trade) => <Tag value={t.status} severity={statusSeverity(t.status)} />

  const tradeActionsBody = (t: Trade) => (
    <div className="flex gap-1">
      <Button icon="pi pi-pencil" rounded text size="small" tooltip="Edit" />
      <Button icon="pi pi-trash" rounded text severity="danger" size="small" tooltip="Delete"
        onClick={() => setTrades(prev => prev.filter(x => x.id !== t.id))} />
    </div>
  )

  const tradeExpansionTemplate = (t: Trade) => (
    <div className="p-4 grid grid-cols-4 gap-4" style={{ background: "var(--surface-section)" }}>
      {[["QSE", t.qse], ["DUNS", t.duns], ["Portfolio", t.portfolio], ["Product Type", t.productType],
        ["Strategy", t.strategy], ["Sleeve Counterparty", t.sleeveCounterparty || "—"],
        ["Broker", t.broker], ["Brokerage Fee", `${t.brokerageFee} ${t.brokerageFeeUom}`]].map(([label, val]) => (
        <div key={label}>
          <p className="text-xs" style={{ color: "var(--text-color-secondary)" }}>{label}</p>
          <p className="text-sm font-medium" style={{ color: "var(--text-color)" }}>{val}</p>
        </div>
      ))}
    </div>
  )

  const tradesTable = (
    <DataTable
      value={trades}
      dataKey="id"
      expandedRows={expandedTradeRows}
      onRowToggle={e => setExpandedTradeRows(e.data as DataTableExpandedRows)}
      rowExpansionTemplate={tradeExpansionTemplate}
      stripedRows size="small"
      emptyMessage="No trades yet. Use Deal Entry to create one."
    >
      <Column expander style={{ width: "3rem" }} />
      <Column field="tradeName" header="Trade Name" style={{ fontFamily: "monospace", fontSize: "0.7rem", minWidth: "280px" }} />
      <Column field="tradeDate" header="Trade Date" sortable style={{ width: "120px" }} />
      <Column field="counterParty" header="Counter Party" sortable style={{ width: "120px" }} />
      <Column field="commodity" header="Commodity" sortable style={{ width: "120px" }} />
      <Column field="tradeType" header="Type" sortable style={{ width: "100px" }} />
      <Column header="Status" body={statusBody} sortable sortField="status" style={{ width: "140px" }} />
      <Column header="Actions" body={tradeActionsBody} style={{ width: "100px" }} />
    </DataTable>
  )

  // ── Approvals table ─────────────────────────────────────────
  const pendingTrades = trades.filter(t => t.status === "Pending Approval")

  const approvalActionsBody = (t: Trade) => (
    <div className="flex gap-2">
      <Button label="Approve" size="small" icon="pi pi-check"
        style={{ background: "#2d7a2d", borderColor: "#2d7a2d" }}
        onClick={() => handleApprove(t.id)} />
      <Button label="Reject" size="small" severity="danger" outlined
        onClick={() => handleReject(t.id)} />
    </div>
  )

  const approvalsTable = (
    <DataTable value={pendingTrades} size="small" stripedRows
      emptyMessage="No trades pending approval.">
      <Column field="tradeName" header="Trade Name" style={{ fontFamily: "monospace", fontSize: "0.7rem", minWidth: "280px" }} />
      <Column field="tradeDate" header="Trade Date" style={{ width: "120px" }} />
      <Column field="counterParty" header="Counter Party" style={{ width: "120px" }} />
      <Column field="commodity" header="Commodity" style={{ width: "120px" }} />
      <Column field="tradeType" header="Type" style={{ width: "100px" }} />
      <Column header="Actions" body={approvalActionsBody} style={{ width: "200px" }} />
    </DataTable>
  )

  // ── Upload Files section ─────────────────────────────────────
  const uploadSection = (
    <div className="space-y-4">
      <Dialog header="Upload Document" visible={uploadModalOpen} onHide={() => setUploadModalOpen(false)} style={{ width: "480px" }} modal>
        <div className="space-y-4 pt-2">
          <Field label="Description (optional)">
            <InputText value={newDocDescription} onChange={e => setNewDocDescription(e.target.value)} className="w-full" placeholder="Enter description" />
          </Field>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
          <Button label="Select File" icon="pi pi-folder-open" outlined onClick={() => fileInputRef.current?.click()} />
        </div>
      </Dialog>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>Document Repository</h3>
        <Button label="Upload Files" icon="pi pi-upload" outlined size="small" onClick={() => setUploadModalOpen(true)} />
      </div>

      <DataTable value={uploadedDocuments} size="small" stripedRows
        emptyMessage="No documents uploaded yet.">
        <Column header="Document" body={(d: UploadedDocument) => (
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" style={{ color: "#cc1111" }} />
            <span className="text-sm">{d.name}</span>
          </div>
        )} />
        <Column field="description" header="Description" />
        <Column field="uploadedBy" header="Uploaded By" />
        <Column field="lastModified" header="Last Modified" />
        <Column header="" body={(d: UploadedDocument) => (
          <Button icon="pi pi-times" rounded text severity="danger" size="small"
            onClick={() => setUploadedDocuments(prev => prev.filter(x => x.id !== d.id))} />
        )} style={{ width: "50px" }} />
      </DataTable>
    </div>
  )

  return (
    <DashboardLayout pageTitle="ETRM">
      <TabView>
        <TabPanel header="Reports">
          <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--text-color-secondary)" }}>
            Reports — coming soon
          </div>
        </TabPanel>

        <TabPanel header="Standard Trade (ST)">
          <TabView>
            <TabPanel header="Deal Entry">
              {dealEntryForm}
            </TabPanel>
            <TabPanel header="Trades">
              {tradesTable}
            </TabPanel>
            <TabPanel header="Approvals">
              <div className="flex items-center gap-3 mb-4">
                <Tag value={`${pendingTrades.length} Pending`} severity="warning" />
              </div>
              {approvalsTable}
            </TabPanel>
            <TabPanel header="Upload Files">
              {uploadSection}
            </TabPanel>
          </TabView>
        </TabPanel>
      </TabView>
    </DashboardLayout>
  )
}
