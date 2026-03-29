"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

// Types
export interface Document {
  id: string
  name: string
  description: string
  uploadedBy: string
  lastModified: string
}

// Alias for compatibility with client configuration page
export type UploadedDocument = Document

export interface Counterparty {
  id: string
  name: string
  address: string
  counterparty: string
  clientId: string
  misShortname: string
  directoryName: string
  directoryEmail: string
  directoryPhone: string
  status: "Active" | "Inactive"
  createdBy: string
  createdOn: string
  modifiedBy: string
  lastModifiedOn: string
  documents?: Document[]
  clientType?: "ems" | "holding" | "subsidiary" | "independent" | "counterparty"
  parentId?: string | null
  emsId?: string | null
}

const D = "03/28/2026 09:00 AM"

const initialCounterparties: Counterparty[] = [
  // ── EMS ────────────────────────────────────────────────────────────────────
  {
    id: "ems-1", name: "Foreman Energy Systems", address: "1001 Energy Plaza, Houston, TX 77002",
    counterparty: "", clientId: "EMS-FOR-001", misShortname: "FRMN",
    directoryName: "James Foreman", directoryEmail: "j.foreman@foremanergy.com", directoryPhone: "(713) 555-1001",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "ems", parentId: null, emsId: null,
  },
  {
    id: "ems-2", name: "Lincoln Grid Solutions", address: "500 Grid Ave, Dallas, TX 75201",
    counterparty: "", clientId: "EMS-LIN-002", misShortname: "LNCLN",
    directoryName: "Sarah Lincoln", directoryEmail: "s.lincoln@lincolngrid.com", directoryPhone: "(214) 555-2002",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "ems", parentId: null, emsId: null,
  },

  // ── Holdings ───────────────────────────────────────────────────────────────
  {
    id: "h-1", name: "Luxor Holdings LLC", address: "888 Commerce St, Houston, TX 77002",
    counterparty: "", clientId: "HLD-LUX-001", misShortname: "LUXOR",
    directoryName: "Marcus Luxor", directoryEmail: "m.luxor@luxorholdings.com", directoryPhone: "(713) 555-3001",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "holding", parentId: null, emsId: "ems-1",
  },
  {
    id: "h-2", name: "Exacore Mining LLC", address: "333 Industrial Blvd, Midland, TX 79701",
    counterparty: "", clientId: "HLD-EXA-002", misShortname: "EXACR",
    directoryName: "Brad Exley", directoryEmail: "b.exley@exacoremining.com", directoryPhone: "(432) 555-3002",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "holding", parentId: null, emsId: null,
  },
  {
    id: "h-3", name: "Meridian Capital Group", address: "200 Capital Dr, Austin, TX 78701",
    counterparty: "", clientId: "HLD-MER-003", misShortname: "MRDCG",
    directoryName: "Clara Meridian", directoryEmail: "c.meridian@meridiancap.com", directoryPhone: "(512) 555-3003",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "holding", parentId: null, emsId: "ems-2",
  },

  // ── Subsidiaries ───────────────────────────────────────────────────────────
  {
    id: "s-1", name: "Steelhead", address: "100 Steel Way, Houston, TX 77003",
    counterparty: "", clientId: "SUB-STL-001", misShortname: "STLHD",
    directoryName: "Ryan Steele", directoryEmail: "r.steele@steelhead.com", directoryPhone: "(713) 555-4001",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "subsidiary", parentId: "h-1", emsId: "ems-1",
  },
  {
    id: "s-2", name: "Delta Green", address: "450 Green Ln, Houston, TX 77004",
    counterparty: "", clientId: "SUB-DLT-002", misShortname: "DLTGR",
    directoryName: "Anna Green", directoryEmail: "a.green@deltagreen.com", directoryPhone: "(713) 555-4002",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "subsidiary", parentId: "h-1", emsId: "ems-2",
  },
  {
    id: "s-3", name: "ROC Digital", address: "77 Tech Park, The Woodlands, TX 77380",
    counterparty: "", clientId: "SUB-ROC-003", misShortname: "ROCDI",
    directoryName: "Kevin Roc", directoryEmail: "k.roc@rocdigital.com", directoryPhone: "(713) 555-4003",
    status: "Inactive", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "subsidiary", parentId: "h-1", emsId: null,
  },
  {
    id: "s-4", name: "Upton", address: "22 Mine Rd, Midland, TX 79702",
    counterparty: "", clientId: "SUB-UPT-004", misShortname: "UPTON",
    directoryName: "Tom Upton", directoryEmail: "t.upton@upton.com", directoryPhone: "(432) 555-4004",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "subsidiary", parentId: "h-2", emsId: "ems-1",
  },
  {
    id: "s-5", name: "Stockton", address: "88 Stockton Ave, Midland, TX 79703",
    counterparty: "", clientId: "SUB-STK-005", misShortname: "STKTM",
    directoryName: "Lisa Stock", directoryEmail: "l.stock@stockton.com", directoryPhone: "(432) 555-4005",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "subsidiary", parentId: "h-2", emsId: "ems-1",
  },
  {
    id: "s-6", name: "Meridian West", address: "301 West Blvd, Austin, TX 78702",
    counterparty: "", clientId: "SUB-MRW-006", misShortname: "MRDNW",
    directoryName: "Carlos West", directoryEmail: "c.west@meridianwest.com", directoryPhone: "(512) 555-4006",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "subsidiary", parentId: "h-3", emsId: "ems-2",
  },

  // ── Independents ───────────────────────────────────────────────────────────
  {
    id: "i-1", name: "Alteri Mining", address: "11 Quarry Ln, El Paso, TX 79901",
    counterparty: "", clientId: "IND-ALT-001", misShortname: "ALTRM",
    directoryName: "Pete Alteri", directoryEmail: "p.alteri@alterimining.com", directoryPhone: "(915) 555-5001",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "independent", parentId: null, emsId: "ems-1",
  },
  {
    id: "i-2", name: "Crane Worldwide Logistics", address: "500 Logistics Way, Fort Worth, TX 76101",
    counterparty: "", clientId: "IND-CRN-002", misShortname: "CRANE",
    directoryName: "Sandra Crane", directoryEmail: "s.crane@craneww.com", directoryPhone: "(817) 555-5002",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "independent", parentId: null, emsId: "ems-2",
  },
  {
    id: "i-3", name: "Apex Field Services", address: "77 Field Rd, Lubbock, TX 79401",
    counterparty: "", clientId: "IND-APX-003", misShortname: "APXFS",
    directoryName: "Mike Apex", directoryEmail: "m.apex@apexfield.com", directoryPhone: "(806) 555-5003",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "independent", parentId: null, emsId: null,
  },
  {
    id: "i-4", name: "Vantage Drilling LLC", address: "999 Drill Site Dr, Odessa, TX 79761",
    counterparty: "", clientId: "IND-VNT-004", misShortname: "VNTDR",
    directoryName: "Jake Vantage", directoryEmail: "j.vantage@vantagedrilling.com", directoryPhone: "(432) 555-5004",
    status: "Inactive", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "independent", parentId: null, emsId: "ems-1",
  },

  // ── Counterparties ─────────────────────────────────────────────────────────
  {
    id: "cp-1", name: "EDF Trading North America", address: "1000 Main St, Houston, TX 77002",
    counterparty: "EDF", clientId: "CP-EDF-001", misShortname: "EDFNA",
    directoryName: "Pierre Dupont", directoryEmail: "pierre.dupont@edftrading.com", directoryPhone: "(713) 555-0101",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "counterparty", parentId: null, emsId: null,
  },
  {
    id: "cp-2", name: "Shell Energy North America", address: "150 N Dairy Ashford, Houston, TX 77079",
    counterparty: "SHELL", clientId: "CP-SHL-002", misShortname: "SHENA",
    directoryName: "David Thompson", directoryEmail: "d.thompson@shell.com", directoryPhone: "(281) 555-0606",
    status: "Active", createdBy: "Admin", createdOn: D, modifiedBy: "Admin", lastModifiedOn: D,
    clientType: "counterparty", parentId: null, emsId: null,
  },
]

