"use client"

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type ExpandedState, type SortingState,
} from "@tanstack/react-table"
import { ArrowRight, Calendar, ChevronDown, ChevronRight, Info, Network, Pencil, Plus, Trash2 } from "lucide-react"
import {
  AmpActionsButton, AmpAlert, AmpBox, AmpButton, AmpCard, AmpCheckbox, AmpChip, AmpDataTable, AmpDataTablePagination,
  AmpDialog, AmpGrid, AmpIcon, AmpKpiCard, AmpMultiSelect, AmpOptionCard, AmpRefetchIcon, AmpSearchInput, AmpSelect,
  AmpStack, AmpStatusIcon, AmpTabs, AmpTextArea, AmpTextInput, AmpTimePicker, AmpTooltip, AmpTypography,
  Popover, PopoverContent, PopoverTrigger,
} from "@powersphere/shared-tw"
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

const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/
const MONO = { fontFamily: "var(--ps-font-mono)" }
const DIVIDER = "1px solid var(--color-border)"
const asMultiChange = (h: (ids: string[]) => void) => h as unknown as (v: string) => void

type ChipColor = React.ComponentProps<typeof AmpChip>["color"]

// ── Status ─────────────────────────────────────────────────────────────────────
type Status = "Pending email" | "Pending WP schedule" | "Welcome packet sent" | "Password email sent" | "Active" | "Inactive"

// "Active" needs no further account-manager work, so it has its own standalone chip
// instead of living in the work-queue dropdown.
const STATUS_ORDER: Status[] = ["Pending email", "Pending WP schedule", "Welcome packet sent", "Password email sent", "Inactive"]

const STATUS_CHIP: Record<Status, ChipColor> = {
  "Pending email": "warning",
  "Pending WP schedule": "orange",
  "Welcome packet sent": "blue",
  "Password email sent": "rose",
  "Active": "success",
  "Inactive": "destructive",
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
function StatusChip({ status }: { status: Status }) {
  return <span style={{ whiteSpace: "nowrap" }}><AmpChip color={STATUS_CHIP[status]} size="sm">{status}</AmpChip></span>
}

function SectionTitle({ title, titleAddon, hint, right }: { title: string; titleAddon?: ReactNode; hint?: string; right?: ReactNode }) {
  return (
    <AmpStack direction="row" justify="between" align="start" gap="sm">
      <AmpStack gap="none">
        <AmpStack direction="row" align="center" gap="xs">
          <AmpTypography variant="body-sm" weight="semibold">{title}</AmpTypography>
          {titleAddon}
        </AmpStack>
        {hint && <AmpTypography variant="caption" color="muted">{hint}</AmpTypography>}
      </AmpStack>
      {right}
    </AmpStack>
  )
}

function Panel({ children, grow }: { children: ReactNode; grow?: boolean }) {
  return (
    <AmpStack gap="sm" p="md" bg="muted" border rounded="lg" style={grow ? { height: "100%" } : undefined}>
      {children}
    </AmpStack>
  )
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <AmpStack align="center" justify="center" p="md" border rounded="md" style={{ borderStyle: "dashed" }}>
      <AmpTypography variant="caption" color="muted" align="center">{children}</AmpTypography>
    </AmpStack>
  )
}

function Divider() {
  return <AmpBox h={1} bg="border" />
}

// KPI cards aren't interactive themselves, so clickable ones are wrapped in a bare button
const bareButton: React.CSSProperties = { background: "none", padding: 0, border: 0, font: "inherit", color: "inherit" }

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AccountManagerConsolePage() {
  const [active, setActive] = useState("console")

  return (
    <DashboardLayout title="Account Manager Console">
      <AmpTabs
        aria-label="Account manager sections"
        value={active}
        onValueChange={setActive}
        items={[
          { value: "console", label: "Account Manager Console", content: <AmpBox pt="lg"><Console /></AmpBox> },
          {
            value: "billing", label: "Billing Notice",
            content: (
              <AmpStack h={256} align="center" justify="center" gap="xs">
                <AmpTypography variant="body-sm">Billing Notice</AmpTypography>
                <AmpTypography variant="caption" color="muted">This tab stays as-is for now — out of scope for this pass.</AmpTypography>
              </AmpStack>
            ),
          },
        ]}
      />
    </DashboardLayout>
  )
}

// ── Console ────────────────────────────────────────────────────────────────────
const ISSUE_BY_NAME = new Map(ACCOUNT_ISSUES.map(i => [i.name, i.reason]))
const CREATOR_KINDS = Object.keys(CREATOR_KIND_LABEL) as CreatorKind[]

