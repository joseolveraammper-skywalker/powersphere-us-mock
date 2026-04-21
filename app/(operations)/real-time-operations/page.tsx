"use client"

import { useState, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Dialog } from "primereact/dialog"
import { DailyLog, type DailyLogHandle } from "./DailyLog"

// ============ TYPES ============
type ReportStatus = "pending" | "approved" | "rejected"
type Report = {
  id: number; report: string; uploadedDate: string; resourceType: string
  customer: string; asset: string; validation1: boolean; validation2: boolean
  status: ReportStatus; rejectNote?: string
}

// ============ MOCK DATA ============
const INITIAL_REPORTS: Report[] = [
  { id: 1,  report: "Daily Generation Summary - March 2026",     uploadedDate: "03-10-2026", resourceType: "NCLR", customer: "Texas Energy Co.",             asset: "Wind Farm Alpha",     validation1: true,  validation2: true,  status: "approved" },
  { id: 2,  report: "Load Forecast Analysis Q1",                 uploadedDate: "03-09-2026", resourceType: "ESR",  customer: "Midwest Industrial",            asset: "Plant B-12",          validation1: true,  validation2: true,  status: "approved" },
  { id: 3,  report: "Demand Response Event Report",              uploadedDate: "03-08-2026", resourceType: "GEN",  customer: "Commercial Partners LLC",        asset: "Portfolio C",         validation1: true,  validation2: false, status: "pending"  },
  { id: 4,  report: "ERCOT Settlement Data Feb 2026",            uploadedDate: "03-07-2026", resourceType: "NCLR", customer: "Texas Energy Co.",             asset: "Solar Array Delta",   validation1: true,  validation2: true,  status: "approved" },
  { id: 5,  report: "Outage Impact Assessment",                  uploadedDate: "03-06-2026", resourceType: "ESR",  customer: "Gulf Coast Power",              asset: "Gas Turbine Unit 3",  validation1: false, validation2: false, status: "pending"  },
  { id: 6,  report: "Monthly Performance Review",                uploadedDate: "03-05-2026", resourceType: "GEN",  customer: "White Realty Management, Inc.", asset: "Portfolio A",         validation1: true,  validation2: true,  status: "approved" },
  { id: 7,  report: "Compliance Audit Report",                   uploadedDate: "03-04-2026", resourceType: "NCLR", customer: "Molinas Enterprises Inc",       asset: "Facility East",       validation1: true,  validation2: true,  status: "pending"  },
  { id: 8,  report: "Equipment Maintenance Log",                 uploadedDate: "03-03-2026", resourceType: "ESR",  customer: "Next Level Blending LLC",       asset: "Plant C-7",           validation1: true,  validation2: false, status: "rejected", rejectNote: "Missing asset ID on page 3." },
  { id: 9,  report: "Energy Trading Summary",                    uploadedDate: "03-02-2026", resourceType: "GEN",  customer: "Wild Duck Bar & Grill LLC",     asset: "Commercial Unit",     validation1: true,  validation2: true,  status: "approved" },
  { id: 10, report: "Ancillary Services Report - Feb 2026",      uploadedDate: "03-01-2026", resourceType: "NCLR", customer: "Lone Star Energy Partners",     asset: "Substation Alpha-4",  validation1: true,  validation2: true,  status: "approved" },
  { id: 11, report: "Reactive Power Compensation Log",           uploadedDate: "02-28-2026", resourceType: "ESR",  customer: "Rio Grande Grid LLC",           asset: "Capacitor Bank 7",    validation1: true,  validation2: false, status: "pending"  },
  { id: 12, report: "Voltage Regulation Monthly Summary",        uploadedDate: "02-27-2026", resourceType: "GEN",  customer: "Texas Energy Co.",             asset: "Wind Farm Alpha",     validation1: true,  validation2: true,  status: "approved" },
  { id: 13, report: "Transmission Constraint Analysis",          uploadedDate: "02-26-2026", resourceType: "NCLR", customer: "Coastal Wind & Solar LLC",      asset: "Offshore Platform 2", validation1: false, validation2: false, status: "rejected", rejectNote: "Constraint assumptions do not match ERCOT published data." },
  { id: 14, report: "Renewable Integration Assessment Q4",       uploadedDate: "02-25-2026", resourceType: "ESR",  customer: "Midwest Industrial",            asset: "Plant B-12",          validation1: true,  validation2: true,  status: "pending"  },
  { id: 15, report: "Frequency Response Event Log",              uploadedDate: "02-24-2026", resourceType: "GEN",  customer: "Gulf Coast Power",              asset: "Gas Turbine Unit 3",  validation1: true,  validation2: true,  status: "approved" },
  { id: 16, report: "Spinning Reserve Activation Report",        uploadedDate: "02-23-2026", resourceType: "NCLR", customer: "Commercial Partners LLC",        asset: "Portfolio C",         validation1: true,  validation2: false, status: "pending"  },
  { id: 17, report: "Power Quality Incident Summary",            uploadedDate: "02-22-2026", resourceType: "ESR",  customer: "Next Level Blending LLC",       asset: "Plant C-7",           validation1: true,  validation2: true,  status: "approved" },
  { id: 18, report: "ERCOT COP Submission Audit",                uploadedDate: "02-21-2026", resourceType: "GEN",  customer: "Molinas Enterprises Inc",       asset: "Facility East",       validation1: true,  validation2: true,  status: "pending"  },
  { id: 19, report: "Load Shed Event Documentation",             uploadedDate: "02-20-2026", resourceType: "NCLR", customer: "White Realty Management, Inc.", asset: "Portfolio A",         validation1: false, validation2: false, status: "pending"  },
  { id: 20, report: "Annual Reliability Performance Report",     uploadedDate: "02-19-2026", resourceType: "ESR",  customer: "Wild Duck Bar & Grill LLC",     asset: "Commercial Unit",     validation1: true,  validation2: true,  status: "approved" },
]

