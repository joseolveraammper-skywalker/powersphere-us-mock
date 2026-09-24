export type Facility = {
  facilityNumber: string
  serviceAddress: string
  meterStartDate: string
  meterEndDate: string
  contractNumber: string
}

export type CustomerContract = {
  id: string
  customerName: string
  contractNumber: string
  executionDate: string
  startDate: string
  endDate: string
  facilities: Facility[]
}

const CUSTOMER_NAMES = [
  "White Realty Management, Inc.", "Wild Duck Bar & Grill LLC", "Molinas Enterprises Inc",
  "Lone Star Cold Storage LLC", "Brazos Valley Dental Group", "Pecan Creek Apartments LP",
  "Hill Country Feed & Supply", "Gulf Coast Marine Services", "Bluebonnet Senior Living",
  "Red River Machining Co.", "Alamo Heights Bakery", "Trinity Plaza Holdings LLC",
  "Cedar Park Fitness Center", "Frio Canyon Ranch Supply", "Big Bend Hospitality Group",
  "Sabine Pass Logistics Inc", "Palo Duro Auto Repair", "Mesquite Smokehouse BBQ",
  "Rio Grande Packaging Corp", "Longhorn Car Wash LLC", "Caddo Lake Outfitters",
  "Galveston Bay Seafood Co.", "Llano Estacado Farms", "Guadalupe River Lodge",
  "Permian Basin Storage LLC", "Stockyards Western Wear", "Nueces County Medical Plaza",
  "Kerrville Printing & Signs", "Waco Riverside Offices LP", "Denton Square Coffee Co.",
  "Abilene Grain Elevator Inc", "Laredo Border Freight LLC", "Tyler Rose Garden Florist",
  "Lubbock Cotton Gin Co-op", "Amarillo Truck Stop Inc", "San Marcos Tubing Rentals",
  "Beaumont Industrial Supply", "Corpus Christi Ice House", "Midland Office Park LLC",
  "El Paso Mountain Storage", "Round Rock Self Storage", "Katy Prairie Veterinary",
  "Sugar Land Learning Center", "McAllen Citrus Packers", "Brownwood Hardware & Lumber",
  "Victoria Tire & Service", "Odessa Oilfield Rentals", "Pflugerville Pizza Kitchen",
  "Conroe Lakeside Marina", "Temple Main Street Deli",
]

const STREETS = [
  "FISHOOK DR", "N FISK AVE", "HIGH TOP ST", "KIRKLAND DR", "S MAIN ST", "COMMERCE ST",
  "INDUSTRIAL BLVD", "RANCH RD 620", "FM 1960 RD", "PECAN ST", "OAK HOLLOW LN", "BROADWAY AVE",
  "MARKET ST", "LAMAR BLVD", "COUNTY RD 45", "ELM ST", "HWY 183", "MESQUITE TRL",
]
const UNITS = ["", "", "", " UNIT A", " UNIT B", " UNIT C", " BLDG", " PERM", " UNIT STAGE", " STE 100"]

const CITIES: { city: string; zip: string }[] = [
  { city: "BROWNWOOD", zip: "76801" }, { city: "AUSTIN", zip: "78704" },
  { city: "HOUSTON", zip: "77002" }, { city: "DALLAS", zip: "75201" },
  { city: "SAN ANTONIO", zip: "78205" }, { city: "WACO", zip: "76701" },
  { city: "LUBBOCK", zip: "79401" }, { city: "CORPUS CHRISTI", zip: "78401" },
  { city: "TYLER", zip: "75701" }, { city: "ABILENE", zip: "79601" },
  { city: "MIDLAND", zip: "79701" }, { city: "BEAUMONT", zip: "77701" },
]

export function mulberry32(a: number) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export const pad = (n: number) => String(n).padStart(2, "0")
export const fmt = (d: Date) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`
const addDays = (d: Date, days: number) => { const r = new Date(d); r.setDate(r.getDate() + days); return r }

function buildMockContracts(): CustomerContract[] {
  const rand = mulberry32(20240306)
  const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]

  return CUSTOMER_NAMES.map((name, i) => {
    const execution = new Date(2023, int(0, 11), int(1, 28))
    const start = new Date(execution.getFullYear() + (rand() < 0.5 ? 0 : 1), int(0, 11), 1)
    const end = new Date(start.getFullYear() + int(2, 5), int(0, 11), 1)
    const prefix = name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase()
    const contractNumber = `${prefix}_${pad(execution.getMonth() + 1)}${pad(execution.getDate())}${execution.getFullYear()}_${int(10000, 199999)}`
    const location = pick(CITIES)

    const facilityCount = int(1, 8)
    const facilities: Facility[] = Array.from({ length: facilityCount }, () => {
      const meterStart = rand() < 0.6 ? start : addDays(start, int(30, 600))
      const meterEnd = rand() < 0.85 ? addDays(end, int(-25, 0)) : addDays(meterStart, int(180, 500))
      return {
        facilityNumber: `1044372000${String(int(0, 9999999)).padStart(7, "0")}`,
        serviceAddress: `${int(10, 9999)} ${pick(STREETS)}${pick(UNITS)} - ${location.city} - TX - ${location.zip}`,
        meterStartDate: fmt(meterStart),
        meterEndDate: fmt(meterEnd),
        contractNumber,
      }
    })

    return {
      id: `rc-${i + 1}`,
      customerName: name,
      contractNumber,
      executionDate: fmt(execution),
      startDate: fmt(start),
      endDate: fmt(end),
      facilities,
    }
  })
}

// Seed only: the live RCP list is derived from Active AMC accounts in account-manager-context.
export const RETAIL_CUSTOMER_SEED = buildMockContracts()
