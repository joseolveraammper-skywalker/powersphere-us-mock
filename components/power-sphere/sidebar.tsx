"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

type NavChild = {
  name: string
  href: string
}

type NavItem = {
  name: string
  href?: string
  children?: NavChild[]
}

const navItems: NavItem[] = [
  { name: "Retail Customer", href: "#" },
  { name: "Meter Readings", href: "#" },
  {
    name: "Operations",
    children: [
      { name: "Client Configuration", href: "/client-configuration" },
      { name: "Document Repository", href: "#" },
      { name: "Real Time Operations", href: "/" },
      { name: "Prospect", href: "#" },
    ],
  },
  {
    name: "Market Desk",
    children: [
      { name: "Market Transactions", href: "/market-transactions/scheduling" },
    ],
  },
  { name: "ETRM", href: "/etrm" },
  { name: "Demand Response", href: "#" },
]

export function Sidebar() {
  const pathname = usePathname()
  
  // Check if any child is active for each section
  const getIsChildActive = (parentName: string) => {
    const parent = navItems.find((item) => item.name === parentName)
    const children = parent?.children || []
    return children.some((c) => c.href === pathname)
  }
  
  const [operationsOpen, setOperationsOpen] = useState(getIsChildActive("Operations") || true)
  const [marketDeskOpen, setMarketDeskOpen] = useState(getIsChildActive("Market Desk") || false)
  
  // Keep sections open when a child is active
  useEffect(() => {
    if (getIsChildActive("Operations")) {
      setOperationsOpen(true)
    }
    if (getIsChildActive("Market Desk")) {
      setMarketDeskOpen(true)
    }
  }, [pathname])

  return (
    <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-sidebar-border">
        <div className="leading-none">
          <div className="text-primary font-black text-2xl tracking-tight">Ammper</div>
          <div className="flex items-center gap-1 -mt-0.5">
            <span className="text-foreground font-semibold text-lg">po</span>
            <span className="text-primary font-black text-lg">w</span>
            <span className="text-foreground font-semibold text-lg">er</span>
          </div>
          <div className="mt-1">
            <span className="text-primary font-black text-sm tracking-wide">POWER</span>
            <span className="text-foreground font-semibold text-sm tracking-wide"> SPHERE</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul>
          {navItems.map((item) => {
            if (item.children) {
              const isOpen = item.name === "Operations" ? operationsOpen : item.name === "Market Desk" ? marketDeskOpen : false
              const toggleOpen = item.name === "Operations" ? setOperationsOpen : item.name === "Market Desk" ? setMarketDeskOpen : null
              const isChildActive = item.children.some((c) => c.href === pathname)
              
              return (
                <li key={item.name}>
                  <button
                    onClick={() => toggleOpen && toggleOpen((o: boolean) => !o)}
                    className={`w-full flex items-center justify-between px-5 py-2.5 text-sm font-bold transition-colors ${
                      isChildActive
                        ? "text-primary border-l-[3px] border-primary bg-sidebar-accent"
                        : "text-sidebar-foreground hover:bg-sidebar-accent border-l-[3px] border-transparent"
                    }`}
                  >
                    {item.name}
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`}
                    />
                  </button>
                  {isOpen && (
                    <ul>
                      {item.children.map((child) => {
                        const isActive = pathname === child.href
                        return (
                          <li key={child.name}>
                            <Link
                              href={child.href}
                              className={`block pl-8 pr-5 py-2 text-sm transition-colors ${
                                isActive
                                  ? "text-primary font-semibold border-l-[3px] border-primary bg-sidebar-accent"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent border-l-[3px] border-transparent"
                              }`}
                            >
                              {child.name}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            }

            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`block px-5 py-2.5 text-sm font-bold transition-colors ${
                    isActive
                      ? "text-primary border-l-[3px] border-primary bg-sidebar-accent"
                      : "text-sidebar-foreground hover:bg-sidebar-accent border-l-[3px] border-transparent"
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
