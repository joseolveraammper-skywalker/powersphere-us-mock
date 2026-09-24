import { RETAIL_CUSTOMER_SEED, mulberry32, pad, type CustomerContract } from "./retail-customer-mock"

export type AmcStep = {
  done: boolean
  date: string | null
  time: string | null
  by?: string | null
  email?: string | null
}

export type AmcFacility = { facilityNumber: string; address: string; meterStart: string; meterEnd: string }

export type AmcContract = { number: string; executed: string; start: string; end: string; facilities: AmcFacility[] }

export type AmcAccount = {
  name: string
  email: string
  contract: string
  created: string
  by: string
  step1: AmcStep
  step2: AmcStep
  step3: AmcStep
  passwordChanged: boolean
  hoursSincePwEmail: number
  contractDetail: AmcContract
  // Set on admin child accounts: the id (contract number) of the account whose admin created it.
  parentId?: string
}

export type ChildRole = "admin" | "user"
// Admin children are full accounts (accountId set); user children only exist under their creator.
export type ChildAccount = { email: string; created: string; role: ChildRole; accountId?: string }

export type ContractChange = { newStart?: string; newEnd?: string; newEmail?: string }

export const CURRENT_USER = "jolvera@ammper.com"
export const NO_EMAIL = "(no email on file)"

export type CreatorKind = "system" | "ammper" | "external"
export const CREATOR_KIND_LABEL: Record<CreatorKind, string> = {
  system: "System",
  ammper: "Ammper",
  external: "External user",
}
export const creatorKind = (by: string): CreatorKind =>
  by === "system" ? "system" : by.toLowerCase().endsWith("@ammper.com") ? "ammper" : "external"

export const toUS = (iso: string) => { const [y, m, d] = iso.split("-"); return `${m}-${d}-${y}` }
export const fromUS = (us: string) => { const [m, d, y] = us.split("-"); return `${y}-${m}-${d}` }
// Date-only UTC parsing keeps lead-time comparisons in exact whole days, unaffected by DST.
export const parseUS = (us: string) => { const [m, d, y] = us.split("-").map(Number); return Date.UTC(y, m - 1, d) }
export const parseISO = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d) }

const bumpTime = (t: string, addHours: number) => {
  const [h, m, s] = t.split(":")
  let hour = parseInt(h, 10) + addHours
  if (hour > 23) hour -= 24
  return `${pad(hour)}:${m}:${s}`
}

const NOT_SENT: AmcStep = { done: false, date: null, time: null, by: null }

