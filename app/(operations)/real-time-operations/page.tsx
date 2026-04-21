"use client"

import { useState, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Dialog } from "primereact/dialog"
import { DailyLog, type DailyLogHandle } from "./DailyLog"

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

type Report = typeof mockReports[0]

// ============ UPLOAD ASSET → RESOURCE TYPE MAP ============
const assetResourceTypeMap: Record<string, string> = {
  "Wind Farm Alpha": "NCLR", "Plant B-12": "ESR", "Portfolio C": "GEN",
  "Solar Array Delta": "NCLR", "Gas Turbine Unit 3": "ESR", "Portfolio A": "GEN",
  "Facility East": "NCLR", "Plant C-7": "ESR", "Commercial Unit": "GEN", "Building Complex A": "GEN",
}

// ============ HELPERS ============
function parseReportDate(dateStr: string): Date {
  const [month, day, year] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

const BORDER = "1px solid var(--surface-border)"
const CTRL_H = "30px"

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

function TypePill({ type }: { type: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    NCLR: { bg: "rgba(26,92,168,0.10)",  color: "#1a5ca8" },
    ESR:  { bg: "rgba(217,119,6,0.10)",   color: "#b45309" },
    GEN:  { bg: "rgba(45,122,45,0.10)",   color: "#2d7a2d" },
  }
  const s = styles[type] ?? { bg: "rgba(100,100,100,0.1)", color: "#555" }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "1px 8px",
      borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      {type}
    </span>
  )
}

