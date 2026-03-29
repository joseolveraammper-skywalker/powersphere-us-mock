"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { Counterparty, Document } from "@/lib/counterparty-context"

// ── Helpers ───────────────────────────────────────────────────────────────
function now() {
  return new Date().toLocaleString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })
}

function toCounterparty(row: {
  id: string; name: string; address: string; counterparty: string
  clientId: string; misShortname: string; directoryName: string
  directoryEmail: string; directoryPhone: string; status: string
  createdBy: string; createdOn: string; modifiedBy: string; lastModifiedOn: string
  documents: { id: string; name: string; description: string; uploadedBy: string; lastModified: string }[]
}): Counterparty {
  return {
    ...row,
    status: row.status as "Active" | "Inactive",
    documents: row.documents as Document[],
  }
}

// ── Actions ───────────────────────────────────────────────────────────────
export async function getCounterparties(): Promise<Counterparty[]> {
  const rows = await prisma.counterparty.findMany({
    include: { documents: true },
    orderBy: { createdOn: "asc" },
  })
  return rows.map(toCounterparty)
}

export async function createCounterparty(
  data: Omit<Counterparty, "id" | "createdOn" | "modifiedBy" | "lastModifiedOn">
): Promise<Counterparty> {
  const timestamp = now()
  const row = await prisma.counterparty.create({
    data: {
      name:          data.name,
      address:       data.address       ?? "",
      counterparty:  data.counterparty  ?? "",
      clientId:      data.clientId      ?? "",
      misShortname:  data.misShortname  ?? "",
      directoryName: data.directoryName ?? "",
      directoryEmail:data.directoryEmail?? "",
      directoryPhone:data.directoryPhone?? "",
      status:        data.status        ?? "Active",
      createdBy:     data.createdBy     ?? "",
      createdOn:     timestamp,
      modifiedBy:    data.createdBy     ?? "",
      lastModifiedOn:timestamp,
      documents: {
        create: (data.documents ?? []).map(d => ({
          name:         d.name,
          description:  d.description  ?? "",
          uploadedBy:   d.uploadedBy   ?? "",
          lastModified: d.lastModified ?? "",
        })),
      },
    },
    include: { documents: true },
  })
  revalidatePath("/client-configuration")
  return toCounterparty(row)
}

export async function updateCounterparty(data: Counterparty): Promise<Counterparty> {
  const timestamp = now()
  const row = await prisma.counterparty.update({
    where: { id: data.id },
    data: {
      name:          data.name,
      address:       data.address,
      counterparty:  data.counterparty,
      clientId:      data.clientId,
      misShortname:  data.misShortname,
      directoryName: data.directoryName,
      directoryEmail:data.directoryEmail,
      directoryPhone:data.directoryPhone,
      status:        data.status,
      modifiedBy:    "Current User",
      lastModifiedOn:timestamp,
    },
    include: { documents: true },
  })
  revalidatePath("/client-configuration")
  return toCounterparty(row)
}

export async function deleteCounterparty(id: string): Promise<void> {
  await prisma.counterparty.delete({ where: { id } })
  revalidatePath("/client-configuration")
}