// ── Accounts from the AMC design ───────────────────────────────────────────────
const DESIGN_ACCOUNTS: AmcAccount[] = [
  {
    name: "HRE KINGHURST, LP", email: "phil.davis@jll.com",
    contract: "2026-09-01", created: "2026-08-29 07:09:00", by: "system",
    step1: { done: true, date: "08-29-2026", time: "07:09:00", email: "phil.davis@jll.com" },
    step2: { done: true, date: "08-29-2026", time: "08:40:12", by: "maria.ops@ammper.com" },
    step3: { done: true, date: "08-29-2026", time: "14:02:51", by: "maria.ops@ammper.com" },
    passwordChanged: true, hoursSincePwEmail: 40,
    contractDetail: { number: "HRE_06152026_10432", executed: "06-15-2026", start: "09-01-2026", end: "09-01-2028",
      facilities: [{ facilityNumber: "10298440017732214", address: "4521 KINGHURST DR", meterStart: "09-01-2026", meterEnd: "09-14-2028" }] },
  },
  {
    name: "VBR ASSET LLC", email: "vnfllc@gmail.com",
    contract: "2026-08-01", created: "2026-08-26 11:27:16", by: "system",
    step1: { done: true, date: "08-26-2026", time: "11:27:16", email: "vnfllc@gmail.com" },
    step2: { done: true, date: "08-26-2026", time: "12:05:40", by: "maria.ops@ammper.com" },
    step3: { done: true, date: "08-30-2026", time: "09:18:03", by: "maria.ops@ammper.com" },
    passwordChanged: false, hoursSincePwEmail: 6,
    contractDetail: { number: "VBR_05202026_88213", executed: "05-20-2026", start: "08-01-2026", end: "08-01-2028",
      facilities: [{ facilityNumber: "10552310029981345", address: "1220 RIVERBEND AVE", meterStart: "08-01-2026", meterEnd: "08-11-2028" }] },
  },
  {
    name: "SMARTSK HOSPITALITY LLC", email: "kbhakta@fronterahotels.com",
    contract: "2026-08-01", created: "2026-08-26 11:27:16", by: "system",
    step1: { done: true, date: "08-26-2026", time: "11:27:16", email: "kbhakta@fronterahotels.com" },
    step2: { done: true, date: "08-26-2026", time: "13:12:09", by: "jose.olvera@ammper.com" },
    step3: { done: true, date: "08-27-2026", time: "09:00:00", by: "jose.olvera@ammper.com" },
    passwordChanged: false, hoursSincePwEmail: 96,
    contractDetail: { number: "SMA_05052026_44210", executed: "05-05-2026", start: "08-01-2026", end: "08-01-2028",
      facilities: [{ facilityNumber: "10774420011239987", address: "902 FRONTERA BLVD", meterStart: "08-01-2026", meterEnd: "08-09-2028" }] },
  },
  {
    name: "ABOGADO JAVIER MARCOS, LLC", email: "danderson@marcoslegal.com",
    contract: "2027-01-01", created: "2026-08-26 11:27:16", by: "system",
    step1: { done: true, date: "08-26-2026", time: "11:27:16", email: "danderson@marcoslegal.com" },
    step2: { done: true, date: "08-27-2026", time: "10:22:34", by: "maria.ops@ammper.com" },
    step3: NOT_SENT,
    passwordChanged: false, hoursSincePwEmail: 0,
    contractDetail: { number: "ABO_10102026_77341", executed: "10-10-2026", start: "01-01-2027", end: "01-01-2029",
      facilities: [{ facilityNumber: "10119930045521002", address: "310 MARCOS PLAZA", meterStart: "01-01-2027", meterEnd: "01-15-2029" }] },
  },
  {
    name: "8713 NORMANDALE, LLC", email: "mjenkins@henleylaw.com",
    contract: "2026-09-01", created: "2026-08-24 16:55:00", by: "system",
    step1: { done: true, date: "08-24-2026", time: "16:55:00", email: "mjenkins@henleylaw.com" },
    step2: NOT_SENT,
    step3: NOT_SENT,
    passwordChanged: false, hoursSincePwEmail: 0,
    contractDetail: { number: "NOR_06012026_20194", executed: "06-01-2026", start: "09-01-2026", end: "09-01-2028",
      facilities: [{ facilityNumber: "10883210033441209", address: "8713 NORMANDALE RD", meterStart: "09-01-2026", meterEnd: "09-10-2028" }] },
  },
  {
    name: "GEOMETRIS LP", email: NO_EMAIL,
    contract: "2027-03-01", created: "2026-08-22 07:09:03", by: "system",
    step1: { done: true, date: "08-22-2026", time: "07:09:03", email: null },
    step2: NOT_SENT,
    step3: NOT_SENT,
    passwordChanged: false, hoursSincePwEmail: 0,
    contractDetail: { number: "GEO_12052026_60218", executed: "12-05-2026", start: "03-01-2027", end: "03-01-2029",
      facilities: [{ facilityNumber: "10441120078652233", address: "77 GEOMETRIS WAY", meterStart: "03-01-2027", meterEnd: "03-12-2029" }] },
  },
  {
    name: "BASS TOOL & SUPPLY, INC.", email: "mark@basstool.com",
    contract: "2026-12-01", created: "2026-08-21 07:09:04", by: "system",
    step1: { done: true, date: "08-21-2026", time: "07:09:04", email: "mark@basstool.com" },
    step2: { done: true, date: "08-21-2026", time: "07:40:19", by: "jose.olvera@ammper.com" },
    step3: { done: true, date: "08-21-2026", time: "15:05:47", by: "jose.olvera@ammper.com" },
    passwordChanged: true, hoursSincePwEmail: 220,
    contractDetail: { number: "BAS_09022026_39012", executed: "09-02-2026", start: "12-01-2026", end: "12-01-2028",
      facilities: [{ facilityNumber: "10229981234456701", address: "455 TOOLMAKER LN", meterStart: "12-01-2026", meterEnd: "12-09-2028" }] },
  },
]

