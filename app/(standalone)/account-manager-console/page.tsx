"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { DataTable, DataTableExpandedRows } from "primereact/datatable"
import { Column } from "primereact/column"
import { Dialog } from "primereact/dialog"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { fmt } from "@/lib/retail-customer-mock"
import {
  ACCOUNT_ISSUES, CREATOR_KIND_LABEL, CURRENT_USER, INTELOMETRY_CHANGES, NO_EMAIL,
  assignedFacilities, childAccountsOf, computeStatus, creatorKind, type AmcFacility, type ChildAccount, type ChildRole, type CreatorKind, distributionGroupFor, parseISO, parseUS,
  type AmcAccount, type AmcContract, type AmcStep,
} from "@/lib/account-manager-mock"
import { useAccountManager, type NotificationRecord } from "@/lib/account-manager-context"
import {
  DAY_LABEL, DAY_ORDER, MAX_SLOTS, activeScheduledSlot, formatDays, formatSlots,
  nextScheduledRun, validateSchedule, type IntelometrySchedule,
} from "@/lib/intelometry-schedule"
import { useTheme } from "next-themes"

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

const thStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, padding: "8px 12px",
  background: "var(--surface-section)", color: "var(--text-color-secondary)",
}
const tdStyle: React.CSSProperties = { fontSize: 12, padding: "8px 12px" }

const tablePt = {
  thead: { style: { background: "var(--surface-card)" } },
  tbody: { style: { background: "var(--surface-card)" } },
  column: { headerCell: { style: thStyle }, bodyCell: { style: tdStyle } },
}

const disabledStyle = (disabled: boolean): React.CSSProperties =>
  disabled ? { opacity: 0.45, cursor: "not-allowed" } : {}

const popoverStyle: React.CSSProperties = {
  background: "var(--surface-card)", border: BORDER, borderRadius: 8,
  boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
}
const popoverHeading: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: "var(--text-color-secondary)",
  textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8, whiteSpace: "nowrap",
}
const errorText: React.CSSProperties = { fontSize: 11, color: "#cc1111" }
const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--text-color)" }
const checkboxStyle: React.CSSProperties = { width: 14, height: 14, margin: 0, accentColor: "#cc1111", cursor: "pointer" }
const backdrop: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 40 }
const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/

// ── Status ─────────────────────────────────────────────────────────────────────
type Status = "Pending email" | "Pending WP schedule" | "Welcome packet sent" | "Password email sent" | "Active" | "Inactive"

// "Active" needs no further account-manager work, so it has its own standalone chip
// instead of living in the work-queue dropdown.
const STATUS_ORDER: Status[] = ["Pending email", "Pending WP schedule", "Welcome packet sent", "Password email sent", "Inactive"]

