import { fmt, pad } from "./retail-customer-mock"

export type IntelometrySchedule = { days: number[]; slots: string[]; updatedBy: string; updatedAt: string }
export type ScheduleHistoryEntry = { at: string; by: string; changes: string[] }

// Scheduled queries are capped per day; manual queries are unlimited.
export const MAX_SLOTS = 10
export const MIN_SLOT_GAP_MINUTES = 120
export const SCHEDULED_RUN_MINUTES = 15

// Week displayed Monday-first; values are JS getDay() indexes.
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
export const DAY_LABEL: Record<number, string> = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" }

export const toMinutes = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m }
export const stamp = (d: Date) => `${fmt(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`

export const formatDays = (days: number[]) =>
  days.length === 0 ? "none" : DAY_ORDER.filter(d => days.includes(d)).map(d => DAY_LABEL[d]).join(", ")
export const formatSlots = (slots: string[]) => (slots.length === 0 ? "none" : [...slots].sort().join(", "))

export function validateSchedule(days: number[], slots: string[]): { message: string | null; badSlots: Set<number> } {
  const bad = new Set<number>()
  const blank = slots.map((s, i) => (s ? -1 : i)).filter(i => i >= 0)
  if (blank.length) return { message: "Enter a time for every slot.", badSlots: new Set(blank) }
  // An empty schedule is valid: it turns scheduling off.
  if (days.length === 0 && slots.length === 0) return { message: null, badSlots: bad }
  if (days.length === 0) return { message: "Select at least one day of the week.", badSlots: bad }
  if (slots.length === 0) return { message: "Add at least one time slot.", badSlots: bad }
  if (slots.length > MAX_SLOTS) return { message: `Up to ${MAX_SLOTS} scheduled queries per day are allowed.`, badSlots: bad }
  const order = slots.map((s, i) => ({ s, i })).sort((a, b) => toMinutes(a.s) - toMinutes(b.s))
  for (let k = 1; k < order.length; k++) {
    if (toMinutes(order[k].s) - toMinutes(order[k - 1].s) < MIN_SLOT_GAP_MINUTES) {
      return {
        message: `Time slots must be at least 2 hours apart (${order[k - 1].s} and ${order[k].s}).`,
        badSlots: new Set([order[k - 1].i, order[k].i]),
      }
    }
  }
  return { message: null, badSlots: bad }
}

export function describeChanges(prev: { days: number[]; slots: string[] } | null, next: { days: number[]; slots: string[] }) {
  if (!prev) return [`Created schedule: ${formatDays(next.days)} at ${formatSlots(next.slots)}`]
  const changes: string[] = []
  if (formatDays(prev.days) !== formatDays(next.days)) changes.push(`Days: ${formatDays(prev.days)} → ${formatDays(next.days)}`)
  if (formatSlots(prev.slots) !== formatSlots(next.slots)) changes.push(`Time slots: ${formatSlots(prev.slots)} → ${formatSlots(next.slots)}`)
  return changes
}

// A scheduled query counts as running for SCHEDULED_RUN_MINUTES after its slot starts.
export function activeScheduledSlot(schedule: IntelometrySchedule, now: Date): string | null {
  if (!schedule.days.includes(now.getDay())) return null
  const mins = now.getHours() * 60 + now.getMinutes()
  return schedule.slots.find(s => mins >= toMinutes(s) && mins < toMinutes(s) + SCHEDULED_RUN_MINUTES) ?? null
}

export function nextScheduledRun(schedule: IntelometrySchedule, now: Date): string | null {
  if (schedule.days.length === 0 || schedule.slots.length === 0) return null
  const sorted = [...schedule.slots].sort()
  const mins = now.getHours() * 60 + now.getMinutes()
  for (let offset = 0; offset <= 7; offset++) {
    const day = (now.getDay() + offset) % 7
    if (!schedule.days.includes(day)) continue
    const slot = sorted.find(s => offset > 0 || toMinutes(s) > mins)
    if (slot) return `${offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : DAY_LABEL[day]} at ${slot}`
  }
  return null
}

export const INITIAL_SCHEDULE: IntelometrySchedule = {
  days: [1, 2, 3, 4, 5], slots: ["06:00", "13:00"], updatedBy: "maria.ops@ammper.com", updatedAt: "09-15-2026 10:42",
}

export const INITIAL_SCHEDULE_HISTORY: ScheduleHistoryEntry[] = [
  { at: "09-02-2026 08:15", by: "jose.olvera@ammper.com", changes: ["Created schedule: Mon, Wed, Fri at 07:00"] },
  { at: "09-15-2026 10:42", by: "maria.ops@ammper.com", changes: [
    "Days: Mon, Wed, Fri → Mon, Tue, Wed, Thu, Fri",
    "Time slots: 07:00 → 06:00, 13:00",
  ] },
]