type SeedStatus = "Pending email" | "Account loaded" | "Welcome email sent" | "Password email sent" | "Inactive" | "Active"
type SeedSpec = {
  name: string; status: SeedStatus; email?: string; created: string; contract: string
  contractNumber: string; executed: string; end: string; meterEnd: string; facilityNumber: string; address: string
}

function buildSteps(status: SeedStatus, date: string, time: string, email: string | null) {
  const step1: AmcStep = { done: true, date, time, email }
  if (status === "Pending email" || status === "Account loaded") {
    return { step1, step2: NOT_SENT, step3: NOT_SENT, passwordChanged: false, hoursSincePwEmail: 0 }
  }
  const step2: AmcStep = { done: true, date, time: bumpTime(time, 1), by: "maria.ops@ammper.com" }
  if (status === "Welcome email sent") {
    return { step1, step2, step3: NOT_SENT, passwordChanged: false, hoursSincePwEmail: 0 }
  }
  const step3: AmcStep = { done: true, date, time: bumpTime(time, 3), by: "jose.olvera@ammper.com" }
  if (status === "Password email sent") return { step1, step2, step3, passwordChanged: false, hoursSincePwEmail: 8 }
  if (status === "Inactive") return { step1, step2, step3, passwordChanged: false, hoursSincePwEmail: 60 }
  return { step1, step2, step3, passwordChanged: true, hoursSincePwEmail: 50 }
}

function fromSpec(spec: SeedSpec): AmcAccount {
  const [datePart, timePart] = spec.created.split(" ")
  const email = spec.status === "Pending email" ? null : spec.email ?? null
  return {
    name: spec.name, email: email ?? NO_EMAIL, contract: spec.contract, created: spec.created, by: "system",
    ...buildSteps(spec.status, toUS(datePart), timePart, email),
    contractDetail: {
      number: spec.contractNumber, executed: spec.executed, start: toUS(spec.contract), end: spec.end,
      facilities: [{ facilityNumber: spec.facilityNumber, address: spec.address, meterStart: toUS(spec.contract), meterEnd: spec.meterEnd }],
    },
  }
}

