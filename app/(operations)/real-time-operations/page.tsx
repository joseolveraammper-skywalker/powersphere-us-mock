"use client"

import { useState, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Button } from "primereact/button"
import { Dialog } from "primereact/dialog"
import { InputText } from "primereact/inputtext"
import { Dropdown } from "primereact/dropdown"
import type { DataTableExpandedRows } from "primereact/datatable"
import { FileText, Check } from "lucide-react"
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

// ── Pill badge components ──
function TypePill({ type }: { type: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    NCLR: { bg: "rgba(26,92,168,0.10)", color: "#1a5ca8" },
    ESR:  { bg: "rgba(217,119,6,0.10)",  color: "#b45309" },
    GEN:  { bg: "rgba(45,122,45,0.10)",  color: "#2d7a2d" },
  }
  const s = styles[type] ?? { bg: "rgba(100,100,100,0.1)", color: "#555" }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide"
      style={{ background: s.bg, color: s.color }}>
      {type}
    </span>
  )
}


// ============ MAIN PAGE ============
export default function RealTimeOperationsPage() {
  const [activeTab, setActiveTab] = useState(0)

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

  const dailyLogRef = useRef<DailyLogHandle>(null)

  const autoResourceType = selectedAsset ? assetResourceTypeMap[selectedAsset] || "" : ""

  const uniqueReportCustomers = [...new Set(mockReports.map((r) => r.customer))].map(v => ({ label: v, value: v }))
  const uniqueReportAssets = [...new Set(mockReports.map((r) => r.asset))].map(v => ({ label: v, value: v }))
  const uniqueReportResourceTypes = [...new Set(mockReports.map((r) => r.resourceType))].map(v => ({ label: v, value: v }))
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(false)
  }

  // ── Column body templates ──
  const reportResourceTypeBody = (row: typeof mockReports[0]) => <TypePill type={row.resourceType} />

  const reportValidationBody = (row: typeof mockReports[0]) => (
    <div className="flex gap-2">
      <span title="Validation 1">
        {row.validation1
          ? <Check className="h-3.5 w-3.5" style={{ color: "#2d7a2d" }} />
          : <span style={{ color: "var(--text-color-secondary)", fontSize: 13 }}>—</span>}
      </span>
      <span title="Validation 2">
        {row.validation2
          ? <Check className="h-3.5 w-3.5" style={{ color: "#2d7a2d" }} />
          : <span style={{ color: "var(--text-color-secondary)", fontSize: 13 }}>—</span>}
      </span>
    </div>
  )

  const reportActionsBody = () => (
    <div className="flex gap-0.5">
      <Button icon="pi pi-eye" rounded text size="small" tooltip="Preview" style={{ width: "1.75rem", height: "1.75rem" }} />
      <Button icon="pi pi-download" rounded text size="small" tooltip="Download" style={{ width: "1.75rem", height: "1.75rem" }} />
    </div>
  )

  const reportExpansionTemplate = (row: typeof mockReports[0]) => (
    <div className="px-6 py-4" style={{ background: "var(--surface-ground)" }}>
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--surface-border)", background: "var(--surface-card)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--surface-border)" }}>
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" style={{ color: "#cc1111" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-color)" }}>{row.report}.pdf</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex justify-between border-b pb-4" style={{ borderColor: "var(--surface-border)" }}>
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--text-color-secondary)" }}>Ammper Power</p>
              <p className="text-xs font-bold" style={{ color: "#2d7a2d" }}>Power Sphere</p>
              <h1 className="text-sm font-semibold mt-2" style={{ color: "var(--text-color)" }}>{row.report}</h1>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--text-color-secondary)" }}>Report Date</p>
              <p className="text-xs font-medium" style={{ color: "var(--text-color)" }}>{row.uploadedDate}</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[11px]" style={{ background: "var(--surface-section)", color: "var(--text-color-secondary)" }}>
              {row.customer}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px]" style={{ background: "var(--surface-section)", color: "var(--text-color-secondary)" }}>
              {row.asset}
            </span>
            <TypePill type={row.resourceType} />
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-color-secondary)" }}>
            This report provides a comprehensive analysis of operational performance for {row.asset} during the reporting period. Key metrics indicate stable generation output with minor variance from forecasted levels.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[["ERCOT Protocols", "Compliant", "#2d7a2d"], ["NERC Standards", "Compliant", "#2d7a2d"], ["Internal SLA", "Met", "#1a5ca8"]].map(([label, val, color]) => (
              <div key={label} className="p-3 rounded-xl" style={{ background: "var(--surface-section)" }}>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-color-secondary)" }}>{label}</p>
                <p className="text-xs font-semibold" style={{ color }}>{val}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Generation Output (MW)", bars: [65, 78, 82, 71, 88, 92, 85, 79, 83, 90, 87, 81], color: "#cc1111" },
              { label: "Response Time (sec)", bars: [45, 52, 38, 41, 55, 48, 42, 50, 44, 39, 47, 43], color: "#1a5ca8" },
            ].map(({ label, bars, color }) => (
              <div key={label} className="p-3 rounded-xl" style={{ background: "var(--surface-section)" }}>
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-color-secondary)" }}>{label}</p>
                <div className="h-12 flex items-end gap-0.5">
                  {bars.map((v, i) => (
                    <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${v}%`, background: color, opacity: 0.8 }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ── Shared control height — matches across all filter bar elements ──
  const CTRL_H = "30px"
  const BORDER = "1px solid var(--surface-border)"

  // ── Shared dropdown passthrough for compact styling ──
  const ddPt = {
    root: { style: { fontSize: 12, height: CTRL_H, border: BORDER } },
    input: { style: { fontSize: 12, padding: "0 0.5rem", height: "100%", display: "flex", alignItems: "center", minHeight: "unset" } },
    trigger: { style: { width: "1.75rem" } },
    item: { style: { fontSize: 12, padding: "0.375rem 0.75rem" } },
    header: { style: { padding: "0.375rem 0.5rem" } },
    filterInput: { style: { fontSize: 12 } },
  }

  // ── Filter bar ──
  const filterBar = (
    type: "report" | "log",
    startDate: string, setStart: (v: string) => void,
    endDate: string, setEnd: (v: string) => void,
    customers: { label: string; value: string }[],
    customer: string | null, setCustomer: (v: string | null) => void,
    assets: { label: string; value: string }[],
    asset: string | null, setAsset: (v: string | null) => void,
    resourceTypes: { label: string; value: string }[],
    resourceType: string | null, setResourceType: (v: string | null) => void,
    query: string, setQuery: (v: string) => void,
  ) => (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {/* Search — height locked to CTRL_H */}
      <div className="relative" style={{ flex: 1, minWidth: 160, height: CTRL_H }}>
        <i className="pi pi-search" style={{
          position: "absolute", left: "0.6rem", top: "50%",
          transform: "translateY(-50%)", fontSize: 11,
          color: "var(--text-color-secondary)", pointerEvents: "none", zIndex: 1,
        }} />
        <InputText
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search..."
          style={{ width: "100%", height: CTRL_H, paddingLeft: "1.85rem", paddingRight: "0.5rem", fontSize: 12, boxSizing: "border-box" }}
        />
      </div>

      {/* Date range — height locked to CTRL_H */}
      <div className="flex items-center gap-1.5 px-2 rounded-lg"
        style={{ height: CTRL_H, background: "var(--surface-card)", border: BORDER, boxSizing: "border-box" }}>
        <i className="pi pi-calendar" style={{ fontSize: 11, color: "var(--text-color-secondary)", flexShrink: 0 }} />
        <input type="date" value={startDate} onChange={e => setStart(e.target.value)}
          style={{ background: "transparent", border: "none", outline: "none", fontSize: 12, color: "var(--text-color)", cursor: "pointer" }}
        />
        <span style={{ color: "var(--text-color-secondary)", fontSize: 11, padding: "0 2px" }}>—</span>
        <input type="date" value={endDate} onChange={e => setEnd(e.target.value)}
          style={{ background: "transparent", border: "none", outline: "none", fontSize: 12, color: "var(--text-color)", cursor: "pointer" }}
        />
      </div>

      {/* Compact dropdowns — height locked to CTRL_H via pt.root */}
      <Dropdown value={customer} options={customers} onChange={e => setCustomer(e.value)}
        placeholder="Customer" showClear style={{ minWidth: 120 }} pt={ddPt} />
      <Dropdown value={asset} options={assets} onChange={e => setAsset(e.value)}
        placeholder="Asset" showClear style={{ minWidth: 110 }} pt={ddPt} />
      <Dropdown value={resourceType} options={resourceTypes} onChange={e => setResourceType(e.value)}
        placeholder="Type" showClear style={{ minWidth: 90 }} pt={ddPt} />

      {/* Upload */}
      {type === "report" && (
        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
          style={{ background: "#cc1111", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, padding: "0.375rem 0.875rem" }}
        >
          <i className="pi pi-upload" style={{ fontSize: 11 }} />
          Upload
        </button>
      )}
    </div>
  )

  // ── Shared table header style injected via className trick ──
  const tableHeaderStyle = {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--text-color-secondary)",
    background: "var(--surface-card)",
    borderBottom: "1px solid var(--surface-border)",
    padding: "0.625rem 0.75rem",
  }

  const tableCellStyle = {
    fontSize: "13px",
    color: "var(--text-color)",
    padding: "0.625rem 0.75rem",
    borderBottom: "1px solid var(--surface-border)",
    borderTop: "none",
    borderLeft: "none",
    borderRight: "none",
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
          border: "1px solid var(--surface-border)", borderRadius: 6,
          background: "var(--surface-card)", color: "var(--text-color)",
          outline: "none", boxSizing: "border-box", fontFamily: "inherit",
        }
        const mBtnSecondary: React.CSSProperties = {
          background: "none", border: "1px solid var(--surface-border)", borderRadius: 6,
          fontSize: 12, fontWeight: 500, padding: "0.35rem 0.75rem",
          color: "var(--text-color-secondary)", cursor: "pointer",
        }
        const mBtnPrimary: React.CSSProperties = {
          background: "#cc1111", border: "none", borderRadius: 6,
          fontSize: 12, fontWeight: 600, padding: "0.35rem 0.875rem",
          color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
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
              header:  { style: { borderBottom: "1px solid var(--surface-border)", padding: "0.75rem 1rem" } },
              content: { style: { padding: "1rem" } },
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {/* Drop zone */}
              <div
                style={{
                  border: `2px dashed ${dragActive ? "#cc1111" : "var(--surface-border)"}`,
                  borderRadius: 10,
                  background: dragActive ? "rgba(204,17,17,0.04)" : "var(--surface-section)",
                  padding: "1.5rem 1rem",
                  textAlign: "center",
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
                <button style={{ ...mBtnSecondary, fontSize: 11, margin: "0 auto" }}>Browse Files</button>
              </div>

              {/* Customer */}
              <div>
                <label style={mLabel}>Customer</label>
                <select
                  value={selectedCustomer}
                  onChange={e => setSelectedCustomer(e.target.value)}
                  style={mInput}
                >
                  <option value="">Select customer</option>
                  {uniqueReportCustomers.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Asset */}
              <div>
                <label style={mLabel}>Asset</label>
                <select
                  value={selectedAsset}
                  onChange={e => setSelectedAsset(e.target.value)}
                  style={mInput}
                >
                  <option value="">Select asset</option>
                  {uniqueReportAssets.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Resource Type — system-filled, read-only */}
              <div>
                <label style={mLabel}>Resource Type</label>
                <div style={{
                  ...mInput,
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--surface-section)",
                  color: autoResourceType ? "var(--text-color)" : "var(--text-color-secondary)",
                  cursor: "default", userSelect: "none",
                }}>
                  {autoResourceType
                    ? <TypePill type={autoResourceType} />
                    : <span style={{ fontSize: 12, fontStyle: "italic" }}>Auto-detected from asset</span>
                  }
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", paddingTop: "0.25rem", borderTop: "1px solid var(--surface-border)" }}>
                <button style={mBtnSecondary} onClick={() => setUploadModalOpen(false)}>Cancel</button>
                <button style={mBtnPrimary}>
                  <i className="pi pi-upload" style={{ fontSize: 11 }} />
                  Upload
                </button>
              </div>
            </div>
          </Dialog>
        )
      })()}

      {/* ── Underline Tab Bar ── */}
      <div className="flex items-end justify-between mb-6"
        style={{ borderBottom: "1px solid var(--surface-border)" }}>
        <div className="flex items-end gap-0">
          {[
            { label: "Reports Repository", icon: "pi pi-file" },
            { label: "Daily Log", icon: "pi pi-list" },
          ].map((tab, i) => {
            const active = activeTab === i
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.65rem 1.1rem",
                  background: "transparent", border: "none", cursor: "pointer",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#cc1111" : "var(--text-color-secondary)",
                  borderBottom: active ? "2px solid #cc1111" : "2px solid transparent",
                  marginBottom: -1,
                  transition: "color 0.15s",
                  outline: "none",
                  whiteSpace: "nowrap",
                }}
              >
                <i className={tab.icon} style={{ fontSize: 12 }} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="pb-2 flex items-center">
          {activeTab === 1 && (
            <button
              onClick={() => dailyLogRef.current?.triggerShiftLogout()}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "1px solid var(--surface-border)", borderRadius: 6,
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
            const KBORDER = "1px solid var(--surface-border)"
            return (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "1rem", padding: "0.5rem 0.875rem", borderRadius: 10, background: "var(--surface-card)", border: KBORDER, marginBottom: "1.25rem" }}>
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
          {filterBar(
            "report",
            reportStartDate, setReportStartDate,
            reportEndDate, setReportEndDate,
            uniqueReportCustomers, reportFilterCustomer, setReportFilterCustomer,
            uniqueReportAssets, reportFilterAsset, setReportFilterAsset,
            uniqueReportResourceTypes, reportFilterResourceType, setReportFilterResourceType,
            reportFilterQuery, setReportFilterQuery,
          )}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--surface-border)" }}>
            <DataTable
              value={filteredReports}
              dataKey="id"
              expandedRows={expandedReportRows}
              onRowToggle={e => setExpandedReportRows(e.data as DataTableExpandedRows)}
              rowExpansionTemplate={reportExpansionTemplate}
              size="small"
              emptyMessage="No reports match the current filters."
              style={{ background: "var(--surface-card)" }}
              pt={{
                thead: { style: { background: "var(--surface-card)" } },
                tbody: { style: { background: "var(--surface-card)" } },
                column: {
                  headerCell: { style: tableHeaderStyle },
                  bodyCell: { style: tableCellStyle },
                },
              }}
            >
              <Column expander style={{ width: "2.5rem" }} />
              <Column field="report" header="Report" sortable style={{ minWidth: "260px" }} />
              <Column field="uploadedDate" header="Uploaded" sortable style={{ width: "110px" }} />
              <Column header="Type" body={reportResourceTypeBody} style={{ width: "80px" }} />
              <Column field="customer" header="Customer" sortable style={{ minWidth: "155px" }} />
              <Column field="asset" header="Asset" sortable style={{ minWidth: "130px" }} />
              <Column header="Validation" body={reportValidationBody} style={{ width: "95px" }} />
              <Column header="" body={reportActionsBody} style={{ width: "80px" }} />
            </DataTable>
          </div>
        </div>
      )}

      {/* ── Daily Log ── */}
      {activeTab === 1 && <DailyLog ref={dailyLogRef} />}
    </DashboardLayout>
  )
}
