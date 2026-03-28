"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Button } from "primereact/button"
import { Tag } from "primereact/tag"
import { Dialog } from "primereact/dialog"
import { InputText } from "primereact/inputtext"
import { Dropdown } from "primereact/dropdown"
import { TabView, TabPanel } from "primereact/tabview"
import type { DataTableExpandedRows } from "primereact/datatable"
import { FileText, Upload, AlertTriangle, Clock, Check } from "lucide-react"

// ============ REPORTS REPOSITORY DATA ============
const mockReports = [
  { id: 1, report: "Daily Generation Summary - March 2026", uploadedDate: "03-10-2026", resourceType: "NCLR", customer: "Texas Energy Co.", asset: "Wind Farm Alpha", validation1: true, validation2: true },
  { id: 2, report: "Load Forecast Analysis Q1", uploadedDate: "03-09-2026", resourceType: "ESR", customer: "Midwest Industrial", asset: "Plant B-12", validation1: true, validation2: true },
  { id: 3, report: "Demand Response Event Report", uploadedDate: "03-08-2026", resourceType: "GEN", customer: "Commercial Partners LLC", asset: "Portfolio C", validation1: true, validation2: false },
  { id: 4, report: "ERCOT Settlement Data Feb 2026", uploadedDate: "03-07-2026", resourceType: "NCLR", customer: "Texas Energy Co.", asset: "Solar Array Delta", validation1: true, validation2: true },
  { id: 5, report: "Outage Impact Assessment", uploadedDate: "03-06-2026", resourceType: "ESR", customer: "Gulf Coast Power", asset: "Gas Turbine Unit 3", validation1: false, validation2: false },
  { id: 6, report: "Monthly Performance Review", uploadedDate: "03-05-2026", resourceType: "GEN", customer: "White Realty Management, Inc.", asset: "Portfolio A", validation1: true, validation2: true },
  { id: 7, report: "Compliance Audit Report", uploadedDate: "03-04-2026", resourceType: "NCLR", customer: "Molinas Enterprises Inc", asset: "Facility East", validation1: true, validation2: true },
  { id: 8, report: "Equipment Maintenance Log", uploadedDate: "03-03-2026", resourceType: "ESR", customer: "Next Level Blending LLC", asset: "Plant C-7", validation1: true, validation2: false },
  { id: 9, report: "Energy Trading Summary", uploadedDate: "03-02-2026", resourceType: "GEN", customer: "Wild Duck Bar & Grill LLC", asset: "Commercial Unit", validation1: true, validation2: true },
]

// ============ DAILY LOG DATA ============
const assetResourceTypeMap: Record<string, string> = {
  "Wind Farm Alpha": "NCLR", "Plant B-12": "ESR", "Portfolio C": "GEN",
  "Solar Array Delta": "NCLR", "Gas Turbine Unit 3": "ESR", "Portfolio A": "GEN",
  "Facility East": "NCLR", "Plant C-7": "ESR", "Commercial Unit": "GEN", "Building Complex A": "GEN",
}