const STATUS_COLOR: Record<Status, string> = {
  "Pending email": "#d99a2b",
  "Pending WP schedule": "#d9752e",
  "Welcome packet sent": "#2f9188",
  "Password email sent": "#7c5cd6",
  "Active": "#2d7a2d",
  "Inactive": "#c14a3e",
}
const tint = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`
}

type Row = {
  id: string
  name: string
  email: string
  contract: string
  created: string
  by: string
  status: Status
  steps: { done: boolean; title: string }[]
  distGroupId: string
  recipientEmails: string[]
  contractDetail: AmcContract
  issueReason: string | null
  notifications: NotificationRecord[]
  parentName: string | null
  childCount: number
}

const stepTitle = (label: string, step: AmcStep, extra: string | null) =>
  !step.done ? `${label} — not sent yet.` : `${label} on ${step.date} at ${step.time}${extra ? `, ${extra}` : "."}`

function toRow(
  a: AmcAccount, notes: NotificationRecord[], issueReason: string | null, parentName: string | null, childCount: number,
): Row {
  const base = computeStatus(a)
  let status: Status
  let step2Title: string
  if (base === "Welcome email sent") {
    status = "Welcome packet sent"
    step2Title = `Welcome packet scheduled on ${a.step2.date} at ${a.step2.time}, by ${a.step2.by}.`
  } else if (base === "Account loaded") {
    // Lead time between loading and contract start decides whether the welcome packet
    // is on track or needs to be scheduled manually.
    const leadDays = Math.round((parseISO(a.contract) - parseUS(a.step1.date!)) / 86400000)
    if (leadDays >= 21) {
      status = "Welcome packet sent"
      step2Title = stepTitle("Welcome packet", a.step2, null)
    } else {
      status = "Pending WP schedule"
      step2Title = "Welcome packet not scheduled yet, schedule manually."
    }
  } else {
    status = base
    step2Title = stepTitle("Welcome email sent", a.step2, a.step2.done ? `scheduled by ${a.step2.by}` : null)
  }
  const dg = distributionGroupFor(a.contractDetail.number)
  return {
    id: a.contractDetail.number,
    name: a.name, email: a.email, contract: a.contract, created: a.created, by: a.by,
    status,
    steps: [
      { done: a.step1.done, title: stepTitle("Account loaded — contract received", a.step1, `primary email: ${a.step1.email || NO_EMAIL}`) },
      { done: a.step2.done, title: step2Title },
      { done: a.step3.done, title: stepTitle("Password email sent", a.step3, a.step3.done ? `scheduled by ${a.step3.by}` : null) },
    ],
    distGroupId: dg.id,
    recipientEmails: dg.emails,
    contractDetail: a.contractDetail,
    issueReason,
    notifications: notes,
    parentName,
    childCount,
  }
}

// ── Small UI pieces ────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: Status }) {
  const color = STATUS_COLOR[status]
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
      padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: tint(color, 0.14), color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {status}
    </span>
  )
}

// Fixed positioning lets the tip escape the DataTable's scroll wrapper.
function HoverTip({ tip, children, fixed }: { tip: React.ReactNode; children: React.ReactNode; fixed?: boolean }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const tipStyle: React.CSSProperties = {
    background: "#1a1a1a", color: "#fff", padding: "7px 10px", borderRadius: 6,
    fontSize: 11, fontWeight: 500, lineHeight: 1.45, width: "max-content", maxWidth: 240,
    textAlign: "left", whiteSpace: "normal", boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
    pointerEvents: "none", transform: "translateX(-50%)",
  }
  return (
    <span
      onMouseEnter={e => {
        const r = e.currentTarget.getBoundingClientRect()
        setPos({ x: r.left + r.width / 2, y: r.bottom + 8 })
      }}
      onMouseLeave={() => setPos(null)}
      style={{ position: "relative", display: "inline-flex", lineHeight: 0 }}
    >
      {children}
      {pos && (fixed
        ? <span style={{ ...tipStyle, position: "fixed", left: pos.x, top: pos.y, zIndex: 3000 }}>{tip}</span>
        : <span style={{ ...tipStyle, position: "absolute", left: "50%", top: "calc(100% + 8px)", zIndex: 3000 }}>{tip}</span>
      )}
    </span>
  )
}

function StepDot({ done, color }: { done: boolean; color: string }) {
  return (
    <span style={{
      width: 17, height: 17, borderRadius: "50%", boxSizing: "border-box",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: done ? color : "var(--surface-card)", border: done ? "none" : BORDER,
    }}>
      {done && <i className="pi pi-check" style={{ fontSize: 8, color: "#fff", fontWeight: 700 }} />}
    </span>
  )
}

function Kpi({ value, label, color, tip, onClick, active, activeColor }: {
  value: number; label: string; color: string; tip?: string; onClick?: () => void; active?: boolean; activeColor?: string
}) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", display: "flex", flexDirection: "column", gap: 2,
        border: active ? `1px solid ${activeColor}` : hover ? "1px solid var(--text-color-secondary)" : BORDER,
        background: active ? tint(activeColor!, 0.08) : "var(--surface-card)",
        borderRadius: 10, padding: "10px 18px", minWidth: 120, cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-color-secondary)", whiteSpace: "nowrap" }}>{label}</div>
      {tip && hover && (
        <span style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 30,
          background: "#1a1a1a", color: "#fff", padding: "7px 10px", borderRadius: 6,
          fontSize: 11, fontWeight: 500, lineHeight: 1.45, width: "max-content", maxWidth: 240,
          boxShadow: "0 6px 16px rgba(0,0,0,0.3)", pointerEvents: "none",
        }}>
          {tip}
        </span>
      )}
    </div>
  )
}

function FixedPopover({ anchor, onClose, children }: { anchor: DOMRect; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    window.addEventListener("scroll", onClose, true)
    window.addEventListener("resize", onClose)
    return () => {
      window.removeEventListener("scroll", onClose, true)
      window.removeEventListener("resize", onClose)
    }
  }, [onClose])
  return (
    <>
      <div onClick={onClose} style={{ ...backdrop, zIndex: 2000 }} />
      <div style={{
        ...popoverStyle, position: "fixed", left: anchor.left, top: anchor.bottom + 6, zIndex: 2001,
        padding: "10px 12px", minWidth: 230, maxHeight: 220, overflowY: "auto",
      }}>
        {children}
      </div>
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "console", label: "Account Manager Console", icon: "pi pi-users" },
  { key: "billing", label: "Billing Notice",          icon: "pi pi-file" },
] as const
type TabKey = typeof TABS[number]["key"]

export default function AccountManagerConsolePage() {
  const [active, setActive] = useState<TabKey>("console")

  return (
    <DashboardLayout title="Account Manager Console">
      <div style={{ display: "flex", gap: 0, borderBottom: BORDER, marginBottom: 20 }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActive(tab.key)} style={{
            padding: "0.5rem 1rem", fontSize: 12, fontWeight: active === tab.key ? 600 : 400,
            border: "none", borderBottom: active === tab.key ? "2px solid #cc1111" : "2px solid transparent",
            background: "none", cursor: "pointer", color: active === tab.key ? "#cc1111" : "var(--text-color-secondary)",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <i className={tab.icon} style={{ fontSize: 12 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {active === "console" ? <Console /> : (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, height: 256,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 14, color: "var(--text-color)" }}>Billing Notice</div>
          <div style={{ fontSize: 12, color: "var(--text-color-secondary)", maxWidth: 420 }}>
            This tab stays as-is for now — out of scope for this pass.
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

// ── Console ────────────────────────────────────────────────────────────────────
const ISSUE_BY_NAME = new Map(ACCOUNT_ISSUES.map(i => [i.name, i.reason]))

function Console() {
  // Notify only records what was sent; it never changes an account's onboarding status.
  const { accounts, notifications, applyIntelometryChanges, recordNotifications: saveNotifications, intelometrySchedule } = useAccountManager()
  const [hidden, setHidden] = useState<Partial<Record<Status, boolean>>>({ Active: true })
  // Cross-status override for the Actions KPI; touching any status filter drops out of it.
  const [onlyFlagged, setOnlyFlagged] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [filter, setFilter] = useState("")
  const [hiddenCreators, setHiddenCreators] = useState<Partial<Record<CreatorKind, boolean>>>({ external: true })
  const [creatorMenuOpen, setCreatorMenuOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | undefined>(undefined)
  const [dgOpen, setDgOpen] = useState<{ row: Row; anchor: DOMRect } | null>(null)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifyKey, setNotifyKey] = useState(0)

  const allRows = useMemo(() => {
    const nameById = new Map(accounts.map(a => [a.contractDetail.number, a.name]))
    return accounts.map(a => toRow(
      a, notifications[a.name] || [], ISSUE_BY_NAME.get(a.name) ?? null,
      a.parentId ? nameById.get(a.parentId) ?? null : null,
      childAccountsOf(a.contractDetail.number, accounts).length,
    ))
  }, [accounts, notifications])

  const im = useIntelometry(allRows, applyIntelometryChanges, intelometrySchedule)

  const rows = useMemo(() => {
    const byStatus = onlyFlagged ? allRows.filter(r => r.issueReason) : allRows.filter(r => !hidden[r.status])
    const base = byStatus.filter(r => !hiddenCreators[creatorKind(r.by)])
    const q = filter.trim().toLowerCase()
    if (!q) return base
    return base.filter(r =>
      r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
    )
  }, [allRows, hidden, onlyFlagged, hiddenCreators, filter])

  const countOf = (s: Status) => allRows.filter(r => r.status === s).length
  const activeVisible = !hidden.Active
  const visibleCount = STATUS_ORDER.filter(s => !hidden[s]).length
  const allSelected = visibleCount === STATUS_ORDER.length

  const setStatusHidden = (next: Partial<Record<Status, boolean>>) => {
    setHidden(next)
    setOnlyFlagged(false)
  }
  const toggleStatus = (s: Status) => {
    const next = { ...hidden }
    if (next[s]) delete next[s]
    else next[s] = true
    setStatusHidden(next)
  }
  const toggleAll = () => {
    if (allSelected) {
      const next = { ...hidden }
      STATUS_ORDER.forEach(s => { next[s] = true })
      setStatusHidden(next)
    } else {
      setStatusHidden(hidden.Active ? { Active: true } : {})
    }
  }
  const filterInactive = () => {
    const next: Partial<Record<Status, boolean>> = {}
    ;[...STATUS_ORDER, "Active" as Status].forEach(s => { if (s !== "Inactive") next[s] = true })
    setStatusHidden(next)
    setStatusMenuOpen(false)
  }
  const toggleActions = () => {
    const next = !onlyFlagged
    setOnlyFlagged(next)
    setActionsOpen(next)
  }

  const allVisibleSelected = rows.length > 0 && rows.every(r => selected.has(r.id))
  const toggleSelectAll = () => {
    const next = new Set(selected)
    if (allVisibleSelected) rows.forEach(r => next.delete(r.id))
    else rows.forEach(r => next.add(r.id))
    setSelected(next)
  }
  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const recordNotifications = (records: { account: string; emails: string[] }[]) =>
    saveNotifications(records.map(r => ({ ...r, sentAt: fmt(new Date()), by: CURRENT_USER })))

  const closeDg = React.useCallback(() => setDgOpen(null), [])

  const bigBtn: React.CSSProperties = { ...btnPrimary, justifyContent: "center", padding: "0.55rem 1.25rem", fontSize: 13, whiteSpace: "nowrap" }

  const expansionTemplate = (row: Row) => <AccountExpansion row={row} />

  const toggleChildren = (id: string) => {
    const open = !!(expandedRows as Record<string, boolean> | undefined)?.[id]
    setExpandedRows(prev => {
      const next = { ...(prev || {}) } as Record<string, boolean>
      if (open) delete next[id]
      else next[id] = true
      return next
    })
    if (!open) setTimeout(() => document.getElementById(`children-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Summary + actions */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button style={bigBtn}>
              <i className="pi pi-user-plus" style={{ fontSize: 12 }} />
              Create account
            </button>
            <button onClick={() => { setNotifyKey(k => k + 1); setNotifyOpen(true) }} style={{ ...bigBtn, background: "#2d7a2d" }}>
              <i className="pi pi-send" style={{ fontSize: 12 }} />
              Notify
            </button>
            <button onClick={() => im.setOpen(true)} style={{ ...bigBtn, background: "#2563eb" }}>
              <i className="pi pi-sync" style={{ fontSize: 12 }} />
              Intelometry check
            </button>
            {im.scheduledRun && (
              <div onClick={() => im.setOpen(true)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                background: tint("#2563eb", 0.1), border: `1px solid ${tint("#2563eb", 0.3)}`, color: "#2563eb", fontSize: 11, fontWeight: 600,
              }}>
                <i className="pi pi-spin pi-spinner" style={{ fontSize: 11 }} />
                Scheduled query running ({im.scheduledRun})…
              </div>
            )}
            {im.bgJob?.status === "running" && (
              <div onClick={() => im.setOpen(true)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                background: tint("#2563eb", 0.1), border: `1px solid ${tint("#2563eb", 0.3)}`, color: "#2563eb", fontSize: 11, fontWeight: 600,
              }}>
                <i className="pi pi-spin pi-spinner" style={{ fontSize: 11 }} />
                Intelometry check running…
              </div>
            )}
            {im.bgJob?.status === "done" && (
              <div onClick={() => im.setOpen(true)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                background: tint("#2d7a2d", 0.1), border: `1px solid ${tint("#2d7a2d", 0.3)}`, color: "#2d7a2d", fontSize: 11, fontWeight: 700,
              }}>
                <i className="pi pi-check" style={{ fontSize: 11 }} />
                {im.bgJob.foundCount} change(s) found — Review
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "stretch", gap: 10, flexWrap: "wrap" }}>
            <Kpi value={allRows.length} label="Total created accounts" color="var(--text-color)"
              tip="All accounts in existence, independent of status." />
            <Kpi value={countOf("Active")} label="Active accounts" color="#2d7a2d" />
            <Kpi value={countOf("Inactive")} label="Inactive accounts" color="#c14a3e"
              tip="Filter the table to Inactive accounts only." onClick={filterInactive} />
            <div style={{ position: "relative" }}>
              <Kpi value={ACCOUNT_ISSUES.length} label="Actions" color="#cc1111"
                onClick={toggleActions} active={onlyFlagged} activeColor="#cc1111" />
              {actionsOpen && (
                <>
                  <div onClick={() => setActionsOpen(false)} style={backdrop} />
                  <div style={{
                    ...popoverStyle, position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50,
                    padding: "12px 14px", minWidth: 320, maxHeight: 260, overflowY: "auto",
                  }}>
                    <div style={popoverHeading}>Accounts blocked from creation</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {ACCOUNT_ISSUES.map(issue => (
                        <div key={issue.name} style={{ display: "flex", alignItems: "flex-start", gap: 8, lineHeight: 1.4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#c14a3e", marginTop: 5, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-color)" }}>{issue.name}</div>
                            <div style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>{issue.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-color)" }}>Emails sent on: 08-31-2026 0/1000</span>
          <i className="pi pi-refresh" style={{ fontSize: 14, color: "var(--text-color-secondary)", cursor: "pointer" }} />
          <i className="pi pi-calendar" style={{ fontSize: 14, color: "var(--text-color-secondary)", cursor: "pointer" }} />
          <select defaultValue="" style={{ ...nativeSelect, width: 170 }}>
            <option value="" disabled>SELECT ACTION</option>
          </select>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--surface-border)" }} />

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <button
          onClick={() => {
            const next = { ...hidden }
            if (activeVisible) next.Active = true
            else delete next.Active
            setStatusHidden(next)
          }}
          style={{
            ...btnSecondary, height: CTRL_H, fontWeight: activeVisible ? 600 : 500,
            background: activeVisible ? tint(STATUS_COLOR.Active, 0.12) : "none",
            color: activeVisible ? STATUS_COLOR.Active : "var(--text-color-secondary)",
            border: activeVisible ? `1px solid ${tint(STATUS_COLOR.Active, 0.4)}` : BORDER,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: activeVisible ? STATUS_COLOR.Active : "var(--surface-border)" }} />
          Active · {countOf("Active")}
        </button>

        <FilterMenu
          icon="pi pi-filter"
          label="Status"
          open={statusMenuOpen}
          onOpenChange={setStatusMenuOpen}
          allChecked={allSelected}
          onToggleAll={toggleAll}
          allCount={allRows.length}
          items={STATUS_ORDER.map(s => ({
            key: s, label: s, color: STATUS_COLOR[s], checked: !hidden[s], count: countOf(s), onToggle: () => toggleStatus(s),
          }))}
        />

        <FilterMenu
          icon="pi pi-user"
          label="Account created by"
          open={creatorMenuOpen}
          onOpenChange={setCreatorMenuOpen}
          allChecked={CREATOR_KINDS.every(k => !hiddenCreators[k])}
          onToggleAll={() => setHiddenCreators(
            CREATOR_KINDS.every(k => !hiddenCreators[k]) ? Object.fromEntries(CREATOR_KINDS.map(k => [k, true])) : {},
          )}
          allCount={allRows.length}
          items={CREATOR_KINDS.map(k => ({
            key: k, label: CREATOR_KIND_LABEL[k], color: CREATOR_COLOR[k], checked: !hiddenCreators[k],
            count: allRows.filter(r => creatorKind(r.by) === k).length,
            onToggle: () => setHiddenCreators(prev => ({ ...prev, [k]: !prev[k] })),
          }))}
        />

        <div style={{ position: "relative" }}>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter ..."
            style={{ ...nativeInput, width: 240, paddingLeft: 28 }}
          />
          <i className="pi pi-search" style={{
            position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
            fontSize: 12, color: "var(--text-color-secondary)", pointerEvents: "none",
          }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ border: BORDER, borderRadius: 12, overflow: "hidden" }}>
        <DataTable
          value={rows}
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={e => setExpandedRows(e.data as DataTableExpandedRows)}
          rowExpansionTemplate={expansionTemplate}
          size="small"
          paginator
          rows={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
          emptyMessage="No accounts match the current filters."
          style={{ background: "var(--surface-card)" }}
          pt={{
            ...tablePt,
            paginator: { root: { style: { borderTop: BORDER, fontSize: 12, padding: "4px 12px", background: "var(--surface-card)" } } },
          }}
        >
          <Column
            header={<input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} style={checkboxStyle} />}
            body={(r: Row) => <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} style={checkboxStyle} />}
            style={{ width: "2.5rem" }}
          />
          <Column expander style={{ width: "3rem" }} />
          <Column style={{ width: "2rem" }} body={(r: Row) => r.issueReason && (
            <HoverTip fixed tip={`${r.issueReason} — resolved automatically by backend processing, not manually.`}>
              <i className="pi pi-exclamation-circle" style={{ fontSize: 15, color: "#c14a3e" }} />
            </HoverTip>
          )} />
          <Column field="name" header="Account Name" sortable
            body={(r: Row) => <span style={{ fontWeight: 600, color: "var(--text-color)" }}>{r.name}</span>} />
          <Column field="email" header="Email" sortable
            body={(r: Row) => (
              <span title={r.email} style={{
                display: "block", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                color: "var(--text-color-secondary)",
              }}>{r.email}</span>
            )} />
          <Column header="Steps" body={(r: Row) => {
            const doneColor = r.status === "Pending email" ? STATUS_COLOR["Pending email"] : STATUS_COLOR.Active
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {r.steps.map((s, i) => (
                  <HoverTip key={i} fixed tip={s.title}><StepDot done={s.done} color={doneColor} /></HoverTip>
                ))}
              </div>
            )
          }} />
          <Column field="status" header="Status" sortable body={(r: Row) => <StatusPill status={r.status} />} />
          <Column header="Distribution Group" body={(r: Row) => (
            <div
              onClick={e => setDgOpen({ row: r, anchor: e.currentTarget.getBoundingClientRect() })}
              style={{ cursor: "pointer", display: "inline-block", lineHeight: 1.35 }}
            >
              <div style={{
                fontWeight: 600, color: "var(--text-color)",
                textDecoration: "underline dotted var(--text-color-secondary)", textUnderlineOffset: 2,
              }}>{r.distGroupId}</div>
              <div style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>{r.recipientEmails.length} recipients</div>
            </div>
          )} />
          <Column field="contract" header="Contract nearest start date" sortable />
          <Column field="created" header="Account created on" sortable />
          <Column field="by" header="Account created by" body={(r: Row) => creatorKind(r.by) === "external" ? (
            <HoverTip fixed tip={
              <>
                <div>{r.by}</div>
                {r.parentName && <div style={{ opacity: 0.7, marginTop: 2 }}>Admin of {r.parentName}</div>}
              </>
            }>
              <span style={{
                lineHeight: 1.4, cursor: "help", color: "var(--text-color)",
                textDecoration: "underline dotted var(--text-color-secondary)", textUnderlineOffset: 2,
              }}>
                External user
              </span>
            </HoverTip>
          ) : r.by} />
          <Column header="Actions" style={{ width: 96, textAlign: "center" }} body={(r: Row) => (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
              <button title="Edit" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex" }}>
                <i className="pi pi-pencil" style={{ fontSize: 13, color: "var(--text-color-secondary)" }} />
              </button>
              {r.status === "Active" && (
                <button
                  onClick={() => toggleChildren(r.id)}
                  title={`Child accounts (${r.childCount})`}
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: 4,
                    display: "inline-flex", alignItems: "center", gap: 3,
                  }}
                >
                  <i className="pi pi-sitemap" style={{ fontSize: 13, color: r.childCount > 0 ? "#cc1111" : "var(--text-color-secondary)" }} />
                  {r.childCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#cc1111" }}>{r.childCount}</span>
                  )}
                </button>
              )}
            </div>
          )} />
        </DataTable>
      </div>

      {dgOpen && (
        <FixedPopover anchor={dgOpen.anchor} onClose={closeDg}>
          <div style={popoverHeading}>Group {dgOpen.row.distGroupId} · {dgOpen.row.recipientEmails.length} recipients</div>
          {dgOpen.row.recipientEmails.map((email, i) => (
            <div key={i} style={{ fontSize: 12, color: "var(--text-color)", padding: "3px 0", whiteSpace: "nowrap" }}>{email}</div>
          ))}
        </FixedPopover>
      )}

      <IntelometryDialog im={im} />
      <NotifyDialog
        key={notifyKey}
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        accountNames={allRows.map(r => r.name)}
        onSent={recordNotifications}
      />
    </div>
  )
}