// Context type
interface CounterpartyContextType {
  counterparties: Counterparty[]
  activeCounterparties: Counterparty[]
  addCounterparty: (counterparty: Omit<Counterparty, "id" | "createdOn" | "modifiedBy" | "lastModifiedOn">) => void
  updateCounterparty: (counterparty: Counterparty) => void
  deleteCounterparty: (id: string) => void
  getCounterpartyById: (id: string) => Counterparty | undefined
}

const CounterpartyContext = createContext<CounterpartyContextType | undefined>(undefined)

export function CounterpartyProvider({ children }: { children: ReactNode }) {
  const [counterparties, setCounterparties] = useState<Counterparty[]>(initialCounterparties)

  const activeCounterparties = counterparties.filter((c) => c.status === "Active")

  const addCounterparty = useCallback((newCounterparty: Omit<Counterparty, "id" | "createdOn" | "modifiedBy" | "lastModifiedOn">) => {
    const now = new Date().toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    const counterparty: Counterparty = {
      ...newCounterparty,
      id: Date.now().toString(),
      createdOn: now,
      modifiedBy: newCounterparty.createdBy,
      lastModifiedOn: now,
    }

    setCounterparties((prev) => [...prev, counterparty])
  }, [])

  const updateCounterparty = useCallback((updatedCounterparty: Counterparty) => {
    const now = new Date().toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    setCounterparties((prev) =>
      prev.map((c) =>
        c.id === updatedCounterparty.id
          ? { ...updatedCounterparty, modifiedBy: "Current User", lastModifiedOn: now }
          : c
      )
    )
  }, [])

  const deleteCounterparty = useCallback((id: string) => {
    setCounterparties((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const getCounterpartyById = useCallback((id: string) => {
    return counterparties.find((c) => c.id === id)
  }, [counterparties])

  return (
    <CounterpartyContext.Provider
      value={{
        counterparties,
        activeCounterparties,
        addCounterparty,
        updateCounterparty,
        deleteCounterparty,
        getCounterpartyById,
      }}
    >
      {children}
    </CounterpartyContext.Provider>
  )
}

export function useCounterparties() {
  const context = useContext(CounterpartyContext)
  if (context === undefined) {
    throw new Error("useCounterparties must be used within a CounterpartyProvider")
  }
  return context
}
