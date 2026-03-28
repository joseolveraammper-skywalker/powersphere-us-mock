"use client"

import { Header } from "./header"
import { Sidebar } from "./sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
  pageTitle?: string
  title?: string
}

export function DashboardLayout({ children, pageTitle, title }: DashboardLayoutProps) {
  const displayTitle = pageTitle || title || ""

  return (
    <div className="h-screen flex" style={{ background: "var(--surface-ground)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header pageTitle={displayTitle} />
        <main className="flex-1 overflow-auto p-6" style={{ background: "var(--surface-ground)" }}>
          {children}
        </main>
      </div>
    </div>
  )
}