const CREATOR_KINDS = Object.keys(CREATOR_KIND_LABEL) as CreatorKind[]
const CREATOR_COLOR: Record<CreatorKind, string> = { system: "#6b7280", ammper: "#cc1111", external: "#2563eb" }

type FilterMenuItem = { key: string; label: string; color: string; checked: boolean; count: number; onToggle: () => void }

function FilterMenu({ icon, label, open, onOpenChange, allChecked, onToggleAll, allCount, items }: {
  icon: string
  label: string
  open: boolean
  onOpenChange: (open: boolean) => void
  allChecked: boolean
  onToggleAll: () => void
  allCount: number
  items: FilterMenuItem[]
}) {
  const selected = items.filter(i => i.checked).length
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => onOpenChange(!open)} style={{ ...btnSecondary, height: CTRL_H, fontWeight: 600 }}>
        <i className={icon} style={{ fontSize: 11, color: "var(--text-color-secondary)" }} />
        {label} <span style={{ color: "var(--text-color-secondary)", fontWeight: 500 }}>({selected}/{items.length})</span>
        <i className={open ? "pi pi-chevron-up" : "pi pi-chevron-down"} style={{ fontSize: 10, color: "var(--text-color-secondary)" }} />
      </button>
      {open && (
        <>
          <div onClick={() => onOpenChange(false)} style={backdrop} />
          <div style={{
            ...popoverStyle, position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
            padding: 6, minWidth: 240, display: "flex", flexDirection: "column", gap: 1,
          }}>
            <MenuCheckItem checked={allChecked} onToggle={onToggleAll} dot="var(--text-color)" label="All" count={allCount} bold />
            <div style={{ height: 1, background: "var(--surface-border)", margin: "4px 2px" }} />
            {items.map(i => (
              <MenuCheckItem key={i.key} checked={i.checked} onToggle={i.onToggle}
                dot={i.checked ? i.color : "var(--surface-border)"} label={i.label} count={i.count} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MenuCheckItem({ checked, onToggle, dot, label, count, bold }: {
  checked: boolean; onToggle: () => void; dot: string; label: string; count: number; bold?: boolean
}) {
  const [hover, setHover] = useState(false)
  return (
    <label
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 6, cursor: "pointer",
        background: hover ? "var(--surface-hover)" : "transparent",
      }}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} style={checkboxStyle} />
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot }} />
      <span style={{ flex: 1, fontSize: 12, fontWeight: bold ? 600 : 400, color: "var(--text-color)" }}>{label}</span>
      <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>{count}</span>
    </label>
  )
}

