"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type ExpandedState, type SortingState,
} from "@tanstack/react-table"
import { BarChart3, BookOpen, CreditCard, FileText, ListChecks, Users, type LucideIcon } from "lucide-react"
import {
  AmpBox, AmpButton, AmpCard, AmpChip, AmpDataTable, AmpDataTablePagination, AmpDialog, AmpFileIcon,
  AmpGrid, AmpIcon, AmpRefetchIcon, AmpSearchInput, AmpStack, AmpTabs, AmpTypography,
} from "@powersphere/shared-tw"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import type { CustomerContract, Facility } from "@/lib/retail-customer-mock"
import { useAccountManager } from "@/lib/account-manager-context"

const MONO = { fontFamily: "var(--ps-font-mono)" }

const TABS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "contracts", label: "Customers and Contracts", icon: Users },
  { value: "ledger",    label: "Customer Ledger",         icon: BookOpen },
  { value: "payments",  label: "Payment Monitor",         icon: CreditCard },
  { value: "bills",     label: "Bills/Statements",        icon: FileText },
  { value: "usage",     label: "Usage",                   icon: BarChart3 },
  { value: "forms",     label: "Forms",                   icon: ListChecks },
]

export default function RetailCustomerPage() {
  const [active, setActive] = useState("contracts")

  return (
    <DashboardLayout title="Retail Customer">
      <AmpTabs
        aria-label="Retail customer sections"
        value={active}
        onValueChange={setActive}
        items={TABS.map(tab => ({
          value: tab.value,
          label: (
            <AmpStack direction="row" align="center" gap="xs">
              <AmpIcon icon={tab.icon} size="sm" />
              {tab.label}
            </AmpStack>
          ),
          content: (
            <AmpBox pt="lg">
              {tab.value === "contracts" ? <CustomersAndContracts /> : <ComingSoon label={tab.label} />}
            </AmpBox>
          ),
        }))}
      />
    </DashboardLayout>
  )
}

function ComingSoon({ label }: { label: string }) {
  return (
    <AmpStack h={256} align="center" justify="center">
      <AmpTypography variant="body-sm" color="muted">{label} — coming soon</AmpTypography>
    </AmpStack>
  )
}

const facilityColumns: ColumnDef<Facility>[] = [
  { accessorKey: "facilityNumber", header: "Facility Number", cell: ({ getValue }) => <span style={MONO}>{String(getValue())}</span> },
  { accessorKey: "serviceAddress", header: "Service Address" },
  { accessorKey: "meterStartDate", header: "Meter Start Date" },
  { accessorKey: "meterEndDate", header: "Estimated Meter End Date" },
  { accessorKey: "contractNumber", header: "Contract Number" },
]

function FacilitiesPanel({ contract }: { contract: CustomerContract }) {
  return (
    <AmpStack gap="sm">
      <AmpStack direction="row" align="center" gap="sm">
      </AmpStack>
      <AmpDataTable columns={facilityColumns} data={contract.facilities} />
    </AmpStack>
  )
}

