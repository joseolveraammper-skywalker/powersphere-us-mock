"use client"

import { PrimeReactProvider } from "primereact/api"
import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"
import { SharedTwProvider } from "@/components/shared-tw-provider"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <PrimeReactProvider value={{ ripple: true }}>
        <SharedTwProvider>{children}</SharedTwProvider>
      </PrimeReactProvider>
    </ThemeProvider>
  )
}