const mockDailyLogs = [
  { id: 1, shiftOperator: "Rodriguez, M.", customer: "Texas Energy Co.", asset: "Wind Farm Alpha", eventBegin: "03/10/2026 08:15", eventDescriptor: "Turbine T-12 offline - bearing overheat", eventRestore: "03/10/2026 14:30", duration: "6h 15m", severity: "High", eventDetails: "Initial: Bearing temperature exceeded 180F threshold. Investigation: Maintenance crew dispatched to site. Resolution: Bearing replaced, turbine back online.", actionsTaken: "Dispatched maintenance crew at 08:22. Ordered replacement bearing from regional warehouse. Performed full diagnostic on adjacent turbines. Updated preventive maintenance schedule." },
  { id: 2, shiftOperator: "Chen, L.", customer: "Midwest Industrial", asset: "Plant B-12", eventBegin: "03/10/2026 11:45", eventDescriptor: "Load curtailment request from ERCOT", eventRestore: "03/10/2026 13:00", duration: "1h 15m", severity: "Medium", eventDetails: "Notification: ERCOT issued EEA Level 1 alert. Response: Curtailed load per contract terms. Completion: Normal operations resumed after all-clear.", actionsTaken: "Notified customer operations team. Reduced load by 50MW as contracted. Documented compliance for settlement." },
  { id: 3, shiftOperator: "Patel, A.", customer: "Commercial Partners LLC", asset: "Portfolio C", eventBegin: "03/10/2026 06:00", eventDescriptor: "Scheduled DR event - morning peak", eventRestore: "03/10/2026 09:00", duration: "3h 00m", severity: "Low", eventDetails: "Scheduled: Pre-planned demand response event. Execution: All sites responded within parameters. Complete: Event concluded successfully.", actionsTaken: "Sent 24-hour advance notification to all sites. Confirmed participation from 12 of 12 sites. Generated performance report for billing." },
  { id: 4, shiftOperator: "Williams, J.", customer: "Gulf Coast Power", asset: "Gas Turbine Unit 3", eventBegin: "03/09/2026 22:30", eventDescriptor: "Emergency shutdown - fuel pressure drop", eventRestore: "03/10/2026 04:15", duration: "5h 45m", severity: "Critical", eventDetails: "Alarm: Low fuel pressure alarm triggered automatic shutdown. Assessment: Gas supply line blockage identified. Repair: Line cleared and pressure restored. Restart: Unit brought back online per startup procedures.", actionsTaken: "Initiated emergency response protocol. Notified ERCOT of forced outage. Coordinated with gas supplier. Filed incident report with management." },
  { id: 5, shiftOperator: "Kim, S.", customer: "Texas Energy Co.", asset: "Solar Array Delta", eventBegin: "03/10/2026 14:00", eventDescriptor: "Inverter communication loss - String 4", eventRestore: "03/10/2026 15:30", duration: "1h 30m", severity: "Medium", eventDetails: "Detection: SCADA lost communication with inverter INV-D4. Troubleshooting: Remote reboot attempted unsuccessfully. Resolution: On-site technician reset communication module.", actionsTaken: "Attempted remote diagnostic via SCADA. Dispatched field technician. Replaced faulty ethernet cable at inverter." },
  { id: 6, shiftOperator: "Martinez, R.", customer: "White Realty Management", asset: "Building Complex A", eventBegin: "03/10/2026 16:30", eventDescriptor: "HVAC system optimization event", eventRestore: "03/10/2026 18:00", duration: "1h 30m", severity: "Low", eventDetails: "Scheduled: Routine HVAC optimization during off-peak. Execution: Temperature setpoints adjusted per protocol. Complete: Normal operations resumed.", actionsTaken: "Coordinated with building management. Adjusted setpoints across 15 units. Monitored occupant comfort levels. Documented energy savings." },
]