const assetResourceTypeMap: Record<string, string> = {
  "Wind Farm Alpha": "NCLR", "Plant B-12": "ESR", "Portfolio C": "GEN",
  "Solar Array Delta": "NCLR", "Gas Turbine Unit 3": "ESR", "Portfolio A": "GEN",
  "Facility East": "NCLR", "Plant C-7": "ESR", "Commercial Unit": "GEN",
  "Building Complex A": "GEN", "Substation Alpha-4": "NCLR", "Capacitor Bank 7": "ESR",
  "Offshore Platform 2": "NCLR", "Coastal Platform": "GEN",
}

function parseReportDate(dateStr: string): Date {
  const [month, day, year] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

// ============ STYLE CONSTANTS ============
const BORDER    = "1px solid var(--surface-border)"
const CTRL_H    = "30px"
const PANEL_H   = 620

const nativeInput: React.CSSProperties = {
  height: CTRL_H, padding: "0 0.5rem", fontSize: 12, border: BORDER, borderRadius: 6,
  background: "var(--surface-card)", color: "var(--text-color)", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
}
const nativeSelect: React.CSSProperties = { ...nativeInput, cursor: "pointer" }
const btnPrimary: React.CSSProperties = {
  background: "#cc1111", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
  padding: "0.35rem 0.875rem", color: "#fff", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const btnSecondary: React.CSSProperties = {
  background: "none", border: BORDER, borderRadius: 6, fontSize: 12, fontWeight: 500,
  padding: "0.35rem 0.875rem", color: "var(--text-color)", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const thStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
  color: "var(--text-color-secondary)", background: "var(--surface-card)",
  borderBottom: BORDER, padding: "0.5rem 0.75rem",
}
const tdStyle: React.CSSProperties = {
  fontSize: 12, color: "var(--text-color)", padding: "0.5rem 0.75rem",
  borderBottom: BORDER, borderTop: "none", borderLeft: "none", borderRight: "none",
}

// ============ SUB-COMPONENTS ============
function TypePill({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    NCLR: { bg: "rgba(26,92,168,0.10)",  color: "#1a5ca8" },
    ESR:  { bg: "rgba(217,119,6,0.10)",   color: "#b45309" },
    GEN:  { bg: "rgba(45,122,45,0.10)",   color: "#2d7a2d" },
  }
  const s = map[type] ?? { bg: "rgba(100,100,100,0.1)", color: "#555" }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {type}
    </span>
  )
}

function StatusPill({ status }: { status: ReportStatus }) {
  const map: Record<ReportStatus, { color: string; label: string }> = {
    approved: { color: "#16a34a", label: "Approved" },
    rejected: { color: "#dc2626", label: "Rejected" },
    pending:  { color: "#9ca3af", label: "Pending"  },
  }
  const s = map[status]
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</span>
    </span>
  )
}