const SEEDED_ACCOUNTS: AmcAccount[] = ([
  { name: "RIVERSIDE LOGISTICS, LLC", status: "Pending email", created: "2026-08-18 09:14:22", contract: "2026-10-01",
    contractNumber: "RIV_06022026_51204", executed: "06-02-2026", end: "10-01-2028", meterEnd: "10-13-2028",
    facilityNumber: "10334420098871122", address: "1450 PORTSIDE AVE" },
  { name: "BLACKWELL DENTAL GROUP, PLLC", status: "Account loaded", email: "amy.tran@blackwelldental.com", created: "2026-08-19 13:02:47", contract: "2026-09-15",
    contractNumber: "BLA_05252026_29981", executed: "05-25-2026", end: "09-15-2028", meterEnd: "09-27-2028",
    facilityNumber: "10221190034456712", address: "88 ORCHARD MEDICAL WAY" },
  { name: "SUNCREST APARTMENTS LP", status: "Welcome email sent", email: "manager@suncrestapts.com", created: "2026-08-12 08:45:10", contract: "2026-09-01",
    contractNumber: "SUN_05102026_66210", executed: "05-10-2026", end: "09-01-2028", meterEnd: "09-14-2028",
    facilityNumber: "10998871122334409", address: "2200 SUNCREST TER" },
  { name: "TITAN STEEL FABRICATORS, INC.", status: "Password email sent", email: "ops@titansteelinc.com", created: "2026-08-27 07:30:00", contract: "2026-09-20",
    contractNumber: "TIT_06182026_40218", executed: "06-18-2026", end: "09-20-2028", meterEnd: "09-30-2028",
    facilityNumber: "10556621239987001", address: "9100 FOUNDRY RD" },
  { name: "GOLDEN HARVEST BAKERY CO.", status: "Inactive", email: "billing@goldenharvestbakery.com", created: "2026-08-10 06:55:31", contract: "2026-08-25",
    contractNumber: "GOL_05012026_18873", executed: "05-01-2026", end: "08-25-2028", meterEnd: "09-06-2028",
    facilityNumber: "10112239987654321", address: "310 HARVEST LN" },
  { name: "NORTHGATE AUTO REPAIR, LLC", status: "Active", email: "frank@northgateauto.com", created: "2026-08-05 11:12:44", contract: "2026-08-20",
    contractNumber: "NOR_04282026_77120", executed: "04-28-2026", end: "08-20-2028", meterEnd: "09-01-2028",
    facilityNumber: "10778821133445566", address: "640 GATEWAY BLVD" },
  { name: "PINEWOOD BUSINESS PARK LLC", status: "Pending email", created: "2026-08-29 14:20:09", contract: "2026-10-15",
    contractNumber: "PIN_06302026_90218", executed: "06-30-2026", end: "10-15-2028", meterEnd: "10-27-2028",
    facilityNumber: "10665521234409876", address: "77 PINEWOOD PARK DR" },
  { name: "COASTAL SEAFOOD DISTRIBUTORS, INC.", status: "Account loaded", email: "jperez@coastalseafood.com", created: "2026-08-14 09:03:18", contract: "2026-09-05",
    contractNumber: "COA_05152026_33218", executed: "05-15-2026", end: "09-05-2028", meterEnd: "09-17-2028",
    facilityNumber: "10887712233445521", address: "5100 HARBOR FRONT DR" },
  { name: "IRONGATE STORAGE SOLUTIONS, LLC", status: "Welcome email sent", email: "admin@irongatestorage.com", created: "2026-08-16 15:41:52", contract: "2026-09-10",
    contractNumber: "IRO_05202026_60219", executed: "05-20-2026", end: "09-10-2028", meterEnd: "09-22-2028",
    facilityNumber: "10443398871122009", address: "820 IRONGATE CIR" },
  { name: "MERIDIAN LEGAL GROUP, LLP", status: "Password email sent", email: "office@meridianlegal.com", created: "2026-08-23 10:08:00", contract: "2026-09-12",
    contractNumber: "MER_06102026_51002", executed: "06-10-2026", end: "09-12-2028", meterEnd: "09-24-2028",
    facilityNumber: "10229987765544332", address: "1500 MERIDIAN AVE STE 400" },
  { name: "SUMMIT RIDGE VINEYARDS, LP", status: "Inactive", email: "info@summitridgevineyards.com", created: "2026-08-09 07:22:15", contract: "2026-08-30",
    contractNumber: "SUM_04222026_20981", executed: "04-22-2026", end: "08-30-2028", meterEnd: "09-11-2028",
    facilityNumber: "10665544332211009", address: "90 SUMMIT RIDGE RD" },
  { name: "FAIRVIEW MEDICAL PLAZA, LLC", status: "Active", email: "facilities@fairviewmedplaza.com", created: "2026-08-03 12:35:47", contract: "2026-08-18",
    contractNumber: "FAI_04152026_11298", executed: "04-15-2026", end: "08-18-2028", meterEnd: "08-30-2028",
    facilityNumber: "10334411229987456", address: "215 FAIRVIEW MEDICAL DR" },
  { name: "CEDAR PARK CAR WASH, INC.", status: "Pending email", created: "2026-08-28 16:00:22", contract: "2026-10-05",
    contractNumber: "CED_06282026_70982", executed: "06-28-2026", end: "10-05-2028", meterEnd: "10-17-2028",
    facilityNumber: "10998821133445509", address: "460 CEDAR PARK BLVD" },
  { name: "DELTA FREIGHT SOLUTIONS, LLC", status: "Account loaded", email: "dispatch@deltafreight.com", created: "2026-08-17 08:19:33", contract: "2026-09-08",
    contractNumber: "DEL_05182026_44210", executed: "05-18-2026", end: "09-08-2028", meterEnd: "09-20-2028",
    facilityNumber: "10223344556677889", address: "7700 FREIGHT YARD RD" },
  { name: "HARBORVIEW HOTEL GROUP, LP", status: "Welcome email sent", email: "gm@harborviewhotelgroup.com", created: "2026-08-13 09:50:05", contract: "2026-09-02",
    contractNumber: "HAR_05122026_88012", executed: "05-12-2026", end: "09-02-2028", meterEnd: "09-14-2028",
    facilityNumber: "10556677889900112", address: "1 HARBORVIEW PLAZA" },
  { name: "WESTLAKE PRINTING CO.", status: "Password email sent", email: "orders@westlakeprinting.com", created: "2026-08-24 11:27:59", contract: "2026-09-14",
    contractNumber: "WES_06142026_29873", executed: "06-14-2026", end: "09-14-2028", meterEnd: "09-26-2028",
    facilityNumber: "10667788990011223", address: "330 WESTLAKE INDUSTRIAL PARK" },
  { name: "BRIGHTON PHARMACY, INC.", status: "Inactive", email: "manager@brightonrx.com", created: "2026-08-07 07:58:41", contract: "2026-08-27",
    contractNumber: "BRI_04252026_60214", executed: "04-25-2026", end: "08-27-2028", meterEnd: "09-08-2028",
    facilityNumber: "10778899001122334", address: "58 BRIGHTON SQUARE" },
  { name: "STONEBRIDGE CONSTRUCTION, LLC", status: "Active", email: "pm@stonebridgeconstruction.com", created: "2026-08-02 13:14:29", contract: "2026-08-16",
    contractNumber: "STO_04102026_77003", executed: "04-10-2026", end: "08-16-2028", meterEnd: "08-28-2028",
    facilityNumber: "10889900112233445", address: "6200 STONEBRIDGE INDUSTRIAL CT" },
  { name: "MAPLEWOOD SENIOR LIVING, LLC", status: "Pending email", created: "2026-08-30 10:41:12", contract: "2026-10-20",
    contractNumber: "MAP_07022026_10982", executed: "07-02-2026", end: "10-20-2028", meterEnd: "11-01-2028",
    facilityNumber: "10990011223344556", address: "140 MAPLEWOOD CAMPUS DR" },
  { name: "QUANTUM DATA CENTERS, INC.", status: "Account loaded", email: "facilities@quantumdc.com", created: "2026-08-15 06:20:03", contract: "2026-09-06",
    contractNumber: "QUA_05162026_39821", executed: "05-16-2026", end: "09-06-2028", meterEnd: "09-18-2028",
    facilityNumber: "10001122334455667", address: "7 QUANTUM CAMPUS WAY" },
] as SeedSpec[]).map(fromSpec)