function Console() {
  // Notify only records what was sent; it never changes an account's onboarding status.
  const { accounts, notifications, applyIntelometryChanges, recordNotifications: saveNotifications, intelometrySchedule } = useAccountManager()
  const [hidden, setHidden] = useState<Partial<Record<Status, boolean>>>({ Active: true })
  // Cross-status override for the Actions KPI; touching any status filter drops out of it.
  const [onlyFlagged, setOnlyFlagged] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [filter, setFilter] = useState("")
  const [hiddenCreators, setHiddenCreators] = useState<Partial<Record<CreatorKind, boolean>>>({ external: true })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
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

  const setStatusHidden = (next: Partial<Record<Status, boolean>>) => {
    setHidden(next)
    setOnlyFlagged(false)
  }
  const setVisibleStatuses = (ids: string[]) => {
    const next: Partial<Record<Status, boolean>> = hidden.Active ? { Active: true } : {}
    STATUS_ORDER.forEach(s => { if (!ids.includes(s)) next[s] = true })
    setStatusHidden(next)
  }
  const toggleActive = () => {
    const next = { ...hidden }
    if (activeVisible) next.Active = true
    else delete next.Active
    setStatusHidden(next)
  }
  const filterInactive = () => {
    const next: Partial<Record<Status, boolean>> = {}
    ;[...STATUS_ORDER, "Active" as Status].forEach(s => { if (s !== "Inactive") next[s] = true })
    setStatusHidden(next)
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

  const isExpanded = (rowKey: string) => expanded === true || !!(expanded as Record<string, boolean>)[rowKey]
  const toggleChildren = (rowKey: string, accountId: string) => {
    const open = isExpanded(rowKey)
    setExpanded(prev => {
      const next = { ...(prev === true ? {} : prev) }
      if (open) delete next[rowKey]
      else next[rowKey] = true
      return next
    })
    if (!open) setTimeout(() => document.getElementById(`children-${accountId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" }), 60)
  }

  const columns: ColumnDef<Row>[] = [
    {
      id: "select", size: 40, enableSorting: false,
      header: () => <AmpCheckbox name="select-all" checked={allVisibleSelected} onChange={toggleSelectAll} />,
      cell: ({ row }) => <AmpCheckbox name={`select-${row.original.id}`} checked={selected.has(row.original.id)} onChange={() => toggleSelect(row.original.id)} />,
    },
    {
      id: "issue", size: 32, header: "", enableSorting: false,
      cell: ({ row }) => row.original.issueReason && (
        <AmpStatusIcon status="error" size="sm"
          tooltipLabel={`${row.original.issueReason} — resolved automatically by backend processing, not manually.`} />
      ),
    },
    {
      accessorKey: "name", header: "Account Name",
      cell: ({ row }) => <AmpTypography variant="body-sm" weight="semibold" as="span">{row.original.name}</AmpTypography>,
    },
    {
      accessorKey: "email", header: "Email",
      cell: ({ row }) => (
        <AmpTooltip content={row.original.email}>
          <AmpBox maxW={200} truncate>
            <AmpTypography variant="body-sm" color="muted" as="span">{row.original.email}</AmpTypography>
          </AmpBox>
        </AmpTooltip>
      ),
    },
    {
      id: "steps", header: "Steps", enableSorting: false,
      cell: ({ row }) => (
        <AmpStack direction="row" align="center" gap="xs">
          {row.original.steps.map((s, i) => (
            <AmpStatusIcon key={i} status={s.done ? "done" : "pending"} size="sm" tooltipLabel={s.title} />
          ))}
        </AmpStack>
      ),
    },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusChip status={row.original.status} /> },
    {
      id: "distGroup", header: "Distribution Group", enableSorting: false,
      cell: ({ row }) => <DistributionGroup row={row.original} />,
    },
    { accessorKey: "contract", header: "Contract nearest start date" },
    { accessorKey: "created", header: "Account created on" },
    {
      accessorKey: "by", header: "Account created by", enableSorting: false,
      cell: ({ row }) => creatorKind(row.original.by) === "external" ? (
        <AmpTooltip content={row.original.parentName ? `${row.original.by}\nAdmin of ${row.original.parentName}` : row.original.by}>
          <AmpTypography variant="body-sm" as="span" style={{ cursor: "help", textDecoration: "underline dotted" }}>External user</AmpTypography>
        </AmpTooltip>
      ) : <AmpTypography variant="body-sm" as="span">{row.original.by}</AmpTypography>,
    },
    {
      id: "actions", header: "Actions", size: 110, enableSorting: false,
      cell: ({ row }) => (
        <AmpStack direction="row" align="center" gap="xs">
          <AmpButton variant="ghost" size="icon" tooltip="Edit" aria-label="Edit">
            <AmpIcon icon={Pencil} size="sm" />
          </AmpButton>
          {row.original.status === "Active" && (
            <AmpButton
              variant="ghost" size="sm"
              tooltip={`Child accounts (${row.original.childCount})`}
              aria-label={`Child accounts (${row.original.childCount})`}
              leftIcon={<AmpIcon icon={Network} size="sm" />}
              onClick={() => toggleChildren(row.id, row.original.id)}
            >
              {row.original.childCount > 0 ? row.original.childCount : null}
            </AmpButton>
          )}
        </AmpStack>
      ),
    },
  ]

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })
  const pageData = table.getRowModel().rows.map(r => r.original)
  const { pageIndex, pageSize } = table.getState().pagination

  // AmpDataTable keys expansion by position within the page, so it must reset whenever the page contents change
  useEffect(() => setExpanded({}), [pageIndex, pageSize, sorting, rows])

  return (
    <AmpStack gap="lg">
      {/* Summary + actions */}
      <AmpStack direction="row" justify="between" align="start" wrap="wrap" gap="lg">
        <AmpStack direction="row" align="start" gap="md" wrap="wrap">
          <AmpStack gap="sm">
            <AmpButton variant="primary" leftIcon={<AmpIcon icon={Plus} />}>Create account</AmpButton>
            <AmpButton variant="outline" onClick={() => { setNotifyKey(k => k + 1); setNotifyOpen(true) }}>Notify</AmpButton>
            <AmpButton variant="outline" onClick={() => im.setOpen(true)}>Intelometry check</AmpButton>
          </AmpStack>

          <AmpStack direction="row" align="stretch" gap="sm" wrap="wrap">
            <AmpTooltip content="All accounts in existence, independent of status.">
              <AmpBox minW={150}><AmpKpiCard title="Total created accounts" value={allRows.length} borderColor="gray" /></AmpBox>
            </AmpTooltip>
            <AmpBox minW={150}><AmpKpiCard title="Active accounts" value={countOf("Active")} valueColor="success" borderColor="gray" /></AmpBox>
            <AmpTooltip content="Filter the table to Inactive accounts only.">
              <button type="button" onClick={filterInactive} className="ps:cursor-pointer ps:text-left" style={bareButton}>
                <AmpBox minW={150}><AmpKpiCard title="Inactive accounts" value={countOf("Inactive")} valueColor="destructive" borderColor="gray" /></AmpBox>
              </button>
            </AmpTooltip>
            <Popover open={actionsOpen} onOpenChange={(open: boolean) => { if (!open) setActionsOpen(false) }}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onClick={(e: React.MouseEvent) => { e.preventDefault(); toggleActions() }}
                  aria-pressed={onlyFlagged}
                  className="ps:cursor-pointer ps:text-left"
                  style={bareButton}
                >
                  <AmpBox minW={150}>
                    <AmpKpiCard title="Actions" value={ACCOUNT_ISSUES.length} valueColor="primary" borderColor={onlyFlagged ? "primary" : "gray"} />
                  </AmpBox>
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <AmpStack gap="sm" p="md" maxW={360} maxH={260} style={{ overflowY: "auto" }}>
                  <AmpTypography variant="footnote" color="muted" weight="semibold">ACCOUNTS BLOCKED FROM CREATION</AmpTypography>
                  {ACCOUNT_ISSUES.map(issue => (
                    <AmpStack key={issue.name} direction="row" align="start" gap="sm">
                      <AmpStatusIcon status="error" size="sm" hideTooltip />
                      <AmpStack gap="none">
                        <AmpTypography variant="body-sm" weight="semibold">{issue.name}</AmpTypography>
                        <AmpTypography variant="caption" color="muted">{issue.reason}</AmpTypography>
                      </AmpStack>
                    </AmpStack>
                  ))}
                </AmpStack>
              </PopoverContent>
            </Popover>
          </AmpStack>

          {(im.scheduledRun || im.bgJob) && (
            <AmpStack gap="sm" maxW={340}>
              {im.scheduledRun && (
                <AmpAlert color="info" action={<AmpButton variant="link" size="sm" onClick={() => im.setOpen(true)}>View</AmpButton>}>
                  Scheduled query running ({im.scheduledRun})…
                </AmpAlert>
              )}
              {im.bgJob?.status === "running" && (
                <AmpAlert color="info" action={<AmpButton variant="link" size="sm" onClick={() => im.setOpen(true)}>View</AmpButton>}>
                  Intelometry check running…
                </AmpAlert>
              )}
              {im.bgJob?.status === "done" && (
                <AmpAlert color="success" action={<AmpButton variant="link" size="sm" onClick={() => im.setOpen(true)}>Review</AmpButton>}>
                  {im.bgJob.foundCount} change(s) found
                </AmpAlert>
              )}
            </AmpStack>
          )}
        </AmpStack>

        <AmpStack direction="row" align="center" gap="sm">
          <AmpTypography variant="body-sm">Emails sent on: 08-31-2026 0/1000</AmpTypography>
          <AmpRefetchIcon tooltip="Refresh" />
          <AmpButton variant="ghost" size="icon" tooltip="Calendar" aria-label="Calendar">
            <AmpIcon icon={Calendar} size="sm" />
          </AmpButton>
          <AmpActionsButton multiple={false} label="Select action" options={[]} variant="outline" />
        </AmpStack>
      </AmpStack>

      <Divider />

      {/* Filters */}
      <AmpStack direction="row" align="end" gap="md" wrap="wrap">
        <AmpStack h={40} justify="center">
          <AmpChip color={activeVisible ? "success" : "gray"} onClick={toggleActive}>
            Active · {countOf("Active")}
          </AmpChip>
        </AmpStack>
        <AmpBox minW={240}>
          <AmpMultiSelect
            name="status" label="Status"
            value={STATUS_ORDER.filter(s => !hidden[s])}
            dropdownItems={STATUS_ORDER.map(s => ({ id: s, alias: `${s} (${countOf(s)})` }))}
            selectAllLabel="All" allSelectedLabel="All statuses"
            onChange={asMultiChange(setVisibleStatuses)}
          />
        </AmpBox>
        <AmpBox minW={240}>
          <AmpMultiSelect
            name="createdBy" label="Account created by"
            value={CREATOR_KINDS.filter(k => !hiddenCreators[k])}
            dropdownItems={CREATOR_KINDS.map(k => ({
              id: k, alias: `${CREATOR_KIND_LABEL[k]} (${allRows.filter(r => creatorKind(r.by) === k).length})`,
            }))}
            selectAllLabel="All" allSelectedLabel="All creators"
            onChange={asMultiChange(ids => setHiddenCreators(Object.fromEntries(CREATOR_KINDS.filter(k => !ids.includes(k)).map(k => [k, true]))))}
          />
        </AmpBox>
        <AmpBox grow minW={16} />
        <AmpBox w={320}>
          <AmpSearchInput name="search" value={filter} onSearch={setFilter} placeholder="Filter…" />
        </AmpBox>
      </AmpStack>

      {/* Table */}
      <AmpCard>
        <AmpDataTable
          columns={columns}
          data={pageData}
          emptyMessage="No accounts match the current filters."
          enableSorting
          sorting={sorting}
          onSortingChange={setSorting}
          expanded={expanded}
          onExpandedChange={setExpanded}
          getRowCanExpand={() => true}
          renderSubComponent={row => <AccountExpansion row={row.original} />}
          expandedRowPadded
        />
        <AmpDataTablePagination table={table} pageSizeOptions={[10, 25, 50, 100]} />
      </AmpCard>

      <IntelometryDialog im={im} />
      <NotifyDialog
        key={notifyKey}
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        accountNames={allRows.map(r => r.name)}
        onSent={recordNotifications}
      />
    </AmpStack>
  )
}

function DistributionGroup({ row }: { row: Row }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="ps:cursor-pointer ps:text-left" style={bareButton}>
          <AmpStack gap="none">
            <AmpTypography variant="body-sm" weight="semibold" style={{ textDecoration: "underline dotted", textUnderlineOffset: 2 }}>
              {row.distGroupId}
            </AmpTypography>
            <AmpTypography variant="footnote" color="muted">{row.recipientEmails.length} recipients</AmpTypography>
          </AmpStack>
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <AmpStack gap="xs" p="md" minW={230} maxH={220} style={{ overflowY: "auto" }}>
          <AmpTypography variant="footnote" color="muted" weight="semibold">
            GROUP {row.distGroupId} · {row.recipientEmails.length} RECIPIENTS
          </AmpTypography>
          {row.recipientEmails.map((email, i) => (
            <AmpTypography key={i} variant="body-sm">{email}</AmpTypography>
          ))}
        </AmpStack>
      </PopoverContent>
    </Popover>
  )
}

// ── Row expansion: contracts → facilities, notifications ──────────────────────
const facilityColumns = (contractNumber: string): ColumnDef<AmcFacility>[] => [
  { accessorKey: "facilityNumber", header: "Facility Number", cell: ({ getValue }) => <span style={MONO}>{String(getValue())}</span> },
  { accessorKey: "address", header: "Service Address" },
  { accessorKey: "meterStart", header: "Meter Start Date" },
  { accessorKey: "meterEnd", header: "Meter End Date" },
  { id: "contractNumber", header: "Contract Number", cell: () => contractNumber },
]

const contractColumns: ColumnDef<AmcContract>[] = [
  { accessorKey: "number", header: "Contract Number" },
  { accessorKey: "executed", header: "Executed" },
  { accessorKey: "start", header: "Start" },
  { accessorKey: "end", header: "End" },
]

function AccountExpansion({ row }: { row: Row }) {
  return (
    <AmpStack gap="md">
      <AmpCard title="Contracts">
        <AmpDataTable
          columns={contractColumns}
          data={[row.contractDetail]}
          getRowCanExpand={() => true}
          expandedRowPadded
          renderSubComponent={c => (
            <AmpStack gap="sm">
              <AmpTypography variant="body-sm" weight="semibold">Facilities of “{row.name}”</AmpTypography>
              <AmpDataTable columns={facilityColumns(c.original.number)} data={c.original.facilities} />
            </AmpStack>
          )}
        />
      </AmpCard>

      {row.status === "Active" && <ChildAccountsCard row={row} />}

      {row.notifications.length > 0 && (
        <AmpCard title="Notifications">
          <AmpStack gap="none">
            {row.notifications.map((n, i) => (
              <AmpStack key={i} gap="none" py="sm" style={i > 0 ? { borderTop: DIVIDER } : undefined}>
                <AmpTypography variant="caption" color="muted">Welcome packet sent on {n.sentAt} by {n.by}</AmpTypography>
                <AmpTypography variant="body-sm">{n.emails.join(", ")}</AmpTypography>
              </AmpStack>
            ))}
          </AmpStack>
        </AmpCard>
      )}
    </AmpStack>
  )
}

// ── Child accounts ─────────────────────────────────────────────────────────────
const ROLE_CHIP: Record<ChildRole, ChipColor> = { admin: "rose", user: "blue" }
const CHILD_GRID = "minmax(0, 1fr) 150px 70px 170px"
const childGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: CHILD_GRID, gap: 10, alignItems: "center" }

function ChildAccountsCard({ row }: { row: Row }) {
  const { accounts } = useAccountManager()
  const children = childAccountsOf(row.id, accounts)
  const admins = children.filter(c => c.role === "admin").length

  return (
    <div id={`children-${row.id}`}>
      <AmpCard
        title="Child accounts"
        headerActions={
          <AmpTypography variant="caption" color="muted">
            {admins} admin · {children.length - admins} user
          </AmpTypography>
        }
      >
        <AmpStack gap="sm">
          <AmpTypography variant="caption" color="muted">
            Created from this account&rsquo;s dashboard. Admins get their own row in the table and can create accounts; users can&rsquo;t.
          </AmpTypography>

          <AmpStack direction="row" align="center" gap="sm" p="sm" bg="muted" border rounded="md">
            <AmpTypography variant="body-sm" weight="semibold">{row.name}</AmpTypography>
            <AmpTypography variant="caption" color="muted">{row.email}</AmpTypography>
          </AmpStack>

          {children.length === 0 ? (
            <AmpBox ml={14}><EmptyNote>No child accounts yet.</EmptyNote></AmpBox>
          ) : (
            <AmpBox ml={14}>
              <AmpBox px="sm" pt="sm" pb="xs" pl={26} style={childGrid}>
                {["Email", "Creation date", "Role", "Status"].map(h => (
                  <AmpTypography key={h} variant="caption" color="muted" weight="semibold">{h}</AmpTypography>
                ))}
              </AmpBox>
              <ChildTree nodes={children} accounts={accounts} pool={row.contractDetail.facilities} />
            </AmpBox>
          )}
        </AmpStack>
      </AmpCard>
    </div>
  )
}

// `pool` is the creator's facilities: the parent account's at the top level, an admin's assigned ones below it.
function ChildTree({ nodes, accounts, pool }: { nodes: ChildAccount[]; accounts: AmcAccount[]; pool: AmcFacility[] }) {
  return (
    <AmpBox style={{ borderLeft: DIVIDER }}>
      {nodes.map(n => <ChildNode key={n.accountId ?? n.email} node={n} accounts={accounts} pool={pool} />)}
    </AmpBox>
  )
}

const assignedFacilityColumns: ColumnDef<AmcFacility>[] = [
  { accessorKey: "facilityNumber", header: "Facility Number", cell: ({ getValue }) => <span style={MONO}>{String(getValue())}</span> },
  { accessorKey: "address", header: "Service Address" },
  { accessorKey: "meterStart", header: "Meter Start Date" },
]

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
      <AmpStack direction="row" align="center" gap="none">
        <AmpBox w={14} h={1} bg="border" style={{ flexShrink: 0 }} />
        <AmpBox w={24} style={{ flexShrink: 0 }}>
          {canExpand && (
            <AmpButton variant="ghost" size="icon" aria-label={open ? "Collapse" : "Expand"} onClick={() => setOpen(o => !o)}>
              <AmpIcon icon={open ? ChevronDown : ChevronRight} size="xs" />
            </AmpButton>
          )}
        </AmpBox>
        <AmpBox grow minW={0} px="sm" py="xs" style={{ ...childGrid, borderBottom: DIVIDER }}>
          <AmpStack gap="none" minW={0}>
            <AmpStack direction="row" align="center" gap="sm" minW={0}>
              <AmpBox truncate minW={0}>
                <AmpTypography variant="body-sm" as="span">{node.email}</AmpTypography>
              </AmpBox>
              <AmpChip size="sm" color={facilitiesOpen ? "primary" : "gray"} tooltip="Assigned facilities" onClick={() => setFacilitiesOpen(o => !o)}>
                {facilities.length} {facilities.length === 1 ? "facility" : "facilities"}
              </AmpChip>
            </AmpStack>
            {canExpand && (
              <AmpTypography variant="footnote" color="muted">
                {grandchildren.length} child account{grandchildren.length === 1 ? "" : "s"}
              </AmpTypography>
            )}
          </AmpStack>
          <AmpTypography variant="body-sm" color="muted">{node.created}</AmpTypography>
          <span><AmpChip size="sm" color={ROLE_CHIP[node.role]}>{node.role === "admin" ? "Admin" : "User"}</AmpChip></span>
          <span>{status ? <StatusChip status={status} /> : <AmpTypography variant="body-sm" color="muted">—</AmpTypography>}</span>
        </AmpBox>
      </AmpStack>
      {facilitiesOpen && (
        <AmpBox mt="sm" mb="sm" ml={36} mr="sm" border rounded="md" bg="muted" overflow="hidden">
          <AmpStack direction="row" align="center" gap="sm" px="md" py="sm" style={{ borderBottom: DIVIDER }}>
            <AmpTypography variant="body-sm" weight="semibold">Assigned facilities</AmpTypography>
            <AmpChip size="sm" color="info">{facilities.length}</AmpChip>
          </AmpStack>
          <AmpDataTable columns={assignedFacilityColumns} data={facilities} />
        </AmpBox>
      )}
      {open && (
        <AmpBox ml={26}>
          <ChildTree nodes={grandchildren} accounts={accounts} pool={facilities} />
        </AmpBox>
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

const WORKFLOW = ["Select", "Stage", "Commit", "Save"]

function WorkflowSteps({ current }: { current: number }) {
  return (
    <AmpStack direction="row" align="center" gap="xs" wrap="wrap">
      {WORKFLOW.map((label, i) => (
        <React.Fragment key={label}>
          {i > 0 && <AmpBox w={14} h={1} bg="border" />}
          <AmpChip size="sm" color={i < current ? "success" : i === current ? "primary" : "gray"}>
            {i + 1}. {label}
          </AmpChip>
        </React.Fragment>
      ))}
    </AmpStack>
  )
}

const resultColumns = (im: ReturnType<typeof useIntelometry>): ColumnDef<Diff>[] => [
  {
    id: "select", size: 40,
    cell: ({ row }) => (
      <AmpCheckbox
        name={`result-${row.original.contractNumber}`}
        checked={!!im.selected[row.original.contractNumber]}
        onChange={() => im.setSelected(prev => ({ ...prev, [row.original.contractNumber]: !prev[row.original.contractNumber] }))}
      />
    ),
  },
  {
    accessorKey: "contractNumber", header: "Contract Number",
    cell: ({ getValue }) => <AmpTypography variant="body-sm" weight="semibold" as="span">{String(getValue())}</AmpTypography>,
  },
  { accessorKey: "accountName", header: "Account" },
  { accessorKey: "newStart", header: "Start Date" },
  { accessorKey: "newEnd", header: "End Date" },
  { accessorKey: "newEmail", header: "Primary Email" },
]

function DiffLine({ label, from, to }: { label: string; from: string; to: string }) {
  return (
    <AmpBox style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 8, alignItems: "baseline" }}>
      <AmpTypography variant="body-sm" color="muted">{label}</AmpTypography>
      <AmpStack direction="row" align="center" gap="sm" wrap="wrap">
        <AmpTypography variant="body-sm" color="destructive" style={{ textDecoration: "line-through" }}>{from}</AmpTypography>
        <AmpIcon icon={ArrowRight} size="xs" color="muted" />
        <AmpTypography variant="body-sm" color="success" weight="semibold">{to}</AmpTypography>
      </AmpStack>
    </AmpBox>
  )
}

function IntelometryDialog({ im }: { im: ReturnType<typeof useIntelometry> }) {
  const stagedDiffs = im.staged
    .map(cn => im.results?.find(r => r.contractNumber === cn))
    .filter((d): d is Diff => !!d)
  const hasResults = !!im.results && im.results.length > 0
  const saved = im.savedCount !== null
  const workflowStep = im.committed ? 3 : im.hasStaged ? 2 : im.anySelected ? 1 : 0

  const footer = saved ? undefined : (
    <AmpStack direction="row" align="center" justify="between" gap="md" wrap="wrap" w="full">
      {hasResults ? <WorkflowSteps current={workflowStep} /> : <span />}
      <AmpStack direction="row" gap="sm">
        <AmpButton variant="ghost" onClick={im.cancel}>{hasResults ? "Cancel" : "Close"}</AmpButton>
        {hasResults && (
          <>
            <AmpButton variant="outline" onClick={im.stage} disabled={!im.anySelected}>Stage</AmpButton>
            <AmpButton variant="outline" onClick={im.openCommit} disabled={!im.hasStaged || im.committed}>Commit</AmpButton>
            <AmpButton variant="primary" onClick={im.save} disabled={!im.committed}>Save</AmpButton>
          </>
        )}
      </AmpStack>
    </AmpStack>
  )

  return (
    <AmpDialog
      open={im.open}
      onClose={() => (saved ? im.closeSaved() : im.cancel())}
      title={saved ? undefined : "Intelometry Check"}
      description={saved ? undefined : "Reconcile contract dates and primary emails against Intelometry"}
      showClose={!saved}
      aria-label="Intelometry Check"
      footer={footer}
      maxWidth="xl"
      fullWidth
      className="ps:max-w-5xl"
    >
      {saved ? (
        <SuccessPanel title="Changes saved" message={`${im.savedCount} contract(s) updated in the account records.`} onClose={im.closeSaved} />
      ) : (
        <AmpStack gap="md">
          {im.bgRunning && (
            <AmpAlert color="info" action={<AmpButton variant="link" size="sm" onClick={im.cancel}>Cancel search</AmpButton>}>
              Full-database search running in the background… this can take several minutes.
            </AmpAlert>
          )}

          {im.scheduledRun && (
            <AmpAlert color="info" title={`Scheduled Intelometry query running (started ${im.scheduledRun}).`}>
              Manual querying is disabled until it finishes.
            </AmpAlert>
          )}

          <AmpGrid cols={{ xs: 1, md: 3 }} gap="md">
            <Panel grow>
              <SectionTitle title="Query up to 5 contract numbers" hint="Look up specific contracts instantly." />
              <AmpStack gap="xs" onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") im.runQuick() }}>
                {im.inputs.map((v, i) => (
                  <AmpTextInput
                    key={i}
                    name={`contract-${i + 1}`}
                    value={v}
                    placeholder={`Contract number ${i + 1}`}
                    disabled={im.manualLocked}
                    onChange={e => im.setInputs(prev => prev.map((p, j) => (j === i ? e.target.value : p)))}
                  />
                ))}
              </AmpStack>
              <AmpStack align="end">
                <AmpButton variant="primary" onClick={im.runQuick} disabled={im.quickDisabled}>Search</AmpButton>
              </AmpStack>
            </Panel>

            <Panel grow>
              <SectionTitle title="Query entire database" hint="This process may take several minutes and can run in the background." />
              <AmpStack grow justify="center" gap="sm">
                {im.confirmOpen ? (
                  <AmpAlert color="warning">
                    <AmpStack gap="sm">
                      <span>This will query the entire database and may take several minutes. It will continue running in the background. Continue?</span>
                      <AmpStack direction="row" gap="sm">
                        <AmpButton variant="primary" size="sm" onClick={im.confirmFull}>Confirm</AmpButton>
                        <AmpButton variant="ghost" size="sm" onClick={() => im.setConfirmOpen(false)}>Cancel</AmpButton>
                      </AmpStack>
                    </AmpStack>
                  </AmpAlert>
                ) : (
                  <EmptyNote>Scans every contract for differences. You can close this window while it runs.</EmptyNote>
                )}
              </AmpStack>
              {!im.confirmOpen && (
                <AmpStack align="end">
                  <AmpButton variant="primary" onClick={() => !im.fullDisabled && im.setConfirmOpen(true)} disabled={im.fullDisabled}>
                    Search
                  </AmpButton>
                </AmpStack>
              )}
            </Panel>

            <ScheduleCard now={im.now} />
          </AmpGrid>

          {im.results && (
            <AmpStack gap="sm">
              <SectionTitle
                title="Results"
                hint={hasResults ? "Select the contracts to stage. Values shown are the new ones from Intelometry." : undefined}
                right={hasResults && <AmpChip size="sm" color="info">{im.results.length}</AmpChip>}
              />
              {hasResults ? (
                <AmpCard>
                  <AmpDataTable columns={resultColumns(im)} data={im.results} />
                </AmpCard>
              ) : (
                <EmptyNote>No pending changes found for the given contract number(s).</EmptyNote>
              )}
            </AmpStack>
          )}

          {im.commitOpen && (
            <Panel>
              <SectionTitle title="Commit message" hint="Describe what changed and why, for traceability." />
              <AmpTextArea
                name="commit-message"
                value={im.commitMessage}
                placeholder="e.g. Aligning contract dates with Intelometry feed"
                onChange={e => im.setCommitMessage(e.target.value)}
              />
              <AmpStack align="end">
                <AmpButton variant="primary" onClick={im.confirmCommit} disabled={!im.commitMessage.trim()}>Confirm commit</AmpButton>
              </AmpStack>
            </Panel>
          )}

          {im.committed && (
            <AmpAlert color="success">
              Committed by {CURRENT_USER} — “{im.commitMessage}”
            </AmpAlert>
          )}

          {stagedDiffs.length > 0 && (
            <AmpStack gap="sm">
              <SectionTitle title="Preview — before / after" />
              {stagedDiffs.map(d => (
                <AmpStack key={d.contractNumber} gap="xs" px="md" py="sm" bg="muted" border rounded="md"
                  style={{ borderLeft: "3px solid var(--color-primary)" }}>
                  <AmpStack direction="row" gap="xs" align="center">
                    <AmpTypography variant="body-sm" weight="semibold">{d.accountName}</AmpTypography>
                    <AmpTypography variant="body-sm" color="muted">· {d.contractNumber}</AmpTypography>
                  </AmpStack>
                  {d.oldStart !== d.newStart && <DiffLine label="Start Date" from={d.oldStart} to={d.newStart} />}
                  {d.oldEnd !== d.newEnd && <DiffLine label="End Date" from={d.oldEnd} to={d.newEnd} />}
                  {d.oldEmail !== d.newEmail && <DiffLine label="Primary Email" from={d.oldEmail} to={d.newEmail} />}
                </AmpStack>
              ))}
            </AmpStack>
          )}
        </AmpStack>
      )}
    </AmpDialog>
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

  const validation = validateSchedule(days, slots)
  const dirty = formatDays(days) !== formatDays(schedule.days) || formatSlots(slots) !== formatSlots(schedule.slots)
  const canSave = dirty && !validation.message
  const nextRun = now ? nextScheduledRun(schedule, now) : null
  // Slot-specific problems are shown on the first offending slot instead of below the list.
  const firstBadSlot = validation.badSlots.size > 0 ? Math.min(...validation.badSlots) : -1

  const editDays = (next: number[]) => { setDays(next); onEdit() }
  const editSlots = (next: string[]) => { setSlots(next); onEdit() }
  const toggleDay = (d: number) => editDays(days.includes(d) ? days.filter(x => x !== d) : [...days, d])

  const stepLabel = (n: number, text: string, right?: ReactNode) => (
    <AmpStack direction="row" align="center" justify="between" gap="sm">
      <AmpTypography variant="caption" weight="semibold">{n}. {text}</AmpTypography>
      {right}
    </AmpStack>
  )

  return (
    <Panel grow>
      <SectionTitle
        title="Schedule"
        titleAddon={
          <AmpTooltip content="Scheduling will query complete Intelometry database">
            <span style={{ display: "inline-flex", cursor: "help" }}><AmpIcon icon={Info} size="xs" color="muted" /></span>
          </AmpTooltip>
        }
        hint="Run the query automatically on set days and times."
      />

      <AmpStack gap="xs">
        {stepLabel(1, "Days of the week")}
        <AmpStack direction="row" gap="xs" wrap="wrap">
          <AmpButton variant="link" size="sm" onClick={() => editDays([1, 2, 3, 4, 5])}>Weekdays</AmpButton>
          <AmpButton variant="link" size="sm" onClick={() => editDays([...DAY_ORDER])}>Every day</AmpButton>
          <AmpButton variant="link" size="sm" onClick={() => editDays([])}>Clear</AmpButton>
        </AmpStack>
        <AmpGrid cols={7} gap="xs">
          {DAY_ORDER.map(d => (
            <AmpButton key={d} size="sm" variant={days.includes(d) ? "primary" : "outline"} aria-pressed={days.includes(d)} onClick={() => toggleDay(d)}>
              {DAY_LABEL[d]}
            </AmpButton>
          ))}
        </AmpGrid>
      </AmpStack>

      <AmpStack gap="xs">
        {stepLabel(2, "Time slots", <AmpTypography variant="caption" color="muted">{slots.length}/{MAX_SLOTS}</AmpTypography>)}
        {slots.map((slot, i) => (
          <AmpStack key={i} direction="row" align="start" gap="xs">
            <AmpBox grow minW={0}>
              <AmpTimePicker
                name={`slot-${i}`}
                value={slot || null}
                error={i === firstBadSlot ? validation.message ?? undefined : undefined}
                onChange={v => editSlots(slots.map((s, j) => (j === i ? v ?? "" : s)))}
              />
            </AmpBox>
            <AmpStack h={40} justify="center">
              <AmpButton variant="ghost" size="icon" tooltip="Remove time slot" aria-label="Remove time slot"
                onClick={() => editSlots(slots.filter((_, j) => j !== i))}>
                <AmpIcon icon={Trash2} size="sm" color="destructive" />
              </AmpButton>
            </AmpStack>
          </AmpStack>
        ))}
        {slots.length < MAX_SLOTS && (
          <AmpStack align="start">
            <AmpButton variant="outline" size="sm" leftIcon={<AmpIcon icon={Plus} size="sm" />} onClick={() => editSlots([...slots, ""])}>
              Add time slot
            </AmpButton>
          </AmpStack>
        )}
        <AmpTypography variant="footnote" color="muted">
          At least 2 hours apart, up to {MAX_SLOTS} scheduled queries per day. Manual queries are unlimited.
        </AmpTypography>
        {validation.message && firstBadSlot < 0 && (
          <AmpTypography variant="caption" color="destructive">{validation.message}</AmpTypography>
        )}
      </AmpStack>

      <AmpStack gap="xs">
        {stepLabel(3, "Save")}
        <AmpStack direction="row" align="center" gap="sm">
          <AmpBox grow>
            <AmpTypography variant="caption" color={savedNotice ? "success" : "muted"}>
              {savedNotice ? "Schedule saved" : dirty ? "Unsaved changes" : nextRun ? `Next run: ${nextRun}` : "Scheduling is off"}
            </AmpTypography>
          </AmpBox>
          {dirty && (
            <AmpButton variant="ghost" size="sm" onClick={() => { setDays(schedule.days); setSlots(schedule.slots) }}>Discard</AmpButton>
          )}
          <AmpButton variant="primary" size="sm" onClick={() => canSave && onSave(days, slots)} disabled={!canSave}>Save</AmpButton>
        </AmpStack>
      </AmpStack>

      <AmpStack direction="row" align="center" gap="sm" p="sm" bg="card" border rounded="md" style={{ marginTop: "auto" }}>
        <AmpStack gap="none" grow minW={0}>
          <AmpTypography variant="footnote" color="muted">Last configured by</AmpTypography>
          <AmpBox truncate>
            <AmpTypography variant="caption" weight="semibold" as="span">
              {schedule.updatedBy}{schedule.updatedBy === CURRENT_USER ? " (you)" : ""}
            </AmpTypography>
          </AmpBox>
          <AmpTypography variant="footnote" color="muted">on {schedule.updatedAt}</AmpTypography>
        </AmpStack>
        <AmpButton variant="outline" size="sm" onClick={onHistory}>History ({historyCount})</AmpButton>
      </AmpStack>
    </Panel>
  )
}

type HistoryRow = { at: string; by: string; changes: string[]; key: string; current: boolean }

const historyColumns: ColumnDef<HistoryRow>[] = [
  { accessorKey: "at", header: "Changed on", cell: ({ getValue }) => <span style={{ whiteSpace: "nowrap" }}>{String(getValue())}</span> },
  {
    accessorKey: "by", header: "Changed by",
    cell: ({ row }) => (
      <AmpStack gap="xs" align="start">
        <AmpTypography variant="body-sm" weight="semibold">
          {row.original.by}{row.original.by === CURRENT_USER ? " (you)" : ""}
        </AmpTypography>
        {row.original.current && <AmpChip size="sm" color="success">Current</AmpChip>}
      </AmpStack>
    ),
  },
  {
    id: "changes", header: "Changes",
    cell: ({ row }) => (
      <AmpStack gap="xs">
        {row.original.changes.map((c, i) => <AmpTypography key={i} variant="body-sm">{c}</AmpTypography>)}
      </AmpStack>
    ),
  },
]

function ScheduleHistoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { intelometrySchedule: schedule, scheduleHistory } = useAccountManager()
  const rows: HistoryRow[] = [...scheduleHistory].reverse().map((h, i) => ({ ...h, key: `${h.at}-${i}`, current: i === 0 }))

  return (
    <AmpDialog
      open={open}
      onClose={onClose}
      closeOnBackdropClick
      title="Schedule history"
      description="Every change to the Intelometry schedule, newest first"
      footer={<AmpButton variant="ghost" onClick={onClose}>Close</AmpButton>}
      maxWidth="lg"
      fullWidth
    >
      <AmpStack gap="md">
        <Panel>
          <AmpTypography variant="body-sm" weight="semibold">Current settings</AmpTypography>
          <AmpTypography variant="caption" color="muted">
            {schedule.days.length === 0 && schedule.slots.length === 0
              ? "Scheduling is off"
              : `${formatDays(schedule.days)} at ${formatSlots(schedule.slots)}`}
          </AmpTypography>
        </Panel>
        <AmpCard>
          <AmpDataTable columns={historyColumns} data={rows} />
        </AmpCard>
      </AmpStack>
    </AmpDialog>
  )
}

function SuccessPanel({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  return (
    <AmpStack align="center" gap="sm" pt="lg" pb="sm" px="lg" textAlign="center">
      <AmpStatusIcon status="done" size="lg" hideTooltip />
      <AmpTypography variant="h3">{title}</AmpTypography>
      <AmpBox maxW={380}>
        <AmpTypography variant="body-sm" color="muted" align="center">{message}</AmpTypography>
      </AmpBox>
      <AmpBox mt="sm">
        <AmpButton variant="primary" onClick={onClose}>Close</AmpButton>
      </AmpBox>
    </AmpStack>
  )
}

// ── Notify ─────────────────────────────────────────────────────────────────────
type Association = { checked: boolean; selected: string | null }
const emptyAssociation = (): Association => ({ checked: false, selected: null })
type SingleRow = { value: string; assoc: Association }

function AssociatePicker({ name, assoc, onChange, accountNames, taken }: {
  name: string
  assoc: Association
  onChange: (next: Association) => void
  accountNames: string[]
  taken: Set<string>
}) {
  return (
    <AmpStack gap="xs">
      <AmpCheckbox
        name={`${name}-associate`}
        label="Associate to account"
        checked={assoc.checked}
        onChange={() => onChange(assoc.checked ? emptyAssociation() : { ...assoc, checked: true })}
      />
      {assoc.checked && (
        <AmpSelect
          name={`${name}-account`}
          placeholder="Type to search accounts..."
          value={assoc.selected ?? ""}
          dropdownItems={accountNames.filter(n => !taken.has(n) || n === assoc.selected).map(n => ({ id: n, alias: n }))}
          onChange={v => onChange({ ...assoc, selected: v || null })}
        />
      )}
    </AmpStack>
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

  const footer = sentSummary !== null ? undefined : confirmOpen ? (
    <>
      <AmpButton variant="ghost" onClick={() => setConfirmOpen(false)}>Back</AmpButton>
      <AmpButton variant="primary" onClick={confirmSend}>Confirm</AmpButton>
    </>
  ) : (
    <>
      <AmpButton variant="ghost" onClick={onClose}>Cancel</AmpButton>
      <AmpButton variant="primary" onClick={() => !sendDisabled && setConfirmOpen(true)} disabled={sendDisabled}>Send</AmpButton>
    </>
  )

  return (
    <AmpDialog
      open={open}
      onClose={() => (confirmOpen ? setConfirmOpen(false) : onClose())}
      title={sentSummary === null ? "Notify" : undefined}
      description={sentSummary === null ? "Send the Welcome packet email to one or more recipients" : undefined}
      showClose={sentSummary === null}
      aria-label="Notify"
      footer={footer}
      maxWidth="lg"
      fullWidth
    >
      {sentSummary !== null ? (
        <SuccessPanel title="Notification sent" message={sentSummary} onClose={onClose} />
      ) : confirmOpen ? (
        <AmpAlert color="warning" title="Confirm send">{confirmMessage}</AmpAlert>
      ) : (
        <AmpStack gap="md">
          <AmpOptionCard
            name="delivery"
            label="Delivery method"
            tooltip="If associating to same account, send group email."
            value={mode ?? undefined}
            onChange={v => {
              setMode(v as "group" | "single")
              if (v === "single") setGroupAssoc(emptyAssociation())
            }}
            items={[
              { value: "group", label: "Send group email", description: "One email to several recipients on the same account." },
              { value: "single", label: "Send single email", description: "Separate emails, each tied to its own account." },
            ]}
          />

          {mode === "group" && (
            <Panel>
              <AmpTextInput
                name="group-recipients"
                label="Recipients (comma-separated)"
                helperText="Separate multiple addresses with commas."
                placeholder="name1@domain.com, name2@domain.com"
                value={groupInput}
                error={groupError ? "Enter one or more valid emails, separated by commas (e.g. name@domain.com)." : undefined}
                onChange={e => setGroupInput(e.target.value)}
              />
              {groupEmails.length > 0 && groupValid && (
                <AmpStack direction="row" wrap="wrap" gap="xs">
                  {groupEmails.map((e, i) => <AmpChip key={i} size="sm" color="gray">{e}</AmpChip>)}
                </AmpStack>
              )}
              <Divider />
              <AssociatePicker name="group" assoc={groupAssoc} onChange={setGroupAssoc} accountNames={accountNames} taken={new Set()} />
            </Panel>
          )}

          {mode === "single" && (
            <Panel>
              <SectionTitle title="Recipients" hint="Each address receives its own email."
                right={<AmpTypography variant="caption" color="muted">{singleRows.length}/10</AmpTypography>} />
              {singleRows.map((row, i) => (
                <AmpStack key={i} gap="sm" p="sm" bg="card" border rounded="md">
                  <AmpStack direction="row" align="start" gap="sm">
                    <AmpStack h={40} justify="center">
                      <AmpChip size="sm" color="gray">{i + 1}</AmpChip>
                    </AmpStack>
                    <AmpBox grow minW={0}>
                      <AmpTextInput
                        name={`recipient-${i}`}
                        placeholder="name@domain.com"
                        value={row.value}
                        error={row.value.trim() && !EMAIL_RE.test(row.value.trim()) ? "Enter a valid email (e.g. name@domain.com)." : undefined}
                        onChange={e => patchRow(i, { value: e.target.value })}
                      />
                    </AmpBox>
                    {singleRows.length > 1 && (
                      <AmpStack h={40} justify="center">
                        <AmpButton variant="ghost" size="icon" tooltip="Remove" aria-label="Remove recipient"
                          onClick={() => setSingleRows(rows => rows.filter((_, j) => j !== i))}>
                          <AmpIcon icon={Trash2} size="sm" color="destructive" />
                        </AmpButton>
                      </AmpStack>
                    )}
                  </AmpStack>
                  <AmpBox pl={36}>
                    <AssociatePicker
                      name={`recipient-${i}`}
                      assoc={row.assoc}
                      onChange={assoc => patchRow(i, { assoc })}
                      accountNames={accountNames}
                      taken={takenByOthers(i)}
                    />
                  </AmpBox>
                </AmpStack>
              ))}
              {singleRows.length < 10 && (
                <AmpStack align="start">
                  <AmpButton variant="outline" size="sm" leftIcon={<AmpIcon icon={Plus} size="sm" />}
                    onClick={() => setSingleRows(rows => [...rows, { value: "", assoc: emptyAssociation() }])}>
                    Add recipient
                  </AmpButton>
                </AmpStack>
              )}
              {singleError && <AmpTypography variant="caption" color="destructive">Enter a valid email in every box (e.g. name@domain.com).</AmpTypography>}
            </Panel>
          )}

          {mode === null && <EmptyNote>Choose how you’d like to send this notification.</EmptyNote>}
        </AmpStack>
      )}
    </AmpDialog>
  )
}
