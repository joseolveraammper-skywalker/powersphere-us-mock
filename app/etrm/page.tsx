"use client"

import React, { useState, useRef, useMemo } from "react"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Calendar, Upload, FileText, X, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { useCounterparties } from "@/lib/counterparty-context"

// Mock logged in user email
const MOCK_USER_EMAIL = "admin@powersphere.com"

type UploadedDocument = {
  id: string
  name: string
  description: string
  uploadedBy: string
  lastModified: string
}

type Trade = {
  id: string
  tradeName: string
  tradeDate: string
  tradeType: string
  commodity: string
  qse: string
  duns: string
  portfolio: string
  productType: string
  strategy: string
  counterParty: string
  sleeveCounterparty: string
  broker: string
  brokerageFee: string
  brokerageFeeUom: string
  status: "Draft" | "Pending Approval" | "Approved" | "Rejected"
  documents?: UploadedDocument[]
}

// Dropdown options
const TRADE_TYPE_OPTIONS = ["Physical", "Financial", "Option", "Swap", "Forward"]
const COMMODITY_OPTIONS = ["Power", "Natural Gas", "Crude Oil", "Coal", "Renewable Energy Credits"]
const QSE_OPTIONS = ["QSE-001", "QSE-002", "QSE-003", "QSE-004", "QSE-005"]
const PORTFOLIO_OPTIONS = ["Trading Book A", "Trading Book B", "Hedging Portfolio", "Speculation Portfolio"]
const PRODUCT_TYPE_OPTIONS = ["Day Ahead", "Real Time", "Term", "Balancing"]
const STRATEGY_OPTIONS = ["Arbitrage", "Hedging", "Speculation", "Market Making"]
const BROKER_OPTIONS = ["Tradition", "ICAP", "BGC", "GFI", "Tullett Prebon"]
const BROKERAGE_FEE_UOM_OPTIONS = ["$/MWh", "$/MMBtu", "Flat Fee", "% of Notional"]

