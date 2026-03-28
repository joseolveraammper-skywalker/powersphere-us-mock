"use client"

import { useState, useMemo, Fragment } from "react"
import { useCounterparties } from "@/lib/counterparty-context"
import { DashboardLayout } from "@/components/power-sphere/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronDown,
  ChevronRight,
  Search,
  Calendar,
  MoreVertical,
  RefreshCw,
} from "lucide-react"

// Mock data for market transactions - updated with counterparty mapping
const mockTransactions = [
  {
    id: 1,
    entity: "QSE",
    resourceId: "ARTEMIS",
    counterpartyId: "1",
    submissionType: "DAM EOO",
    submissionDate: "2026-03-26",
    status: "Confirmed",
    details: "Submission 1",
  },
  {
    id: 2,
    entity: "QSE",
    resourceId: "ARTEMIS",
    counterpartyId: "2",
    submissionType: "DAM EB",
    submissionDate: "2026-03-26",
    status: "Validated",
    details: "Submission 2",
  },
  {
    id: 3,
    entity: "QSE",
    resourceId: "ARTEMIS",
    counterpartyId: "3",
    submissionType: "COP",
    submissionDate: "2026-03-25",
    status: "Confirmed",
    details: "Submission 3",
  },
  {
    id: 4,
    entity: "QSE",
    resourceId: "KRNCH_LD1",
    counterpartyId: "4",
    submissionType: "PTP Bids",
    submissionDate: "2026-03-26",
    status: "Confirmed",
    details: "Submission 4",
  },
  {
    id: 5,
    entity: "QSE",
    resourceId: "KRNCH_LD1",
    counterpartyId: "5",
    submissionType: "TPO",
    submissionDate: "2026-03-25",
    status: "Validated",
    details: "Submission 5",
  },
  {
    id: 6,
    entity: "SQ1",
    resourceId: "SGSA_ESR1",
    counterpartyId: "6",
    submissionType: "COP",
    submissionDate: "2026-03-26",
    status: "Confirmed",
    details: "Submission 6",
  },
  {
    id: 7,
    entity: "SQ1",
    resourceId: "SGSA_ESR1",
    counterpartyId: "7",
    submissionType: "DAM EOO",
    submissionDate: "2026-03-24",
    status: "Validated",
    details: "Submission 7",
  },
  {
    id: 8,
    entity: "SQ2",
    resourceId: "AMMPERUSA",
    counterpartyId: "8",
    submissionType: "Energy Trades",
    submissionDate: "2026-03-26",
    status: "Confirmed",
    details: "Submission 8",
  },
  {
    id: 9,
    entity: "SQ3",
    resourceId: "AMMPERUSA",
    counterpartyId: "9",
    submissionType: "COP",
    submissionDate: "2026-03-25",
    status: "Validated",
    details: "Submission 9",
  },
  {
    id: 10,
    entity: "SQ4",
    resourceId: "ARTEMIS",
    counterpartyId: "1",
    submissionType: "ASO",
    submissionDate: "2026-03-26",
    status: "Confirmed",
    details: "Submission 10",
  },
]

const SUBMISSION_TYPES = ["DAM EOO", "DAM EB", "PTP Bids", "COP", "TPO", "ASO", "Energy Trades"]
const ENTITIES = ["QSE", "SQ1", "SQ2", "SQ3", "SQ4"]
const RESOURCE_IDS = ["ARTEMIS", "KRNCH_LD1", "SGSA_ESR1", "AMMPERUSA"]

// Three-position toggle component
function StatusToggle({ value, onChange }: { value: "all" | "active" | "inactive"; onChange: (v: "all" | "active" | "inactive") => void }) {
  const positions = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
  ] as const

  return (
    <div className="inline-flex items-center rounded-full bg-muted p-1 gap-1">
      {positions.map((pos) => (
        <button
          key={pos.key}
          onClick={() => onChange(pos.key)}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
            value === pos.key
              ? "bg-white text-primary shadow-sm border border-primary/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {pos.label}
        </button>
      ))}
    </div>
  )
}

