"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import {
  AMC_ACCOUNTS, INTELOMETRY_CHANGES, applyOverride, computeStatus, toCustomerContract,
  type AmcAccount, type ContractChange,
} from "./account-manager-mock"
import type { CustomerContract } from "./retail-customer-mock"
import {
  INITIAL_SCHEDULE, INITIAL_SCHEDULE_HISTORY, describeChanges, stamp,
  type IntelometrySchedule, type ScheduleHistoryEntry,
} from "./intelometry-schedule"

export type NotificationRecord = { emails: string[]; sentAt: string; by: string }

type AccountManagerContextValue = {
  accounts: AmcAccount[]
  // The RCP list is exactly the Active AMC accounts, derived — never stored separately.
  retailCustomers: CustomerContract[]
  notifications: Record<string, NotificationRecord[]>
  applyIntelometryChanges: (contractNumbers: string[]) => void
  recordNotifications: (records: { account: string; emails: string[]; sentAt: string; by: string }[]) => void
  // One shared schedule: whoever saves last overwrites it, and every save is logged.
  intelometrySchedule: IntelometrySchedule
  scheduleHistory: ScheduleHistoryEntry[]
  saveIntelometrySchedule: (days: number[], slots: string[], by: string) => void
}

const AccountManagerContext = createContext<AccountManagerContextValue | null>(null)

export function AccountManagerProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, ContractChange>>({})
  const [notifications, setNotifications] = useState<Record<string, NotificationRecord[]>>({})
  const [intelometrySchedule, setIntelometrySchedule] = useState<IntelometrySchedule>(INITIAL_SCHEDULE)
  const [scheduleHistory, setScheduleHistory] = useState<ScheduleHistoryEntry[]>(INITIAL_SCHEDULE_HISTORY)

  const accounts = useMemo(
    () => AMC_ACCOUNTS.map(a => applyOverride(a, overrides[a.contractDetail.number])),
    [overrides],
  )
  const retailCustomers = useMemo(
    () => accounts.filter(a => computeStatus(a) === "Active").map(toCustomerContract),
    [accounts],
  )

  const applyIntelometryChanges = useCallback((contractNumbers: string[]) => {
    setOverrides(prev => {
      const next = { ...prev }
      contractNumbers.forEach(cn => { next[cn] = { ...(next[cn] || {}), ...INTELOMETRY_CHANGES[cn] } })
      return next
    })
  }, [])

  const recordNotifications = useCallback((records: { account: string; emails: string[]; sentAt: string; by: string }[]) => {
    setNotifications(prev => {
      const next = { ...prev }
      records.forEach(({ account, ...record }) => { next[account] = [...(next[account] || []), record] })
      return next
    })
  }, [])

  const saveIntelometrySchedule = useCallback((days: number[], slots: string[], by: string) => {
    const at = stamp(new Date())
    const next = { days: [...days], slots: [...slots].sort() }
    const changes = describeChanges(scheduleHistory.length > 0 ? intelometrySchedule : null, next)
    setScheduleHistory(h => [...h, { at, by, changes: changes.length ? changes : ["Saved without changes"] }])
    setIntelometrySchedule({ ...next, updatedBy: by, updatedAt: at })
  }, [intelometrySchedule, scheduleHistory.length])

  const value = useMemo(
    () => ({
      accounts, retailCustomers, notifications, applyIntelometryChanges, recordNotifications,
      intelometrySchedule, scheduleHistory, saveIntelometrySchedule,
    }),
    [accounts, retailCustomers, notifications, applyIntelometryChanges, recordNotifications,
      intelometrySchedule, scheduleHistory, saveIntelometrySchedule],
  )

  return <AccountManagerContext.Provider value={value}>{children}</AccountManagerContext.Provider>
}

export function useAccountManager() {
  const ctx = useContext(AccountManagerContext)
  if (!ctx) throw new Error("useAccountManager must be used within AccountManagerProvider")
  return ctx
}