// Generate trade name based on pattern
function generateTradeName(tradeDate: string, sequenceNumber: number): string {
  const dateParts = tradeDate.split("-")
  if (dateParts.length !== 3) return `- - - - ${tradeDate} - ${tradeDate} - - - - ${String(sequenceNumber).padStart(3, "0")}`
  const formattedDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`
  return `- - - - ${formattedDate} - ${formattedDate} - - - - ${String(sequenceNumber).padStart(3, "0")}`
}

// Mock trades data
const initialTrades: Trade[] = [
  {
    id: "1",
    tradeName: "- - - - 03/20/2026 - 03/20/2026 - - - - 001",
    tradeDate: "2026-03-20",
    tradeType: "Physical",
    commodity: "Power",
    qse: "QSE-001",
    duns: "123456789",
    portfolio: "Trading Book A",
    productType: "Day Ahead",
    strategy: "Arbitrage",
    counterParty: "EDF",
    sleeveCounterparty: "",
    broker: "Tradition",
    brokerageFee: "0.05",
    brokerageFeeUom: "$/MWh",
    status: "Approved",
  },
  {
    id: "2",
    tradeName: "- - - - 03/22/2026 - 03/22/2026 - - - - 002",
    tradeDate: "2026-03-22",
    tradeType: "Financial",
    commodity: "Natural Gas",
    qse: "QSE-002",
    duns: "987654321",
    portfolio: "Hedging Portfolio",
    productType: "Term",
    strategy: "Hedging",
    counterParty: "SHELL",
    sleeveCounterparty: "ENGIE",
    broker: "ICAP",
    brokerageFee: "0.02",
    brokerageFeeUom: "$/MMBtu",
    status: "Pending Approval",
  },
  {
    id: "3",
    tradeName: "- - - - 03/24/2026 - 03/24/2026 - - - - 003",
    tradeDate: "2026-03-24",
    tradeType: "Swap",
    commodity: "Power",
    qse: "QSE-003",
    duns: "456789123",
    portfolio: "Trading Book B",
    productType: "Real Time",
    strategy: "Market Making",
    counterParty: "VISTRA",
    sleeveCounterparty: "",
    broker: "BGC",
    brokerageFee: "100",
    brokerageFeeUom: "Flat Fee",
    status: "Draft",
  },
]

// Underline input component
function UnderlineInput({
  placeholder,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  placeholder: string
  value: string
  onChange: (value: string) => void
  type?: string
  disabled?: boolean
}) {
  return (
    <div className="relative w-full">
      <label className="text-xs text-muted-foreground mb-1 block">{placeholder}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border-0 border-b border-border bg-transparent pb-1 pt-0 text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  )
}

// Underline select component
function UnderlineSelect({
  placeholder,
  value,
  onValueChange,
  options,
  disabled = false,
}: {
  placeholder: string
  value: string
  onValueChange: (value: string) => void
  options: string[]
  disabled?: boolean
}) {
  return (
    <div className="relative w-full">
      <label className="text-xs text-muted-foreground mb-1 block">{placeholder}</label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full border-0 border-b border-border rounded-none bg-transparent h-auto pb-1 pt-0 text-sm focus:ring-0 focus:border-primary px-0">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function ETRMPage() {
  const [activeMainTab, setActiveMainTab] = useState<"reports" | "standard-trade">("standard-trade")
  const [activeSubTab, setActiveSubTab] = useState<"trades" | "deal-entry" | "approvals" | "upload-files">("deal-entry")
  
  // Get active counterparties from shared context (Client Configuration)
  const { activeCounterparties } = useCounterparties()
  const counterpartyOptions = useMemo(() => activeCounterparties.map((cp) => cp.counterparty), [activeCounterparties])
  
  // Trade form state
  const [tradeDate, setTradeDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
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
  
  // Trades list
  const [trades, setTrades] = useState<Trade[]>(initialTrades)
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null)
  
  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [newDocDescription, setNewDocDescription] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Generate trade name
  const tradeName = useMemo(() => {
    return generateTradeName(tradeDate, trades.length + 1)
  }, [tradeDate, trades.length])
  
  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }
  
  // Handle file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const newDoc: UploadedDocument = {
        id: Date.now().toString(),
        name: file.name,
        description: newDocDescription,
        uploadedBy: MOCK_USER_EMAIL,
        lastModified: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
      }
      setUploadedDocuments((prev) => [...prev, newDoc])
      setNewDocDescription("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }
  
  // Save trade
  const handleSaveTrade = () => {
    const newTrade: Trade = {
      id: Date.now().toString(),
      tradeName,
      tradeDate,
      tradeType,
      commodity,
      qse,
      duns,
      portfolio,
      productType,
      strategy,
      counterParty,
      sleeveCounterparty,
      broker,
      brokerageFee,
      brokerageFeeUom,
      status: "Draft",
      documents: uploadedDocuments,
    }
    setTrades((prev) => [...prev, newTrade])
    
    // Reset form
    setTradeType("")
    setCommodity("")
    setQse("")
    setDuns("")
    setPortfolio("")
    setProductType("")
    setStrategy("")
    setCounterParty("")
    setSleeveCounterparty("")
    setBroker("")
    setBrokerageFee("")
    setBrokerageFeeUom("")
    setUploadedDocuments([])
  }
  
  // Render main tabs
  const renderMainTabs = () => (
    <div className="flex items-center border-b border-border">
      <button
        onClick={() => setActiveMainTab("reports")}
        className={`px-6 py-3 text-sm font-medium transition-colors relative ${
          activeMainTab === "reports"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Reports
        {activeMainTab === "reports" && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
        )}
      </button>
      <button
        onClick={() => setActiveMainTab("standard-trade")}
        className={`px-6 py-3 text-sm font-medium transition-colors relative ${
          activeMainTab === "standard-trade"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Standard Trade (ST)
        {activeMainTab === "standard-trade" && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
        )}
      </button>
    </div>
  )
  
  // Render sub tabs
  const renderSubTabs = () => (
    <div className="flex items-center gap-2 py-4">
      {[
        { key: "trades", label: "Trades" },
        { key: "deal-entry", label: "Deal Entry" },
        { key: "approvals", label: "Approvals" },
        { key: "upload-files", label: "Upload Files" },
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveSubTab(tab.key as typeof activeSubTab)}
          className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
            activeSubTab === tab.key
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-foreground border-border hover:bg-muted"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
  
  // Render Deal Entry form
  const renderDealEntry = () => (
    <div className="space-y-6">
      {/* General Section */}
      <div className="relative">
        <span className="absolute -top-3 left-4 bg-background px-2 text-sm font-medium text-destructive">
          General
        </span>
        <Card className="border border-border">
          <CardContent className="p-6 space-y-6">
            {/* Row 1: Trade Name, Trade Type, Commodity */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Trade Name</label>
                <div className="text-sm pb-1 border-b border-border text-muted-foreground">
                  {tradeName}
                </div>
              </div>
              <UnderlineSelect
                placeholder="Trade Type"
                value={tradeType}
                onValueChange={setTradeType}
                options={TRADE_TYPE_OPTIONS}
              />
              <UnderlineSelect
                placeholder="Commodity"
                value={commodity}
                onValueChange={setCommodity}
                options={COMMODITY_OPTIONS}
              />
            </div>
            
            {/* Row 2: Trade Date, QSE, DUNS */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Trade Date</label>
                <div className="flex items-center gap-2 border-b border-border pb-1">
                  <span className="text-sm">{formatDateDisplay(tradeDate)}</span>
                  <input
                    type="date"
                    value={tradeDate}
                    onChange={(e) => setTradeDate(e.target.value)}
                    className="absolute opacity-0 w-0 h-0"
                    id="trade-date-picker"
                  />
                  <label htmlFor="trade-date-picker" className="cursor-pointer ml-auto">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </label>
                </div>
              </div>
              <UnderlineSelect
                placeholder="QSE"
                value={qse}
                onValueChange={setQse}
                options={QSE_OPTIONS}
              />
              <UnderlineInput
                placeholder="DUNS"
                value={duns}
                onChange={setDuns}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Classification Section */}
      <div className="relative">
        <span className="absolute -top-3 left-4 bg-background px-2 text-sm font-medium text-destructive">
          Classification
        </span>
        <Card className="border border-border">
          <CardContent className="p-6 space-y-6">
            {/* Row 1: Portfolio, Product Type, Strategy */}
            <div className="grid grid-cols-3 gap-6">
              <UnderlineSelect
                placeholder="Portfolio"
                value={portfolio}
                onValueChange={setPortfolio}
                options={PORTFOLIO_OPTIONS}
              />
              <UnderlineSelect
                placeholder="Product Type"
                value={productType}
                onValueChange={setProductType}
                options={PRODUCT_TYPE_OPTIONS}
              />
              <UnderlineSelect
                placeholder="Strategy"
                value={strategy}
                onValueChange={setStrategy}
                options={STRATEGY_OPTIONS}
              />
            </div>
            
            {/* Row 2: Counter Party, Sleeve Counterparty, Broker */}
            <div className="grid grid-cols-3 gap-6">
              <UnderlineSelect
                placeholder="Counter Party"
                value={counterParty}
                onValueChange={setCounterParty}
                options={counterpartyOptions}
              />
              <UnderlineSelect
                placeholder="Sleeve Counterparty"
                value={sleeveCounterparty}
                onValueChange={setSleeveCounterparty}
                options={counterpartyOptions}
              />
              <UnderlineSelect
                placeholder="Broker"
                value={broker}
                onValueChange={setBroker}
                options={BROKER_OPTIONS}
              />
            </div>
            
            {/* Row 3: Brokerage Fee, Brokerage Fee UoM */}
            <div className="grid grid-cols-3 gap-6">
              <UnderlineInput
                placeholder="Brokerage Fee"
                value={brokerageFee}
                onChange={setBrokerageFee}
              />
              <UnderlineSelect
                placeholder="Brokerage Fee (UoM)"
                value={brokerageFeeUom}
                onValueChange={setBrokerageFeeUom}
                options={BROKERAGE_FEE_UOM_OPTIONS}
              />
              <div /> {/* Empty cell for alignment */}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => {
          setTradeType("")
          setCommodity("")
          setQse("")
          setDuns("")
          setPortfolio("")
          setProductType("")
          setStrategy("")
          setCounterParty("")
          setSleeveCounterparty("")
          setBroker("")
          setBrokerageFee("")
          setBrokerageFeeUom("")
        }}>
          Clear
        </Button>
        <Button onClick={handleSaveTrade} className="bg-primary text-primary-foreground">
          Save Trade
        </Button>
      </div>
    </div>
  )
  
  // Render Trades list
  const renderTrades = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10"></TableHead>
                <TableHead>Trade Name</TableHead>
                <TableHead>Trade Date</TableHead>
                <TableHead>Counter Party</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Trade Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => {
                const isExpanded = expandedTradeId === trade.id
                return (
                  <React.Fragment key={trade.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{trade.tradeName}</TableCell>
                      <TableCell>{formatDateDisplay(trade.tradeDate)}</TableCell>
                      <TableCell>{trade.counterParty}</TableCell>
                      <TableCell>{trade.commodity}</TableCell>
                      <TableCell>{trade.tradeType}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trade.status === "Approved" 
                            ? "bg-green-100 text-green-800" 
                            : trade.status === "Pending Approval"
                            ? "bg-yellow-100 text-yellow-800"
                            : trade.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {trade.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                            e.stopPropagation()
                            setTrades((prev) => prev.filter((t) => t.id !== trade.id))
                          }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/10 p-4">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">QSE:</span> {trade.qse}
                            </div>
                            <div>
                              <span className="text-muted-foreground">DUNS:</span> {trade.duns}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Portfolio:</span> {trade.portfolio}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Product Type:</span> {trade.productType}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Strategy:</span> {trade.strategy}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Sleeve Counterparty:</span> {trade.sleeveCounterparty || "-"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Broker:</span> {trade.broker}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Brokerage Fee:</span> {trade.brokerageFee} {trade.brokerageFeeUom}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
              {trades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No trades found. Create a new trade in the Deal Entry tab.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
  
  // Render Approvals
  const renderApprovals = () => {
    const pendingTrades = trades.filter((t) => t.status === "Pending Approval")
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Trade Name</TableHead>
                  <TableHead>Trade Date</TableHead>
                  <TableHead>Counter Party</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Trade Type</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.tradeName}</TableCell>
                    <TableCell>{formatDateDisplay(trade.tradeDate)}</TableCell>
                    <TableCell>{trade.counterParty}</TableCell>
                    <TableCell>{trade.commodity}</TableCell>
                    <TableCell>{trade.tradeType}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            setTrades((prev) => prev.map((t) => 
                              t.id === trade.id ? { ...t, status: "Approved" } : t
                            ))
                          }}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            setTrades((prev) => prev.map((t) => 
                              t.id === trade.id ? { ...t, status: "Rejected" } : t
                            ))
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingTrades.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No trades pending approval.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Render Upload Files
  const renderUploadFiles = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Document Repository</h3>
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                  <Input
                    placeholder="Brief description of the document"
                    value={newDocDescription}
                    onChange={(e) => setNewDocDescription(e.target.value)}
                  />
                </div>
                <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Select File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              
              {uploadedDocuments.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {doc.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{doc.description || "-"}</TableCell>
                        <TableCell>{doc.uploadedBy}</TableCell>
                        <TableCell>{doc.lastModified}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setUploadedDocuments((prev) => prev.filter((d) => d.id !== doc.id))}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Document</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploadedDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {doc.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{doc.description || "-"}</TableCell>
                  <TableCell>{doc.uploadedBy}</TableCell>
                  <TableCell>{doc.lastModified}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setUploadedDocuments((prev) => prev.filter((d) => d.id !== doc.id))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {uploadedDocuments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No documents uploaded. Click &quot;Upload Files&quot; to add documents.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
  
  // Render Reports placeholder
  const renderReports = () => (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Reports module coming soon...
    </div>
  )
  
  return (
    <DashboardLayout>
      <div className="p-6 space-y-4">
        {renderMainTabs()}
        
        {activeMainTab === "standard-trade" && (
          <>
            {renderSubTabs()}
            {activeSubTab === "trades" && renderTrades()}
            {activeSubTab === "deal-entry" && renderDealEntry()}
            {activeSubTab === "approvals" && renderApprovals()}
            {activeSubTab === "upload-files" && renderUploadFiles()}
          </>
        )}
        
        {activeMainTab === "reports" && renderReports()}
      </div>
    </DashboardLayout>
  )
}
