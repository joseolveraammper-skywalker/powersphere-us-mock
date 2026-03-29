"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import {
  getCounterparties,
  createCounterparty as dbCreate,
  updateCounterparty as dbUpdate,
  deleteCounterparty as dbDelete,
} from "@/lib/actions/counterparties"

// Types
export interface Document {
  id: string
  name: string
  description: string
  uploadedBy: string
  lastModified: string
}

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

interface CounterpartyContextType {
  counterparties: Counterparty[]
  activeCounterparties: Counterparty[]
  loading: boolean
  addCounterparty: (counterparty: Omit<Counterparty, "id" | "createdOn" | "modifiedBy" | "lastModifiedOn">) => Promise<void>
  updateCounterparty: (counterparty: Counterparty) => Promise<void>
  deleteCounterparty: (id: string) => Promise<void>
  getCounterpartyById: (id: string) => Counterparty | undefined
}

const CounterpartyContext = createContext<CounterpartyContextType | undefined>(undefined)

export function CounterpartyProvider({ children }: { children: ReactNode }) {
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [loading, setLoading] = useState(true)

  // Load from DB on mount
  useEffect(() => {
    getCounterparties()
      .then(setCounterparties)
      .finally(() => setLoading(false))
  }, [])

  const activeCounterparties = counterparties.filter(c => c.status === "Active")

  const addCounterparty = useCallback(async (
    data: Omit<Counterparty, "id" | "createdOn" | "modifiedBy" | "lastModifiedOn">
  ) => {
    const created = await dbCreate(data)
    setCounterparties(prev => [...prev, created])
  }, [])

  const updateCounterparty = useCallback(async (data: Counterparty) => {
    const updated = await dbUpdate(data)
    setCounterparties(prev => prev.map(c => c.id === updated.id ? updated : c))
  }, [])

  const deleteCounterparty = useCallback(async (id: string) => {
    await dbDelete(id)
    setCounterparties(prev => prev.filter(c => c.id !== id))
  }, [])

  const getCounterpartyById = useCallback((id: string) => {
    return counterparties.find(c => c.id === id)
  }, [counterparties])

  return (
    <CounterpartyContext.Provider value={{
      counterparties, activeCounterparties, loading,
      addCounterparty, updateCounterparty, deleteCounterparty, getCounterpartyById,
    }}>
      {children}
    </CounterpartyContext.Provider>
  )
}

export function useCounterparties() {
  const context = useContext(CounterpartyContext)
  if (context === undefined) throw new Error("useCounterparties must be used within a CounterpartyProvider")
  return context
}
