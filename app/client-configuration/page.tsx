"use client"

import React, { useState, useRef } from "react"
import { useCounterparties, type Counterparty } from "@/lib/counterparty-context"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Building2, Zap, Building, Users, Trash2, Pencil, ChevronDown, ChevronUp, Info, Upload, Calendar, X, FileText } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type UploadedDocument = {
  id: string
  name: string
  description: string
  uploadedBy: string
  lastModified: string
}

// Counterparty type is imported from context

type Site = {
  id: string
  siteName: string
  resourceType: string // ESR, NCLR, GEN
  esiId: string
  address: string
  state: string
  city: string
  zipCode: string
  zipCodePlus4: string
  contractStartDate: string
  contractEndDate: string
  tdsp: string
  // Real Time Operations
  realTimeOperations: boolean
  // ESR fields
  esrAssetCode: string
  esrStationVoltage: string
  esrTotalLoadAtPod: string
  esrInterruptibleLoad: string
  // NCLR fields
  nclrAssetCode: string
  nclrStationVoltage: string
  nclrStorageCapacity: string
  nclrPowerCapacity: string
  nclrProgramEcrs: boolean
  nclrProgramRegup: boolean
  nclrProgramRegdown: boolean
  nclrProgramRrs: boolean
  nclrProgramNonSpin: boolean
}

// Mock logged in user email (in production this would come from auth middleware)
const MOCK_USER_EMAIL = "admin@powersphere.com"

// Mock data moved to counterparty-context.tsx for shared state
// The initialCounterparties are now managed via CounterpartyProvider

const clientTypes = [
  { id: "holding", label: "Holding company", icon: Building2 },
  { id: "ems", label: "EMS", icon: Zap },
  { id: "independent", label: "Independent Company", icon: Building },
  { id: "counterparty", label: "Counterparty", icon: Users },
]