export default function SchedulingPage() {
  const { counterparties } = useCounterparties()
  
  const [selectedSubmissionType, setSelectedSubmissionType] = useState<string | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<string>("all")
  const [selectedResourceId, setSelectedResourceId] = useState<string>("all")
  const [selectedCounterparty, setSelectedCounterparty] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState("2026-03-01")
  const [endDate, setEndDate] = useState("2026-03-31")
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set())
  const [expandedResourceIds, setExpandedResourceIds] = useState<Set<string>>(new Set())

  const toggleEntityExpanded = (entity: string) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev)
      if (next.has(entity)) {
        next.delete(entity)
      } else {
        next.add(entity)
      }
      return next
    })
  }

  const toggleResourceIdExpanded = (resourceId: string) => {
    setExpandedResourceIds((prev) => {
      const next = new Set(prev)
      if (next.has(resourceId)) {
        next.delete(resourceId)
      } else {
        next.add(resourceId)
      }
      return next
    })
  }

  // Get counterparties filtered by status
  const getCounterpartiesByStatus = (status: "all" | "active" | "inactive") => {
    if (status === "all") return counterparties
    return counterparties.filter((c) => {
      if (status === "active") return c.status === "Active"
      if (status === "inactive") return c.status === "Inactive"
      return true
    })
  }

  // Check if Energy Trades is selected
  const isEnergyTradesSelected = selectedSubmissionType === "Energy Trades"

  // Get available counterparties based on status toggle
  const availableCounterparties = useMemo(
    () => getCounterpartiesByStatus(statusFilter),
    [statusFilter, counterparties]
  )

  // Filter transactions based on all criteria
  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter((tx) => {
      // Date range filter
      const txDate = new Date(tx.submissionDate)
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (txDate < start || txDate > end) return false

      // Submission type filter
      if (selectedSubmissionType && tx.submissionType !== selectedSubmissionType) return false

      // Entity filter
      if (selectedEntity !== "all" && tx.entity !== selectedEntity) return false

      // Resource ID filter
      if (selectedResourceId !== "all" && tx.resourceId !== selectedResourceId) return false

      // Counterparty filter - only for Energy Trades
      if (isEnergyTradesSelected && selectedCounterparty !== "all" && tx.counterpartyId !== selectedCounterparty) return false

      // Status filter based on counterparty status (only for Energy Trades)
      if (isEnergyTradesSelected) {
        const cp = counterparties.find((c) => c.id === tx.counterpartyId)
        if (statusFilter === "active" && cp?.status !== "Active") return false
        if (statusFilter === "inactive" && cp?.status !== "Inactive") return false
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          tx.entity.toLowerCase().includes(query) ||
          tx.resourceId.toLowerCase().includes(query) ||
          tx.submissionType.toLowerCase().includes(query) ||
          tx.status.toLowerCase().includes(query) ||
          tx.details.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      return true
    })
  }, [selectedSubmissionType, selectedEntity, selectedResourceId, selectedCounterparty, statusFilter, searchQuery, startDate, endDate])

  // Group filtered transactions by entity and resource ID
  const groupedTransactions = useMemo(() => {
    const grouped: Record<string, Record<string, typeof mockTransactions>> = {}

    filteredTransactions.forEach((tx) => {
      if (!grouped[tx.entity]) {
        grouped[tx.entity] = {}
      }
      if (!grouped[tx.entity][tx.resourceId]) {
        grouped[tx.entity][tx.resourceId] = []
      }
      grouped[tx.entity][tx.resourceId].push(tx)
    })

    return grouped
  }, [filteredTransactions])

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl font-bold text-primary">ERCOT</div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Market Transactions</span>
          </div>
        </div>

        {/* Submission Type Ribbon */}
        <div className="border-b border-border px-6 py-3 bg-muted/30">
          <div className="flex items-center gap-2 overflow-x-auto">
            {SUBMISSION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => {
                  const newType = selectedSubmissionType === type ? null : type
                  setSelectedSubmissionType(newType)
                  // Reset counterparty filters when Energy Trades is deselected
                  if (type === "Energy Trades" && newType === null) {
                    setSelectedCounterparty("all")
                    setStatusFilter("all")
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap ${
                  selectedSubmissionType === type
                    ? "text-white bg-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-border px-6 py-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Entity Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Entity:</label>
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {ENTITIES.map((entity) => (
                    <SelectItem key={entity} value={entity}>
                      {entity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resource ID Filter - Hidden for Energy Trades */}
            {selectedSubmissionType !== "Energy Trades" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">Resource:</label>
                <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {RESOURCE_IDS.map((id) => (
                      <SelectItem key={id} value={id}>
                        {id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Date Range:</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
                />
              </div>
            </div>

            <div className="flex-1"></div>

            {/* Energy Trades Specific Controls - Status Toggle and Counterparty */}
            {selectedSubmissionType === "Energy Trades" ? (
              <>
                {/* Status Toggle */}
                <div className="flex items-center gap-2">
                  <StatusToggle value={statusFilter} onChange={setStatusFilter} />
                </div>

                {/* Counterparty Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Counterparty:</label>
                  <Select value={selectedCounterparty} onValueChange={setSelectedCounterparty}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {availableCounterparties.map((cp) => (
                        <SelectItem key={cp.id} value={cp.id}>
                          {cp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}

            {/* Search Box */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
            </div>

            {/* Actions Button */}
            <Button variant="outline" size="sm" className="gap-2">
              <MoreVertical className="h-4 w-4" />
              Actions
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50">
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Market Participant/Customer</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead>Submission Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedTransactions).map(([entity, resources]) => (
                <Fragment key={entity}>
                  {/* Entity Row */}
                  <TableRow className="bg-muted/50 hover:bg-muted/70">
                    <TableCell className="w-12">
                      <button
                        onClick={() => toggleEntityExpanded(entity)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        {expandedEntities.has(entity) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">{entity}</TableCell>
                    <TableCell colSpan={5} className="text-muted-foreground text-sm">
                      {Object.keys(resources).length} resource(s)
                    </TableCell>
                  </TableRow>

                  {/* Resource ID and Submission Rows */}
                  {expandedEntities.has(entity) &&
                    Object.entries(resources).map(([resourceId, transactions]) => (
                      <Fragment key={`${entity}-${resourceId}`}>
                        {/* Resource Row */}
                        <TableRow className="bg-background hover:bg-muted/30">
                          <TableCell className="w-12 pl-8">
                            <button
                              onClick={() => toggleResourceIdExpanded(resourceId)}
                              className="p-1 hover:bg-muted rounded transition-colors"
                            >
                              {expandedResourceIds.has(resourceId) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell colSpan={2} className="font-medium text-foreground">
                            {resourceId}
                          </TableCell>
                          <TableCell colSpan={4} className="text-muted-foreground text-sm">
                            {transactions.length} submission(s)
                          </TableCell>
                        </TableRow>

                        {/* Submission Rows */}
                        {expandedResourceIds.has(resourceId) &&
                          transactions.map((tx) => (
                            <TableRow key={tx.id} className="hover:bg-muted/20">
                              <TableCell className="w-12 pl-16"></TableCell>
                              <TableCell className="text-sm text-muted-foreground">{tx.details}</TableCell>
                              <TableCell className="text-sm">{resourceId}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-xs font-medium ${
                                    tx.submissionType === "COP"
                                      ? "border-primary text-primary bg-primary/5"
                                      : "border-muted-foreground/50"
                                  }`}
                                >
                                  {tx.submissionType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{tx.submissionDate}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={`text-xs font-medium ${
                                    tx.status === "Confirmed"
                                      ? "bg-accent/10 text-accent"
                                      : "bg-chart-4/10 text-chart-4"
                                  }`}
                                >
                                  {tx.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <button className="p-1 hover:bg-muted rounded transition-colors">
                                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </Fragment>
                    ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  )
}
