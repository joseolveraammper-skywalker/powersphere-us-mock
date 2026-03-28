"use client"

import { Header } from "./header"
import { Sidebar } from "./sidebar"

type Tab = {
  id: string
  label: string
}

interface DashboardLayoutProps {
  children: React.ReactNode
  pageTitle?: string
  title?: string
  tabs?: Tab[]
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function DashboardLayout({ children, pageTitle, title, tabs, activeTab, onTabChange }: DashboardLayoutProps) {
  const displayTitle = pageTitle || title || ""
  
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header pageTitle={displayTitle} />

        {/* Tab navigation */}
        {tabs && tabs.length > 0 && onTabChange && (
          <div className="bg-card border-b border-border px-6">
            <nav className="flex gap-6">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`py-3 text-sm border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? "border-foreground text-foreground font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
