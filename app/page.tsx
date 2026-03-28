"use client"

import { useState, Fragment, useMemo } from "react"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChevronRight,
  RefreshCw,
  Search,
  X,
  FileText,
  BarChart3,
  CheckCircle,
  Eye,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  Check,
  Calendar,
  Filter,
  AlertTriangle,
  Clock
} from "lucide-react"

const tabs = [
  { id: "Reports Repository", label: "Reports Repository" },
  { id: "Daily Log", label: "Daily Log" },
]

// ============ REPORTS REPOSITORY DATA ============
const mockReports = [
  {
    id: 1,
    report: "Daily Generation Summary - March 2026",
    uploadedDate: "03-10-2026",
    resourceType: "NCLR",
    customer: "Texas Energy Co.",
    asset: "Wind Farm Alpha",
    validation1: true,
    validation2: true,
  },
  {
    id: 2,
    report: "Load Forecast Analysis Q1",
    uploadedDate: "03-09-2026",
    resourceType: "ESR",
    customer: "Midwest Industrial",
    asset: "Plant B-12",
    validation1: true,
    validation2: true,
  },
  {
    id: 3,
    report: "Demand Response Event Report",
    uploadedDate: "03-08-2026",
    resourceType: "GEN",
    customer: "Commercial Partners LLC",
    asset: "Portfolio C",
    validation1: true,
    validation2: false,
  },
  {
    id: 4,
    report: "ERCOT Settlement Data Feb 2026",
    uploadedDate: "03-07-2026",
    resourceType: "NCLR",
    customer: "Texas Energy Co.",
    asset: "Solar Array Delta",
    validation1: true,
    validation2: true,
  },
  {
    id: 5,
    report: "Outage Impact Assessment",
    uploadedDate: "03-06-2026",
    resourceType: "ESR",
    customer: "Gulf Coast Power",
    asset: "Gas Turbine Unit 3",
    validation1: false,
    validation2: false,
  },
  {
    id: 6,
    report: "Monthly Performance Review",
    uploadedDate: "03-05-2026",
    resourceType: "GEN",
    customer: "White Realty Management, Inc.",
    asset: "Portfolio A",
    validation1: true,
    validation2: true,
  },
  {
    id: 7,
    report: "Compliance Audit Report",
    uploadedDate: "03-04-2026",
    resourceType: "NCLR",
    customer: "Molinas Enterprises Inc",
    asset: "Facility East",
    validation1: true,
    validation2: true,
  },
  {
    id: 8,
    report: "Equipment Maintenance Log",
    uploadedDate: "03-03-2026",
    resourceType: "ESR",
    customer: "Next Level Blending LLC",
    asset: "Plant C-7",
    validation1: true,
    validation2: false,
  },
  {
    id: 9,
    report: "Energy Trading Summary",
    uploadedDate: "03-02-2026",
    resourceType: "GEN",
    customer: "Wild Duck Bar & Grill LLC",
    asset: "Commercial Unit",
    validation1: true,
    validation2: true,
  },
]

// ============ DAILY LOG DATA ============
const assetResourceTypeMap: Record<string, string> = {
  "Wind Farm Alpha": "NCLR",
  "Plant B-12": "ESR",
  "Portfolio C": "GEN",
  "Solar Array Delta": "NCLR",
  "Gas Turbine Unit 3": "ESR",
  "Portfolio A": "GEN",
  "Facility East": "NCLR",
  "Plant C-7": "ESR",
  "Commercial Unit": "GEN",
  "Building Complex A": "GEN",
}

