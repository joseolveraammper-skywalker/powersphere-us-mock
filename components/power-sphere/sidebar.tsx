"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import Image from "next/image"

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
  { name: "Retail Customer", href: "/retail-customer" },
  { name: "Meter Readings", href: "/meter-readings" },
  {
    name: "Operations",
    children: [
      { name: "Client Configuration", href: "/client-configuration" },
      { name: "Document Repository", href: "/document-repository" },
      { name: "Real Time Operations", href: "/real-time-operations" },
      { name: "Prospect", href: "/prospect" },
    ],
  },
  {
    name: "Market Desk",
    children: [
      { name: "Market Transactions", href: "/market-transactions/scheduling" },
    ],
  },
  { name: "ETRM", href: "/etrm" },
  { name: "Demand Response", href: "/demand-response" },
]

export function Sidebar() {
  const pathname = usePathname()

  const isChildActive = (parentName: string) => {
    const parent = navItems.find((item) => item.name === parentName)
    return (parent?.children || []).some((c) => c.href === pathname)
  }

  const [operationsOpen, setOperationsOpen] = useState<boolean>(isChildActive("Operations") || true)
  const [marketDeskOpen, setMarketDeskOpen] = useState<boolean>(isChildActive("Market Desk") || false)

  useEffect(() => {
    if (isChildActive("Operations")) setOperationsOpen(true)
    if (isChildActive("Market Desk")) setMarketDeskOpen(true)
  }, [pathname])

  return (
    <aside
      className="w-56 flex flex-col h-full shrink-0"
      style={{ background: "var(--surface-card)", borderRight: "1px solid var(--surface-border)" }}
    >
      {/* Logo */}
      <div
        className="px-5 pt-4 pb-3 flex items-center"
        style={{ borderBottom: "1px solid var(--surface-border)" }}
      >
        <Image
          src="/powersphere-logo.png"
          alt="Ammper Power Sphere"
          width={148}
          height={58}
          priority
          style={{ width: "auto", height: "52px", objectFit: "contain" }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => {
            if (item.children) {
              const isOpen =
                item.name === "Operations" ? operationsOpen :
                item.name === "Market Desk" ? marketDeskOpen : false
              const toggle =
                item.name === "Operations" ? setOperationsOpen :
                item.name === "Market Desk" ? setMarketDeskOpen : null
              const groupActive = item.children.some((c) => c.href === pathname)

              return (
                <li key={item.name}>
                  <button
                    onClick={() => toggle && toggle((o) => !o)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
                    style={{
                      color: groupActive ? "#cc1111" : "var(--text-color-secondary)",
                      background: groupActive ? "rgba(204,17,17,0.08)" : "transparent",
                    }}
                    onMouseEnter={e => { if (!groupActive) (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = groupActive ? "rgba(204,17,17,0.08)" : "transparent" }}
                  >
                    <span>{item.name}</span>
                    <ChevronDown
                      className="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
                      style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                    />
                  </button>
                  {isOpen && (
                    <ul className="mt-0.5 ml-2 space-y-0.5">
                      {item.children.map((child) => {
                        const active = pathname === child.href
                        return (
                          <li key={child.name}>
                            <Link
                              href={child.href}
                              className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-md text-sm transition-colors"
                              style={{
                                color: active ? "#cc1111" : "var(--text-color-secondary)",
                                background: active ? "rgba(204,17,17,0.10)" : "transparent",
                                fontWeight: active ? 600 : 400,
                                borderLeft: active ? "2px solid #cc1111" : "2px solid transparent",
                              }}
                              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)" }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? "rgba(204,17,17,0.10)" : "transparent" }}
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

            const active = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href!}
                  className="flex items-center px-3 py-2 rounded-md text-sm transition-colors"
                  style={{
                    color: active ? "#cc1111" : "var(--text-color-secondary)",
                    background: active ? "rgba(204,17,17,0.10)" : "transparent",
                    fontWeight: active ? 600 : 400,
                    borderLeft: active ? "2px solid #cc1111" : "2px solid transparent",
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? "rgba(204,17,17,0.10)" : "transparent" }}
                >
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-3 text-xs"
        style={{ borderTop: "1px solid var(--surface-border)", color: "var(--text-color-secondary)" }}
      >
        admin@powersphere.com
      </div>
    </aside>
  )
}
