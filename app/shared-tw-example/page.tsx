"use client"

import { useState } from "react"
import { getCoreRowModel, getPaginationRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { Pencil, Plus } from "lucide-react"
import {
  AmpBox, AmpButton, AmpCard, AmpChip, AmpDataTable, AmpDataTablePagination, AmpDayRangePicker,
  AmpDialog, AmpIcon, AmpRefetchIcon, AmpSearchInput, AmpSelect, AmpStack, AmpStatusIcon, AmpTypography,
  useAmpSnackbar,
} from "@powersphere/shared-tw"

type Row = { name: string; market: string; status: "done" | "pending" }
const rows: Row[] = Array.from({ length: 12 }, (_, i) => ({
  name: `Counterparty ${i + 1}`, market: i % 2 ? "ERCOT" : "PJM", status: i % 3 ? "done" : "pending",
}))
const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "market", header: "Market", cell: ({ getValue }) => <AmpChip color="blue">{String(getValue())}</AmpChip> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <AmpStatusIcon status={row.original.status} size="md" /> },
]

export default function SharedTwExample() {
  const [open, setOpen] = useState(false)
  const [market, setMarket] = useState("ercot")
  const [q, setQ] = useState("")
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({})
  const notify = useAmpSnackbar()
  const table = useReactTable({
    data: rows, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  })

  return (
    <AmpStack gap="lg" p="xl">
      <AmpStack direction="row" justify="between" align="center">
        <AmpTypography variant="h2">shared-tw example</AmpTypography>
        <AmpButton variant="primary" leftIcon={<AmpIcon icon={Plus} />} onClick={() => setOpen(true)}>Create</AmpButton>
      </AmpStack>
      <AmpStack direction="row" align="end" gap="md" wrap="wrap">
        <AmpBox minW={280}><AmpDayRangePicker name="period" label="Time Period" value={range} onChange={(r) => setRange(r ?? {})} /></AmpBox>
        <AmpBox minW={160}>
          <AmpSelect name="market" label="Market" value={market}
            dropdownItems={[{ id: "ercot", alias: "ERCOT" }, { id: "pjm", alias: "PJM" }]} onChange={setMarket} />
        </AmpBox>
        <AmpStack h={40} justify="center"><AmpRefetchIcon onClick={() => notify.success("Refreshed")} tooltip="Refresh" /></AmpStack>
        <AmpBox grow minW={16} />
        <AmpBox w={320}><AmpSearchInput name="search" value={q} onSearch={setQ} placeholder="Filter…" /></AmpBox>
        <AmpButton variant="ghost" size="icon" tooltip="Edit" aria-label="Edit"><AmpIcon icon={Pencil} size="sm" /></AmpButton>
      </AmpStack>
      <AmpCard>
        <AmpDataTable columns={columns} data={table.getRowModel().rows.map((r) => r.original)} />
        <AmpDataTablePagination table={table} pageSizeOptions={[5, 10]} />
      </AmpCard>
      <AmpDialog open={open} onClose={() => setOpen(false)} title="Create counterparty" maxWidth="sm" fullWidth
        footer={<><AmpButton variant="ghost" onClick={() => setOpen(false)}>Cancel</AmpButton><AmpButton variant="primary">Save</AmpButton></>}>
        <AmpTypography variant="body-sm">Dialog body</AmpTypography>
      </AmpDialog>
    </AmpStack>
  )
}