const mockDailyLogs = [
  {
    id: 1,
    shiftOperator: "Rodriguez, M.",
    customer: "Texas Energy Co.",
    asset: "Wind Farm Alpha",
    eventBegin: "03/10/2026 08:15",
    eventDescriptor: "Turbine T-12 offline - bearing overheat",
    eventRestore: "03/10/2026 14:30",
    duration: "6h 15m",
    severity: "High",
    eventDetails: "Initial: Bearing temperature exceeded 180F threshold. Investigation: Maintenance crew dispatched to site. Resolution: Bearing replaced, turbine back online.",
    actionsTaken: "Dispatched maintenance crew at 08:22. Ordered replacement bearing from regional warehouse. Performed full diagnostic on adjacent turbines. Updated preventive maintenance schedule.",
  },
  {
    id: 2,
    shiftOperator: "Chen, L.",
    customer: "Midwest Industrial",
    asset: "Plant B-12",
    eventBegin: "03/10/2026 11:45",
    eventDescriptor: "Load curtailment request from ERCOT",
    eventRestore: "03/10/2026 13:00",
    duration: "1h 15m",
    severity: "Medium",
    eventDetails: "Notification: ERCOT issued EEA Level 1 alert. Response: Curtailed load per contract terms. Completion: Normal operations resumed after all-clear.",
    actionsTaken: "Notified customer operations team. Reduced load by 50MW as contracted. Documented compliance for settlement.",
  },
  {
    id: 3,
    shiftOperator: "Patel, A.",
    customer: "Commercial Partners LLC",
    asset: "Portfolio C",
    eventBegin: "03/10/2026 06:00",
    eventDescriptor: "Scheduled DR event - morning peak",
    eventRestore: "03/10/2026 09:00",
    duration: "3h 00m",
    severity: "Low",
    eventDetails: "Scheduled: Pre-planned demand response event. Execution: All sites responded within parameters. Complete: Event concluded successfully.",
    actionsTaken: "Sent 24-hour advance notification to all sites. Confirmed participation from 12 of 12 sites. Generated performance report for billing.",
  },
  {
    id: 4,
    shiftOperator: "Williams, J.",
    customer: "Gulf Coast Power",
    asset: "Gas Turbine Unit 3",
    eventBegin: "03/09/2026 22:30",
    eventDescriptor: "Emergency shutdown - fuel pressure drop",
    eventRestore: "03/10/2026 04:15",
    duration: "5h 45m",
    severity: "Critical",
    eventDetails: "Alarm: Low fuel pressure alarm triggered automatic shutdown. Assessment: Gas supply line blockage identified. Repair: Line cleared and pressure restored. Restart: Unit brought back online per startup procedures.",
    actionsTaken: "Initiated emergency response protocol. Notified ERCOT of forced outage. Coordinated with gas supplier. Filed incident report with management.",
  },
  {
    id: 5,
    shiftOperator: "Kim, S.",
    customer: "Texas Energy Co.",
    asset: "Solar Array Delta",
    eventBegin: "03/10/2026 14:00",
    eventDescriptor: "Inverter communication loss - String 4",
    eventRestore: "03/10/2026 15:30",
    duration: "1h 30m",
    severity: "Medium",
    eventDetails: "Detection: SCADA lost communication with inverter INV-D4. Troubleshooting: Remote reboot attempted unsuccessfully. Resolution: On-site technician reset communication module.",
    actionsTaken: "Attempted remote diagnostic via SCADA. Dispatched field technician. Replaced faulty ethernet cable at inverter.",
  },
  {
    id: 6,
    shiftOperator: "Martinez, R.",
    customer: "White Realty Management",
    asset: "Building Complex A",
    eventBegin: "03/10/2026 16:30",
    eventDescriptor: "HVAC system optimization event",
    eventRestore: "03/10/2026 18:00",
    duration: "1h 30m",
    severity: "Low",
    eventDetails: "Scheduled: Routine HVAC optimization during off-peak. Execution: Temperature setpoints adjusted per protocol. Complete: Normal operations resumed.",
    actionsTaken: "Coordinated with building management. Adjusted setpoints across 15 units. Monitored occupant comfort levels. Documented energy savings.",
  },
]