// ── Row expansion: contracts → facilities, notifications ──────────────────────
function AccountExpansion({ row }: { row: Row }) {
  const [expandedContracts, setExpandedContracts] = useState<DataTableExpandedRows | undefined>(undefined)
  const card: React.CSSProperties = { background: "var(--surface-card)", border: BORDER, borderRadius: 8, padding: "14px 16px" }
  const cardTitle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "var(--text-color)", marginBottom: 12 }

  const facilitiesTemplate = (c: AmcContract) => (
    <div style={{ padding: "12px 16px 16px", background: "var(--surface-section)" }}>
      <div style={{ ...cardTitle, fontSize: 12 }}>Facilities of “{row.name}”</div>
      <DataTable value={c.facilities} dataKey="facilityNumber" size="small" style={{ background: "var(--surface-card)" }} pt={tablePt}>
        <Column field="facilityNumber" header="Facility Number" style={{ fontFamily: "monospace" }} />
        <Column field="address" header="Service Address" />
        <Column field="meterStart" header="Meter Start Date" />
        <Column field="meterEnd" header="Meter End Date" />
        <Column header="Contract Number" body={() => c.number} />
      </DataTable>
    </div>
  )

  return (
    <div style={{ padding: "12px 16px 16px", background: "rgba(204,17,17,0.04)", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={card}>
        <div style={cardTitle}>Contracts</div>
        <DataTable
          value={[row.contractDetail]}
          dataKey="number"
          expandedRows={expandedContracts}
          onRowToggle={e => setExpandedContracts(e.data as DataTableExpandedRows)}
          rowExpansionTemplate={facilitiesTemplate}
          size="small"
          style={{ background: "var(--surface-card)" }}
          pt={tablePt}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column field="number" header="Contract Number" />
          <Column field="executed" header="Executed" />
          <Column field="start" header="Start" />
          <Column field="end" header="End" />
        </DataTable>
      </div>

      {row.status === "Active" && <ChildAccountsCard row={row} />}

      {row.notifications.length > 0 && (
        <div style={card}>
          <div style={cardTitle}>Notifications</div>
          {row.notifications.map((n, i) => (
            <div key={i} style={{ borderTop: BORDER, padding: "10px 0", display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>Welcome packet sent on {n.sentAt} by {n.by}</div>
              <div style={{ fontSize: 12, color: "var(--text-color)" }}>{n.emails.join(", ")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Child accounts ─────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<ChildRole, string> = { admin: "#7c5cd6", user: "#2563eb" }
const CHILD_GRID = "minmax(0, 1fr) 150px 70px 160px"

function RolePill({ role }: { role: ChildRole }) {
  const color = ROLE_COLOR[role]
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 8px", borderRadius: 20,
      fontSize: 10, fontWeight: 700, background: tint(color, 0.14), color, textTransform: "capitalize",
    }}>
      <i className={role === "admin" ? "pi pi-shield" : "pi pi-user"} style={{ fontSize: 8 }} />
      {role}
    </span>
  )
}

function ChildAccountsCard({ row }: { row: Row }) {
  const { accounts } = useAccountManager()
  const children = childAccountsOf(row.id, accounts)
  const admins = children.filter(c => c.role === "admin").length

  return (
    <div id={`children-${row.id}`} style={{ background: "var(--surface-card)", border: BORDER, borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <i className="pi pi-sitemap" style={{ fontSize: 13, color: "#cc1111", marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-color)" }}>Child accounts</div>
            <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginTop: 2, lineHeight: 1.45 }}>
              Created from this account&rsquo;s dashboard. Admins get their own row in the table and can create accounts; users can&rsquo;t.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: ROLE_COLOR.admin, fontWeight: 600 }}>{admins} admin</span>
          <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>·</span>
          <span style={{ fontSize: 11, color: ROLE_COLOR.user, fontWeight: 600 }}>{children.length - admins} user</span>
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6,
        background: "var(--surface-section)", border: BORDER,
      }}>
        <i className="pi pi-building" style={{ fontSize: 12, color: "var(--text-color-secondary)" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-color)" }}>{row.name}</span>
        <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>{row.email}</span>
      </div>

      {children.length === 0 ? (
        <div style={{
          marginTop: 10, marginLeft: 14, border: "1px dashed var(--surface-border)", borderRadius: 8, padding: "14px",
          fontSize: 12, color: "var(--text-color-secondary)", display: "flex", alignItems: "center", gap: 8,
        }}>
          <i className="pi pi-inbox" style={{ fontSize: 14 }} />
          No child accounts yet.
        </div>
      ) : (
        <div style={{ marginLeft: 14 }}>
          <div style={{
            display: "grid", gridTemplateColumns: CHILD_GRID, gap: 10, padding: "10px 10px 6px 26px",
            fontSize: 11, fontWeight: 600, color: "var(--text-color-secondary)",
          }}>
            <span>Email</span><span>Creation date</span><span>Role</span><span>Status</span>
          </div>
          <ChildTree nodes={children} accounts={accounts} pool={row.contractDetail.facilities} />
        </div>
      )}
    </div>
  )
}

// `pool` is the creator's facilities: the parent account's at the top level, an admin's assigned ones below it.
function ChildTree({ nodes, accounts, pool }: { nodes: ChildAccount[]; accounts: AmcAccount[]; pool: AmcFacility[] }) {
  return (
    <div style={{ borderLeft: BORDER }}>
      {nodes.map(n => <ChildNode key={n.accountId ?? n.email} node={n} accounts={accounts} pool={pool} />)}
    </div>
  )
}

function ChildNode({ node, accounts, pool }: { node: ChildAccount; accounts: AmcAccount[]; pool: AmcFacility[] }) {
  const [open, setOpen] = useState(false)
  const [facilitiesOpen, setFacilitiesOpen] = useState(false)
  const facilities = assignedFacilities(node.email, pool)
  const account = node.accountId ? accounts.find(a => a.contractDetail.number === node.accountId) : undefined
  const status = account ? (computeStatus(account) as Status) : null
  const grandchildren = node.accountId ? childAccountsOf(node.accountId, accounts) : []
  const canExpand = grandchildren.length > 0

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ width: 14, height: 1, background: "var(--surface-border)", flexShrink: 0 }} />
        <button
          onClick={() => canExpand && setOpen(o => !o)}
          style={{
            width: 12, marginRight: 0, padding: 0, background: "none", border: "none", flexShrink: 0,
            cursor: canExpand ? "pointer" : "default", display: "inline-flex", justifyContent: "center",
          }}
        >
          {canExpand && <i className={open ? "pi pi-chevron-down" : "pi pi-chevron-right"} style={{ fontSize: 9, color: "var(--text-color-secondary)" }} />}
        </button>
        <div style={{
          flex: 1, display: "grid", gridTemplateColumns: CHILD_GRID, gap: 10, alignItems: "center",
          padding: "7px 10px", borderBottom: BORDER, fontSize: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ color: "var(--text-color)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.email}</span>
              <button
                onClick={() => setFacilitiesOpen(o => !o)}
                title="Assigned facilities"
                style={{
                  ...btnSecondary, padding: "1px 8px", fontSize: 10, gap: 4, flexShrink: 0,
                  border: facilitiesOpen ? "1px solid #cc1111" : BORDER,
                  color: facilitiesOpen ? "#cc1111" : "var(--text-color-secondary)",
                  background: facilitiesOpen ? "rgba(204,17,17,0.06)" : "none",
                }}
              >
                <i className="pi pi-building" style={{ fontSize: 9 }} />
                {facilities.length}
                <i className={facilitiesOpen ? "pi pi-chevron-up" : "pi pi-chevron-down"} style={{ fontSize: 8 }} />
              </button>
            </div>
            {canExpand && (
              <div style={{ fontSize: 10, color: "var(--text-color-secondary)", marginTop: 3 }}>
                <i className="pi pi-sitemap" style={{ fontSize: 9, marginRight: 3 }} />{grandchildren.length} child account{grandchildren.length === 1 ? "" : "s"}
              </div>
            )}
          </div>
          <span style={{ color: "var(--text-color-secondary)" }}>{node.created}</span>
          <span><RolePill role={node.role} /></span>
          <span>{status ? <StatusPill status={status} /> : <span style={{ color: "var(--text-color-secondary)" }}>—</span>}</span>
        </div>
      </div>
      {facilitiesOpen && (
        <div style={{ margin: "8px 10px 10px 36px", border: BORDER, borderRadius: 8, overflow: "hidden", background: "var(--surface-section)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: BORDER }}>
            <i className="pi pi-building" style={{ fontSize: 11, color: "#cc1111" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-color)" }}>Assigned facilities</span>
            <span style={{
              padding: "0 7px", borderRadius: 20, fontSize: 10, fontWeight: 600,
              background: tint("#2563eb", 0.12), color: "#2563eb",
            }}>{facilities.length}</span>
          </div>
          <DataTable value={facilities} dataKey="facilityNumber" size="small" style={{ background: "var(--surface-card)" }} pt={tablePt}>
            <Column field="facilityNumber" header="Facility Number" style={{ fontFamily: "monospace" }} />
            <Column field="address" header="Service Address" />
            <Column field="meterStart" header="Meter Start Date" />
          </DataTable>
        </div>
      )}
      {open && (
        <div style={{ marginLeft: 26 }}>
          <ChildTree nodes={grandchildren} accounts={accounts} pool={facilities} />
        </div>
      )}
    </div>
  )
}

// ── Intelometry check ──────────────────────────────────────────────────────────
type Diff = {
  contractNumber: string; accountName: string
  oldStart: string; newStart: string
  oldEnd: string; newEnd: string
  oldEmail: string; newEmail: string
}
type BgJob = { status: "running" } | { status: "done"; foundCount: number } | null

function useIntelometry(allRows: Row[], onSave: (contractNumbers: string[]) => void, schedule: IntelometrySchedule) {
  const [open, setOpen] = useState(false)
  const [inputs, setInputs] = useState(["", "", "", "", ""])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [results, setResults] = useState<Diff[] | null>(null)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [staged, setStaged] = useState<string[]>([])
  const [commitOpen, setCommitOpen] = useState(false)
  const [committed, setCommitted] = useState(false)
  const [commitMessage, setCommitMessage] = useState("")
  const [savedCount, setSavedCount] = useState<number | null>(null)
  const [bgJob, setBgJob] = useState<BgJob>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Starts null so server and client render the same markup; the clock begins on mount.
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(id)
  }, [])

  const computeDiff = useMemo(() => {
    const index = new Map(allRows.map(r => [r.contractDetail.number, r]))
    return (cn: string): Diff | null => {
      const change = INTELOMETRY_CHANGES[cn]
      const current = index.get(cn)
      if (!change || !current) return null
      const cd = current.contractDetail
      const newStart = change.newStart || cd.start
      const newEnd = change.newEnd || cd.end
      const newEmail = change.newEmail || current.email
      if (newStart === cd.start && newEnd === cd.end && newEmail === current.email) return null
      return {
        contractNumber: cn, accountName: current.name,
        oldStart: cd.start, newStart, oldEnd: cd.end, newEnd, oldEmail: current.email, newEmail,
      }
    }
  }, [allRows])
  // The background job resolves after a delay, so it must read the latest diff function.
  const diffRef = useRef(computeDiff)
  useEffect(() => { diffRef.current = computeDiff }, [computeDiff])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const bgRunning = bgJob?.status === "running"
  const scheduledRun = now ? activeScheduledSlot(schedule, now) : null
  const manualLocked = !!scheduledRun
  const quickDisabled = !inputs.some(v => v.trim()) || bgRunning || manualLocked
  const fullDisabled = bgRunning || manualLocked
  const anySelected = Object.values(selected).some(Boolean)
  const hasStaged = staged.length > 0

  const resetTransient = () => {
    setResults(null); setSelected({}); setStaged([]); setCommitOpen(false); setCommitted(false); setCommitMessage("")
  }

  const runQuick = () => {
    if (quickDisabled) return
    const cns = inputs.map(v => v.trim().toUpperCase()).filter(Boolean)
    resetTransient()
    setResults(cns.map(cn => computeDiff(cn)).filter((d): d is Diff => !!d))
  }
  const confirmFull = () => {
    if (fullDisabled) return
    setConfirmOpen(false)
    setOpen(false)
    setBgJob({ status: "running" })
    timer.current = setTimeout(() => {
      const found = Object.keys(INTELOMETRY_CHANGES).map(cn => diffRef.current(cn)).filter((d): d is Diff => !!d)
      resetTransient()
      setResults(found)
      setBgJob({ status: "done", foundCount: found.length })
    }, 6000)
  }
  // When a scheduled run finishes, surface its findings unless a review is already in progress.
  const prevScheduledRun = useRef<string | null>(null)
  useEffect(() => {
    const wasRunning = prevScheduledRun.current
    prevScheduledRun.current = scheduledRun
    if (!wasRunning || scheduledRun || hasStaged || committed) return
    const found = Object.keys(INTELOMETRY_CHANGES).map(cn => diffRef.current(cn)).filter((d): d is Diff => !!d)
    setResults(found); setSelected({}); setStaged([]); setCommitOpen(false); setCommitMessage("")
    setBgJob({ status: "done", foundCount: found.length })
  }, [scheduledRun, hasStaged, committed])
  useEffect(() => { if (manualLocked) setConfirmOpen(false) }, [manualLocked])

  const stage = () => {
    if (!anySelected) return
    setStaged(Object.keys(selected).filter(k => selected[k]))
    setCommitOpen(false); setCommitted(false); setCommitMessage("")
  }
  const openCommit = () => { if (hasStaged && !committed) setCommitOpen(true) }
  const confirmCommit = () => {
    if (!commitMessage.trim()) return
    setCommitted(true)
    setCommitOpen(false)
  }
  const save = () => {
    if (!committed) return
    const cns = staged.filter(cn => INTELOMETRY_CHANGES[cn])
    onSave(cns)
    if (timer.current) clearTimeout(timer.current)
    setBgJob(null)
    setSavedCount(cns.length)
    resetTransient()
  }
  const closeSaved = () => { setOpen(false); setSavedCount(null) }
  // Steps back one level at a time; plain close keeps fetched results for reopening.
  const cancel = () => {
    if (confirmOpen) { setConfirmOpen(false); return }
    if (bgRunning) {
      if (timer.current) clearTimeout(timer.current)
      setBgJob(null)
      setOpen(false)
      return
    }
    if (commitOpen || committed) { setCommitOpen(false); setCommitted(false); setCommitMessage(""); return }
    if (hasStaged) { setStaged([]); return }
    setOpen(false)
  }

  return {
    open, setOpen, inputs, setInputs, confirmOpen, setConfirmOpen, results, selected, setSelected, staged,
    commitOpen, committed, commitMessage, setCommitMessage, savedCount, bgJob, bgRunning,
    quickDisabled, fullDisabled, anySelected, hasStaged,
    now, scheduledRun, manualLocked,
    runQuick, confirmFull, stage, openCommit, confirmCommit, save, closeSaved, cancel,
  }
}

const dialogPt = {
  root: { style: { borderRadius: 12, overflow: "hidden", border: BORDER, boxShadow: "0 24px 64px rgba(0,0,0,0.35)" } },
  header: { style: { background: "var(--surface-card)", borderBottom: BORDER, padding: "1rem 1.25rem" } },
  content: { style: { background: "var(--surface-card)", padding: "1.25rem" } },
  footer: { style: { background: "var(--surface-card)", borderTop: BORDER, padding: "0.75rem 1.25rem" } },
}

const sectionCard: React.CSSProperties = {
  background: "var(--surface-section)", border: BORDER, borderRadius: 10, padding: "14px 16px",
  display: "flex", flexDirection: "column", gap: 10,
}

function DialogHeader({ icon, color, title, subtitle }: { icon: string; color: string; title: string; subtitle: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, background: tint(color, 0.12), flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <i className={icon} style={{ fontSize: 15, color }} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-color)" }}>{title}</div>
        <div style={{ fontSize: 11, fontWeight: 400, color: "var(--text-color-secondary)", marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  )
}

function SectionTitle({ icon, title, hint, right }: { icon: string; title: React.ReactNode; hint?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <i className={icon} style={{ fontSize: 12, color: "#cc1111", marginTop: 2 }} />
        <div>
          <div style={fieldLabel}>{title}</div>
          {hint && <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginTop: 2, lineHeight: 1.45 }}>{hint}</div>}
        </div>
      </div>
      {right}
    </div>
  )
}

function Banner({ color, icon, children }: { color: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 8,
      background: tint(color, 0.1), border: `1px solid ${tint(color, 0.3)}`, color, fontSize: 12, lineHeight: 1.5,
    }}>
      <i className={icon} style={{ fontSize: 13, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

const WORKFLOW = ["Select", "Stage", "Commit", "Save"]

function WorkflowSteps({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {WORKFLOW.map((label, i) => {
        const done = i < current
        const active = i === current
        const color = done ? "#2d7a2d" : active ? "#cc1111" : "var(--text-color-secondary)"
        return (
          <React.Fragment key={label}>
            {i > 0 && <span style={{ width: 14, height: 1, background: "var(--surface-border)" }} />}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: active ? 700 : 500, color }}>
              <span style={{
                width: 16, height: 16, borderRadius: "50%", fontSize: 9, fontWeight: 700,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: done ? "#2d7a2d" : active ? "#cc1111" : "transparent",
                border: done || active ? "none" : BORDER, color: done || active ? "#fff" : "var(--text-color-secondary)",
              }}>
                {done ? <i className="pi pi-check" style={{ fontSize: 8 }} /> : i + 1}
              </span>
              {label}
            </span>
          </React.Fragment>
        )
      })}
    </div>
  )
}

function IntelometryDialog({ im }: { im: ReturnType<typeof useIntelometry> }) {
  const stagedDiffs = im.staged
    .map(cn => im.results?.find(r => r.contractNumber === cn))
    .filter((d): d is Diff => !!d)
  const hasResults = !!im.results && im.results.length > 0
  const saved = im.savedCount !== null
  const workflowStep = im.committed ? 3 : im.hasStaged ? 2 : im.anySelected ? 1 : 0

  const diffLine = (label: string, from: string, to: string) => (
    <div style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 8, fontSize: 12, alignItems: "baseline" }}>
      <span style={{ color: "var(--text-color-secondary)" }}>{label}</span>
      <span>
        <span style={{ textDecoration: "line-through", color: "#c14a3e" }}>{from}</span>
        <i className="pi pi-arrow-right" style={{ fontSize: 9, margin: "0 8px", color: "var(--text-color-secondary)" }} />
        <span style={{ color: "#2d7a2d", fontWeight: 600 }}>{to}</span>
      </span>
    </div>
  )

  const footer = saved ? undefined : (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      {hasResults ? <WorkflowSteps current={workflowStep} /> : <span />}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={im.cancel} style={btnSecondary}>{hasResults ? "Cancel" : "Close"}</button>
        {hasResults && (
          <>
            <button onClick={im.stage} disabled={!im.anySelected} style={{ ...btnSecondary, ...disabledStyle(!im.anySelected) }}>
              <i className="pi pi-inbox" style={{ fontSize: 11 }} />
              Stage
            </button>
            <button onClick={im.openCommit} disabled={!im.hasStaged || im.committed}
              style={{ ...btnSecondary, ...disabledStyle(!im.hasStaged || im.committed) }}>
              <i className="pi pi-check-square" style={{ fontSize: 11 }} />
              Commit
            </button>
            <button onClick={im.save} disabled={!im.committed} style={{ ...btnPrimary, ...disabledStyle(!im.committed) }}>
              <i className="pi pi-save" style={{ fontSize: 11 }} />
              Save
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <Dialog
      visible={im.open}
      onHide={() => (saved ? im.closeSaved() : im.cancel())}
      header={<DialogHeader icon="pi pi-sync" color="#2563eb" title="Intelometry Check"
        subtitle="Reconcile contract dates and primary emails against Intelometry" />}
      showHeader={!saved}
      footer={footer}
      style={{ width: 1200, maxWidth: "96vw" }}
      pt={dialogPt}
      modal
      dismissableMask
    >
      {saved ? (
        <SuccessPanel title="Changes saved" message={`${im.savedCount} contract(s) updated in the account records.`} onClose={im.closeSaved} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {im.bgRunning && (
            <Banner color="#2563eb" icon="pi pi-spin pi-spinner">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Full-database search running in the background… this can take several minutes.</span>
                <span onClick={im.cancel} style={{ marginLeft: "auto", textDecoration: "underline", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 600 }}>
                  Cancel search
                </span>
              </div>
            </Banner>
          )}

          {im.scheduledRun && (
            <Banner color="#2563eb" icon="pi pi-spin pi-spinner">
              <span style={{ fontWeight: 600 }}>Scheduled Intelometry query running (started {im.scheduledRun}).</span>{" "}
              Manual querying is disabled until it finishes.
            </Banner>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
            <div style={sectionCard}>
              <SectionTitle icon="pi pi-list" title="Query up to 5 contract numbers" hint="Look up specific contracts instantly." />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {im.inputs.map((v, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                      fontSize: 10, fontWeight: 700, color: "var(--text-color-secondary)", pointerEvents: "none",
                    }}>{i + 1}</span>
                    <input
                      value={v}
                      onChange={e => im.setInputs(prev => prev.map((p, j) => (j === i ? e.target.value : p)))}
                      onKeyDown={e => { if (e.key === "Enter") im.runQuick() }}
                      placeholder={`Contract number ${i + 1}`}
                      disabled={im.manualLocked}
                      style={{ ...nativeInput, width: "100%", paddingLeft: 24, ...disabledStyle(im.manualLocked) }}
                    />
                  </div>
                ))}
              </div>
              <button onClick={im.runQuick} disabled={im.quickDisabled}
                style={{ ...btnPrimary, alignSelf: "flex-end", ...disabledStyle(im.quickDisabled) }}>
                <i className="pi pi-search" style={{ fontSize: 11 }} />
                Search
              </button>
            </div>

            <div style={sectionCard}>
              <SectionTitle icon="pi pi-database" title="Query entire database"
                hint="This process may take several minutes and can run in the background." />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
                {im.confirmOpen ? (
                  <Banner color="#b45309" icon="pi pi-exclamation-triangle">
                    <div>This will query the entire database and may take several minutes. It will continue running in the background. Continue?</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button onClick={im.confirmFull} style={btnPrimary}>Confirm</button>
                      <button onClick={() => im.setConfirmOpen(false)} style={btnSecondary}>Cancel</button>
                    </div>
                  </Banner>
                ) : (
                  <div style={{
                    border: "1px dashed var(--surface-border)", borderRadius: 8, padding: "18px 14px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center",
                  }}>
                    <i className="pi pi-server" style={{ fontSize: 20, color: "var(--text-color-secondary)" }} />
                    <div style={{ fontSize: 11, color: "var(--text-color-secondary)", maxWidth: 260, lineHeight: 1.5 }}>
                      Scans every contract for differences. You can close this window while it runs.
                    </div>
                  </div>
                )}
              </div>
              {!im.confirmOpen && (
                <button onClick={() => !im.fullDisabled && im.setConfirmOpen(true)} disabled={im.fullDisabled}
                  style={{ ...btnPrimary, alignSelf: "flex-end", ...disabledStyle(im.fullDisabled) }}>
                  <i className="pi pi-database" style={{ fontSize: 11 }} />
                  Search
                </button>
              )}
            </div>

            <ScheduleCard now={im.now} />
          </div>

          {im.results && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SectionTitle icon="pi pi-table" title="Results"
                hint={hasResults ? "Select the contracts to stage. Values shown are the new ones from Intelometry." : undefined}
                right={hasResults && (
                  <span style={{
                    padding: "1px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: tint("#2563eb", 0.12), color: "#2563eb",
                  }}>{im.results.length}</span>
                )} />
              {hasResults ? (
                <div style={{ border: BORDER, borderRadius: 8, overflow: "hidden" }}>
                  <DataTable value={im.results} dataKey="contractNumber" size="small" style={{ background: "var(--surface-card)" }} pt={tablePt}
                    onRowClick={e => {
                      const cn = (e.data as Diff).contractNumber
                      im.setSelected(prev => ({ ...prev, [cn]: !prev[cn] }))
                    }}
                  >
                    <Column style={{ width: "2.5rem" }} body={(r: Diff) => (
                      <input type="checkbox" readOnly checked={!!im.selected[r.contractNumber]} style={checkboxStyle} />
                    )} />
                    <Column field="contractNumber" header="Contract Number"
                      body={(r: Diff) => <span style={{ fontWeight: 600 }}>{r.contractNumber}</span>} />
                    <Column field="accountName" header="Account" />
                    <Column field="newStart" header="Start Date" />
                    <Column field="newEnd" header="End Date" />
                    <Column field="newEmail" header="Primary Email" />
                  </DataTable>
                </div>
              ) : (
                <div style={{
                  border: "1px dashed var(--surface-border)", borderRadius: 8, padding: "22px 14px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                }}>
                  <i className="pi pi-inbox" style={{ fontSize: 20, color: "var(--text-color-secondary)" }} />
                  <div style={{ fontSize: 12, color: "var(--text-color-secondary)" }}>No pending changes found for the given contract number(s).</div>
                </div>
              )}
            </div>
          )}

          {im.commitOpen && (
            <div style={sectionCard}>
              <SectionTitle icon="pi pi-pencil" title="Commit message" hint="Describe what changed and why, for traceability." />
              <textarea
                value={im.commitMessage}
                onChange={e => im.setCommitMessage(e.target.value)}
                placeholder="e.g. Aligning contract dates with Intelometry feed"
                style={{ ...nativeInput, height: "auto", minHeight: 72, padding: 8, resize: "vertical", width: "100%" }}
              />
              <button onClick={im.confirmCommit} disabled={!im.commitMessage.trim()}
                style={{ ...btnPrimary, alignSelf: "flex-end", ...disabledStyle(!im.commitMessage.trim()) }}>
                <i className="pi pi-check" style={{ fontSize: 11 }} />
                Confirm commit
              </button>
            </div>
          )}

          {im.committed && (
            <Banner color="#2d7a2d" icon="pi pi-check-circle">
              Committed by <strong>{CURRENT_USER}</strong> — “{im.commitMessage}”
            </Banner>
          )}

          {stagedDiffs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SectionTitle icon="pi pi-eye" title="Preview — before / after" />
              {stagedDiffs.map(d => (
                <div key={d.contractNumber} style={{
                  background: "var(--surface-section)", border: BORDER, borderLeft: "3px solid #cc1111", borderRadius: 8,
                  padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-color)" }}>
                    {d.accountName} <span style={{ color: "var(--text-color-secondary)", fontWeight: 500 }}>· {d.contractNumber}</span>
                  </div>
                  {d.oldStart !== d.newStart && diffLine("Start Date", d.oldStart, d.newStart)}
                  {d.oldEnd !== d.newEnd && diffLine("End Date", d.oldEnd, d.newEnd)}
                  {d.oldEmail !== d.newEmail && diffLine("Primary Email", d.oldEmail, d.newEmail)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}

// ── Intelometry schedule ───────────────────────────────────────────────────────
function ScheduleCard({ now }: { now: Date | null }) {
  const { intelometrySchedule: schedule, scheduleHistory, saveIntelometrySchedule } = useAccountManager()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)

  return (
    <>
      {/* Remounting on every save resets the draft to whatever was saved last, by anyone. */}
      <ScheduleEditor
        key={`${schedule.updatedAt}|${schedule.updatedBy}|${scheduleHistory.length}`}
        schedule={schedule}
        now={now}
        historyCount={scheduleHistory.length}
        savedNotice={savedNotice}
        onEdit={() => setSavedNotice(false)}
        onSave={(days, slots) => { saveIntelometrySchedule(days, slots, CURRENT_USER); setSavedNotice(true) }}
        onHistory={() => setHistoryOpen(true)}
      />
      <ScheduleHistoryDialog open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}

function ScheduleEditor({ schedule, now, historyCount, savedNotice, onEdit, onSave, onHistory }: {
  schedule: IntelometrySchedule
  now: Date | null
  historyCount: number
  savedNotice: boolean
  onEdit: () => void
  onSave: (days: number[], slots: string[]) => void
  onHistory: () => void
}) {
  const [days, setDays] = useState<number[]>(schedule.days)
  const [slots, setSlots] = useState<string[]>(schedule.slots)
  const { resolvedTheme } = useTheme()

  const validation = validateSchedule(days, slots)
  const dirty = formatDays(days) !== formatDays(schedule.days) || formatSlots(slots) !== formatSlots(schedule.slots)
  const canSave = dirty && !validation.message
  const nextRun = now ? nextScheduledRun(schedule, now) : null

  const editDays = (next: number[]) => { setDays(next); onEdit() }
  const editSlots = (next: string[]) => { setSlots(next); onEdit() }
  const toggleDay = (d: number) => editDays(days.includes(d) ? days.filter(x => x !== d) : [...days, d])

  const stepLabel = (n: number, text: string, right?: React.ReactNode) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 16, height: 16, borderRadius: "50%", fontSize: 9, fontWeight: 700, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "rgba(204,17,17,0.12)", color: "#cc1111",
      }}>{n}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-color)", flex: 1 }}>{text}</span>
      {right}
    </div>
  )
  const linkBtn: React.CSSProperties = {
    background: "none", border: "none", padding: 0, fontSize: 11, color: "#2563eb", cursor: "pointer", fontFamily: "inherit",
  }

  return (
    <div style={sectionCard}>
      <SectionTitle
        icon="pi pi-calendar"
        title={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            Schedule
            <HoverTip tip="Scheduling will query complete Intelometry database">
              <i className="pi pi-info-circle" style={{ fontSize: 11, color: "var(--text-color-secondary)", cursor: "help" }} />
            </HoverTip>
          </span>
        }
        hint="Run the query automatically on set days and times."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {stepLabel(1, "Days of the week", (
          <span style={{ display: "inline-flex", gap: 8 }}>
            <button onClick={() => editDays([1, 2, 3, 4, 5])} style={linkBtn}>Weekdays</button>
            <button onClick={() => editDays([...DAY_ORDER])} style={linkBtn}>Every day</button>
            <button onClick={() => editDays([])} style={{ ...linkBtn, color: "var(--text-color-secondary)" }}>Clear</button>
          </span>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {DAY_ORDER.map(d => {
            const on = days.includes(d)
            return (
              <button key={d} onClick={() => toggleDay(d)} style={{
                height: 28, borderRadius: 6, fontSize: 11, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit",
                border: on ? "1px solid #cc1111" : BORDER,
                background: on ? "rgba(204,17,17,0.10)" : "var(--surface-card)",
                color: on ? "#cc1111" : "var(--text-color-secondary)",
              }}>
                {DAY_LABEL[d]}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {stepLabel(2, "Time slots", (
          <span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>{slots.length}/{MAX_SLOTS}</span>
        ))}
        {slots.map((slot, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i className="pi pi-clock" style={{ fontSize: 11, color: "var(--text-color-secondary)", width: 14 }} />
            <input
              type="time"
              value={slot}
              onChange={e => editSlots(slots.map((s, j) => (j === i ? e.target.value : s)))}
              style={{
                ...nativeInput, flex: 1, colorScheme: resolvedTheme === "light" ? "light" : "dark",
                borderColor: validation.badSlots.has(i) ? "#cc1111" : undefined,
              }}
            />
            <button onClick={() => editSlots(slots.filter((_, j) => j !== i))} title="Remove time slot"
              style={{ ...btnSecondary, width: CTRL_H, height: CTRL_H, padding: 0, justifyContent: "center" }}>
              <i className="pi pi-trash" style={{ fontSize: 11 }} />
            </button>
          </div>
        ))}
        {slots.length < MAX_SLOTS && (
          <button onClick={() => editSlots([...slots, ""])}
            style={{ ...btnSecondary, alignSelf: "flex-start", borderStyle: "dashed" }}>
            <i className="pi pi-plus" style={{ fontSize: 10 }} />
            Add time slot
          </button>
        )}
        <div style={{ fontSize: 10, color: "var(--text-color-secondary)", lineHeight: 1.45 }}>
          At least 2 hours apart, up to {MAX_SLOTS} scheduled queries per day. Manual queries are unlimited.
        </div>
        {validation.message && <div style={errorText}>{validation.message}</div>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {stepLabel(3, "Save")}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1, fontSize: 11, color: savedNotice ? "#2d7a2d" : "var(--text-color-secondary)" }}>
            {savedNotice ? (
              <><i className="pi pi-check" style={{ fontSize: 10, marginRight: 4 }} />Schedule saved</>
            ) : dirty ? "Unsaved changes" : nextRun ? `Next run: ${nextRun}` : "Scheduling is off"}
          </span>
          {dirty && (
            <button onClick={() => { setDays(schedule.days); setSlots(schedule.slots) }} style={btnSecondary}>Discard</button>
          )}
          <button onClick={() => canSave && onSave(days, slots)} disabled={!canSave}
            style={{ ...btnPrimary, ...disabledStyle(!canSave) }}>
            <i className="pi pi-save" style={{ fontSize: 11 }} />
            Save
          </button>
        </div>
      </div>

      <div style={{
        marginTop: "auto", background: "var(--surface-card)", border: BORDER, borderRadius: 8, padding: "8px 10px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <i className="pi pi-user-edit" style={{ fontSize: 13, color: "var(--text-color-secondary)" }} />
        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>
          <div style={{ fontSize: 10, color: "var(--text-color-secondary)" }}>Last configured by</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-color)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {schedule.updatedBy}{schedule.updatedBy === CURRENT_USER ? " (you)" : ""}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-color-secondary)" }}>on {schedule.updatedAt}</div>
        </div>
        <button onClick={onHistory} style={{ ...btnSecondary, padding: "0.25rem 0.625rem", fontSize: 11 }}>
          <i className="pi pi-history" style={{ fontSize: 11 }} />
          History
          <span style={{
            padding: "0 6px", borderRadius: 20, fontSize: 10, fontWeight: 600,
            background: "var(--surface-section)", color: "var(--text-color-secondary)",
          }}>{historyCount}</span>
        </button>
      </div>
    </div>
  )
}

function ScheduleHistoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { intelometrySchedule: schedule, scheduleHistory } = useAccountManager()
  const rows = [...scheduleHistory].reverse().map((h, i) => ({ ...h, key: `${h.at}-${i}`, current: i === 0 }))

  return (
    <Dialog
      visible={open}
      onHide={onClose}
      header={<DialogHeader icon="pi pi-history" color="#2563eb" title="Schedule history"
        subtitle="Every change to the Intelometry schedule, newest first" />}
      footer={<div style={{ display: "flex", justifyContent: "flex-end" }}><button onClick={onClose} style={btnSecondary}>Close</button></div>}
      style={{ width: 720, maxWidth: "95vw" }}
      pt={dialogPt}
      modal
      dismissableMask
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ ...sectionCard, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <i className="pi pi-calendar" style={{ fontSize: 16, color: "#cc1111" }} />
          <div style={{ flex: 1 }}>
            <div style={fieldLabel}>Current settings</div>
            <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginTop: 2 }}>
              {schedule.days.length === 0 && schedule.slots.length === 0
                ? "Scheduling is off"
                : `${formatDays(schedule.days)} at ${formatSlots(schedule.slots)}`}
            </div>
          </div>
        </div>
        <div style={{ border: BORDER, borderRadius: 8, overflow: "hidden" }}>
          <DataTable value={rows} dataKey="key" size="small" style={{ background: "var(--surface-card)" }} pt={tablePt}>
            <Column field="at" header="Changed on" style={{ whiteSpace: "nowrap", verticalAlign: "top" }} />
            <Column header="Changed by" style={{ verticalAlign: "top" }} body={(r: typeof rows[number]) => (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                <span style={{ fontWeight: 600, color: "var(--text-color)" }}>{r.by}{r.by === CURRENT_USER ? " (you)" : ""}</span>
                {r.current && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5, padding: "1px 8px", borderRadius: 20,
                    fontSize: 10, fontWeight: 600, background: tint("#2d7a2d", 0.14), color: "#2d7a2d",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2d7a2d" }} />
                    Current
                  </span>
                )}
              </div>
            )} />
            <Column header="Changes" body={(r: typeof rows[number]) => (
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {r.changes.map((c, i) => <span key={i} style={{ color: "var(--text-color)" }}>{c}</span>)}
              </div>
            )} />
          </DataTable>
        </div>
      </div>
    </Dialog>
  )
}

function SuccessPanel({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  return (
    <div style={{ padding: "28px 24px 12px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%", background: tint("#2d7a2d", 0.12),
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4,
      }}>
        <i className="pi pi-check" style={{ fontSize: 24, color: "#2d7a2d" }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-color)" }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--text-color-secondary)", maxWidth: 380, lineHeight: 1.5 }}>{message}</div>
      <button onClick={onClose} style={{ ...btnPrimary, marginTop: 10, padding: "0.45rem 1.5rem" }}>Close</button>
    </div>
  )
}

// ── Notify ─────────────────────────────────────────────────────────────────────
type Association = { checked: boolean; query: string; selected: string | null; open: boolean }
const emptyAssociation = (): Association => ({ checked: false, query: "", selected: null, open: false })
type SingleRow = { value: string; assoc: Association }

function AssociatePicker({ assoc, onChange, accountNames, taken, labelSize = 12 }: {
  assoc: Association
  onChange: (next: Association) => void
  accountNames: string[]
  taken: Set<string>
  labelSize?: number
}) {
  // Only an exact existing account name counts as a selection; free text never does.
  const q = assoc.query.trim().toLowerCase()
  const matches = (q ? accountNames.filter(n => n.toLowerCase().includes(q)) : accountNames)
    .filter(n => !taken.has(n))
    .slice(0, 8)
  const invalid = assoc.checked && assoc.query.trim().length > 0 && !assoc.selected

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={assoc.checked}
          onChange={() => onChange(assoc.checked ? emptyAssociation() : { ...assoc, checked: true })}
          style={checkboxStyle}
        />
        <span style={{ fontSize: labelSize, color: "var(--text-color)" }}>Associate to account</span>
      </label>
      {assoc.checked && (
        <>
          <div style={{ position: "relative" }}>
            <input
              value={assoc.query}
              onChange={e => {
                const v = e.target.value
                const names = new Set(accountNames)
                onChange({ ...assoc, query: v, open: true, selected: names.has(v) && !taken.has(v) ? v : null })
              }}
              onClick={() => onChange({ ...assoc, open: true })}
              placeholder="Type to search accounts..."
              style={{ ...nativeInput, width: "100%" }}
            />
            {assoc.open && (
              <>
                <div onClick={() => onChange({ ...assoc, open: false })} style={{ ...backdrop, zIndex: 10 }} />
                <div style={{
                  ...popoverStyle, position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 11,
                  maxHeight: 190, overflowY: "auto", padding: 4,
                }}>
                  {matches.map(name => <MatchItem key={name} name={name}
                    onChoose={() => onChange({ ...assoc, query: name, selected: name, open: false })} />)}
                  {matches.length === 0 && (
                    <div style={{ padding: "7px 10px", fontSize: 12, color: "var(--text-color-secondary)" }}>No matching accounts.</div>
                  )}
                </div>
              </>
            )}
          </div>
          {invalid && <div style={errorText}>Select an existing account from the list.</div>}
        </>
      )}
    </div>
  )
}

function MatchItem({ name, onChoose }: { name: string; onChoose: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onChoose}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "7px 10px", fontSize: 12, borderRadius: 4, cursor: "pointer", color: "var(--text-color)",
        background: hover ? "var(--surface-hover)" : "transparent",
      }}
    >
      {name}
    </div>
  )
}

function NotifyDialog({ open, onClose, accountNames, onSent }: {
  open: boolean
  onClose: () => void
  accountNames: string[]
  onSent: (records: { account: string; emails: string[] }[]) => void
}) {
  const [mode, setMode] = useState<"group" | "single" | null>(null)
  const [groupInput, setGroupInput] = useState("")
  const [groupAssoc, setGroupAssoc] = useState<Association>(emptyAssociation())
  const [singleRows, setSingleRows] = useState<SingleRow[]>([{ value: "", assoc: emptyAssociation() }])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sentSummary, setSentSummary] = useState<string | null>(null)

  const groupEmails = groupInput.split(",").map(s => s.trim()).filter(Boolean)
  const groupValid = groupEmails.length > 0 && groupEmails.every(e => EMAIL_RE.test(e))
  const groupError = groupInput.trim().length > 0 && !groupValid
  const groupAssocValid = !groupAssoc.checked || !!groupAssoc.selected

  const singleEmails = singleRows.map(r => r.value.trim())
  const singleValid = singleEmails.every(e => EMAIL_RE.test(e))
  const singleError = singleEmails.some(e => e.length > 0) && !singleValid
  const singleAssocValid = singleRows.every(r => !r.assoc.checked || !!r.assoc.selected)

  const sendDisabled = mode === "group" ? !groupValid || !groupAssocValid
    : mode === "single" ? !singleValid || !singleAssocValid
    : true

  const patchRow = (i: number, patch: Partial<SingleRow>) =>
    setSingleRows(rows => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  // An account already tied to another single-email box can't be picked again; the
  // same account with several recipients is what the group email is for.
  const takenByOthers = (i: number) =>
    new Set(singleRows.filter((r, j) => j !== i && r.assoc.selected).map(r => r.assoc.selected as string))

  const confirmMessage = mode === "group"
    ? `You are about to send a Welcome packet group email to ${groupEmails.join(", ")}${groupAssoc.selected ? `, associated with ${groupAssoc.selected}` : ""}.`
    : `You are about to send separate Welcome packet emails to ${singleRows.map(r => r.value.trim() + (r.assoc.selected ? ` (${r.assoc.selected})` : "")).join(", ")}.`

  const confirmSend = () => {
    const records: { account: string; emails: string[] }[] = []
    let summary: string
    if (mode === "group") {
      if (groupAssoc.checked && groupAssoc.selected) records.push({ account: groupAssoc.selected, emails: groupEmails })
      summary = `Welcome packet group email sent to ${groupEmails.length} recipient(s).${groupAssoc.selected ? ` Logged under ${groupAssoc.selected}.` : ""}`
    } else {
      singleRows.forEach(r => {
        const email = r.value.trim()
        if (r.assoc.selected && email) records.push({ account: r.assoc.selected, emails: [email] })
      })
      summary = `Welcome packet emails sent separately to ${singleEmails.length} recipient(s).${records.length > 0 ? ` ${records.length} logged under an account.` : ""}`
    }
    onSent(records)
    setConfirmOpen(false)
    setSentSummary(summary)
  }

  const footer = sentSummary !== null ? undefined : (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
      {confirmOpen ? (
        <>
          <button onClick={() => setConfirmOpen(false)} style={btnSecondary}>Back</button>
          <button onClick={confirmSend} style={btnPrimary}>
            <i className="pi pi-send" style={{ fontSize: 11 }} />
            Confirm
          </button>
        </>
      ) : (
        <>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={() => !sendDisabled && setConfirmOpen(true)} disabled={sendDisabled}
            style={{ ...btnPrimary, ...disabledStyle(sendDisabled) }}>
            <i className="pi pi-send" style={{ fontSize: 11 }} />
            Send
          </button>
        </>
      )}
    </div>
  )

  const modeOption = (key: "group" | "single", icon: string, title: string, desc: string, onPick: () => void) => {
    const selected = mode === key
    return (
      <button onClick={onPick} style={{
        flex: 1, display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left", cursor: "pointer",
        padding: "12px 14px", borderRadius: 10, fontFamily: "inherit",
        border: selected ? "1.5px solid #cc1111" : BORDER,
        background: selected ? "rgba(204,17,17,0.06)" : "var(--surface-card)",
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: selected ? "rgba(204,17,17,0.12)" : "var(--surface-section)",
        }}>
          <i className={icon} style={{ fontSize: 13, color: selected ? "#cc1111" : "var(--text-color-secondary)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: selected ? "#cc1111" : "var(--text-color)" }}>{title}</div>
          <div style={{ fontSize: 11, color: "var(--text-color-secondary)", marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
        </div>
        <span style={{
          width: 14, height: 14, borderRadius: "50%", flexShrink: 0, marginTop: 2, boxSizing: "border-box",
          border: selected ? "4px solid #cc1111" : BORDER, background: "var(--surface-card)",
        }} />
      </button>
    )
  }

  return (
    <Dialog
      visible={open}
      onHide={() => (confirmOpen ? setConfirmOpen(false) : onClose())}
      header={<DialogHeader icon="pi pi-send" color="#2d7a2d" title="Notify" subtitle="Send the Welcome packet email to one or more recipients" />}
      showHeader={sentSummary === null}
      footer={footer}
      style={{ width: 600, maxWidth: "95vw" }}
      pt={dialogPt}
      modal
      dismissableMask
    >
      {sentSummary !== null ? (
        <SuccessPanel title="Notification sent" message={sentSummary} onClose={onClose} />
      ) : confirmOpen ? (
        <Banner color="#b45309" icon="pi pi-exclamation-triangle">
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Confirm send</div>
          {confirmMessage}
        </Banner>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={fieldLabel}>Delivery method</span>
              <HoverTip tip="If associating to same account, send group email.">
                <i className="pi pi-info-circle" style={{ fontSize: 12, color: "var(--text-color-secondary)", cursor: "help" }} />
              </HoverTip>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {modeOption("group", "pi pi-users", "Send group email", "One email to several recipients on the same account.",
                () => setMode("group"))}
              {modeOption("single", "pi pi-user", "Send single email", "Separate emails, each tied to its own account.",
                () => { setMode("single"); setGroupAssoc(emptyAssociation()) })}
            </div>
          </div>

          {mode === "group" && (
            <div style={sectionCard}>
              <SectionTitle icon="pi pi-envelope" title="Recipients (comma-separated)" hint="Separate multiple addresses with commas." />
              <input
                value={groupInput}
                onChange={e => setGroupInput(e.target.value)}
                placeholder="name1@domain.com, name2@domain.com"
                style={{ ...nativeInput, width: "100%", borderColor: groupError ? "#cc1111" : undefined }}
              />
              {groupError && <div style={errorText}>Enter one or more valid emails, separated by commas (e.g. name@domain.com).</div>}
              {groupEmails.length > 0 && groupValid && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {groupEmails.map((e, i) => (
                    <span key={i} style={{
                      display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 20,
                      fontSize: 11, background: "var(--surface-card)", border: BORDER, color: "var(--text-color)",
                    }}>
                      <i className="pi pi-envelope" style={{ fontSize: 9, color: "var(--text-color-secondary)" }} />
                      {e}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ height: 1, background: "var(--surface-border)", margin: "2px 0" }} />
              <AssociatePicker assoc={groupAssoc} onChange={setGroupAssoc} accountNames={accountNames} taken={new Set()} />
            </div>
          )}

          {mode === "single" && (
            <div style={sectionCard}>
              <SectionTitle icon="pi pi-envelope" title="Recipients" hint="Each address receives its own email."
                right={<span style={{ fontSize: 11, color: "var(--text-color-secondary)" }}>{singleRows.length}/10</span>} />
              {singleRows.map((row, i) => (
                <div key={i} style={{
                  background: "var(--surface-card)", border: BORDER, borderRadius: 8, padding: "10px 12px",
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0, fontSize: 10, fontWeight: 700,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: "var(--surface-section)", color: "var(--text-color-secondary)",
                    }}>{i + 1}</span>
                    <input
                      value={row.value}
                      onChange={e => patchRow(i, { value: e.target.value })}
                      placeholder="name@domain.com"
                      style={{
                        ...nativeInput, flex: 1,
                        borderColor: row.value.trim() && !EMAIL_RE.test(row.value.trim()) ? "#cc1111" : undefined,
                      }}
                    />
                    {singleRows.length > 1 && (
                      <button onClick={() => setSingleRows(rows => rows.filter((_, j) => j !== i))} title="Remove"
                        style={{ ...btnSecondary, width: CTRL_H, height: CTRL_H, padding: 0, justifyContent: "center" }}>
                        <i className="pi pi-trash" style={{ fontSize: 11 }} />
                      </button>
                    )}
                  </div>
                  <div style={{ paddingLeft: 28 }}>
                    <AssociatePicker
                      assoc={row.assoc}
                      onChange={assoc => patchRow(i, { assoc })}
                      accountNames={accountNames}
                      taken={takenByOthers(i)}
                      labelSize={11}
                    />
                  </div>
                </div>
              ))}
              {singleRows.length < 10 && (
                <button onClick={() => setSingleRows(rows => [...rows, { value: "", assoc: emptyAssociation() }])}
                  style={{ ...btnSecondary, alignSelf: "flex-start", borderStyle: "dashed" }}>
                  <i className="pi pi-plus" style={{ fontSize: 10 }} />
                  Add recipient
                </button>
              )}
              {singleError && <div style={errorText}>Enter a valid email in every box (e.g. name@domain.com).</div>}
            </div>
          )}

          {mode === null && (
            <div style={{
              border: "1px dashed var(--surface-border)", borderRadius: 8, padding: "18px 14px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}>
              <i className="pi pi-envelope" style={{ fontSize: 20, color: "var(--text-color-secondary)" }} />
              <div style={{ fontSize: 12, color: "var(--text-color-secondary)" }}>Choose how you’d like to send this notification.</div>
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}