export default function ClientConfigurationPage() {
  // Use shared context for counterparties
  const { counterparties, addCounterparty, updateCounterparty, deleteCounterparty } = useCounterparties()
  
  const [activeTab, setActiveTab] = useState<"board" | "registration">("board")
  const [participantType, setParticipantType] = useState<"market" | "non-participant">("market")
  
  // Handlers that use context
  const handleDelete = (id: string) => {
    deleteCounterparty(id)
  }

  const handleUpdate = (updatedClient: Counterparty) => {
    updateCounterparty(updatedClient)
  }
  
  // Registration form state
  const [selectedClientType, setSelectedClientType] = useState<string>("counterparty")
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    address: "",
    state: "",
    city: "",
    zipCode: "",
    zipCodePlus4: "",
    mwh: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactRole: "",
    contactOtherRole: "",
    qse: "",
    resourceNames: "",
    resourceIds: "",
    directory: "",
    counterparty: "",
    clientId: "",
    misShortname: "",
    directoryName: "",
    directoryEmail: "",
    directoryPhone: "",
    status: true,
    programs: {
      fourCP: false,
      ers: false,
      edr: false,
      clm: false,
      rrs: false,
      ecrs: false,
      regulationService: false,
      nonSpinReverseService: false,
      meterReadings: false,
      api: false,
      marketTransactions: false,
    },
    marketTransactionsOptions: {
      energyTrades: false,
      ptp: false,
      tpo: false,
    },
    energyTradesConfig: {
      clientId: "",
      counterparty: "",
      misShortname: "",
      status: true,
    },
    uploadedDocuments: [] as UploadedDocument[],
    sites: [] as Site[],
  })
  const [expandedSites, setExpandedSites] = useState<string[]>([])

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith("programs.")) {
      const key = field.replace("programs.", "")
      setFormData((prev) => ({
        ...prev,
        programs: { ...prev.programs, [key]: value },
      }))
    } else if (field.startsWith("marketTransactionsOptions.")) {
      const key = field.replace("marketTransactionsOptions.", "")
      setFormData((prev) => ({
        ...prev,
        marketTransactionsOptions: { ...prev.marketTransactionsOptions, [key]: value },
      }))
    } else if (field.startsWith("energyTradesConfig.")) {
      const key = field.replace("energyTradesConfig.", "")
      setFormData((prev) => ({
        ...prev,
        energyTradesConfig: { ...prev.energyTradesConfig, [key]: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = () => {
    if (!formData.name) return

    // Mock current user - in production this would come from auth middleware
    const currentUser = "Current User"

    // Create new counterparty - context will auto-generate id, createdOn, modifiedBy, lastModifiedOn
    addCounterparty({
      name: formData.name,
      address: formData.address,
      counterparty: formData.energyTradesConfig.counterparty || formData.counterparty,
      clientId: formData.energyTradesConfig.clientId || formData.clientId,
      misShortname: formData.energyTradesConfig.misShortname || formData.misShortname,
      directoryName: formData.contactName || formData.directoryName,
      directoryEmail: formData.contactEmail || formData.directoryEmail,
      directoryPhone: formData.contactPhone || formData.directoryPhone,
      status: formData.energyTradesConfig.status ? "Active" : "Inactive",
      createdBy: currentUser,
      documents: formData.uploadedDocuments,
    })
    
    // Reset form
    setFormData({
      name: "",
      shortName: "",
      address: "",
      state: "",
      city: "",
      zipCode: "",
      zipCodePlus4: "",
      mwh: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      contactRole: "",
      contactOtherRole: "",
      qse: "",
      resourceNames: "",
      resourceIds: "",
      directory: "",
      counterparty: "",
      clientId: "",
      misShortname: "",
      directoryName: "",
      directoryEmail: "",
      directoryPhone: "",
      status: true,
      programs: {
        fourCP: false,
        ers: false,
        edr: false,
        clm: false,
        rrs: false,
        ecrs: false,
        regulationService: false,
        nonSpinReverseService: false,
        meterReadings: false,
        api: false,
        marketTransactions: false,
      },
      marketTransactionsOptions: {
        energyTrades: false,
        ptp: false,
        tpo: false,
      },
      energyTradesConfig: {
        clientId: "",
        counterparty: "",
        misShortname: "",
        status: true,
      },
      uploadedDocuments: [],
      sites: [],
    })
    setExpandedSites([])
    
    // Switch to board tab to see the new entry
    setActiveTab("board")
  }

  const tabs = [
    { id: "board", label: "Client Board" },
    { id: "registration", label: "Client Registration" },
  ]

  return (
    <DashboardLayout
      title="Client Configuration"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as "board" | "registration")}
    >
      {activeTab === "board" ? (
        <ClientBoardTab 
          counterparties={counterparties} 
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      ) : (
        <div className="space-y-4">
          {/* Participant Type Chips */}
          <div className="flex gap-2">
            <button
              onClick={() => setParticipantType("market")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                participantType === "market"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Market participant
            </button>
            <button
              onClick={() => setParticipantType("non-participant")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                participantType === "non-participant"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Non-participant
            </button>
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

          {participantType === "non-participant" && (
            <NonParticipantRegistrationTab />
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

function ClientBoardTab({ 
  counterparties, 
  onDelete,
  onUpdate,
}: { 
  counterparties: Counterparty[]
  onDelete: (id: string) => void
  onUpdate: (client: Counterparty) => void
}) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [editingClient, setEditingClient] = useState<Counterparty | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleEditClick = (client: Counterparty) => {
    setEditingClient({ ...client })
    setEditModalOpen(true)
  }

  const handleEditSave = () => {
    if (editingClient) {
      onUpdate(editingClient)
      setEditModalOpen(false)
      setEditingClient(null)
    }
  }

  const handleEditChange = (field: keyof Counterparty, value: string) => {
    if (editingClient) {
      setEditingClient({ ...editingClient, [field]: value })
    }
  }

  const handleStatusToggle = (checked: boolean) => {
    if (editingClient) {
      setEditingClient({ ...editingClient, status: checked ? "Active" : "Inactive" })
    }
  }

  return (
    <div className="space-y-4">
      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <div className="space-y-4 py-4">
              {/* Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Client Status</Label>
                  <p className="text-xs text-muted-foreground">Toggle to activate or deactivate this client</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${editingClient.status === "Inactive" ? "text-muted-foreground font-medium" : "text-muted-foreground"}`}>
                    Inactive
                  </span>
                  <Switch
                    checked={editingClient.status === "Active"}
                    onCheckedChange={handleStatusToggle}
                  />
                  <span className={`text-sm ${editingClient.status === "Active" ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    Active
                  </span>
                </div>
              </div>

              {/* Company Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Company Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Company Name</Label>
                    <Input
                      id="edit-name"
                      value={editingClient.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Input
                      id="edit-address"
                      value={editingClient.address}
                      onChange={(e) => handleEditChange("address", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Energy Trades Configuration */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Energy Trades Configuration</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-clientId">Client ID</Label>
                    <Input
                      id="edit-clientId"
                      value={editingClient.clientId}
                      onChange={(e) => handleEditChange("clientId", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-counterparty">Counterparty</Label>
                    <Input
                      id="edit-counterparty"
                      value={editingClient.counterparty}
                      onChange={(e) => handleEditChange("counterparty", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-misShortname">MIS Shortname</Label>
                    <Input
                      id="edit-misShortname"
                      value={editingClient.misShortname}
                      onChange={(e) => handleEditChange("misShortname", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact Information</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-directoryName">Contact Name</Label>
                    <Input
                      id="edit-directoryName"
                      value={editingClient.directoryName}
                      onChange={(e) => handleEditChange("directoryName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-directoryEmail">Contact Email</Label>
                    <Input
                      id="edit-directoryEmail"
                      type="email"
                      value={editingClient.directoryEmail}
                      onChange={(e) => handleEditChange("directoryEmail", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-directoryPhone">Contact Phone</Label>
                    <Input
                      id="edit-directoryPhone"
                      value={editingClient.directoryPhone}
                      onChange={(e) => handleEditChange("directoryPhone", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Card */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Registered Counterparties</p>
              <p className="text-2xl font-bold text-primary">{counterparties.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold w-10"></TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Client ID</TableHead>
                <TableHead className="font-semibold">MIS Shortname</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counterparties.map((cp) => {
                const isExpanded = expandedRows.has(cp.id)
                return (
                  <React.Fragment key={cp.id}>
                    <TableRow className="hover:bg-muted/30">
                      <TableCell className="px-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleRow(cp.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cp.name}</p>
                          <p className="text-xs text-muted-foreground">{cp.address}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{cp.clientId}</TableCell>
                      <TableCell className="font-mono text-sm">{cp.misShortname}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{cp.directoryName}</p>
                          <p className="text-xs text-muted-foreground">{cp.directoryEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            cp.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {cp.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEditClick(cp)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => onDelete(cp.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Audit Info Dropdown Row */}
                    {isExpanded && (
                      <TableRow key={`${cp.id}-audit`} className="bg-muted/20">
                        <TableCell colSpan={7} className="py-3 px-6">
                          <div className="ml-8 space-y-4">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                Audit Information
                              </p>
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-b border-border/50">
                                    <TableHead className="text-xs font-medium py-2">Created By</TableHead>
                                    <TableHead className="text-xs font-medium py-2">Created On</TableHead>
                                    <TableHead className="text-xs font-medium py-2">Modified By</TableHead>
                                    <TableHead className="text-xs font-medium py-2">Last Modified On</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow className="border-0">
                                    <TableCell className="text-sm py-2">{cp.createdBy}</TableCell>
                                    <TableCell className="text-sm py-2">{cp.createdOn}</TableCell>
                                    <TableCell className="text-sm py-2">{cp.modifiedBy}</TableCell>
                                    <TableCell className="text-sm py-2">{cp.lastModifiedOn}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                            {cp.documents && cp.documents.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                  Documents
                                </p>
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-b border-border/50">
                                      <TableHead className="text-xs font-medium py-2">Document</TableHead>
                                      <TableHead className="text-xs font-medium py-2">Description</TableHead>
                                      <TableHead className="text-xs font-medium py-2">Uploaded By</TableHead>
                                      <TableHead className="text-xs font-medium py-2">Last Modified</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {cp.documents.map((doc) => (
                                      <TableRow key={doc.id} className="border-0">
                                        <TableCell className="text-sm py-2">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            {doc.name}
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-sm py-2 text-muted-foreground">
                                          {doc.description || "-"}
                                        </TableCell>
                                        <TableCell className="text-sm py-2">{doc.uploadedBy}</TableCell>
                                        <TableCell className="text-sm py-2">{doc.lastModified}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
              {counterparties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No counterparties registered yet. Go to Client Registration to add one.
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

// Underline-style input for the registration form
function UnderlineInput({
  id,
  placeholder,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  id?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
  className?: string
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border-0 border-b border-border bg-transparent pb-1 pt-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors ${className}`}
    />
  )
}

// Underline-style select
function UnderlineSelect({
  placeholder,
  value,
  onValueChange,
  options,
  className = "",
}: {
  placeholder: string
  value: string
  onValueChange: (v: string) => void
  options: string[]
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={`border-0 border-b border-border rounded-none bg-transparent px-0 h-auto pb-1 pt-0 text-sm shadow-none focus:ring-0 focus:border-primary ${className}`}
      >
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
  )
}

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
]

const TX_CITIES = ["Houston","Dallas","Austin","San Antonio","Fort Worth","El Paso","Arlington","Corpus Christi","Plano","Lubbock"]
const QSE_OPTIONS = ["QSE-001","QSE-002","QSE-003","QSE-004","QSE-005"]
const CONTACT_ROLES = ["Executive","Manager","Engineer","Analyst","Operator","Other"]
const DIRECTORY_OPTIONS = ["Directory A","Directory B","Directory C","Directory D"]

// Non-participant types
const nonParticipantTypes = [
  { id: "operator", label: "Operator", icon: Users },
]

// Non-participant registration form (Operator type)
function NonParticipantRegistrationTab() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [operatorData, setOperatorData] = useState({
    operatorName: "",
    email: "",
    phoneNumber: "",
    operatorId: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setOperatorData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!operatorData.operatorName || !operatorData.operatorId) {
      return
    }
    // For now, just reset the form - no persistence
    setOperatorData({
      operatorName: "",
      email: "",
      phoneNumber: "",
      operatorId: "",
    })
  }

  return (
    <div className="space-y-6">
      {/* Non-participant Type Selection */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold mb-1">Create non-participant</h3>
          <p className="text-sm text-muted-foreground mb-4">Select type</p>
          <div className="grid grid-cols-4 gap-3">
            {nonParticipantTypes.map((type) => {
              const Icon = type.icon
              const isSelected = selectedType === type.id
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded border-2 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs text-center ${isSelected ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    {type.label}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Operator Registration Form - only shown when Operator is selected */}
      {selectedType === "operator" && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Operator Form */}
              <div className="space-y-4">
                <UnderlineInput
                  placeholder="Operator Name *"
                  value={operatorData.operatorName}
                  onChange={(v) => handleInputChange("operatorName", v)}
                />

                <div className="flex gap-4">
                  <div className="flex-1">
                    <UnderlineInput
                      placeholder="Email"
                      type="email"
                      value={operatorData.email}
                      onChange={(v) => handleInputChange("email", v)}
                    />
                  </div>
                  <div className="flex-1">
                    <UnderlineInput
                      placeholder="Phone Number"
                      value={operatorData.phoneNumber}
                      onChange={(v) => handleInputChange("phoneNumber", v)}
                    />
                  </div>
                </div>

                <div className="w-64">
                  <UnderlineInput
                    placeholder="Operator ID *"
                    value={operatorData.operatorId}
                    onChange={(v) => handleInputChange("operatorId", v)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
                  Register Operator
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ClientRegistrationTab({
  selectedClientType,
  onClientTypeChange,
  formData,
  onInputChange,
  onSubmit,
  setFormData,
  expandedSites,
  setExpandedSites,
}: {
  selectedClientType: string
  onClientTypeChange: (type: string) => void
  formData: {
    name: string
    shortName: string
    address: string
    state: string
    city: string
    zipCode: string
    zipCodePlus4: string
    mwh: string
    contactName: string
    contactEmail: string
    contactPhone: string
    contactRole: string
    contactOtherRole: string
    qse: string
    resourceNames: string
    resourceIds: string
    directory: string
    counterparty: string
    clientId: string
    misShortname: string
    directoryName: string
    directoryEmail: string
    directoryPhone: string
    status: boolean
    programs: {
      fourCP: boolean
      ers: boolean
      edr: boolean
      clm: boolean
      rrs: boolean
      ecrs: boolean
      regulationService: boolean
      nonSpinReverseService: boolean
      meterReadings: boolean
      api: boolean
      marketTransactions: boolean
    }
    marketTransactionsOptions: {
      energyTrades: boolean
      ptp: boolean
      tpo: boolean
    }
    energyTradesConfig: {
      clientId: string
      counterparty: string
      misShortname: string
      status: boolean
    }
    uploadedDocuments: UploadedDocument[]
    sites: Site[]
  }
  onInputChange: (field: string, value: string | boolean) => void
  onSubmit: () => void
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>
  expandedSites: string[]
  setExpandedSites: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingDescription, setPendingDescription] = useState("")
  // Track which sites have validation errors for resource type
  const [siteValidationErrors, setSiteValidationErrors] = useState<Set<string>>(new Set())

  const isCounterparty = selectedClientType === "counterparty"
  const isHoldingCompany = selectedClientType === "holding"
  const isEMS = selectedClientType === "ems"

  // Holding Company: only Demand Response and Operational Services enabled (Ancillary Services disabled)
  // EMS: disabled Add Site, all Demand Response, all Ancillary Services, Meter Readings, Market Transactions
  const isDemandResponseDisabled = isCounterparty || isEMS
  const isAncillaryServicesDisabled = isCounterparty || isHoldingCompany || isEMS
  const isAddSiteDisabled = isEMS

  const handleProgramChange = (key: string, checked: boolean) => {
    onInputChange(`programs.${key}`, checked)
  }

  const handleMarketTransactionsOptionChange = (key: string, checked: boolean) => {
    onInputChange(`marketTransactionsOptions.${key}`, checked)
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setPendingFile(files[0])
    setPendingDescription("")
  }

  const handleAddDocument = () => {
    if (!pendingFile) return
    
    const now = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })

    const newDoc: UploadedDocument = {
      id: Date.now().toString(),
      name: pendingFile.name,
      description: pendingDescription,
      uploadedBy: MOCK_USER_EMAIL,
      lastModified: now,
    }

    setFormData((prev) => ({
      ...prev,
      uploadedDocuments: [...prev.uploadedDocuments, newDoc],
    }))

    setPendingFile(null)
    setPendingDescription("")
  }

  const handleRemoveDocument = (docId: string) => {
    setFormData((prev) => ({
      ...prev,
      uploadedDocuments: prev.uploadedDocuments.filter((d) => d.id !== docId),
    }))
  }

  return (
    <div className="space-y-6">
      {/* Company Type Selection */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold mb-1">Create client</h3>
          <p className="text-sm text-muted-foreground mb-4">Company</p>
          <div className="grid grid-cols-4 gap-3 mb-0">
            {clientTypes.map((type) => {
              const Icon = type.icon
              const isSelected = selectedClientType === type.id
              return (
                <button
                  key={type.id}
                  onClick={() => onClientTypeChange(type.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded border-2 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs text-center ${isSelected ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    {type.label}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Registration Form */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Company Name */}
            <UnderlineInput
              placeholder="Company Name"
              value={formData.name}
              onChange={(v) => onInputChange("name", v)}
            />

            {/* Short company name */}
            <UnderlineInput
              placeholder="Short company name"
              value={formData.shortName}
              onChange={(v) => onInputChange("shortName", v)}
            />

            {/* Address */}
            <UnderlineInput
              placeholder="Address"
              value={formData.address}
              onChange={(v) => onInputChange("address", v)}
            />

            {/* State / City / Zip Code / Zip Code+4 */}
            <div className="flex gap-4 items-end">
              <div className="w-36">
                <UnderlineSelect
                  placeholder="State"
                  value={formData.state}
                  onValueChange={(v) => onInputChange("state", v)}
                  options={US_STATES}
                />
              </div>
              <div className="w-36">
                <UnderlineSelect
                  placeholder="City"
                  value={formData.city}
                  onValueChange={(v) => onInputChange("city", v)}
                  options={TX_CITIES}
                />
              </div>
              <div className="w-24">
                <UnderlineInput
                  placeholder="Zip Code"
                  value={formData.zipCode}
                  onChange={(v) => onInputChange("zipCode", v)}
                />
              </div>
              <div className="w-24">
                <UnderlineInput
                  placeholder="Zip Code + 4"
                  value={formData.zipCodePlus4}
                  onChange={(v) => onInputChange("zipCodePlus4", v)}
                />
              </div>
            </div>

            {/* MWH - only shown when NOT counterparty */}
            {!isCounterparty && (
              <div className="w-64">
                <UnderlineInput
                  placeholder="MWH"
                  value={formData.mwh}
                  onChange={(v) => onInputChange("mwh", v)}
                />
              </div>
            )}

            {/* Contact Name / Email / Phone */}
            <div className="flex gap-4">
              <div className="flex-1">
                <UnderlineInput
                  placeholder="Contact Name"
                  value={formData.contactName}
                  onChange={(v) => onInputChange("contactName", v)}
                />
              </div>
              <div className="flex-1">
                <UnderlineInput
                  placeholder="Contact Email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(v) => onInputChange("contactEmail", v)}
                />
              </div>
              <div className="flex-1">
                <UnderlineInput
                  placeholder="Contact Phone"
                  value={formData.contactPhone}
                  onChange={(v) => onInputChange("contactPhone", v)}
                />
              </div>
            </div>

            {/* Contact Role / Contact Other Role */}
            <div className="flex gap-4 items-end">
              <div className="w-48">
                <UnderlineSelect
                  placeholder="Contact Role"
                  value={formData.contactRole}
                  onValueChange={(v) => onInputChange("contactRole", v)}
                  options={CONTACT_ROLES}
                />
              </div>
              <div className="flex-1">
                <UnderlineInput
                  placeholder="Contact Other Role"
                  value={formData.contactOtherRole}
                  onChange={(v) => onInputChange("contactOtherRole", v)}
                />
              </div>
            </div>

            {/* QSE / Resource Names / Resource IDs - only shown when NOT counterparty */}
            {!isCounterparty && (
              <div className="flex gap-4 items-end">
                <div className="w-36">
                  <UnderlineSelect
                    placeholder="QSE"
                    value={formData.qse}
                    onValueChange={(v) => onInputChange("qse", v)}
                    options={QSE_OPTIONS}
                  />
                </div>
                <div className="flex-1 flex items-end gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-blue-500 mb-1 shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Resource names associated with this client</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <UnderlineInput
                    placeholder="Resource Names"
                    value={formData.resourceNames}
                    onChange={(v) => onInputChange("resourceNames", v)}
                  />
                </div>
                <div className="flex-1 flex items-end gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-blue-500 mb-1 shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Resource IDs associated with this client</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <UnderlineInput
                    placeholder="Resource IDs"
                    value={formData.resourceIds}
                    onChange={(v) => onInputChange("resourceIds", v)}
                  />
                </div>
              </div>
            )}

            {/* Directory (full-width dropdown) */}
            <div className="border border-border rounded">
              <Select value={formData.directory} onValueChange={(v) => onInputChange("directory", v)}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Directory" />
                </SelectTrigger>
                <SelectContent>
                  {DIRECTORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload Files Button - integrated into form */}
            <div className="flex items-center gap-4">
              <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Files
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Documents</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* File selection and description */}
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <Label className="text-sm mb-2 block">Select File</Label>
                        <div
                          className="border border-dashed rounded flex items-center justify-center gap-2 p-3 cursor-pointer transition-colors border-border hover:border-muted-foreground/40"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {pendingFile ? pendingFile.name : "Click to select file"}
                          </span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files)}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm mb-2 block">Description (optional)</Label>
                        <Input
                          placeholder="Brief description of the document"
                          value={pendingDescription}
                          onChange={(e) => setPendingDescription(e.target.value)}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleAddDocument}
                        disabled={!pendingFile}
                      >
                        Add
                      </Button>
                    </div>

                    {/* Documents table */}
                    {formData.uploadedDocuments.length > 0 && (
                      <div className="border rounded">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-xs font-medium">Document</TableHead>
                              <TableHead className="text-xs font-medium">Description</TableHead>
                              <TableHead className="text-xs font-medium">Uploaded By</TableHead>
                              <TableHead className="text-xs font-medium">Last Modified</TableHead>
                              <TableHead className="text-xs font-medium w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {formData.uploadedDocuments.map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell className="text-sm">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    {doc.name}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {doc.description || "-"}
                                </TableCell>
                                <TableCell className="text-sm">{doc.uploadedBy}</TableCell>
                                <TableCell className="text-sm">{doc.lastModified}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleRemoveDocument(doc.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {formData.uploadedDocuments.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No documents uploaded yet.
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {formData.uploadedDocuments.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {formData.uploadedDocuments.length} document{formData.uploadedDocuments.length !== 1 ? "s" : ""} uploaded
                </span>
              )}
            </div>

            {/* Add Site button */}
            <div>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive/5"
                disabled={isAddSiteDisabled}
                onClick={() => {
                  const newSite: Site = {
                    id: Date.now().toString(),
                    siteName: "",
                    resourceType: "",
                    esiId: "",
                    address: "",
                    state: "",
                    city: "",
                    zipCode: "",
                    zipCodePlus4: "",
                    contractStartDate: "",
                    contractEndDate: "",
                    tdsp: "",
                    // Real Time Operations
                    realTimeOperations: false,
                    // ESR fields
                    esrAssetCode: "",
                    esrStationVoltage: "",
                    esrTotalLoadAtPod: "",
                    esrInterruptibleLoad: "",
                    // NCLR fields
                    nclrAssetCode: "",
                    nclrStationVoltage: "",
                    nclrStorageCapacity: "",
                    nclrPowerCapacity: "",
                    nclrProgramEcrs: false,
                    nclrProgramRegup: false,
                    nclrProgramRegdown: false,
                    nclrProgramRrs: false,
                    nclrProgramNonSpin: false,
                  }
                  setFormData((prev) => ({
                    ...prev,
                    sites: [...prev.sites, newSite],
                  }))
                  setExpandedSites((prev) => [...prev, newSite.id])
                }}
              >
                Add Site
              </Button>
            </div>

            {/* Sites Section */}
            {formData.sites.length > 0 && (
              <div className="space-y-4 pt-2">
                {formData.sites.map((site) => {
                  const isExpanded = expandedSites.includes(site.id)
                  return (
                    <div key={site.id} className="border border-border rounded">
                      {/* Site Header */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => {
                          setExpandedSites((prev) =>
                            isExpanded
                              ? prev.filter((id) => id !== site.id)
                              : [...prev, site.id]
                          )
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="font-medium text-sm">
                            {site.siteName || "Untitled Site"}
                          </span>
                          {site.esiId && (
                            <span className="text-xs text-muted-foreground">
                              {"•"} ESI ID: {site.esiId}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFormData((prev) => ({
                              ...prev,
                              sites: prev.sites.filter((s) => s.id !== site.id),
                            }))
                            setExpandedSites((prev) => prev.filter((id) => id !== site.id))
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      {/* Site Content */}
                      {isExpanded && (
                        <div className="border-t border-border p-4 bg-muted/10 space-y-4">
                          {/* Row 1: Site Name | Site Type | ESI ID */}
                          <div className="flex gap-4 items-end">
                            <div className="flex-1">
                              <UnderlineInput
                                placeholder="Site Name *"
                                value={site.siteName}
                                onChange={(v) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    sites: prev.sites.map((s) =>
                                      s.id === site.id ? { ...s, siteName: v } : s
                                    ),
                                  }))
                                }}
                              />
                            </div>
                            <div className="w-40 relative">
                              {/* Validation error tooltip */}
                              {siteValidationErrors.has(site.id) && !site.resourceType && (
                                <div className="absolute -top-8 left-0 z-10 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">
                                  A resource type must be selected when Real Time Operations is enabled
                                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-destructive" />
                                </div>
                              )}
                              <UnderlineSelect
                                placeholder={site.realTimeOperations ? "Resource Type *" : "Resource Type"}
                                value={site.resourceType}
                                onValueChange={(v) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    sites: prev.sites.map((s) =>
                                      s.id === site.id ? { ...s, resourceType: v } : s
                                    ),
                                  }))
                                  // Clear validation error when a resource type is selected
                                  setSiteValidationErrors((prev) => {
                                    const next = new Set(prev)
                                    next.delete(site.id)
                                    return next
                                  })
                                }}
                                options={["ESR", "NCLR", "GEN"]}
                              />
                            </div>
                            <div className="flex-1">
                              <UnderlineInput
                                placeholder="ESI ID"
                                value={site.esiId}
                                onChange={(v) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    sites: prev.sites.map((s) =>
                                      s.id === site.id ? { ...s, esiId: v } : s
                                    ),
                                  }))
                                }}
                              />
                            </div>
                          </div>

                          {/* Row 2: Address | State | City | Zip Code */}
                          <div className="flex gap-4 items-end">
                            <div className="flex-1">
                              <UnderlineInput
                                placeholder="Address"
                                value={site.address}
                                onChange={(v) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    sites: prev.sites.map((s) =>
                                      s.id === site.id ? { ...s, address: v } : s
                                    ),
                                  }))
                                }}
                              />
                            </div>
                            <div className="w-36">
                              <UnderlineSelect
                                placeholder="State *"
                                value={site.state}
                                onValueChange={(v) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    sites: prev.sites.map((s) =>
                                      s.id === site.id ? { ...s, state: v } : s
                                    ),
                                  }))
                                }}
                                options={US_STATES}
                              />
                            </div>
                            <div className="w-36">
                              <UnderlineSelect
                                placeholder="City *"
                                value={site.city}
                                onValueChange={(v) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    sites: prev.sites.map((s) =>
                                      s.id === site.id ? { ...s, city: v } : s
                                    ),
                                  }))
                                }}
                                options={TX_CITIES}
                              />
                            </div>
                            <div className="w-24">
                              <UnderlineInput
                                placeholder="Zip Code"
                                value={site.zipCode}
                                onChange={(v) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    sites: prev.sites.map((s) =>
                                      s.id === site.id ? { ...s, zipCode: v } : s
                                    ),
                                  }))
                                }}
                              />
                            </div>
                          </div>

                          {/* Row 3: Zip Code+4 | Contract Start Date | Contract End Date */}
                          <div className="flex gap-4 items-center">
                            <div className="w-32">
                              <UnderlineInput
                                placeholder="Zip Code + 4"
                                value={site.zipCodePlus4}
                                onChange={(v) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    sites: prev.sites.map((s) =>
                                      s.id === site.id ? { ...s, zipCodePlus4: v } : s
                                    ),
                                  }))
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-muted-foreground mb-1 block">
                                Contract Start Date *
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={site.contractStartDate}
                                  onChange={(e) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      sites: prev.sites.map((s) =>
                                        s.id === site.id
                                          ? { ...s, contractStartDate: e.target.value }
                                          : s
                                      ),
                                    }))
                                  }}
                                  className="w-full border-0 border-b border-border bg-transparent pb-1 pt-0 text-sm focus:outline-none focus:border-primary transition-colors"
                                />
                                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-muted-foreground mb-1 block">
                                Contract End Date *
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={site.contractEndDate}
                                  onChange={(e) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      sites: prev.sites.map((s) =>
                                        s.id === site.id
                                          ? { ...s, contractEndDate: e.target.value }
                                          : s
                                      ),
                                    }))
                                  }}
                                  className="w-full border-0 border-b border-border bg-transparent pb-1 pt-0 text-sm focus:outline-none focus:border-primary transition-colors"
                                />
                                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                              </div>
                            </div>
                          </div>

                          {/* Row 4: TDSP */}
                          <div className="w-64">
                            <UnderlineSelect
                              placeholder="TDSP"
                              value={site.tdsp}
                              onValueChange={(v) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  sites: prev.sites.map((s) =>
                                    s.id === site.id ? { ...s, tdsp: v } : s
                                  ),
                                }))
                              }}
                              options={["TDSP-001", "TDSP-002", "TDSP-003", "TDSP-004"]}
                            />
                          </div>

                          {/* Real Time Operations Checkbox */}
                          <div className="pt-4 border-t border-border">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`realTimeOps-${site.id}`}
                                checked={site.realTimeOperations}
                                onCheckedChange={(checked) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    sites: prev.sites.map((s) =>
                                      s.id === site.id ? { ...s, realTimeOperations: !!checked } : s
                                    ),
                                  }))
                                  // Show validation error if checking and no resource type selected
                                  if (checked && !site.resourceType) {
                                    setSiteValidationErrors((prev) => new Set(prev).add(site.id))
                                  } else {
                                    setSiteValidationErrors((prev) => {
                                      const next = new Set(prev)
                                      next.delete(site.id)
                                      return next
                                    })
                                  }
                                }}
                              />
                              <label
                                htmlFor={`realTimeOps-${site.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                Real Time Operations
                              </label>
                            </div>
                          </div>

                          {/* ESR Fields - shown when Real Time Operations is checked and Resource Type is ESR */}
                          {site.realTimeOperations && site.resourceType === "ESR" && (
                            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                              <p className="text-sm font-medium text-muted-foreground">ESR Configuration</p>
                              <div className="grid grid-cols-2 gap-4">
                                <UnderlineInput
                                  placeholder="Asset Code"
                                  value={site.esrAssetCode}
                                  onChange={(v) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      sites: prev.sites.map((s) =>
                                        s.id === site.id ? { ...s, esrAssetCode: v } : s
                                      ),
                                    }))
                                  }}
                                />
                                <UnderlineInput
                                  placeholder="Station Voltage"
                                  value={site.esrStationVoltage}
                                  onChange={(v) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      sites: prev.sites.map((s) =>
                                        s.id === site.id ? { ...s, esrStationVoltage: v } : s
                                      ),
                                    }))
                                  }}
                                />
                                <UnderlineInput
                                  placeholder="Total Load at POD"
                                  value={site.esrTotalLoadAtPod}
                                  onChange={(v) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      sites: prev.sites.map((s) =>
                                        s.id === site.id ? { ...s, esrTotalLoadAtPod: v } : s
                                      ),
                                    }))
                                  }}
                                />
                                <UnderlineInput
                                  placeholder="Interruptible Load"
                                  value={site.esrInterruptibleLoad}
                                  onChange={(v) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      sites: prev.sites.map((s) =>
                                        s.id === site.id ? { ...s, esrInterruptibleLoad: v } : s
                                      ),
                                    }))
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* NCLR Fields - shown when Real Time Operations is checked and Resource Type is NCLR */}
                          {site.realTimeOperations && site.resourceType === "NCLR" && (
                            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                              <p className="text-sm font-medium text-muted-foreground">NCLR Configuration</p>
                              <div className="grid grid-cols-2 gap-4">
                                <UnderlineInput
                                  placeholder="Asset Code"
                                  value={site.nclrAssetCode}
                                  onChange={(v) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      sites: prev.sites.map((s) =>
                                        s.id === site.id ? { ...s, nclrAssetCode: v } : s
                                      ),
                                    }))
                                  }}
                                />
                                <UnderlineInput
                                  placeholder="Station Voltage"
                                  value={site.nclrStationVoltage}
                                  onChange={(v) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      sites: prev.sites.map((s) =>
                                        s.id === site.id ? { ...s, nclrStationVoltage: v } : s
                                      ),
                                    }))
                                  }}
                                />
                                <UnderlineInput
                                  placeholder="Storage Capacity"
                                  value={site.nclrStorageCapacity}
                                  onChange={(v) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      sites: prev.sites.map((s) =>
                                        s.id === site.id ? { ...s, nclrStorageCapacity: v } : s
                                      ),
                                    }))
                                  }}
                                />
                                <UnderlineInput
                                  placeholder="Power Capacity"
                                  value={site.nclrPowerCapacity}
                                  onChange={(v) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      sites: prev.sites.map((s) =>
                                        s.id === site.id ? { ...s, nclrPowerCapacity: v } : s
                                      ),
                                    }))
                                  }}
                                />
                              </div>
                              
                              {/* Program Participation */}
                              <div className="pt-2">
                                <p className="text-sm font-medium mb-3">Program Participation</p>
                                <div className="flex flex-wrap gap-4">
                                  {[
                                    { key: "nclrProgramEcrs", label: "ECRS" },
                                    { key: "nclrProgramRegup", label: "REGUP" },
                                    { key: "nclrProgramRegdown", label: "REGDOWN" },
                                    { key: "nclrProgramRrs", label: "RRS" },
                                    { key: "nclrProgramNonSpin", label: "NON SPIN" },
                                  ].map((program) => (
                                    <div key={program.key} className="flex items-center gap-2">
                                      <Checkbox
                                        id={`${program.key}-${site.id}`}
                                        checked={site[program.key as keyof Site] as boolean}
                                        onCheckedChange={(checked) => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            sites: prev.sites.map((s) =>
                                              s.id === site.id ? { ...s, [program.key]: !!checked } : s
                                            ),
                                          }))
                                        }}
                                      />
                                      <label
                                        htmlFor={`${program.key}-${site.id}`}
                                        className="text-sm cursor-pointer"
                                      >
                                        {program.label}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* GEN - No nested form when Real Time Operations is checked */}
                          {site.realTimeOperations && site.resourceType === "GEN" && (
                            <div className="p-4 bg-muted/30 rounded-lg">
                              <p className="text-sm text-muted-foreground">No additional configuration required for GEN resource type.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Programs Section */}
            <div className="pt-2">
              <h4 className="text-base font-semibold mb-4">Programs</h4>
              <div className="grid grid-cols-3 gap-6">
                {/* Demand Response */}
                <div>
                  <p className="text-sm font-medium mb-3">Demand Response</p>
                  <div className="space-y-2.5">
                    {[
                      { key: "fourCP", label: "4CP" },
                      { key: "ers", label: "ERS" },
                      { key: "edr", label: "EDR" },
                      { key: "clm", label: "CLM" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={`dr-${key}`}
                          checked={formData.programs[key as keyof typeof formData.programs] as boolean}
                          onCheckedChange={(checked) => handleProgramChange(key, !!checked)}
                          disabled={isDemandResponseDisabled}
                        />
                        <label 
                          htmlFor={`dr-${key}`} 
                          className={`text-sm cursor-pointer ${isDemandResponseDisabled ? "text-muted-foreground" : ""}`}
                        >
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ancillary Services */}
                <div>
                  <p className="text-sm font-medium mb-3">Ancillary Services</p>
                  <div className="space-y-2.5">
                    {[
                      { key: "rrs", label: "RRS" },
                      { key: "ecrs", label: "ECRS" },
                      { key: "regulationService", label: "Regulation Service" },
                      { key: "nonSpinReverseService", label: "Non-Spin Reverse Service" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={`as-${key}`}
                          checked={formData.programs[key as keyof typeof formData.programs] as boolean}
                          onCheckedChange={(checked) => handleProgramChange(key, !!checked)}
                          disabled={isAncillaryServicesDisabled}
                        />
                        <label 
                          htmlFor={`as-${key}`} 
                          className={`text-sm cursor-pointer ${isAncillaryServicesDisabled ? "text-muted-foreground" : ""}`}
                        >
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operational Services */}
                <div>
                  <p className="text-sm font-medium mb-3">Operational Services</p>
                  <div className="space-y-2.5">
                    {[
                      { key: "meterReadings", label: "Meter Readings" },
                      { key: "api", label: "API" },
                      { key: "marketTransactions", label: "Market Transactions" },
                    ].map(({ key, label }) => {
                      // EMS: Meter Readings and Market Transactions disabled
                      // Counterparty: only Market Transactions enabled
                      const isDisabled = 
                        (isEMS && (key === "meterReadings" || key === "marketTransactions")) ||
                        (isCounterparty && key !== "marketTransactions")
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <Checkbox
                            id={`os-${key}`}
                            checked={formData.programs[key as keyof typeof formData.programs] as boolean}
                            onCheckedChange={(checked) => handleProgramChange(key, !!checked)}
                            disabled={isDisabled}
                          />
                          <label 
                            htmlFor={`os-${key}`} 
                            className={`text-sm cursor-pointer ${isDisabled ? "text-muted-foreground" : ""}`}
                          >
                            {label}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Market Transactions Options Card - only shown when Market Transactions is checked */}
            {formData.programs.marketTransactions && (
              <Card className="border border-border shadow-sm">
                <CardContent className="p-4">
                  <h5 className="text-sm font-semibold mb-3">Market Transactions Options</h5>
                  <div className="flex gap-6">
                    {[
                      { key: "energyTrades", label: "Energy Trades" },
                      { key: "ptp", label: "PTP" },
                      { key: "tpo", label: "TPO" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={`mt-${key}`}
                          checked={formData.marketTransactionsOptions[key as keyof typeof formData.marketTransactionsOptions]}
                          onCheckedChange={(checked) => handleMarketTransactionsOptionChange(key, !!checked)}
                        />
                        <label htmlFor={`mt-${key}`} className="text-sm cursor-pointer">
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Energy Trades Configuration - only shown when Energy Trades is checked */}
            {formData.programs.marketTransactions && formData.marketTransactionsOptions.energyTrades && (
              <Card className="border border-primary/30 shadow-sm bg-primary/5">
                <CardContent className="p-4">
                  <h5 className="text-sm font-semibold mb-4">Energy Trades Configuration</h5>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Client ID</Label>
                        <UnderlineInput
                          placeholder="Enter Client ID"
                          value={formData.energyTradesConfig.clientId}
                          onChange={(v) => onInputChange("energyTradesConfig.clientId", v)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Counterparty</Label>
                        <UnderlineInput
                          placeholder="Enter Counterparty"
                          value={formData.energyTradesConfig.counterparty}
                          onChange={(v) => onInputChange("energyTradesConfig.counterparty", v)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">MIS Shortname</Label>
                        <UnderlineInput
                          placeholder="Enter MIS Shortname"
                          value={formData.energyTradesConfig.misShortname}
                          onChange={(v) => onInputChange("energyTradesConfig.misShortname", v)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <span className={`text-sm ${!formData.energyTradesConfig.status ? "font-medium" : "text-muted-foreground"}`}>Inactive</span>
                      <Switch
                        checked={formData.energyTradesConfig.status}
                        onCheckedChange={(checked) => onInputChange("energyTradesConfig.status", checked)}
                      />
                      <span className={`text-sm ${formData.energyTradesConfig.status ? "font-medium text-green-600" : "text-muted-foreground"}`}>Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t flex items-center justify-end">
            <Button onClick={onSubmit} disabled={isCounterparty ? !formData.energyTradesConfig.clientId : !formData.name}>
              Register Client
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