// ============ HELPER FUNCTIONS ============
function parseReportDate(dateStr: string): Date {
  const [month, day, year] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function parseLogDate(dateStr: string): Date {
  const [datePart] = dateStr.split(" ")
  const [month, day, year] = datePart.split("/").map(Number)
  return new Date(year, month - 1, day)
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case "Critical":
      return { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20" }
    case "High":
      return { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" }
    case "Medium":
      return { bg: "bg-chart-4/10", text: "text-chart-4", border: "border-chart-4/20" }
    default:
      return { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" }
  }
}

// ============ REPORT PREVIEW COMPONENT ============
function ReportPreview({ report, onClose }: { report: typeof mockReports[0], onClose: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={8} className="p-0 bg-muted/30">
        <div className="p-6">
          <Card className="max-w-4xl shadow-lg border-0">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{report.report}.pdf</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Close Preview"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <CardContent className="p-6 space-y-6">
              <div className="border-b border-border pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Ammper Power</p>
                    <p className="text-sm font-bold text-accent">Power Sphere</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Report Date</p>
                    <p className="text-sm font-medium">{report.uploadedDate}</p>
                  </div>
                </div>
                <h1 className="text-lg font-bold mt-4 text-foreground">{report.report}</h1>
                <div className="flex gap-4 mt-3">
                  <Badge variant="secondary" className="text-xs">Customer: {report.customer}</Badge>
                  <Badge variant="secondary" className="text-xs">Asset: {report.asset}</Badge>
                  <Badge variant="outline" className="text-xs">Type: {report.resourceType}</Badge>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                  </div>
                  1. Summary
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed pl-8">
                  This report provides a comprehensive analysis of operational performance for {report.asset} during the reporting period.
                  Key metrics indicate stable generation output with minor variance from forecasted levels.
                </p>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
                    <CheckCircle className="h-3.5 w-3.5 text-accent" />
                  </div>
                  2. Compliance Status
                </h2>
                <div className="grid grid-cols-3 gap-3 pl-8">
                  <Card className="border shadow-sm">
                    <CardContent className="p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">ERCOT Protocols</p>
                      <p className="text-sm font-semibold text-accent mt-1">Compliant</p>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardContent className="p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">NERC Standards</p>
                      <p className="text-sm font-semibold text-accent mt-1">Compliant</p>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardContent className="p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Internal SLA</p>
                      <p className="text-sm font-semibold text-accent mt-1">Met</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-chart-3/10 flex items-center justify-center">
                    <BarChart3 className="h-3.5 w-3.5 text-chart-3" />
                  </div>
                  3. Dispatch Response in Real Time
                </h2>
                <div className="grid grid-cols-2 gap-4 pl-8">
                  <Card className="border shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Generation Output (MW)</p>
                      <div className="h-16 flex items-end justify-between gap-1">
                        {[65, 78, 82, 71, 88, 92, 85, 79, 83, 90, 87, 81].map((val, i) => (
                          <div key={i} className="flex-1 bg-primary/80 rounded-t-sm" style={{ height: `${val}%` }} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Response Time (sec)</p>
                      <div className="h-16 flex items-end justify-between gap-1">
                        {[45, 52, 38, 41, 55, 48, 42, 50, 44, 39, 47, 43].map((val, i) => (
                          <div key={i} className="flex-1 bg-chart-3/80 rounded-t-sm" style={{ height: `${val}%` }} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-6 flex justify-between text-xs text-muted-foreground">
                <span>Generated by Power Sphere | Ammper Power</span>
                <span>Page 1 of 1</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ============ MAIN PAGE ============
export default function RealTimeOperationsPage() {
  const [activeTab, setActiveTab] = useState("Reports Repository")

  // Reports Repository state
  const [previewReportId, setPreviewReportId] = useState<number | null>(null)
  const [reportFilterQuery, setReportFilterQuery] = useState("")
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedAsset, setSelectedAsset] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [reportStartDate, setReportStartDate] = useState("2026-03-01")
  const [reportEndDate, setReportEndDate] = useState("2026-03-31")
  const [reportFilterCustomer, setReportFilterCustomer] = useState("")
  const [reportFilterAsset, setReportFilterAsset] = useState("")
  const [reportFilterResourceType, setReportFilterResourceType] = useState("")

  // Daily Log state
  const [logFilterQuery, setLogFilterQuery] = useState("")
  const [logStartDate, setLogStartDate] = useState("2026-03-01")
  const [logEndDate, setLogEndDate] = useState("2026-03-31")
  const [logFilterCustomer, setLogFilterCustomer] = useState("")
  const [logFilterAsset, setLogFilterAsset] = useState("")
  const [logFilterResourceType, setLogFilterResourceType] = useState("")
  const [expandedLogIds, setExpandedLogIds] = useState<Set<number>>(new Set())

  const toggleLogExpand = (id: number) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const autoResourceType = selectedAsset ? assetResourceTypeMap[selectedAsset] || "" : ""

  // Filtered reports
  const filteredReports = useMemo(() => {
    return mockReports.filter((report) => {
      const reportDate = parseReportDate(report.uploadedDate)
      const start = new Date(reportStartDate)
      const end = new Date(reportEndDate)
      if (reportDate < start || reportDate > end) return false
      if (reportFilterCustomer && report.customer !== reportFilterCustomer) return false
      if (reportFilterAsset && report.asset !== reportFilterAsset) return false
      if (reportFilterResourceType && report.resourceType !== reportFilterResourceType) return false
      if (reportFilterQuery) {
        const query = reportFilterQuery.toLowerCase()
        const matchesSearch =
          report.report.toLowerCase().includes(query) ||
          report.customer.toLowerCase().includes(query) ||
          report.asset.toLowerCase().includes(query) ||
          report.resourceType.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      return true
    })
  }, [reportStartDate, reportEndDate, reportFilterCustomer, reportFilterAsset, reportFilterResourceType, reportFilterQuery])

  // Filtered daily logs
  const filteredLogs = useMemo(() => {
    return mockDailyLogs.filter((log) => {
      const logDate = parseLogDate(log.eventBegin)
      const start = new Date(logStartDate)
      const end = new Date(logEndDate)
      if (logDate < start || logDate > end) return false
      if (logFilterCustomer && log.customer !== logFilterCustomer) return false
      if (logFilterAsset && log.asset !== logFilterAsset) return false
      if (logFilterResourceType) {
        const logResourceType = assetResourceTypeMap[log.asset] || ""
        if (logResourceType !== logFilterResourceType) return false
      }
      if (logFilterQuery) {
        const query = logFilterQuery.toLowerCase()
        const matchesSearch =
          log.shiftOperator.toLowerCase().includes(query) ||
          log.customer.toLowerCase().includes(query) ||
          log.asset.toLowerCase().includes(query) ||
          log.eventDescriptor.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      return true
    })
  }, [logStartDate, logEndDate, logFilterCustomer, logFilterAsset, logFilterResourceType, logFilterQuery])

  const togglePreview = (reportId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewReportId(previewReportId === reportId ? null : reportId)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const uniqueReportCustomers = [...new Set(mockReports.map((r) => r.customer))]
  const uniqueReportAssets = [...new Set(mockReports.map((r) => r.asset))]
  const uniqueReportResourceTypes = [...new Set(mockReports.map((r) => r.resourceType))]

  const uniqueLogCustomers = [...new Set(mockDailyLogs.map((l) => l.customer))]
  const uniqueLogAssets = [...new Set(mockDailyLogs.map((l) => l.asset))]
  const uniqueLogResourceTypes = [...new Set(Object.values(assetResourceTypeMap))]

  const criticalCount = filteredLogs.filter(l => l.severity === "Critical").length
  const highCount = filteredLogs.filter(l => l.severity === "High").length

  return (
    <DashboardLayout 
      pageTitle="Real Time Operations" 
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* Upload Report Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Upload Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-foreground font-medium mb-1">Drag and drop PDF file here</p>
              <p className="text-xs text-muted-foreground mb-3">or</p>
              <Button variant="outline" size="sm">Browse Files</Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Customer</label>
              <div className="relative">
                <select
                  className="w-full h-10 text-sm pl-3 pr-8 border border-border rounded-lg bg-background appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Select Customer</option>
                  <option>Texas Energy Co.</option>
                  <option>Midwest Industrial</option>
                  <option>Commercial Partners LLC</option>
                  <option>Gulf Coast Power</option>
                  <option>White Realty Management, Inc.</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Asset</label>
              <div className="relative">
                <select
                  className="w-full h-10 text-sm pl-3 pr-8 border border-border rounded-lg bg-background appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                >
                  <option value="">Select Asset</option>
                  <option>Wind Farm Alpha</option>
                  <option>Plant B-12</option>
                  <option>Portfolio C</option>
                  <option>Solar Array Delta</option>
                  <option>Gas Turbine Unit 3</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Resource Type</label>
              <Input type="text" value={autoResourceType} readOnly className="h-10 bg-muted/50" placeholder="Select asset to auto-fill" />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setUploadModalOpen(false)}>Cancel</Button>
              <Button>Upload Report</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ REPORTS REPOSITORY TAB ============ */}
      {activeTab === "Reports Repository" && (
        <Card className="shadow-sm border m-6">
          <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-muted/50 to-transparent">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Available Reports</p>
                  <p className="text-3xl font-bold text-foreground">{filteredReports.length}</p>
                </div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Total: <span className="font-semibold text-foreground">{mockReports.length}</span></span>
                {(reportFilterCustomer || reportFilterAsset || reportFilterResourceType || reportFilterQuery) && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    <Filter className="h-3 w-3 mr-1" />
                    Filtered
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-b border-border gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Button variant="ghost" size="icon" className="h-9 w-9" title="Refresh">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </Button>

              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="h-7 text-sm px-2 border-0 bg-transparent focus:outline-none" />
                <span className="text-sm text-muted-foreground">to</span>
                <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="h-7 text-sm px-2 border-0 bg-transparent focus:outline-none" />
              </div>

              <div className="relative">
                <select className="h-9 text-sm pl-3 pr-8 border border-border rounded-lg bg-background appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring" value={reportFilterCustomer} onChange={(e) => setReportFilterCustomer(e.target.value)}>
                  <option value="">All Customers</option>
                  {uniqueReportCustomers.map((customer) => <option key={customer} value={customer}>{customer}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>

              <div className="relative">
                <select className="h-9 text-sm pl-3 pr-8 border border-border rounded-lg bg-background appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring" value={reportFilterAsset} onChange={(e) => setReportFilterAsset(e.target.value)}>
                  <option value="">All Assets</option>
                  {uniqueReportAssets.map((asset) => <option key={asset} value={asset}>{asset}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>

              <div className="relative">
                <select className="h-9 text-sm pl-3 pr-8 border border-border rounded-lg bg-background appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring" value={reportFilterResourceType} onChange={(e) => setReportFilterResourceType(e.target.value)}>
                  <option value="">All Types</option>
                  {uniqueReportResourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => setUploadModalOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Report
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search reports..." value={reportFilterQuery} onChange={(e) => setReportFilterQuery(e.target.value)} className="h-9 text-sm w-56 pl-9" />
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/30">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-xs font-semibold py-4 px-4">Report</TableHead>
                <TableHead className="text-xs font-semibold py-4 px-4">Uploaded Date</TableHead>
                <TableHead className="text-xs font-semibold py-4 px-4">Resource Type</TableHead>
                <TableHead className="text-xs font-semibold py-4 px-4">Customer</TableHead>
                <TableHead className="text-xs font-semibold py-4 px-4">Asset</TableHead>
                <TableHead className="text-xs font-semibold py-4 px-4">Validation</TableHead>
                <TableHead className="text-xs font-semibold py-4 px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <Fragment key={report.id}>
                  <TableRow className={`hover:bg-muted/50 transition-colors ${previewReportId === report.id ? "bg-muted/30" : ""}`}>
                    <TableCell className="py-4 px-4 w-10">
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${previewReportId === report.id ? "rotate-90 text-primary" : ""}`} />
                    </TableCell>
                    <TableCell className="text-sm py-4 px-4 font-medium">{report.report}</TableCell>
                    <TableCell className="text-sm py-4 px-4 text-muted-foreground">{report.uploadedDate}</TableCell>
                    <TableCell className="text-sm py-4 px-4">
                      <Badge variant="outline" className="font-medium">{report.resourceType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm py-4 px-4">{report.customer}</TableCell>
                    <TableCell className="text-sm py-4 px-4 text-muted-foreground">{report.asset}</TableCell>
                    <TableCell className="text-sm py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${report.validation1 ? "bg-accent/10" : "bg-muted"}`}>
                          <Check className={`h-3 w-3 ${report.validation1 ? "text-accent" : "text-muted-foreground/40"}`} />
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${report.validation2 ? "bg-accent/10" : "bg-muted"}`}>
                          <Check className={`h-3 w-3 ${report.validation2 ? "text-accent" : "text-muted-foreground/40"}`} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => togglePreview(report.id, e)} title="View Report">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Download PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {previewReportId === report.id && <ReportPreview report={report} onClose={() => setPreviewReportId(null)} />}
                </Fragment>
              ))}
              {filteredReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm">No reports found matching the selected filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ============ DAILY LOG TAB ============ */}
      {activeTab === "Daily Log" && (
        <Card className="shadow-sm border m-6">
          <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-muted/50 to-transparent">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Daily Logs</p>
                  <p className="text-3xl font-bold text-foreground">{filteredLogs.length}</p>
                </div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="flex items-center gap-6">
                {criticalCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Critical</p>
                      <p className="text-lg font-bold text-destructive">{criticalCount}</p>
                    </div>
                  </div>
                )}
                {highCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">High Priority</p>
                      <p className="text-lg font-bold text-primary">{highCount}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1" />
              {(logFilterCustomer || logFilterAsset || logFilterResourceType || logFilterQuery) && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  <Filter className="h-3 w-3 mr-1" />
                  Filtered
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-b border-border gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9" title="Refresh">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </Button>

              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input type="date" value={logStartDate} onChange={(e) => setLogStartDate(e.target.value)} className="h-7 text-sm px-2 border-0 bg-transparent focus:outline-none" />
                <span className="text-sm text-muted-foreground">to</span>
                <input type="date" value={logEndDate} onChange={(e) => setLogEndDate(e.target.value)} className="h-7 text-sm px-2 border-0 bg-transparent focus:outline-none" />
              </div>

              <div className="relative">
                <select className="h-9 text-sm pl-3 pr-8 border border-border rounded-lg bg-background appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring" value={logFilterCustomer} onChange={(e) => setLogFilterCustomer(e.target.value)}>
                  <option value="">All Customers</option>
                  {uniqueLogCustomers.map((customer) => <option key={customer} value={customer}>{customer}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>

              <div className="relative">
                <select className="h-9 text-sm pl-3 pr-8 border border-border rounded-lg bg-background appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring" value={logFilterAsset} onChange={(e) => setLogFilterAsset(e.target.value)}>
                  <option value="">All Assets</option>
                  {uniqueLogAssets.map((asset) => <option key={asset} value={asset}>{asset}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>

              <div className="relative">
                <select className="h-9 text-sm pl-3 pr-8 border border-border rounded-lg bg-background appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring" value={logFilterResourceType} onChange={(e) => setLogFilterResourceType(e.target.value)}>
                  <option value="">All Types</option>
                  {uniqueLogResourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search logs..." value={logFilterQuery} onChange={(e) => setLogFilterQuery(e.target.value)} className="h-9 text-sm w-56 pl-9" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="text-xs font-semibold py-3 px-3 w-10"></TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-3 whitespace-nowrap">Operator</TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-3 whitespace-nowrap">Customer / Asset</TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-3 whitespace-nowrap">Event Descriptor</TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-3 whitespace-nowrap">Begin</TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-3 whitespace-nowrap">Restore</TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-3 whitespace-nowrap">Duration</TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-3 whitespace-nowrap">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const severityConfig = getSeverityConfig(log.severity)
                  const isExpanded = expandedLogIds.has(log.id)
                  return (
                    <Fragment key={log.id}>
                      <TableRow className={`hover:bg-muted/50 transition-colors cursor-pointer ${isExpanded ? "bg-muted/30" : ""}`} onClick={() => toggleLogExpand(log.id)}>
                        <TableCell className="py-3 px-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-sm py-3 px-3 whitespace-nowrap font-medium">{log.shiftOperator}</TableCell>
                        <TableCell className="text-sm py-3 px-3">
                          <div>
                            <p className="font-medium">{log.customer}</p>
                            <p className="text-xs text-muted-foreground">{log.asset}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm py-3 px-3 max-w-[250px]">
                          <p className="truncate" title={log.eventDescriptor}>{log.eventDescriptor}</p>
                        </TableCell>
                        <TableCell className="text-sm py-3 px-3 whitespace-nowrap font-mono text-xs text-muted-foreground">{log.eventBegin}</TableCell>
                        <TableCell className="text-sm py-3 px-3 whitespace-nowrap font-mono text-xs text-muted-foreground">{log.eventRestore}</TableCell>
                        <TableCell className="text-sm py-3 px-3 whitespace-nowrap">
                          <Badge variant="outline" className="font-mono text-xs">{log.duration}</Badge>
                        </TableCell>
                        <TableCell className="text-sm py-3 px-3 whitespace-nowrap">
                          <Badge className={`${severityConfig.bg} ${severityConfig.text} border ${severityConfig.border} text-xs`}>{log.severity}</Badge>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={8} className="p-0">
                            <div className="py-4 px-6 ml-10 space-y-4 border-l-2 border-primary/30">
                              <div>
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Event Details</p>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-normal break-words">{log.eventDetails}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Actions Taken</p>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-normal break-words">{log.actionsTaken}</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm">No logs found matching the selected filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </DashboardLayout>
  )
}