// ── Accounts already live in the Retail Customer Portal ────────────────────────
// RCP customers have finished onboarding, so every step is done and the password
// has been changed — which makes each one compute as "Active".
const rcpEmail = (name: string) =>
  `billing@${name.toLowerCase().replace(/\b(inc|llc|lp|co|corp)\b\.?/g, "").replace(/[^a-z0-9]/g, "")}.com`

function fromRetailCustomers(): AmcAccount[] {
  const rand = mulberry32(20260923)
  return RETAIL_CUSTOMER_SEED.map((c, i) => {
    const time = `${pad(6 + Math.floor(rand() * 11))}:${pad(Math.floor(rand() * 60))}:${pad(Math.floor(rand() * 60))}`
    const by = i % 2 ? "jose.olvera@ammper.com" : "maria.ops@ammper.com"
    const email = rcpEmail(c.customerName)
    return {
      name: c.customerName, email, contract: fromUS(c.startDate), created: `${fromUS(c.executionDate)} ${time}`, by: "system",
      step1: { done: true, date: c.executionDate, time, email },
      step2: { done: true, date: c.executionDate, time: bumpTime(time, 1), by },
      step3: { done: true, date: c.executionDate, time: bumpTime(time, 3), by },
      passwordChanged: true, hoursSincePwEmail: 50,
      contractDetail: {
        number: c.contractNumber, executed: c.executionDate, start: c.startDate, end: c.endDate,
        facilities: c.facilities.map(f => ({
          facilityNumber: f.facilityNumber, address: f.serviceAddress, meterStart: f.meterStartDate, meterEnd: f.meterEndDate,
        })),
      },
    }
  })
}

