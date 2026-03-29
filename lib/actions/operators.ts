"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type OperatorRow = {
  id: string
  operatorName: string
  email: string
  phoneNumber: string
  operatorId: string
  moduleRealTimeOps: boolean
  moduleReportsRepo: boolean
  moduleCryptoMiners: boolean
  moduleIndirectMarket: boolean
  createdAt: Date
}

export async function getOperators(): Promise<OperatorRow[]> {
  return prisma.operator.findMany({ orderBy: { createdAt: "asc" } })
}

export async function createOperator(data: {
  operatorName: string
  email: string
  phoneNumber: string
  operatorId: string
  moduleRealTimeOps: boolean
  moduleReportsRepo: boolean
  moduleCryptoMiners: boolean
  moduleIndirectMarket: boolean
}): Promise<OperatorRow> {
  const row = await prisma.operator.create({ data })
  revalidatePath("/client-configuration")
  return row
}

export async function deleteOperator(id: string): Promise<void> {
  await prisma.operator.delete({ where: { id } })
  revalidatePath("/client-configuration")
}