// ============ MAIN PAGE ============
export default function RealTimeOperationsPage() {
  const [activeTab, setActiveTab] = useState(0)

  // Reports state
  const [previewReport, setPreviewReport] = useState<Report | null>(null)
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

  const dailyLogRef = useRef<DailyLogHandle>(null)

  const autoResourceType = selectedAsset ? assetResourceTypeMap[selectedAsset] || "" : ""

  const uniqueReportCustomers = [...new Set(mockReports.map((r) => r.customer))]
  const uniqueReportAssets    = [...new Set(mockReports.map((r) => r.asset))]
  const uniqueReportResourceTypes = [...new Set(mockReports.map((r) => r.resourceType))]

  const filteredReports = useMemo(() => {
    return mockReports.filter((report) => {
      const reportDate = parseReportDate(report.uploadedDate)
      const start = new Date(reportStartDate)
      const end   = new Date(reportEndDate)
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(false)
  }

  // ── Column body templates ──
  const reportResourceTypeBody = (row: Report) => <TypePill type={row.resourceType} />

  const reportValidationBody = (row: Report) => (
    <div style={{ display: "flex", gap: 8 }}>
      <span title="Validation 1">
        {row.validation1
          ? <i className="pi pi-check" style={{ fontSize: 13, color: "#2d7a2d" }} />
          : <span style={{ color: "var(--text-color-secondary)", fontSize: 13 }}>—</span>}
      </span>
      <span title="Validation 2">
        {row.validation2
          ? <i className="pi pi-check" style={{ fontSize: 13, color: "#2d7a2d" }} />
          : <span style={{ color: "var(--text-color-secondary)", fontSize: 13 }}>—</span>}
      </span>
    </div>
  )

  const reportActionsBody = (row: Report) => (
    <div style={{ display: "flex", gap: 2 }}>
      <button
        onClick={() => setPreviewReport(prev => prev?.id === row.id ? null : row)}
        title="Preview"
        style={{
          width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: previewReport?.id === row.id ? "rgba(204,17,17,0.08)" : "none",
          border: previewReport?.id === row.id ? "1px solid #cc1111" : "1px solid transparent",
          borderRadius: 6, cursor: "pointer",
          color: previewReport?.id === row.id ? "#cc1111" : "var(--text-color-secondary)",
        }}
      >
        <i className="pi pi-eye" style={{ fontSize: 12 }} />
      </button>
      <button
        title="Download"
        style={{
          width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "none", border: "1px solid transparent", borderRadius: 6, cursor: "pointer",
          color: "var(--text-color-secondary)",
        }}
      >
        <i className="pi pi-download" style={{ fontSize: 12 }} />
      </button>
    </div>
  )

  const thStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
    color: "var(--text-color-secondary)", background: "var(--surface-card)",
    borderBottom: BORDER, padding: "0.625rem 0.75rem",
  }
  const tdStyle: React.CSSProperties = {
    fontSize: 13, color: "var(--text-color)", padding: "0.625rem 0.75rem",
    borderBottom: BORDER, borderTop: "none", borderLeft: "none", borderRight: "none",
  }

  return (
    <DashboardLayout pageTitle="Real Time Operations">

      {/* Upload Modal */}
      {(() => {
        const mLabel: React.CSSProperties = {
          display: "block", fontSize: 10, fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.06em",
          color: "var(--text-color-secondary)", marginBottom: 4,
        }
        const mInput: React.CSSProperties = {
          width: "100%", padding: "0.375rem 0.5rem", fontSize: 12,
          border: BORDER, borderRadius: 6,
          background: "var(--surface-card)", color: "var(--text-color)",
          outline: "none", boxSizing: "border-box", fontFamily: "inherit",
        }
        return (
          <Dialog
            header={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(204,17,17,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="pi pi-upload" style={{ fontSize: 11, color: "#cc1111" }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-color)" }}>Upload Report</span>
              </div>
            }
            visible={uploadModalOpen}
            onHide={() => setUploadModalOpen(false)}
            style={{ width: 400 }}
            modal
            pt={{
              header:  { style: { borderBottom: BORDER, padding: "0.75rem 1rem" } },
              content: { style: { padding: "1rem" } },
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div
                style={{
                  border: `2px dashed ${dragActive ? "#cc1111" : "var(--surface-border)"}`,
                  borderRadius: 10,
                  background: dragActive ? "rgba(204,17,17,0.04)" : "var(--surface-section)",
                  padding: "1.5rem 1rem", textAlign: "center",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onDragEnter={handleDrag} onDragLeave={handleDrag}
                onDragOver={handleDrag} onDrop={handleDrop}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(204,17,17,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.625rem" }}>
                  <i className="pi pi-upload" style={{ fontSize: 14, color: "#cc1111" }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-color)", margin: 0 }}>Drop a PDF file here</p>
                <p style={{ fontSize: 11, color: "var(--text-color-secondary)", margin: "0.25rem 0 0.75rem" }}>or</p>
                <button style={{ ...btnSecondary, fontSize: 11, margin: "0 auto" }}>Browse Files</button>
              </div>

              <div>
                <label style={mLabel}>Customer</label>
                <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} style={mInput}>
                  <option value="">Select customer</option>
                  {uniqueReportCustomers.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label style={mLabel}>Asset</label>
                <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)} style={mInput}>
                  <option value="">Select asset</option>
                  {uniqueReportAssets.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label style={mLabel}>Resource Type</label>
                <div style={{
                  ...mInput, display: "flex", alignItems: "center", gap: 8,
                  background: "var(--surface-section)",
                  color: autoResourceType ? "var(--text-color)" : "var(--text-color-secondary)",
                  cursor: "default", userSelect: "none",
                }}>
                  {autoResourceType
                    ? <TypePill type={autoResourceType} />
                    : <span style={{ fontSize: 12, fontStyle: "italic" }}>Auto-detected from asset</span>}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4, borderTop: BORDER }}>
                <button style={btnSecondary} onClick={() => setUploadModalOpen(false)}>Cancel</button>
                <button style={btnPrimary}>
                  <i className="pi pi-upload" style={{ fontSize: 11 }} />
                  Upload
                </button>
              </div>
            </div>
          </Dialog>
        )
      })()}

      {/* ── Tab Bar ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: BORDER, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
          {[
            { label: "Reports Repository", icon: "pi pi-file" },
            { label: "Daily Log",          icon: "pi pi-list" },
          ].map((tab, i) => {
            const active = activeTab === i
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "0.65rem 1.1rem", background: "transparent", border: "none",
                  cursor: "pointer", fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#cc1111" : "var(--text-color-secondary)",
                  borderBottom: active ? "2px solid #cc1111" : "2px solid transparent",
                  marginBottom: -1, outline: "none", whiteSpace: "nowrap",
                }}
              >
                <i className={tab.icon} style={{ fontSize: 12 }} />
                {tab.label}
              </button>
            )
          })}
        </div>
        <div style={{ paddingBottom: 8 }}>
          {activeTab === 1 && (
            <button
              onClick={() => dailyLogRef.current?.triggerShiftLogout()}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: BORDER, borderRadius: 6,
                fontSize: 12, fontWeight: 500, padding: "0.3rem 0.75rem",
                color: "var(--text-color-secondary)", cursor: "pointer",
              }}
            >
              <i className="pi pi-sign-out" style={{ fontSize: 11 }} />
              Shift Log Out
            </button>
          )}
        </div>
      </div>

      {/* ── Reports Repository ── */}
      {activeTab === 0 && (
        <div>
          {/* KPI bar */}
          {(() => {
            const validated = filteredReports.filter(r => r.validation1 && r.validation2).length
            const pending   = filteredReports.filter(r => !r.validation1 || !r.validation2).length
            return (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "0.5rem 0.875rem", borderRadius: 10, background: "var(--surface-card)", border: BORDER, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(204,17,17,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className="pi pi-file" style={{ fontSize: 12, color: "#cc1111" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-color-secondary)", lineHeight: 1 }}>Reports</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-color)", lineHeight: 1.2 }}>{filteredReports.length}</div>
                  </div>
                </div>
                <div style={{ width: 1, height: 24, background: "var(--surface-border)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="pi pi-check-circle" style={{ fontSize: 11, color: "#2d7a2d" }} />
                  <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Validated</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#2d7a2d" }}>{validated}</span>
                </div>
                <div style={{ width: 1, height: 24, background: "var(--surface-border)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="pi pi-clock" style={{ fontSize: 11, color: "#b45309" }} />
                  <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Pending</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#b45309" }}>{pending}</span>
                </div>
              </div>
            )
          })()}

          {/* Filter bar */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
              <i className="pi pi-search" style={{
                position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)",
                fontSize: 11, color: "var(--text-color-secondary)", pointerEvents: "none", zIndex: 1,
              }} />
              <input
                value={reportFilterQuery}
                onChange={e => setReportFilterQuery(e.target.value)}
                placeholder="Search..."
                style={{ ...nativeInput, width: "100%", paddingLeft: "1.85rem" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px", borderRadius: 6, background: "var(--surface-card)", border: BORDER, height: CTRL_H, boxSizing: "border-box" }}>
              <i className="pi pi-calendar" style={{ fontSize: 11, color: "var(--text-color-secondary)", flexShrink: 0 }} />
              <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", fontSize: 12, color: "var(--text-color)", cursor: "pointer" }} />
              <span style={{ color: "var(--text-color-secondary)", fontSize: 11, padding: "0 2px" }}>—</span>
              <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", fontSize: 12, color: "var(--text-color)", cursor: "pointer" }} />
            </div>

            <select value={reportFilterCustomer ?? ""} onChange={e => setReportFilterCustomer(e.target.value || null)} style={{ ...nativeSelect, minWidth: 130 }}>
              <option value="">Customer</option>
              {uniqueReportCustomers.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={reportFilterAsset ?? ""} onChange={e => setReportFilterAsset(e.target.value || null)} style={{ ...nativeSelect, minWidth: 120 }}>
              <option value="">Asset</option>
              {uniqueReportAssets.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={reportFilterResourceType ?? ""} onChange={e => setReportFilterResourceType(e.target.value || null)} style={{ ...nativeSelect, minWidth: 90 }}>
              <option value="">Type</option>
              {uniqueReportResourceTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>

            <button onClick={() => setUploadModalOpen(true)} style={btnPrimary}>
              <i className="pi pi-upload" style={{ fontSize: 11 }} />
              Upload
            </button>
          </div>

          {/* Split layout: table + PDF viewer */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

            {/* Table */}
            <div style={{ flex: previewReport ? "0 0 calc(50% - 8px)" : "1 1 100%", minWidth: 0, transition: "flex 0.2s" }}>
              <div style={{ borderRadius: 12, overflow: "hidden", border: BORDER }}>
                <DataTable
                  value={filteredReports}
                  dataKey="id"
                  size="small"
                  emptyMessage="No reports match the current filters."
                  style={{ background: "var(--surface-card)" }}
                  pt={{
                    thead: { style: { background: "var(--surface-card)" } },
                    tbody: { style: { background: "var(--surface-card)" } },
                    column: {
                      headerCell: { style: thStyle },
                      bodyCell:   { style: tdStyle },
                    },
                  }}
                >
                  <Column field="report"       header="Report"     sortable style={{ minWidth: 200 }} />
                  <Column field="uploadedDate" header="Uploaded"   sortable style={{ width: 110 }} />
                  <Column header="Type"        body={reportResourceTypeBody} style={{ width: 80 }} />
                  <Column field="customer"     header="Customer"   sortable style={{ minWidth: previewReport ? 100 : 155 }} />
                  <Column field="asset"        header="Asset"      sortable style={{ minWidth: previewReport ? 80 : 130 }} />
                  <Column header="Validation"  body={reportValidationBody}   style={{ width: 90 }} />
                  <Column header=""            body={reportActionsBody}       style={{ width: 72 }} />
                </DataTable>
              </div>
            </div>

            {/* PDF viewer panel */}
            {previewReport && (
              <div style={{
                flex: "0 0 calc(50% - 8px)", position: "sticky", top: 16,
                border: BORDER, borderRadius: 12, overflow: "hidden",
                background: "var(--surface-card)", display: "flex", flexDirection: "column",
                maxHeight: "calc(100vh - 120px)",
              }}>
                {/* Toolbar */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: BORDER, flexShrink: 0 }}>
                  <i className="pi pi-file-pdf" style={{ fontSize: 13, color: "#cc1111" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-color)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {previewReport.report}.pdf
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-color-secondary)", flexShrink: 0 }}>1 / 1</span>
                  <button title="Download" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-color-secondary)", display: "inline-flex", alignItems: "center" }}>
                    <i className="pi pi-download" style={{ fontSize: 12 }} />
                  </button>
                  <button onClick={() => setPreviewReport(null)} title="Close" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-color-secondary)", display: "inline-flex", alignItems: "center" }}>
                    <i className="pi pi-times" style={{ fontSize: 12 }} />
                  </button>
                </div>

                {/* Document area */}
                <div style={{ flex: 1, overflowY: "auto", background: "#3a3a3a", padding: 20, display: "flex", justifyContent: "center" }}>
                  <div style={{
                    width: "100%", maxWidth: 520, minHeight: 680,
                    background: "#fff", borderRadius: 4,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
                    padding: "40px 48px",
                    display: "flex", flexDirection: "column", gap: 20,
                    color: "#1a1a1a",
                  }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #cc1111", paddingBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "#888", marginBottom: 2 }}>Ammper Power</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#2d7a2d" }}>Power Sphere</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginTop: 8, maxWidth: 260 }}>{previewReport.report}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: 2 }}>Report Date</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{previewReport.uploadedDate}</div>
                        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginTop: 8, marginBottom: 2 }}>Resource Type</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{previewReport.resourceType}</div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[previewReport.customer, previewReport.asset].map(v => (
                        <span key={v} style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: "#f3f4f6", color: "#374151" }}>{v}</span>
                      ))}
                    </div>

                    {/* Body */}
                    <p style={{ fontSize: 12, lineHeight: 1.7, color: "#374151", margin: 0 }}>
                      This report provides a comprehensive analysis of operational performance for <strong>{previewReport.asset}</strong> during the reporting period. Key metrics indicate stable generation output with minor variance from forecasted levels.
                    </p>

                    {/* Compliance */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      {[["ERCOT Protocols", "Compliant", "#2d7a2d"], ["NERC Standards", "Compliant", "#2d7a2d"], ["Internal SLA", "Met", "#1a5ca8"]].map(([label, val, color]) => (
                        <div key={label} style={{ padding: "10px 12px", borderRadius: 8, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color }}>{val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Charts */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        { label: "Generation Output (MW)", bars: [65, 78, 82, 71, 88, 92, 85, 79, 83, 90, 87, 81], color: "#cc1111" },
                        { label: "Response Time (sec)",    bars: [45, 52, 38, 41, 55, 48, 42, 50, 44, 39, 47, 43], color: "#1a5ca8" },
                      ].map(({ label, bars, color }) => (
                        <div key={label} style={{ padding: "10px 12px", borderRadius: 8, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", marginBottom: 8 }}>{label}</div>
                          <div style={{ height: 48, display: "flex", alignItems: "flex-end", gap: 2 }}>
                            {bars.map((v, i) => (
                              <div key={i} style={{ flex: 1, borderRadius: "2px 2px 0 0", height: `${v}%`, background: color, opacity: 0.8 }} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Daily Log ── */}
      {activeTab === 1 && <DailyLog ref={dailyLogRef} />}
    </DashboardLayout>
  )
}
