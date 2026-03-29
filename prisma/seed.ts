import "dotenv/config"
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

const adapter = new PrismaLibSql({ url: process.env["DATABASE_URL"] ?? "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Clear existing data
  await prisma.document.deleteMany()
  await prisma.site.deleteMany()
  await prisma.counterparty.deleteMany()

  await prisma.counterparty.createMany({
    data: [
      { id:"1", name:"EDF Trading North America",  address:"1000 Main St, Houston, TX 77002",          counterparty:"EDF",            clientId:"CP-EDF-001", misShortname:"EDFNA",  directoryName:"Pierre Dupont",   directoryEmail:"pierre.dupont@edftrading.com",  directoryPhone:"(713) 555-0101", status:"Active", createdBy:"Maria Garcia",    createdOn:"01/10/2026 09:00 AM", modifiedBy:"Carlos Rodriguez",  lastModifiedOn:"03/15/2026 02:30 PM" },
      { id:"2", name:"ENGIE Energy Marketing",     address:"1360 Post Oak Blvd, Houston, TX 77056",    counterparty:"ENGIE",          clientId:"CP-ENG-002", misShortname:"ENGIE",  directoryName:"Sophie Laurent",  directoryEmail:"sophie.laurent@engie.com",      directoryPhone:"(713) 555-0202", status:"Active", createdBy:"James Wilson",    createdOn:"01/15/2026 10:30 AM", modifiedBy:"James Wilson",      lastModifiedOn:"03/10/2026 11:45 AM" },
      { id:"3", name:"Vistra Corp",                address:"6555 Sierra Dr, Irving, TX 75039",         counterparty:"VISTRA",         clientId:"CP-VIS-003", misShortname:"VSTRA",  directoryName:"Michael Chen",    directoryEmail:"m.chen@vistracorp.com",         directoryPhone:"(972) 555-0303", status:"Active", createdBy:"Ana Martinez",    createdOn:"01/20/2026 02:00 PM", modifiedBy:"Maria Garcia",      lastModifiedOn:"03/12/2026 09:15 AM" },
      { id:"4", name:"ICE Markets LLC",            address:"5660 New Northside Dr, Atlanta, GA 30328", counterparty:"ICE",            clientId:"CP-ICE-004", misShortname:"ICEMK",  directoryName:"Robert Williams", directoryEmail:"r.williams@theice.com",         directoryPhone:"(770) 555-0404", status:"Active", createdBy:"Carlos Rodriguez", createdOn:"01/25/2026 11:00 AM", modifiedBy:"Carlos Rodriguez",  lastModifiedOn:"03/08/2026 03:30 PM" },
      { id:"5", name:"Axpo US LLC",                address:"200 Park Ave, New York, NY 10166",         counterparty:"AXPO",           clientId:"CP-AXP-005", misShortname:"AXPUS",  directoryName:"Hans Mueller",    directoryEmail:"hans.mueller@axpo.com",         directoryPhone:"(212) 555-0505", status:"Active", createdBy:"Maria Garcia",    createdOn:"02/01/2026 09:30 AM", modifiedBy:"Ana Martinez",      lastModifiedOn:"03/14/2026 10:00 AM" },
      { id:"6", name:"Shell Energy North America", address:"150 N Dairy Ashford, Houston, TX 77079",   counterparty:"SHELL",          clientId:"CP-SHL-006", misShortname:"SHENA",  directoryName:"David Thompson",  directoryEmail:"d.thompson@shell.com",          directoryPhone:"(281) 555-0606", status:"Active", createdBy:"James Wilson",    createdOn:"02/05/2026 01:45 PM", modifiedBy:"James Wilson",      lastModifiedOn:"03/18/2026 04:20 PM" },
      { id:"7", name:"Citadel Energy Trading",     address:"131 S Dearborn St, Chicago, IL 60603",     counterparty:"CITADEL",        clientId:"CP-CTD-007", misShortname:"CTDEL",  directoryName:"Jennifer Adams",  directoryEmail:"j.adams@citadel.com",           directoryPhone:"(312) 555-0707", status:"Active", createdBy:"Ana Martinez",    createdOn:"02/10/2026 10:15 AM", modifiedBy:"Maria Garcia",      lastModifiedOn:"03/20/2026 11:30 AM" },
      { id:"8", name:"MEA Energy Partners",        address:"2929 Allen Pkwy, Houston, TX 77019",       counterparty:"MEA",            clientId:"CP-MEA-008", misShortname:"MEAEP",  directoryName:"Sarah Mitchell",  directoryEmail:"s.mitchell@meaenergy.com",      directoryPhone:"(713) 555-0808", status:"Active", createdBy:"Carlos Rodriguez", createdOn:"02/15/2026 03:00 PM", modifiedBy:"Carlos Rodriguez",  lastModifiedOn:"03/19/2026 09:45 AM" },
      { id:"9", name:"TotalEnergies Trading",      address:"1201 Louisiana St, Houston, TX 77002",     counterparty:"TOTAL ENERGIES", clientId:"CP-TOT-009", misShortname:"TOTAL",  directoryName:"Antoine Moreau",  directoryEmail:"a.moreau@totalenergies.com",    directoryPhone:"(713) 555-0909", status:"Active", createdBy:"Maria Garcia",    createdOn:"02/20/2026 08:30 AM", modifiedBy:"Ana Martinez",      lastModifiedOn:"03/22/2026 02:15 PM" },
    ],
  })

  await prisma.document.createMany({
    data: [
      { id:"doc-edf-1", name:"EDF_Master_Agreement_2026.pdf",       description:"Master trading agreement for energy transactions", uploadedBy:"maria.garcia@powersphere.com",    lastModified:"01/10/2026", counterpartyId:"1" },
      { id:"doc-edf-2", name:"EDF_Credit_Profile.xlsx",             description:"Credit assessment and financial profile",          uploadedBy:"carlos.rodriguez@powersphere.com", lastModified:"02/20/2026", counterpartyId:"1" },
      { id:"doc-eng-1", name:"ENGIE_Trading_Terms.pdf",             description:"Standard trading terms and conditions",            uploadedBy:"james.wilson@powersphere.com",    lastModified:"01/15/2026", counterpartyId:"2" },
      { id:"doc-vis-1", name:"Vistra_Counterparty_Agreement.pdf",   description:"Bilateral trading agreement",                     uploadedBy:"ana.martinez@powersphere.com",    lastModified:"01/20/2026", counterpartyId:"3" },
      { id:"doc-vis-2", name:"Vistra_Compliance_Certificate.pdf",   description:"Regulatory compliance documentation",              uploadedBy:"maria.garcia@powersphere.com",    lastModified:"03/01/2026", counterpartyId:"3" },
      { id:"doc-ice-1", name:"ICE_Exchange_Agreement.pdf",          description:"Exchange participant agreement",                   uploadedBy:"carlos.rodriguez@powersphere.com", lastModified:"01/25/2026", counterpartyId:"4" },
      { id:"doc-axp-1", name:"Axpo_ISDA_Agreement.pdf",             description:"ISDA master agreement for derivatives",            uploadedBy:"maria.garcia@powersphere.com",    lastModified:"02/01/2026", counterpartyId:"5" },
      { id:"doc-axp-2", name:"Axpo_KYC_Documents.zip",              description:"Know Your Customer documentation package",         uploadedBy:"ana.martinez@powersphere.com",    lastModified:"02/15/2026", counterpartyId:"5" },
      { id:"doc-shl-1", name:"Shell_Energy_Trade_Contract.pdf",     description:"Energy trading master contract",                   uploadedBy:"james.wilson@powersphere.com",    lastModified:"02/05/2026", counterpartyId:"6" },
      { id:"doc-shl-2", name:"Shell_Credit_Support_Annex.pdf",      description:"Credit support documentation",                    uploadedBy:"james.wilson@powersphere.com",    lastModified:"02/28/2026", counterpartyId:"6" },
      { id:"doc-shl-3", name:"Shell_Settlement_Instructions.xlsx",  description:"Payment and settlement details",                   uploadedBy:"carlos.rodriguez@powersphere.com", lastModified:"03/10/2026", counterpartyId:"6" },
      { id:"doc-ctd-1", name:"Citadel_Trading_Agreement.pdf",       description:"Proprietary trading agreement",                    uploadedBy:"ana.martinez@powersphere.com",    lastModified:"02/10/2026", counterpartyId:"7" },
      { id:"doc-mea-1", name:"MEA_Partnership_Agreement.pdf",       description:"Energy partnership framework agreement",           uploadedBy:"carlos.rodriguez@powersphere.com", lastModified:"02/15/2026", counterpartyId:"8" },
      { id:"doc-mea-2", name:"MEA_Risk_Assessment.pdf",             description:"Counterparty risk evaluation report",              uploadedBy:"maria.garcia@powersphere.com",    lastModified:"03/05/2026", counterpartyId:"8" },
      { id:"doc-tot-1", name:"TotalEnergies_Master_Agreement.pdf",  description:"Global energy trading master agreement",           uploadedBy:"maria.garcia@powersphere.com",    lastModified:"02/20/2026", counterpartyId:"9" },
      { id:"doc-tot-2", name:"TotalEnergies_Netting_Agreement.pdf", description:"Close-out netting agreement",                     uploadedBy:"ana.martinez@powersphere.com",    lastModified:"03/01/2026", counterpartyId:"9" },
      { id:"doc-tot-3", name:"TotalEnergies_Authorized_Traders.xlsx",description:"List of authorized trading personnel",            uploadedBy:"carlos.rodriguez@powersphere.com", lastModified:"03/15/2026", counterpartyId:"9" },
    ],
  })

  console.log("✓ Seeded 9 counterparties and 17 documents")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