// ============ PDF MOCK PAGES ============
function PdfMockPages({ report }: { report: Report }) {
  const pageStyle: React.CSSProperties = {
    width: "100%", background: "#fff", borderRadius: 4,
    boxShadow: "0 4px 24px rgba(0,0,0,0.35)", padding: "36px 44px",
    display: "flex", flexDirection: "column", gap: 18, color: "#1a1a1a",
    boxSizing: "border-box",
  }
  const pageFooter = (n: number) => (
    <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 10, display: "flex", justifyContent: "space-between", marginTop: "auto" }}>
      <span style={{ fontSize: 9, color: "#9ca3af" }}>Ammper Power — PowerSphere Report</span>
      <span style={{ fontSize: 9, color: "#9ca3af" }}>Page {n} of 3</span>
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Page 1 */}
      <div style={pageStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #cc1111", paddingBottom: 14 }}>
          <div>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "#888", marginBottom: 2 }}>Ammper Power</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#2d7a2d" }}>Power Sphere</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8, maxWidth: 240 }}>{report.report}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: 2 }}>Report Date</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{report.uploadedDate}</div>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginTop: 8, marginBottom: 2 }}>Resource Type</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{report.resourceType}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {[report.customer, report.asset].map(v => (
            <span key={v} style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: "#f3f4f6", color: "#374151" }}>{v}</span>
          ))}
        </div>
        <p style={{ fontSize: 12, lineHeight: 1.7, color: "#374151", margin: 0 }}>
          This report provides a comprehensive analysis of operational performance for <strong>{report.asset}</strong> during the reporting period. Key metrics indicate stable generation output with minor variance from forecasted levels. All operational parameters remained within established thresholds throughout the period under review.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[["Reporting Period", report.uploadedDate], ["Customer", report.customer], ["Asset", report.asset], ["Resource Type", report.resourceType]].map(([label, val]) => (
            <div key={label} style={{ padding: "8px 12px", borderRadius: 6, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{val}</div>
            </div>
          ))}
        </div>
        {pageFooter(1)}
      </div>

      {/* Page 2 */}
      <div style={pageStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid #e5e7eb", paddingBottom: 10 }}>Compliance & Standards</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[["ERCOT Protocols", "Compliant", "#2d7a2d"], ["NERC Standards", "Compliant", "#2d7a2d"], ["Internal SLA", "Met", "#1a5ca8"]].map(([label, val, color]) => (
            <div key={label} style={{ padding: "10px 12px", borderRadius: 8, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid #e5e7eb", paddingBottom: 10, marginTop: 4 }}>Operational Metrics</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Metric", "Target", "Actual", "Variance", "Status"].map(h => (
                <th key={h} style={{ padding: "7px 10px", textAlign: "left", border: "1px solid #e5e7eb", fontWeight: 600, color: "#374151" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Generation Output", "850 MW", "867 MW", "+2.0%", "✓"],
              ["Availability Factor", "95.0%", "96.4%", "+1.4%", "✓"],
              ["Heat Rate",           "9,800 BTU/kWh", "9,742 BTU/kWh", "-0.6%", "✓"],
              ["Ramp Rate",           "30 MW/min",     "28.5 MW/min",   "-5.0%", "⚠"],
            ].map(([m, t, a, v, s]) => (
              <tr key={m}>
                <td style={{ padding: "6px 10px", border: "1px solid #e5e7eb", fontWeight: 500 }}>{m}</td>
                <td style={{ padding: "6px 10px", border: "1px solid #e5e7eb", color: "#6b7280" }}>{t}</td>
                <td style={{ padding: "6px 10px", border: "1px solid #e5e7eb" }}>{a}</td>
                <td style={{ padding: "6px 10px", border: "1px solid #e5e7eb", color: v.startsWith("+") ? "#16a34a" : "#b45309" }}>{v}</td>
                <td style={{ padding: "6px 10px", border: "1px solid #e5e7eb", color: s === "✓" ? "#16a34a" : "#b45309" }}>{s}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pageFooter(2)}
      </div>

      {/* Page 3 */}
      <div style={pageStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid #e5e7eb", paddingBottom: 10 }}>Performance Charts</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Generation Output (MW)", bars: [65, 78, 82, 71, 88, 92, 85, 79, 83, 90, 87, 81], color: "#cc1111" },
            { label: "Response Time (sec)",    bars: [45, 52, 38, 41, 55, 48, 42, 50, 44, 39, 47, 43], color: "#1a5ca8" },
            { label: "Availability (%)",       bars: [95, 97, 96, 98, 94, 99, 97, 96, 98, 97, 95, 98], color: "#2d7a2d" },
            { label: "Heat Rate (BTU/kWh)",    bars: [72, 68, 75, 70, 65, 73, 69, 74, 71, 67, 76, 70], color: "#b45309" },
          ].map(({ label, bars, color }) => (
            <div key={label} style={{ padding: "10px 12px", borderRadius: 8, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", marginBottom: 8 }}>{label}</div>
              <div style={{ height: 44, display: "flex", alignItems: "flex-end", gap: 2 }}>
                {bars.map((v, i) => (
                  <div key={i} style={{ flex: 1, borderRadius: "2px 2px 0 0", height: `${v}%`, background: color, opacity: 0.75 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 8, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", marginBottom: 6 }}>Summary & Recommendations</div>
          <p style={{ fontSize: 11, lineHeight: 1.7, color: "#374151", margin: 0 }}>
            Overall operational performance for the reporting period met or exceeded targets. The minor ramp rate variance is under investigation and a corrective action plan will be submitted within 5 business days. All ERCOT and NERC compliance obligations were satisfied.
          </p>
        </div>
        <div style={{ borderTop: "2px solid #1a1a1a", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 9, color: "#888", marginBottom: 2 }}>Prepared by</div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>Operations Team — Ammper Power</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#888", marginBottom: 2 }}>Approved by</div>
            <div style={{ fontSize: 11, fontStyle: "italic", color: "#6b7280" }}>Pending review</div>
          </div>
        </div>
        {pageFooter(3)}
      </div>

    </div>
  )
}

// ============ MAIN PAGE ============
export default function RealTimeOperationsPage() {
  const [activeTab, setActiveTab] = useState(0)

  // Reports mutable state
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [previewReport, setPreviewReport] = useState<Report | null>(null)
  const [pdfPage, setPdfPage] = useState(1)

  // Filters
  const [reportFilterQuery, setReportFilterQuery]                 = useState("")
  const [reportStartDate, setReportStartDate]                     = useState("2026-02-01")
  const [reportEndDate, setReportEndDate]                         = useState("2026-03-31")
  const [reportFilterCustomer, setReportFilterCustomer]           = useState<string | null>(null)
  const [reportFilterAsset, setReportFilterAsset]                 = useState<string | null>(null)
  const [reportFilterResourceType, setReportFilterResourceType]   = useState<string | null>(null)

  // Upload modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedAsset, setSelectedAsset]       = useState("")
  const [dragActive, setDragActive]             = useState(false)

  // Reject modal
  const [rejectModal, setRejectModal]         = useState(false)
  const [rejectNote, setRejectNote]           = useState("")
  const [rejectTargetId, setRejectTargetId]   = useState<number | null>(null)

  const dailyLogRef = useRef<DailyLogHandle>(null)

  const autoResourceType = selectedAsset ? assetResourceTypeMap[selectedAsset] || "" : ""
  const uniqueCustomers      = [...new Set(INITIAL_REPORTS.map(r => r.customer))]
  const uniqueAssets         = [...new Set(INITIAL_REPORTS.map(r => r.asset))]
  const uniqueResourceTypes  = [...new Set(INITIAL_REPORTS.map(r => r.resourceType))]

  const filteredReports = useMemo(() => reports.filter(r => {
    const d = parseReportDate(r.uploadedDate)
    if (d < new Date(reportStartDate) || d > new Date(reportEndDate)) return false
    if (reportFilterCustomer && r.customer !== reportFilterCustomer) return false
    if (reportFilterAsset && r.asset !== reportFilterAsset) return false
    if (reportFilterResourceType && r.resourceType !== reportFilterResourceType) return false
    if (reportFilterQuery) {
      const q = reportFilterQuery.toLowerCase()
      if (![r.report, r.customer, r.asset, r.resourceType].some(s => s.toLowerCase().includes(q))) return false
    }
    return true
  }), [reports, reportStartDate, reportEndDate, reportFilterCustomer, reportFilterAsset, reportFilterResourceType, reportFilterQuery])

  // ── Selection helpers ──
  const allFilteredSelected = filteredReports.length > 0 && filteredReports.every(r => selectedIds.has(r.id))
  const someFilteredSelected = filteredReports.some(r => selectedIds.has(r.id))
  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => { const n = new Set(prev); filteredReports.forEach(r => n.delete(r.id)); return n })
    } else {
      setSelectedIds(prev => { const n = new Set(prev); filteredReports.forEach(r => n.add(r.id)); return n })
    }
  }
  const toggleOne = (id: number) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  // ── Actions ──
  const handleApprove = () => {
    setReports(prev => prev.map(r => selectedIds.has(r.id) ? { ...r, status: "approved" as const } : r))
    setSelectedIds(new Set())
  }
  const openReject = () => {
    const [id] = selectedIds
    setRejectTargetId(id)
    setRejectNote("")
    setRejectModal(true)
  }
  const confirmReject = () => {
    if (!rejectNote.trim() || rejectTargetId == null) return
    setReports(prev => prev.map(r => r.id === rejectTargetId ? { ...r, status: "rejected" as const, rejectNote: rejectNote.trim() } : r))
    setSelectedIds(new Set())
    setRejectModal(false)
    setRejectTargetId(null)
    setRejectNote("")
  }

  const handleAction = (action: string) => {
    if (action === "approve") handleApprove()
    if (action === "reject")  openReject()
  }

  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type !== "dragleave" && e.type !== "drop") }
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false) }

  // ── Column bodies ──
  const checkboxHeader = (
    <input
      type="checkbox"
      checked={allFilteredSelected}
      ref={el => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected }}
      onChange={toggleAll}
      style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#cc1111" }}
    />
  )
  const checkboxBody = (row: Report) => (
    <input
      type="checkbox"
      checked={selectedIds.has(row.id)}
      onChange={() => toggleOne(row.id)}
      style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#cc1111" }}
    />
  )
  const typeBody       = (row: Report) => <TypePill type={row.resourceType} />
  const statusBody     = (row: Report) => <StatusPill status={row.status} />
  const validationBody = (row: Report) => (
    <div style={{ display: "flex", gap: 8 }}>
      {[row.validation1, row.validation2].map((v, i) => (
        <span key={i} title={`Validation ${i + 1}`}>
          {v ? <i className="pi pi-check" style={{ fontSize: 12, color: "#2d7a2d" }} />
             : <span style={{ color: "var(--text-color-secondary)", fontSize: 12 }}>—</span>}
        </span>
      ))}
    </div>
  )
  const actionsBody = (row: Report) => (
    <div style={{ display: "flex", gap: 2 }}>
      <button
        onClick={() => { setPreviewReport(prev => prev?.id === row.id ? null : row); setPdfPage(1) }}
        title="Preview"
        style={{
          width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: previewReport?.id === row.id ? "rgba(204,17,17,0.08)" : "none",
          border: previewReport?.id === row.id ? "1px solid #cc1111" : "1px solid transparent",
          borderRadius: 6, cursor: "pointer",
          color: previewReport?.id === row.id ? "#cc1111" : "var(--text-color-secondary)",
        }}
      >
        <i className="pi pi-eye" style={{ fontSize: 11 }} />
      </button>
      <button title="Download" style={{ width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid transparent", borderRadius: 6, cursor: "pointer", color: "var(--text-color-secondary)" }}>
        <i className="pi pi-download" style={{ fontSize: 11 }} />
      </button>
    </div>
  )

  const kpiApproved = reports.filter(r => r.status === "approved").length
  const kpiRejected = reports.filter(r => r.status === "rejected").length
  const kpiPending  = reports.filter(r => r.status === "pending").length

  return (
    <DashboardLayout pageTitle="Real Time Operations">

      {/* ── Reject Modal ── */}
      {rejectModal && (() => {
        const target = reports.find(r => r.id === rejectTargetId)
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseDown={e => { if (e.target === e.currentTarget) { setRejectModal(false); setRejectNote("") } }}>
            <div style={{ background: "var(--surface-card)", borderRadius: 12, width: 480, maxWidth: "92vw", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.22)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px 12px", borderBottom: BORDER }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(220,38,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="pi pi-times-circle" style={{ fontSize: 15, color: "#dc2626" }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Reject Report</span>
                </div>
                <button onClick={() => { setRejectModal(false); setRejectNote("") }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-color-secondary)", display: "flex" }}>
                  <i className="pi pi-times" style={{ fontSize: 13 }} />
                </button>
              </div>
              <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                {target && (
                  <div style={{ background: "var(--surface-section)", border: BORDER, borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-color-secondary)", marginBottom: 4 }}>Report</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-color)" }}>{target.report}</div>
                    <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginTop: 4 }}>{target.customer} — {target.asset}</div>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Rejection reason <span style={{ color: "#dc2626" }}>*</span></label>
                    <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>{rejectNote.length}/300</span>
                  </div>
                  <textarea
                    value={rejectNote}
                    onChange={e => setRejectNote(e.target.value.slice(0, 300))}
                    rows={4} autoFocus
                    placeholder="Describe why this report is being rejected..."
                    style={{ padding: "10px 12px", fontSize: 12, border: BORDER, borderRadius: 8, background: "var(--surface-card)", color: "var(--text-color)", outline: "none", fontFamily: "inherit", resize: "none", boxSizing: "border-box", width: "100%", lineHeight: 1.5 }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#dc2626" }}
                    onBlur={e =>  { e.currentTarget.style.borderColor = "var(--surface-border)" }}
                  />
                  <p style={{ fontSize: 11, color: "var(--text-color-secondary)", margin: 0 }}>This message will be visible in the Status column tooltip.</p>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 22px", borderTop: BORDER }}>
                <button onClick={() => { setRejectModal(false); setRejectNote("") }} style={{ ...btnSecondary, height: 34, padding: "0 18px" }}>Cancel</button>
                <button
                  onClick={confirmReject}
                  disabled={!rejectNote.trim()}
                  style={{ height: 34, padding: "0 18px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: rejectNote.trim() ? "pointer" : "not-allowed", background: rejectNote.trim() ? "#dc2626" : "var(--surface-section)", color: rejectNote.trim() ? "#fff" : "var(--text-color-secondary)", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <i className="pi pi-times-circle" style={{ fontSize: 12 }} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Upload Modal ── */}
      {(() => {
        const mLabel: React.CSSProperties = { display: "block", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)", marginBottom: 4 }
        const mInput: React.CSSProperties = { width: "100%", padding: "0.375rem 0.5rem", fontSize: 12, border: BORDER, borderRadius: 6, background: "var(--surface-card)", color: "var(--text-color)", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }
        return (
          <Dialog
            header={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(204,17,17,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="pi pi-upload" style={{ fontSize: 11, color: "#cc1111" }} /></div><span style={{ fontSize: 13, fontWeight: 700 }}>Upload Report</span></div>}
            visible={uploadModalOpen} onHide={() => setUploadModalOpen(false)} style={{ width: 400 }} modal
            pt={{ header: { style: { borderBottom: BORDER, padding: "0.75rem 1rem" } }, content: { style: { padding: "1rem" } } }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div style={{ border: `2px dashed ${dragActive ? "#cc1111" : "var(--surface-border)"}`, borderRadius: 10, background: dragActive ? "rgba(204,17,17,0.04)" : "var(--surface-section)", padding: "1.5rem 1rem", textAlign: "center", transition: "border-color 0.15s, background 0.15s" }} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(204,17,17,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.625rem" }}><i className="pi pi-upload" style={{ fontSize: 14, color: "#cc1111" }} /></div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-color)", margin: 0 }}>Drop a PDF file here</p>
                <p style={{ fontSize: 11, color: "var(--text-color-secondary)", margin: "0.25rem 0 0.75rem" }}>or</p>
                <button style={{ ...btnSecondary, fontSize: 11, margin: "0 auto" }}>Browse Files</button>
              </div>
              <div><label style={mLabel}>Customer</label><select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} style={mInput}><option value="">Select customer</option>{uniqueCustomers.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
              <div><label style={mLabel}>Asset</label><select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)} style={mInput}><option value="">Select asset</option>{uniqueAssets.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
              <div>
                <label style={mLabel}>Resource Type</label>
                <div style={{ ...mInput, display: "flex", alignItems: "center", gap: 8, background: "var(--surface-section)", color: autoResourceType ? "var(--text-color)" : "var(--text-color-secondary)", cursor: "default", userSelect: "none" }}>
                  {autoResourceType ? <TypePill type={autoResourceType} /> : <span style={{ fontSize: 12, fontStyle: "italic" }}>Auto-detected from asset</span>}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4, borderTop: BORDER }}>
                <button style={btnSecondary} onClick={() => setUploadModalOpen(false)}>Cancel</button>
                <button style={btnPrimary}><i className="pi pi-upload" style={{ fontSize: 11 }} />Upload</button>
              </div>
            </div>
          </Dialog>
        )
      })()}

      {/* ── Tab Bar ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: BORDER, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          {[{ label: "Reports Repository", icon: "pi pi-file" }, { label: "Daily Log", icon: "pi pi-list" }].map((tab, i) => {
            const active = activeTab === i
            return (
              <button key={tab.label} onClick={() => setActiveTab(i)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.65rem 1.1rem", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#cc1111" : "var(--text-color-secondary)", borderBottom: active ? "2px solid #cc1111" : "2px solid transparent", marginBottom: -1, outline: "none", whiteSpace: "nowrap" }}>
                <i className={tab.icon} style={{ fontSize: 12 }} />{tab.label}
              </button>
            )
          })}
        </div>
        <div style={{ paddingBottom: 8 }}>
          {activeTab === 1 && (
            <button onClick={() => dailyLogRef.current?.triggerShiftLogout()} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: BORDER, borderRadius: 6, fontSize: 12, fontWeight: 500, padding: "0.3rem 0.75rem", color: "var(--text-color-secondary)", cursor: "pointer" }}>
              <i className="pi pi-sign-out" style={{ fontSize: 11 }} />Shift Log Out
            </button>
          )}
        </div>
      </div>

      {/* ── Reports Repository ── */}
      {activeTab === 0 && (
        <div>
          {/* KPI bar */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "0.5rem 0.875rem", borderRadius: 10, background: "var(--surface-card)", border: BORDER, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(204,17,17,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="pi pi-file" style={{ fontSize: 12, color: "#cc1111" }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)", lineHeight: 1 }}>Reports</div>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{filteredReports.length}</div>
              </div>
            </div>
            <div style={{ width: 1, height: 24, background: "var(--surface-border)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <i className="pi pi-check-circle" style={{ fontSize: 11, color: "#16a34a" }} />
              <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Approved</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{kpiApproved}</span>
            </div>
            <div style={{ width: 1, height: 24, background: "var(--surface-border)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <i className="pi pi-clock" style={{ fontSize: 11, color: "#b45309" }} />
              <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Pending</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#b45309" }}>{kpiPending}</span>
            </div>
            <div style={{ width: 1, height: 24, background: "var(--surface-border)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <i className="pi pi-times-circle" style={{ fontSize: 11, color: "#dc2626" }} />
              <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Rejected</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#dc2626" }}>{kpiRejected}</span>
            </div>
          </div>

          {/* Filter + Action bar */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
              <i className="pi pi-search" style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-color-secondary)", pointerEvents: "none", zIndex: 1 }} />
              <input value={reportFilterQuery} onChange={e => setReportFilterQuery(e.target.value)} placeholder="Search..." style={{ ...nativeInput, width: "100%", paddingLeft: "1.85rem" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px", borderRadius: 6, background: "var(--surface-card)", border: BORDER, height: CTRL_H, boxSizing: "border-box" }}>
              <i className="pi pi-calendar" style={{ fontSize: 11, color: "var(--text-color-secondary)" }} />
              <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} style={{ background: "transparent", border: "none", outline: "none", fontSize: 12, color: "var(--text-color)", cursor: "pointer" }} />
              <span style={{ color: "var(--text-color-secondary)", fontSize: 11, padding: "0 2px" }}>—</span>
              <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} style={{ background: "transparent", border: "none", outline: "none", fontSize: 12, color: "var(--text-color)", cursor: "pointer" }} />
            </div>
            <select value={reportFilterCustomer ?? ""} onChange={e => setReportFilterCustomer(e.target.value || null)} style={{ ...nativeSelect, minWidth: 130 }}>
              <option value="">Customer</option>{uniqueCustomers.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={reportFilterAsset ?? ""} onChange={e => setReportFilterAsset(e.target.value || null)} style={{ ...nativeSelect, minWidth: 120 }}>
              <option value="">Asset</option>{uniqueAssets.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={reportFilterResourceType ?? ""} onChange={e => setReportFilterResourceType(e.target.value || null)} style={{ ...nativeSelect, minWidth: 90 }}>
              <option value="">Type</option>{uniqueResourceTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>

            {/* Select Action */}
            <select
              value=""
              disabled={selectedIds.size === 0}
              onChange={e => { handleAction(e.target.value); e.target.value = "" }}
              style={{ ...nativeSelect, minWidth: 130, opacity: selectedIds.size === 0 ? 0.45 : 1 }}
            >
              <option value="" disabled>Select action…</option>
              <option value="approve">Approve</option>
              <option value="reject" disabled={selectedIds.size !== 1}>Reject</option>
              <option value="download">Download</option>
            </select>

            {selectedIds.size > 0 && (
              <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>{selectedIds.size} selected</span>
            )}

            <button onClick={() => setUploadModalOpen(true)} style={btnPrimary}>
              <i className="pi pi-upload" style={{ fontSize: 11 }} />Upload
            </button>
          </div>

          {/* Split layout */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

            {/* Table panel */}
            <div style={{ flex: "0 0 calc(50% - 8px)", height: PANEL_H, overflow: "hidden", border: BORDER, borderRadius: 12, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, overflowY: "auto" }}>
                <DataTable
                  value={filteredReports}
                  dataKey="id"
                  size="small"
                  paginator
                  rows={8}
                  emptyMessage="No reports match the current filters."
                  style={{ background: "var(--surface-card)" }}
                  pt={{
                    thead: { style: { background: "var(--surface-card)", position: "sticky", top: 0, zIndex: 1 } },
                    tbody: { style: { background: "var(--surface-card)" } },
                    column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } },
                    paginator: { root: { style: { borderTop: BORDER, fontSize: 12, padding: "6px 12px", background: "var(--surface-card)" } } },
                  }}
                >
                  <Column header={checkboxHeader} body={checkboxBody} style={{ width: 44 }} />
                  <Column field="report"       header="Report"     sortable style={{ minWidth: 160 }} />
                  <Column field="uploadedDate" header="Uploaded"   sortable style={{ width: 100 }} />
                  <Column header="Type"        body={typeBody}               style={{ width: 70 }} />
                  <Column header="Validation"  body={validationBody}         style={{ width: 80 }} />
                  <Column header="Status"      body={statusBody}             style={{ width: 90 }} />
                  <Column header=""            body={actionsBody}            style={{ width: 64 }} />
                </DataTable>
              </div>
            </div>

            {/* PDF viewer panel */}
            <div style={{ flex: "0 0 calc(50% - 8px)", height: PANEL_H, border: BORDER, borderRadius: 12, overflow: "hidden", background: "var(--surface-card)", display: "flex", flexDirection: "column" }}>
              {previewReport ? (
                <>
                  {/* Toolbar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: BORDER, flexShrink: 0 }}>
                    <i className="pi pi-file-pdf" style={{ fontSize: 13, color: "#cc1111" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {previewReport.report}.pdf
                    </span>
                    <button onClick={() => setPdfPage(p => Math.max(1, p - 1))} disabled={pdfPage === 1} style={{ background: "none", border: "none", cursor: pdfPage === 1 ? "default" : "pointer", padding: 4, color: pdfPage === 1 ? "var(--text-color-secondary)" : "var(--text-color)", opacity: pdfPage === 1 ? 0.4 : 1, display: "inline-flex" }}>
                      <i className="pi pi-chevron-left" style={{ fontSize: 11 }} />
                    </button>
                    <span style={{ fontSize: 11, color: "var(--text-color-secondary)", minWidth: 36, textAlign: "center" }}>{pdfPage} / 3</span>
                    <button onClick={() => setPdfPage(p => Math.min(3, p + 1))} disabled={pdfPage === 3} style={{ background: "none", border: "none", cursor: pdfPage === 3 ? "default" : "pointer", padding: 4, color: pdfPage === 3 ? "var(--text-color-secondary)" : "var(--text-color)", opacity: pdfPage === 3 ? 0.4 : 1, display: "inline-flex" }}>
                      <i className="pi pi-chevron-right" style={{ fontSize: 11 }} />
                    </button>
                    <button title="Download" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-color-secondary)", display: "inline-flex" }}>
                      <i className="pi pi-download" style={{ fontSize: 12 }} />
                    </button>
                    <button onClick={() => setPreviewReport(null)} title="Close" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-color-secondary)", display: "inline-flex" }}>
                      <i className="pi pi-times" style={{ fontSize: 12 }} />
                    </button>
                  </div>
                  {/* Document scroll area */}
                  <div style={{ flex: 1, overflowY: "auto", background: "#3a3a3a", padding: 20 }}>
                    <PdfMockPages report={previewReport} />
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-color-secondary)" }}>
                  <i className="pi pi-file-pdf" style={{ fontSize: 32, opacity: 0.25 }} />
                  <span style={{ fontSize: 12 }}>Click the eye icon on a report to preview</span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Daily Log ── */}
      {activeTab === 1 && <DailyLog ref={dailyLogRef} />}
    </DashboardLayout>
  )
}