function CustomersAndContracts() {
  const { retailCustomers } = useAccountManager()
  const [filter, setFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [contractPreview, setContractPreview] = useState<CustomerContract | null>(null)

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return retailCustomers
    return retailCustomers.filter(c =>
      c.customerName.toLowerCase().includes(q) ||
      c.contractNumber.toLowerCase().includes(q) ||
      c.facilities.some(f =>
        f.facilityNumber.includes(q) || f.serviceAddress.toLowerCase().includes(q)
      )
    )
  }, [filter, retailCustomers])

  const columns = useMemo<ColumnDef<CustomerContract>[]>(() => [
    {
      accessorKey: "customerName", header: "Customer Name",
      cell: ({ getValue }) => <AmpTypography variant="body-sm" weight="semibold" as="span">{String(getValue())}</AmpTypography>,
    },
    { accessorKey: "contractNumber", header: "Contract Number" },
    { accessorKey: "executionDate", header: "Contract Execution Date", enableSorting: false },
    { accessorKey: "startDate", header: "Contract Start Date", enableSorting: false },
    { accessorKey: "endDate", header: "Contract End Date", enableSorting: false },
    {
      id: "contract", header: "Contract", size: 90, enableSorting: false,
      cell: ({ row }) => (
        <AmpButton
          variant="ghost" size="icon"
          tooltip={`View ${row.original.contractNumber}.pdf`}
          aria-label={`View ${row.original.contractNumber}.pdf`}
          onClick={() => setContractPreview(row.original)}
        >
          <AmpFileIcon extension="pdf" size="sm" />
        </AmpButton>
      ),
    },
  ], [])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })
  const pageData = table.getRowModel().rows.map(r => r.original)
  const { pageIndex, pageSize } = table.getState().pagination

  // AmpDataTable keys expansion by position within the page, so it must reset whenever the page contents change
  useEffect(() => setExpanded({}), [pageIndex, pageSize, sorting, filter])

  const reset = () => {
    setFilter("")
    setSorting([])
    table.setPageIndex(0)
  }

  return (
    <AmpStack gap="md">
      <AmpStack direction="row" align="end" gap="md" wrap="wrap">
        <AmpStack h={40} justify="center">
          <AmpRefetchIcon onClick={reset} tooltip="Reset" />
        </AmpStack>
        <AmpBox grow minW={16} />
        <AmpBox w={320}>
          <AmpSearchInput
            name="search" value={filter} placeholder="Filter…"
            onSearch={v => { setFilter(v); table.setPageIndex(0) }}
          />
        </AmpBox>
      </AmpStack>

      <AmpCard>
        <AmpDataTable
          columns={columns}
          data={pageData}
          emptyMessage="No customers match the current filter."
          enableSorting
          sorting={sorting}
          onSortingChange={setSorting}
          expanded={expanded}
          onExpandedChange={setExpanded}
          getRowCanExpand={row => row.original.facilities.length > 0}
          renderSubComponent={row => <FacilitiesPanel contract={row.original} />}
          expandedRowPadded
        />
        <AmpDataTablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      </AmpCard>

      <AmpDialog
        open={!!contractPreview}
        onClose={() => setContractPreview(null)}
        closeOnBackdropClick
        title={contractPreview ? `${contractPreview.contractNumber}.pdf` : ""}
        maxWidth="lg"
        fullWidth
      >
        {contractPreview && <ContractPreview contract={contractPreview} />}
      </AmpDialog>
    </AmpStack>
  )
}

const scheduleColumns: ColumnDef<Facility>[] = [
  { accessorKey: "facilityNumber", header: "ESI ID", cell: ({ getValue }) => <span style={MONO}>{String(getValue())}</span> },
  { accessorKey: "serviceAddress", header: "Service Address" },
]

function ContractField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <AmpStack gap="none">
      <AmpTypography variant="footnote" color="muted" weight="semibold">{label.toUpperCase()}</AmpTypography>
      <AmpTypography variant="body-sm" weight="semibold">{children}</AmpTypography>
    </AmpStack>
  )
}

function ContractPreview({ contract }: { contract: CustomerContract }) {
  return (
    <AmpBox bg="muted" p="md" rounded="md">
      <AmpStack gap="md" bg="card" p="xl" rounded="sm" shadow="md">
        <AmpStack gap="sm">
          <AmpStack direction="row" justify="between" align="start">
            <AmpStack gap="none">
              <AmpTypography variant="body" weight="bold" color="primary">Ammper Power</AmpTypography>
              <AmpTypography variant="caption" color="muted">Retail Electricity Service Agreement</AmpTypography>
            </AmpStack>
            <AmpStack gap="none" align="end">
              <AmpTypography variant="caption" color="muted">Contract No.</AmpTypography>
              <AmpTypography variant="caption" weight="semibold">{contract.contractNumber}</AmpTypography>
            </AmpStack>
          </AmpStack>
          <AmpBox h={2} bg="primary" />
        </AmpStack>

        <AmpGrid cols={{ xs: 1, sm: 2 }} gap="md">
          <ContractField label="Customer">{contract.customerName}</ContractField>
          <ContractField label="Execution Date">{contract.executionDate}</ContractField>
          <ContractField label="Term Start">{contract.startDate}</ContractField>
          <ContractField label="Term End">{contract.endDate}</ContractField>
        </AmpGrid>

        <AmpTypography variant="body-sm">
          This Agreement sets forth the terms under which Ammper Power will supply retail electric service to the
          Customer for the facilities listed below within the ERCOT market, for the term stated above.
        </AmpTypography>

        <AmpStack gap="sm">
          <AmpTypography variant="caption" weight="bold">
            Schedule A — Facilities ({contract.facilities.length})
          </AmpTypography>
          <AmpDataTable columns={scheduleColumns} data={contract.facilities} striping="none" />
        </AmpStack>
      </AmpStack>
    </AmpBox>
  )
}
