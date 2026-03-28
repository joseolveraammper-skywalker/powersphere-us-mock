"use client"

import { PrimeReactProvider } from "primereact/api"
import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <PrimeReactProvider value={{ ripple: true }}>
        {children}
      </PrimeReactProvider>
    </ThemeProvider>
  )
}