// Mock spread of creators across every account, seeded so it stays stable between reloads.
const AMMPER_CREATORS = ["john@ammper.com", "sue@ammper.com", "mike@ammper.com", "anna@ammper.com", "carlos@ammper.com", "emily@ammper.com"]

// External users always have their password email by the time they appear here, so every
// onboarding step is marked done; whether they've logged in (passwordChanged) is theirs to decide.
function asAdminChild(a: AmcAccount, parent: AmcAccount): AmcAccount {
  const s1 = a.step1
  const sent = (step: AmcStep, hours: number): AmcStep =>
    step.done ? step : { done: true, date: s1.date, time: bumpTime(s1.time!, hours), by: "system" }
  return { ...a, by: parent.email, parentId: parent.contractDetail.number, step2: sent(a.step2, 1), step3: sent(a.step3, 3) }
}

// Accounts appear in the table only when created by system, an Ammper user, or an external
// admin. An external creator is always the admin of an earlier Active account, so walking in
// creation order lets admins created by other admins keep branching.
function assignCreators(accounts: AmcAccount[]): AmcAccount[] {
  const rand = mulberry32(8675309)
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]
  const done: AmcAccount[] = []
  const ascending = [...accounts].sort((a, b) => a.created.localeCompare(b.created))
  for (const a of ascending) {
    const roll = rand()
    const parents = done.filter(p => computeStatus(p) === "Active" && p.created < a.created && p.step1.email)
    let next: AmcAccount
    if (roll < 0.4) next = { ...a, by: "system" }
    // An admin child needs an email on file to have received its password email.
    else if (roll < 0.75 || !a.step1.email || parents.length === 0) next = { ...a, by: pick(AMMPER_CREATORS) }
    else next = asAdminChild(a, pick(parents))
    done.push(next)
  }
  return done.sort((a, b) => b.created.localeCompare(a.created))
}

const CREATED_ACCOUNTS = assignCreators([...DESIGN_ACCOUNTS, ...SEEDED_ACCOUNTS, ...fromRetailCustomers()])

// ── User children (no table row: users can't create accounts) ─────────────────
const CHILD_FIRST_NAMES = ["james", "maria", "robert", "linda", "david", "susan", "daniel", "karen", "paul", "nancy", "mark", "laura", "steven", "olivia", "brian", "grace"]
const CHILD_LAST_INITIALS = "abcdefghjklmnprstw"
const LATEST_CHILD_DATE = Date.UTC(2026, 8, 22)

