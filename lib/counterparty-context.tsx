"use client"

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react"

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
}

// Initial mock data - 9 Counterparty clients participating in Energy Trades
const initialCounterparties: Counterparty[] = [
  {
    id: "1",
    name: "EDF Trading North America",
    address: "1000 Main St, Houston, TX 77002",
    counterparty: "EDF",
    clientId: "CP-EDF-001",
    misShortname: "EDFNA",
    directoryName: "Pierre Dupont",
    directoryEmail: "pierre.dupont@edftrading.com",
    directoryPhone: "(713) 555-0101",
    status: "Active",
    createdBy: "Maria Garcia",
    createdOn: "01/10/2026 09:00 AM",
    modifiedBy: "Carlos Rodriguez",
    lastModifiedOn: "03/15/2026 02:30 PM",
    documents: [
      {
        id: "doc-edf-1",
        name: "EDF_Master_Agreement_2026.pdf",
        description: "Master trading agreement for energy transactions",
        uploadedBy: "maria.garcia@powersphere.com",
        lastModified: "01/10/2026",
      },
      {
        id: "doc-edf-2",
        name: "EDF_Credit_Profile.xlsx",
        description: "Credit assessment and financial profile",
        uploadedBy: "carlos.rodriguez@powersphere.com",
        lastModified: "02/20/2026",
      },
    ],
  },
  {
    id: "2",
    name: "ENGIE Energy Marketing",
    address: "1360 Post Oak Blvd, Houston, TX 77056",
    counterparty: "ENGIE",
    clientId: "CP-ENG-002",
    misShortname: "ENGIE",
    directoryName: "Sophie Laurent",
    directoryEmail: "sophie.laurent@engie.com",
    directoryPhone: "(713) 555-0202",
    status: "Active",
    createdBy: "James Wilson",
    createdOn: "01/15/2026 10:30 AM",
    modifiedBy: "James Wilson",
    lastModifiedOn: "03/10/2026 11:45 AM",
    documents: [
      {
        id: "doc-eng-1",
        name: "ENGIE_Trading_Terms.pdf",
        description: "Standard trading terms and conditions",
        uploadedBy: "james.wilson@powersphere.com",
        lastModified: "01/15/2026",
      },
    ],
  },
  {
    id: "3",
    name: "Vistra Corp",
    address: "6555 Sierra Dr, Irving, TX 75039",
    counterparty: "VISTRA",
    clientId: "CP-VIS-003",
    misShortname: "VSTRA",
    directoryName: "Michael Chen",
    directoryEmail: "m.chen@vistracorp.com",
    directoryPhone: "(972) 555-0303",
    status: "Active",
    createdBy: "Ana Martinez",
    createdOn: "01/20/2026 02:00 PM",
    modifiedBy: "Maria Garcia",
    lastModifiedOn: "03/12/2026 09:15 AM",
    documents: [
      {
        id: "doc-vis-1",
        name: "Vistra_Counterparty_Agreement.pdf",
        description: "Bilateral trading agreement",
        uploadedBy: "ana.martinez@powersphere.com",
        lastModified: "01/20/2026",
      },
      {
        id: "doc-vis-2",
        name: "Vistra_Compliance_Certificate.pdf",
        description: "Regulatory compliance documentation",
        uploadedBy: "maria.garcia@powersphere.com",
        lastModified: "03/01/2026",
      },
    ],
  },
  {
    id: "4",
    name: "ICE Markets LLC",
    address: "5660 New Northside Dr, Atlanta, GA 30328",
    counterparty: "ICE",
    clientId: "CP-ICE-004",
    misShortname: "ICEMK",
    directoryName: "Robert Williams",
    directoryEmail: "r.williams@theice.com",
    directoryPhone: "(770) 555-0404",
    status: "Active",
    createdBy: "Carlos Rodriguez",
    createdOn: "01/25/2026 11:00 AM",
    modifiedBy: "Carlos Rodriguez",
    lastModifiedOn: "03/08/2026 03:30 PM",
    documents: [
      {
        id: "doc-ice-1",
        name: "ICE_Exchange_Agreement.pdf",
        description: "Exchange participant agreement",
        uploadedBy: "carlos.rodriguez@powersphere.com",
        lastModified: "01/25/2026",
      },
    ],
  },
  {
    id: "5",
    name: "Axpo US LLC",
    address: "200 Park Ave, New York, NY 10166",
    counterparty: "AXPO",
    clientId: "CP-AXP-005",
    misShortname: "AXPUS",
    directoryName: "Hans Mueller",
    directoryEmail: "hans.mueller@axpo.com",
    directoryPhone: "(212) 555-0505",
    status: "Active",
    createdBy: "Maria Garcia",
    createdOn: "02/01/2026 09:30 AM",
    modifiedBy: "Ana Martinez",
    lastModifiedOn: "03/14/2026 10:00 AM",
    documents: [
      {
        id: "doc-axp-1",
        name: "Axpo_ISDA_Agreement.pdf",
        description: "ISDA master agreement for derivatives",
        uploadedBy: "maria.garcia@powersphere.com",
        lastModified: "02/01/2026",
      },
      {
        id: "doc-axp-2",
        name: "Axpo_KYC_Documents.zip",
        description: "Know Your Customer documentation package",
        uploadedBy: "ana.martinez@powersphere.com",
        lastModified: "02/15/2026",
      },
    ],
  },
  {
    id: "6",
    name: "Shell Energy North America",
    address: "150 N Dairy Ashford, Houston, TX 77079",
    counterparty: "SHELL",
    clientId: "CP-SHL-006",
    misShortname: "SHENA",
    directoryName: "David Thompson",
    directoryEmail: "d.thompson@shell.com",
    directoryPhone: "(281) 555-0606",
    status: "Active",
    createdBy: "James Wilson",
    createdOn: "02/05/2026 01:45 PM",
    modifiedBy: "James Wilson",
    lastModifiedOn: "03/18/2026 04:20 PM",
    documents: [
      {
        id: "doc-shl-1",
        name: "Shell_Energy_Trade_Contract.pdf",
        description: "Energy trading master contract",
        uploadedBy: "james.wilson@powersphere.com",
        lastModified: "02/05/2026",
      },
      {
        id: "doc-shl-2",
        name: "Shell_Credit_Support_Annex.pdf",
        description: "Credit support documentation",
        uploadedBy: "james.wilson@powersphere.com",
        lastModified: "02/28/2026",
      },
      {
        id: "doc-shl-3",
        name: "Shell_Settlement_Instructions.xlsx",
        description: "Payment and settlement details",
        uploadedBy: "carlos.rodriguez@powersphere.com",
        lastModified: "03/10/2026",
      },
    ],
  },
  {
    id: "7",
    name: "Citadel Energy Trading",
    address: "131 S Dearborn St, Chicago, IL 60603",
    counterparty: "CITADEL",
    clientId: "CP-CTD-007",
    misShortname: "CTDEL",
    directoryName: "Jennifer Adams",
    directoryEmail: "j.adams@citadel.com",
    directoryPhone: "(312) 555-0707",
    status: "Active",
    createdBy: "Ana Martinez",
    createdOn: "02/10/2026 10:15 AM",
    modifiedBy: "Maria Garcia",
    lastModifiedOn: "03/20/2026 11:30 AM",
    documents: [
      {
        id: "doc-ctd-1",
        name: "Citadel_Trading_Agreement.pdf",
        description: "Proprietary trading agreement",
        uploadedBy: "ana.martinez@powersphere.com",
        lastModified: "02/10/2026",
      },
    ],
  },
  {
    id: "8",
    name: "MEA Energy Partners",
    address: "2929 Allen Pkwy, Houston, TX 77019",
    counterparty: "MEA",
    clientId: "CP-MEA-008",
    misShortname: "MEAEP",
    directoryName: "Sarah Mitchell",
    directoryEmail: "s.mitchell@meaenergy.com",
    directoryPhone: "(713) 555-0808",
    status: "Active",
    createdBy: "Carlos Rodriguez",
    createdOn: "02/15/2026 03:00 PM",
    modifiedBy: "Carlos Rodriguez",
    lastModifiedOn: "03/19/2026 09:45 AM",
    documents: [
      {
        id: "doc-mea-1",
        name: "MEA_Partnership_Agreement.pdf",
        description: "Energy partnership framework agreement",
        uploadedBy: "carlos.rodriguez@powersphere.com",
        lastModified: "02/15/2026",
      },
      {
        id: "doc-mea-2",
        name: "MEA_Risk_Assessment.pdf",
        description: "Counterparty risk evaluation report",
        uploadedBy: "maria.garcia@powersphere.com",
        lastModified: "03/05/2026",
      },
    ],
  },
  {
    id: "9",
    name: "TotalEnergies Trading",
    address: "1201 Louisiana St, Houston, TX 77002",
    counterparty: "TOTAL ENERGIES",
    clientId: "CP-TOT-009",
    misShortname: "TOTAL",
    directoryName: "Antoine Moreau",
    directoryEmail: "a.moreau@totalenergies.com",
    directoryPhone: "(713) 555-0909",
    status: "Active",
    createdBy: "Maria Garcia",
    createdOn: "02/20/2026 08:30 AM",
    modifiedBy: "Ana Martinez",
    lastModifiedOn: "03/22/2026 02:15 PM",
    documents: [
      {
        id: "doc-tot-1",
        name: "TotalEnergies_Master_Agreement.pdf",
        description: "Global energy trading master agreement",
        uploadedBy: "maria.garcia@powersphere.com",
        lastModified: "02/20/2026",
      },
      {
        id: "doc-tot-2",
        name: "TotalEnergies_Netting_Agreement.pdf",
        description: "Close-out netting agreement",
        uploadedBy: "ana.martinez@powersphere.com",
        lastModified: "03/01/2026",
      },
      {
        id: "doc-tot-3",
        name: "TotalEnergies_Authorized_Traders.xlsx",
        description: "List of authorized trading personnel",
        uploadedBy: "carlos.rodriguez@powersphere.com",
        lastModified: "03/15/2026",
      },
    ],
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
