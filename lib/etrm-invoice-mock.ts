// Shared ETRM invoice mock data used by:
//   - Document Repository (ETRM Invoices tab)
//   - ETRM Settlement Report (Invoice Validation overlay)

export type SendStatus = "done" | "pending" | "none"

export type ETRMInvoiceRecord = {
  id: string
  name: string
  counterparty: string
  contractId: string        // matches ReportContract.id in etrm/page.tsx
  receivedDate: string
  period: string
  fileSize: string
  // Invoice financial figures — from the counterparty's PDF invoice
  invoiceMwh: number
  invoiceTotal: number      // total amount on the invoice (positive = owed to us)
  invoiceRate: number       // $/MWh as stated on the invoice
  // Document workflow status
  postedOnMis: boolean
  sentToSap: boolean
  downloaded: boolean
  extractData: boolean
  billCheck: boolean
  sendToSap: SendStatus
}

// Settled values (from ETRM settlement report contracts) for reference:
//   e1  EDF    Physical  mwh:  1440   total: -75801.60
//   n1  ENGIE  Financial mwh: -1760   total:  13151.78
//   n2  ENGIE  Financial mwh: -1280   total:  11446.85  ← INVOICE MISMATCH
//   n3  ENGIE  Financial mwh:   300   total: -13387.40
//   n4  ENGIE  Financial mwh:  -640   total:   5723.42
//   n5  ENGIE  Physical  invoiceArrived=false → no invoice
//   n6  ENGIE  Financial mwh:  3520   total: -21903.56
//   n7  ENGIE  Financial mwh: -1760   total:  15351.78  ← INVOICE MISMATCH
//   v1  VISTRA Physical  mwh:   720   total: -38400.00
//   s1  SHELL  Financial mwh:  -880   total:   6775.60  ← INVOICE MISMATCH

export const ETRM_INVOICE_DATA: ETRMInvoiceRecord[] = [
  // ── EDF ──────────────────────────────────────────────────────────────────────
  {
    id: "ei-e1", name: "ETRM-STD/2026-031", counterparty: "EDF", contractId: "e1",
    receivedDate: "03/31/2026", period: "Mar 2026", fileSize: "0.6 MB",
    invoiceMwh: 1440, invoiceTotal: -75801.60, invoiceRate: -52.64,
    postedOnMis: false, sentToSap: false, downloaded: true, extractData: true, billCheck: true, sendToSap: "done",
  },
  // ── ENGIE ─────────────────────────────────────────────────────────────────────
  {
    id: "ei-n1", name: "ETRM-FIN/2026-033", counterparty: "ENGIE", contractId: "n1",
    receivedDate: "03/31/2026", period: "Mar 2026", fileSize: "0.5 MB",
    invoiceMwh: -1760, invoiceTotal: 13151.78, invoiceRate: -7.47,
    postedOnMis: false, sentToSap: false, downloaded: true, extractData: true, billCheck: true, sendToSap: "done",
  },
  {
    // MISMATCH: invoice says $11,200.00, settlement calculates $11,446.85
    id: "ei-n2", name: "ETRM-FIN/2026-034", counterparty: "ENGIE", contractId: "n2",
    receivedDate: "03/31/2026", period: "Mar 2026", fileSize: "0.4 MB",
    invoiceMwh: -1280, invoiceTotal: 11200.00, invoiceRate: -8.75,
    postedOnMis: false, sentToSap: false, downloaded: true, extractData: true, billCheck: false, sendToSap: "none",
  },
  {
    id: "ei-n3", name: "ETRM-FIN/2026-035", counterparty: "ENGIE", contractId: "n3",
    receivedDate: "03/30/2026", period: "Mar 2026", fileSize: "0.4 MB",
    invoiceMwh: 300, invoiceTotal: -13387.40, invoiceRate: -44.62,
    postedOnMis: false, sentToSap: false, downloaded: true, extractData: true, billCheck: true, sendToSap: "pending",
  },
  {
    id: "ei-n4", name: "ETRM-FIN/2026-036", counterparty: "ENGIE", contractId: "n4",
    receivedDate: "03/30/2026", period: "Mar 2026", fileSize: "0.3 MB",
    invoiceMwh: -640, invoiceTotal: 5723.42, invoiceRate: -8.94,
    postedOnMis: false, sentToSap: false, downloaded: true, extractData: false, billCheck: false, sendToSap: "none",
  },
  {
    id: "ei-n6", name: "ETRM-FIN/2026-037", counterparty: "ENGIE", contractId: "n6",
    receivedDate: "03/31/2026", period: "Mar 2026", fileSize: "0.5 MB",
    invoiceMwh: 3520, invoiceTotal: -21903.56, invoiceRate: -6.22,
    postedOnMis: false, sentToSap: false, downloaded: true, extractData: true, billCheck: true, sendToSap: "pending",
  },
  {
    // MISMATCH: invoice says $15,600.00, settlement calculates $15,351.78
    id: "ei-n7", name: "ETRM-FIN/2026-038", counterparty: "ENGIE", contractId: "n7",
    receivedDate: "03/31/2026", period: "Mar 2026", fileSize: "0.4 MB",
    invoiceMwh: -1760, invoiceTotal: 15600.00, invoiceRate: -8.86,
    postedOnMis: false, sentToSap: false, downloaded: true, extractData: false, billCheck: false, sendToSap: "none",
  },
  // ── VISTRA ────────────────────────────────────────────────────────────────────
  {
    id: "ei-v1", name: "ETRM-STD/2026-039", counterparty: "VISTRA", contractId: "v1",
    receivedDate: "03/31/2026", period: "Mar 2026", fileSize: "0.6 MB",
    invoiceMwh: 720, invoiceTotal: -38400.00, invoiceRate: -53.33,
    postedOnMis: false, sentToSap: false, downloaded: true, extractData: true, billCheck: true, sendToSap: "pending",
  },
  // ── SHELL ─────────────────────────────────────────────────────────────────────
  {
    // MISMATCH: invoice says $6,900.00, settlement calculates $6,775.60
    id: "ei-s1", name: "ETRM-STD/2026-040", counterparty: "SHELL", contractId: "s1",
    receivedDate: "03/31/2026", period: "Mar 2026", fileSize: "0.4 MB",
    invoiceMwh: -880, invoiceTotal: 6900.00, invoiceRate: -7.84,
    postedOnMis: false, sentToSap: false, downloaded: true, extractData: true, billCheck: false, sendToSap: "none",
  },
]