const shiftTimestamp = (created: string, days: number, rand: () => number) => {
  const [date] = created.split(" ")
  const [y, m, d] = date.split("-").map(Number)
  const t = new Date(Math.min(Date.UTC(y, m - 1, d) + days * 86400000, LATEST_CHILD_DATE))
  const time = `${pad(7 + Math.floor(rand() * 11))}:${pad(Math.floor(rand() * 60))}:${pad(Math.floor(rand() * 60))}`
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ${time}`
}

function buildUserChildren(accounts: AmcAccount[]): Record<string, ChildAccount[]> {
  const rand = mulberry32(4242)
  const out: Record<string, ChildAccount[]> = {}
  accounts.filter(a => computeStatus(a) === "Active").forEach(a => {
    const domain = a.email.split("@")[1]
    const count = Math.floor(rand() * 5)
    if (!domain || count === 0) return
    const used = new Set<string>()
    const children: ChildAccount[] = []
    for (let i = 0; i < count; i++) {
      const local = `${CHILD_FIRST_NAMES[Math.floor(rand() * CHILD_FIRST_NAMES.length)]}.${CHILD_LAST_INITIALS[Math.floor(rand() * CHILD_LAST_INITIALS.length)]}`
      if (used.has(local)) continue
      used.add(local)
      children.push({ email: `${local}@${domain}`, created: shiftTimestamp(a.created, 3 + Math.floor(rand() * 180), rand), role: "user" })
    }
    out[a.contractDetail.number] = children
  })
  return out
}

export const USER_CHILDREN = buildUserChildren(CREATED_ACCOUNTS)

// Children are assigned a subset of their creator's facilities, so every parent needs at least two.
const PAD_STREETS = ["COMMERCE ST", "INDUSTRIAL BLVD", "S MAIN ST", "OAK HOLLOW LN", "MARKET ST", "LAMAR BLVD", "ELM ST", "PECAN ST", "HWY 183", "BROADWAY AVE"]

function padParentFacilities(accounts: AmcAccount[], parentIds: Set<string>): AmcAccount[] {
  const rand = mulberry32(1357)
  return accounts.map(a => {
    const cd = a.contractDetail
    if (!parentIds.has(cd.number) || cd.facilities.length >= 2) return a
    const base = cd.facilities[0]
    const extra: AmcFacility[] = Array.from({ length: 2 + Math.floor(rand() * 4) }, () => ({
      facilityNumber: `10${String(Math.floor(rand() * 1e15)).padStart(15, "0")}`,
      address: `${10 + Math.floor(rand() * 9990)} ${PAD_STREETS[Math.floor(rand() * PAD_STREETS.length)]}`,
      meterStart: base.meterStart,
      meterEnd: base.meterEnd,
    }))
    return { ...a, contractDetail: { ...cd, facilities: [...cd.facilities, ...extra] } }
  })
}

export const AMC_ACCOUNTS: AmcAccount[] = padParentFacilities(CREATED_ACCOUNTS, new Set([
  ...Object.keys(USER_CHILDREN),
  ...CREATED_ACCOUNTS.flatMap(a => (a.parentId ? [a.parentId] : [])),
]))

// Stable per-child pick of 2–6 facilities from the creator's pool (capped at the pool size).
export function assignedFacilities(childEmail: string, pool: AmcFacility[]): AmcFacility[] {
  const rand = mulberry32(seedFromString(childEmail))
  const count = Math.min(pool.length, 2 + Math.floor(rand() * 5))
  const idx = pool.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx.slice(0, count).sort((a, b) => a - b).map(i => pool[i])
}

export function childAccountsOf(parentId: string, accounts: AmcAccount[]): ChildAccount[] {
  const admins: ChildAccount[] = accounts
    .filter(a => a.parentId === parentId)
    .map(a => ({ email: a.email, created: a.created, role: "admin", accountId: a.contractDetail.number }))
  return [...admins, ...(USER_CHILDREN[parentId] || [])].sort((a, b) => a.created.localeCompare(b.created))
}

// Flags can only be cleared by backend processing, never manually from the console.
export const ACCOUNT_ISSUES: { name: string; reason: string }[] = [
  { name: "RIVERSIDE LOGISTICS, LLC", reason: "Missing contract start date" },
  { name: "MAPLEWOOD SENIOR LIVING, LLC", reason: "Missing contract start date" },
  { name: "PINEWOOD BUSINESS PARK LLC", reason: "Countersigned contract not found in database" },
  { name: "CEDAR PARK CAR WASH, INC.", reason: "Account previously exists" },
]

// Contracts where the external Intelometry system differs from what the console has on file.
export const INTELOMETRY_CHANGES: Record<string, ContractChange> = {
  VBR_05202026_88213: { newEmail: "accounting@vbrasset.com" },
  SMA_05052026_44210: { newEnd: "08-15-2028" },
  TIT_06182026_40218: { newStart: "10-01-2026" },
  GOL_05012026_18873: { newEmail: "ap@goldenharvestbakery.com" },
  MER_06102026_51002: { newEnd: "09-30-2028" },
  QUA_05162026_39821: { newStart: "09-20-2026", newEnd: "09-20-2028" },
}

// ── Distribution groups ────────────────────────────────────────────────────────
// Seeded from the contract number so the group stays stable across re-renders.
const seedFromString = (str: string) => {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
const DG_FIRST_NAMES = ["alex", "jordan", "taylor", "morgan", "casey", "riley", "sam", "jamie", "drew", "cameron", "avery", "reese", "quinn", "hayden", "rowan", "emerson", "blair", "dana", "kai", "skyler"]
const DG_DOMAINS = ["ammper.com", "ammper-dist.com", "contractors.ammper.com"]

export function distributionGroupFor(contractNumber: string) {
  const rand = mulberry32(seedFromString(contractNumber))
  const id = String(Math.floor(rand() * 10000)).padStart(4, "0")
  const count = 1 + Math.floor(rand() * 20)
  const emails = Array.from({ length: count }, () => {
    const name = DG_FIRST_NAMES[Math.floor(rand() * DG_FIRST_NAMES.length)]
    const num = 100 + Math.floor(rand() * 900)
    return `${name}${num}@${DG_DOMAINS[Math.floor(rand() * DG_DOMAINS.length)]}`
  })
  return { id, emails }
}

// ── Derivations shared by AMC and RCP ──────────────────────────────────────────
export function applyOverride(a: AmcAccount, ov?: ContractChange): AmcAccount {
  if (!ov) return a
  const cd = a.contractDetail
  return {
    ...a,
    email: ov.newEmail || a.email,
    step1: ov.newEmail ? { ...a.step1, email: ov.newEmail } : a.step1,
    contract: ov.newStart ? fromUS(ov.newStart) : a.contract,
    contractDetail: {
      ...cd,
      start: ov.newStart || cd.start,
      end: ov.newEnd || cd.end,
      facilities: cd.facilities.map(f => (ov.newStart ? { ...f, meterStart: ov.newStart } : f)),
    },
  }
}

export function computeStatus(a: AmcAccount) {
  if (a.passwordChanged) return "Active"
  // External users only move between these two statuses, driven by their own login.
  if (creatorKind(a.by) === "external") return "Password email sent"
  if (a.step3.done) return a.hoursSincePwEmail > 24 ? "Inactive" : "Password email sent"
  if (a.step2.done) return "Welcome email sent"
  return a.step1.email ? "Account loaded" : "Pending email"
}

export function toCustomerContract(a: AmcAccount): CustomerContract {
  const cd = a.contractDetail
  return {
    id: cd.number,
    customerName: a.name,
    contractNumber: cd.number,
    executionDate: cd.executed,
    startDate: cd.start,
    endDate: cd.end,
    facilities: cd.facilities.map(f => ({
      facilityNumber: f.facilityNumber, serviceAddress: f.address,
      meterStartDate: f.meterStart, meterEndDate: f.meterEnd, contractNumber: cd.number,
    })),
  }
}