// ============ HELPERS ============
function parseReportDate(dateStr: string): Date {
  const [month, day, year] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function parseLogDate(dateStr: string): Date {
  const [datePart] = dateStr.split(" ")
  const [month, day, year] = datePart.split("/").map(Number)
  return new Date(year, month - 1, day)
}

function resourceTypeSeverity(rt: string): "info" | "warning" | "success" {
  if (rt === "NCLR") return "info"
  if (rt === "ESR") return "warning"
  return "success"
}

function severityTag(severity: string): "danger" | "warning" | "success" | "info" {
  if (severity === "Critical") return "danger"
  if (severity === "High") return "warning"
  if (severity === "Low") return "success"
  return "info"
}

// ============ MAIN PAGE ============
export default function RealTimeOperationsPage() {
  // Tab
  const [activeTabIndex, setActiveTabIndex] = useState(0)

  // Reports state
  const [expandedReportRows, setExpandedReportRows] = useState<DataTableExpandedRows>({})
  const [reportFilterQuery, setReportFilterQuery] = useState("")
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedAsset, setSelectedAsset] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [reportStartDate, setReportStartDate] = useState("2026-03-01")
  const [reportEndDate, setReportEndDate] = useState("2026-03-31")
  const [reportFilterCustomer, setReportFilterCustomer] = useState<string | null>(null)
  const [reportFilterAsset, setReportFilterAsset] = useState<string | null>(null)
  const [reportFilterResourceType, setReportFilterResourceType] = useState<string | null>(null)

  // Daily Log state
  const [expandedLogRows, setExpandedLogRows] = useState<DataTableExpandedRows>({})
  const [logFilterQuery, setLogFilterQuery] = useState("")
  const [logStartDate, setLogStartDate] = useState("2026-03-01")
  const [logEndDate, setLogEndDate] = useState("2026-03-31")
  const [logFilterCustomer, setLogFilterCustomer] = useState<string | null>(null)
  const [logFilterAsset, setLogFilterAsset] = useState<string | null>(null)
  const [logFilterResourceType, setLogFilterResourceType] = useState<string | null>(null)

  const autoResourceType = selectedAsset ? assetResourceTypeMap[selectedAsset] || "" : ""

  const uniqueReportCustomers = [...new Set(mockReports.map((r) => r.customer))].map(v => ({ label: v, value: v }))
  const uniqueReportAssets = [...new Set(mockReports.map((r) => r.asset))].map(v => ({ label: v, value: v }))
  const uniqueReportResourceTypes = [...new Set(mockReports.map((r) => r.resourceType))].map(v => ({ label: v, value: v }))
  const uniqueLogCustomers = [...new Set(mockDailyLogs.map((l) => l.customer))].map(v => ({ label: v, value: v }))
  const uniqueLogAssets = [...new Set(mockDailyLogs.map((l) => l.asset))].map(v => ({ label: v, value: v }))
  const uniqueLogResourceTypes = [...new Set(Object.values(assetResourceTypeMap))].map(v => ({ label: v, value: v }))

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
        const q = reportFilterQuery.toLowerCase()
        if (![report.report, report.customer, report.asset, report.resourceType].some(s => s.toLowerCase().includes(q))) return false
      }
      return true
    })
  }, [reportStartDate, reportEndDate, reportFilterCustomer, reportFilterAsset, reportFilterResourceType, reportFilterQuery])

  const filteredLogs = useMemo(() => {
    return mockDailyLogs.filter((log) => {
      const logDate = parseLogDate(log.eventBegin)
      const start = new Date(logStartDate)
      const end = new Date(logEndDate)
      if (logDate < start || logDate > end) return false
      if (logFilterCustomer && log.customer !== logFilterCustomer) return false
      if (logFilterAsset && log.asset !== logFilterAsset) return false
      if (logFilterResourceType && (assetResourceTypeMap[log.asset] || "") !== logFilterResourceType) return false
      if (logFilterQuery) {
        const q = logFilterQuery.toLowerCase()
        if (![log.shiftOperator, log.customer, log.asset, log.eventDescriptor].some(s => s.toLowerCase().includes(q))) return false
      }
      return true
    })
  }, [logStartDate, logEndDate, logFilterCustomer, logFilterAsset, logFilterResourceType, logFilterQuery])

  const criticalCount = filteredLogs.filter(l => l.severity === "Critical").length
  const highCount = filteredLogs.filter(l => l.severity === "High").length

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(false)
  }

  // ── Column body templates ──
  const reportResourceTypeBody = (row: typeof mockReports[0]) => (
    <Tag value={row.resourceType} severity={resourceTypeSeverity(row.resourceType)} />
  )

  const reportValidationBody = (row: typeof mockReports[0]) => (
    <div className="flex gap-2">
      <span title="Validation 1">
        {row.validation1
          ? <Check className="h-4 w-4" style={{ color: "#2d7a2d" }} />
          : <span style={{ color: "var(--text-color-secondary)" }}>—</span>}
      </span>
      <span title="Validation 2">
        {row.validation2
          ? <Check className="h-4 w-4" style={{ color: "#2d7a2d" }} />
          : <span style={{ color: "var(--text-color-secondary)" }}>—</span>}
      </span>
    </div>
  )

  const reportActionsBody = () => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" tooltip="Preview" />
      <Button icon="pi pi-download" rounded text size="small" tooltip="Download" />
    </div>
  )

  const reportExpansionTemplate = (row: typeof mockReports[0]) => (
    <div className="p-4" style={{ background: "var(--surface-section)" }}>
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--surface-border)", background: "var(--surface-card)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--surface-border)", background: "var(--surface-hover)" }}>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: "#cc1111" }} />
            <span className="text-sm font-medium" style={{ color: "var(--text-color)" }}>{row.report}.pdf</span>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="border-b pb-4" style={{ borderColor: "var(--surface-border)" }}>
            <div className="flex justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "var(--text-color-secondary)" }}>Ammper Power</p>
                <p className="text-sm font-bold" style={{ color: "#2d7a2d" }}>Power Sphere</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "var(--text-color-secondary)" }}>Report Date</p>
                <p className="text-sm font-medium" style={{ color: "var(--text-color)" }}>{row.uploadedDate}</p>
              </div>
            </div>
            <h1 className="text-base font-bold mt-3" style={{ color: "var(--text-color)" }}>{row.report}</h1>
            <div className="flex gap-2 mt-2">
              <Tag value={`Customer: ${row.customer}`} severity="secondary" />
              <Tag value={`Asset: ${row.asset}`} severity="secondary" />
              <Tag value={`Type: ${row.resourceType}`} severity={resourceTypeSeverity(row.resourceType)} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-color-secondary)" }}>Summary</p>
            <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
              This report provides a comprehensive analysis of operational performance for {row.asset} during the reporting period. Key metrics indicate stable generation output with minor variance from forecasted levels.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[["ERCOT Protocols", "Compliant"], ["NERC Standards", "Compliant"], ["Internal SLA", "Met"]].map(([label, val]) => (
              <div key={label} className="p-3 rounded-lg border" style={{ borderColor: "var(--surface-border)", background: "var(--surface-section)" }}>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-color-secondary)" }}>{label}</p>
                <p className="text-sm font-semibold" style={{ color: "#2d7a2d" }}>{val}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border" style={{ borderColor: "var(--surface-border)", background: "var(--surface-section)" }}>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--text-color-secondary)" }}>Generation Output (MW)</p>
              <div className="h-14 flex items-end gap-0.5">
                {[65, 78, 82, 71, 88, 92, 85, 79, 83, 90, 87, 81].map((val, i) => (
                  <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${val}%`, background: "#cc1111" }} />
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg border" style={{ borderColor: "var(--surface-border)", background: "var(--surface-section)" }}>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--text-color-secondary)" }}>Response Time (sec)</p>
              <div className="h-14 flex items-end gap-0.5">
                {[45, 52, 38, 41, 55, 48, 42, 50, 44, 39, 47, 43].map((val, i) => (
                  <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${val}%`, background: "#1a5ca8" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const logSeverityBody = (row: typeof mockDailyLogs[0]) => (
    <Tag value={row.severity} severity={severityTag(row.severity)} />
  )

  const logDurationBody = (row: typeof mockDailyLogs[0]) => (
    <span className="font-mono text-xs" style={{ color: "var(--text-color-secondary)" }}>{row.duration}</span>
  )

  const logCustomerBody = (row: typeof mockDailyLogs[0]) => (
    <div>
      <div className="text-sm font-medium" style={{ color: "var(--text-color)" }}>{row.customer}</div>
      <div className="text-xs" style={{ color: "var(--text-color-secondary)" }}>{row.asset}</div>
    </div>
  )

  const logExpansionTemplate = (row: typeof mockDailyLogs[0]) => (
    <div className="p-4 grid grid-cols-2 gap-4" style={{ background: "var(--surface-section)" }}>
      <div className="p-3 rounded-lg border" style={{ borderColor: "var(--surface-border)", background: "var(--surface-card)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#cc1111" }}>Event Details</p>
        <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>{row.eventDetails}</p>
      </div>
      <div className="p-3 rounded-lg border" style={{ borderColor: "var(--surface-border)", background: "var(--surface-card)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#2d7a2d" }}>Actions Taken</p>
        <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>{row.actionsTaken}</p>
      </div>
    </div>
  )

  // ── Toolbar helpers ──
  const filterBar = (
    type: "report" | "log",
    startDate: string, setStart: (v: string) => void,
    endDate: string, setEnd: (v: string) => void,
    customers: {label:string,value:string}[],
    customer: string | null, setCustomer: (v: string | null) => void,
    assets: {label:string,value:string}[],
    asset: string | null, setAsset: (v: string | null) => void,
    resourceTypes: {label:string,value:string}[],
    resourceType: string | null, setResourceType: (v: string | null) => void,
    query: string, setQuery: (v: string) => void,
  ) => (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="p-input-icon-left flex-1 min-w-[180px]">
        <i className="pi pi-search" />
        <InputText
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full"
          size="small"
        />
      </span>
      <input type="date" value={startDate} onChange={e => setStart(e.target.value)}
        className="px-2 py-1.5 rounded border text-sm"
        style={{ background: "var(--surface-card)", borderColor: "var(--surface-border)", color: "var(--text-color)" }}
      />
      <span style={{ color: "var(--text-color-secondary)", fontSize: 12 }}>to</span>
      <input type="date" value={endDate} onChange={e => setEnd(e.target.value)}
        className="px-2 py-1.5 rounded border text-sm"
        style={{ background: "var(--surface-card)", borderColor: "var(--surface-border)", color: "var(--text-color)" }}
      />
      <Dropdown value={customer} options={customers} onChange={e => setCustomer(e.value)} placeholder="Customer" showClear className="text-sm" style={{ minWidth: 140 }} />
      <Dropdown value={asset} options={assets} onChange={e => setAsset(e.value)} placeholder="Asset" showClear className="text-sm" style={{ minWidth: 130 }} />
      <Dropdown value={resourceType} options={resourceTypes} onChange={e => setResourceType(e.value)} placeholder="Type" showClear className="text-sm" style={{ minWidth: 110 }} />
      {type === "report" && (
        <Button label="Upload Report" icon="pi pi-upload" size="small" onClick={() => setUploadModalOpen(true)} />
      )}
    </div>
  )

  return (
    <DashboardLayout pageTitle="Real Time Operations">
      {/* Upload Modal */}
      <Dialog
        header="Upload Report"
        visible={uploadModalOpen}
        onHide={() => setUploadModalOpen(false)}
        style={{ width: "440px" }}
        modal
      >
        <div className="space-y-4 pt-2">
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center transition-all"
            style={{
              borderColor: dragActive ? "#cc1111" : "var(--surface-border)",
              background: dragActive ? "rgba(204,17,17,0.05)" : "var(--surface-section)",
            }}
            onDragEnter={handleDrag} onDragLeave={handleDrag}
            onDragOver={handleDrag} onDrop={handleDrop}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(204,17,17,0.1)" }}>
              <Upload className="h-6 w-6" style={{ color: "#cc1111" }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>Drag and drop PDF file here</p>
            <p className="text-xs mb-3" style={{ color: "var(--text-color-secondary)" }}>or</p>
            <Button label="Browse Files" outlined size="small" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: "var(--text-color)" }}>Customer</label>
            <Dropdown
              value={selectedCustomer} options={uniqueReportCustomers}
              onChange={e => setSelectedCustomer(e.value)}
              placeholder="Select customer" className="w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: "var(--text-color)" }}>Asset</label>
            <Dropdown
              value={selectedAsset} options={uniqueReportAssets}
              onChange={e => setSelectedAsset(e.value)}
              placeholder="Select asset" className="w-full"
            />
          </div>

          {autoResourceType && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--surface-section)" }}>
              <span className="text-sm" style={{ color: "var(--text-color-secondary)" }}>Resource Type:</span>
              <Tag value={autoResourceType} severity={resourceTypeSeverity(autoResourceType)} />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button label="Cancel" outlined onClick={() => setUploadModalOpen(false)} />
            <Button label="Upload" icon="pi pi-upload" />
          </div>
        </div>
      </Dialog>

      <TabView activeIndex={activeTabIndex} onTabChange={e => setActiveTabIndex(e.index)}>
        {/* ── Reports Repository ── */}
        <TabPanel header="Reports Repository">
          {/* Stats row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border"
              style={{ background: "var(--surface-card)", borderColor: "var(--surface-border)" }}>
              <FileText className="h-4 w-4" style={{ color: "#cc1111" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                {filteredReports.length} Available Reports
              </span>
            </div>
            {(reportFilterCustomer || reportFilterAsset || reportFilterResourceType || reportFilterQuery) && (
              <Tag value="Filtered" severity="warning" icon="pi pi-filter" />
            )}
          </div>

          {filterBar(
            "report",
            reportStartDate, setReportStartDate,
            reportEndDate, setReportEndDate,
            uniqueReportCustomers, reportFilterCustomer, setReportFilterCustomer,
            uniqueReportAssets, reportFilterAsset, setReportFilterAsset,
            uniqueReportResourceTypes, reportFilterResourceType, setReportFilterResourceType,
            reportFilterQuery, setReportFilterQuery,
          )}

          <DataTable
            value={filteredReports}
            dataKey="id"
            expandedRows={expandedReportRows}
            onRowToggle={e => setExpandedReportRows(e.data as DataTableExpandedRows)}
            rowExpansionTemplate={reportExpansionTemplate}
            stripedRows
            size="small"
            emptyMessage="No reports match the current filters."
            style={{ background: "var(--surface-card)" }}
          >
            <Column expander style={{ width: "3rem" }} />
            <Column field="report" header="Report" sortable style={{ minWidth: "260px" }} />
            <Column field="uploadedDate" header="Uploaded" sortable style={{ width: "120px" }} />
            <Column header="Type" body={reportResourceTypeBody} style={{ width: "90px" }} />
            <Column field="customer" header="Customer" sortable style={{ minWidth: "160px" }} />
            <Column field="asset" header="Asset" sortable style={{ minWidth: "130px" }} />
            <Column header="Validation" body={reportValidationBody} style={{ width: "100px" }} />
            <Column header="Actions" body={reportActionsBody} style={{ width: "90px" }} />
          </DataTable>
        </TabPanel>

        {/* ── Daily Log ── */}
        <TabPanel header="Daily Log">
          {/* Stats row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border"
              style={{ background: "var(--surface-card)", borderColor: "var(--surface-border)" }}>
              <FileText className="h-4 w-4" style={{ color: "#cc1111" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                {filteredLogs.length} Daily Logs
              </span>
            </div>
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(204,17,17,0.1)", color: "#cc1111" }}>
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">{criticalCount} Critical</span>
              </div>
            )}
            {highCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(217,119,6,0.1)", color: "#d97706" }}>
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">{highCount} High</span>
              </div>
            )}
          </div>

          {filterBar(
            "log",
            logStartDate, setLogStartDate,
            logEndDate, setLogEndDate,
            uniqueLogCustomers, logFilterCustomer, setLogFilterCustomer,
            uniqueLogAssets, logFilterAsset, setLogFilterAsset,
            uniqueLogResourceTypes, logFilterResourceType, setLogFilterResourceType,
            logFilterQuery, setLogFilterQuery,
          )}

          <DataTable
            value={filteredLogs}
            dataKey="id"
            expandedRows={expandedLogRows}
            onRowToggle={e => setExpandedLogRows(e.data as DataTableExpandedRows)}
            rowExpansionTemplate={logExpansionTemplate}
            stripedRows
            size="small"
            emptyMessage="No log entries match the current filters."
          >
            <Column expander style={{ width: "3rem" }} />
            <Column field="shiftOperator" header="Operator" sortable style={{ width: "130px" }} />
            <Column header="Customer / Asset" body={logCustomerBody} style={{ minWidth: "160px" }} />
            <Column field="eventDescriptor" header="Event" sortable style={{ minWidth: "220px" }} />
            <Column field="eventBegin" header="Begin" sortable style={{ width: "140px", fontFamily: "monospace", fontSize: "0.75rem" }} />
            <Column field="eventRestore" header="Restore" sortable style={{ width: "140px", fontFamily: "monospace", fontSize: "0.75rem" }} />
            <Column header="Duration" body={logDurationBody} style={{ width: "90px" }} />
            <Column header="Severity" body={logSeverityBody} sortable sortField="severity" style={{ width: "100px" }} />
          </DataTable>
        </TabPanel>
      </TabView>
    </DashboardLayout>
  )
}
