"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

type NavChild = {
  name: string
  href: string
  icon: string
}

type NavItem = {
  name: string
  icon: string
  href?: string
  children?: NavChild[]
}

const navItems: NavItem[] = [
  { name: "Retail Customer",  icon: "pi pi-users",     href: "/retail-customer" },
  { name: "Meter Readings",   icon: "pi pi-chart-bar", href: "/meter-readings" },
  {
    name: "Operations",
    icon: "pi pi-cog",
    children: [
      { name: "Client Configuration",  icon: "pi pi-sliders-h", href: "/client-configuration" },
      { name: "Document Repository",   icon: "pi pi-folder",    href: "/document-repository" },
      { name: "Real Time Operations",  icon: "pi pi-desktop",   href: "/real-time-operations" },
      { name: "Prospect",              icon: "pi pi-briefcase", href: "/prospect" },
    ],
  },
  {
    name: "Market Desk",
    icon: "pi pi-chart-line",
    children: [
      { name: "Market Transactions", icon: "pi pi-arrow-right-arrow-left", href: "/market-transactions/scheduling" },
    ],
  },
  { name: "ETRM",            icon: "pi pi-database", href: "/etrm" },
  { name: "Demand Response", icon: "pi pi-bolt",     href: "/demand-response" },
]

const BORDER = "1px solid var(--surface-border)"

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
    <aside style={{
      width: 216,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "var(--surface-card)",
      borderRight: BORDER,
    }}>

      {/* Logo */}
      <div style={{ padding: "1rem 1.25rem 0.875rem", borderBottom: BORDER, display: "flex", alignItems: "center" }}>
        <Image
          src="/powersphere-logo.png"
          alt="Ammper Power Sphere"
          width={148}
          height={58}
          priority
          style={{ width: "auto", height: "44px", objectFit: "contain" }}
        />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "0.625rem 0.5rem" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 1 }}>
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
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.45rem 0.625rem",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      background: groupActive ? "rgba(204,17,17,0.07)" : "transparent",
                      color: groupActive ? "#cc1111" : "var(--text-color-secondary)",
                    }}
                    onMouseEnter={e => { if (!groupActive) (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = groupActive ? "rgba(204,17,17,0.07)" : "transparent" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <i className={item.icon} style={{ fontSize: 12, width: 14, textAlign: "center", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{item.name}</span>
                    </div>
                    <i
                      className="pi pi-angle-down"
                      style={{
                        fontSize: 11,
                        flexShrink: 0,
                        transition: "transform 0.2s",
                        transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                      }}
                    />
                  </button>

                  {isOpen && (
                    <ul style={{ listStyle: "none", margin: "2px 0 2px 8px", padding: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                      {item.children.map((child) => {
                        const active = pathname === child.href
                        return (
                          <li key={child.name}>
                            <Link
                              href={child.href}
                              style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "0.4rem 0.625rem",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: active ? 600 : 400,
                                color: active ? "#cc1111" : "var(--text-color-secondary)",
                                background: active ? "rgba(204,17,17,0.08)" : "transparent",
                                borderLeft: active ? "2px solid #cc1111" : "2px solid transparent",
                                textDecoration: "none",
                                transition: "background 0.15s, color 0.15s",
                              }}
                              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)" }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? "rgba(204,17,17,0.08)" : "transparent" }}
                            >
                              <i className={child.icon} style={{ fontSize: 11, width: 14, textAlign: "center", flexShrink: 0 }} />
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
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "0.45rem 0.625rem",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#cc1111" : "var(--text-color-secondary)",
                    background: active ? "rgba(204,17,17,0.08)" : "transparent",
                    borderLeft: active ? "2px solid #cc1111" : "2px solid transparent",
                    textDecoration: "none",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? "rgba(204,17,17,0.08)" : "transparent" }}
                >
                  <i className={item.icon} style={{ fontSize: 12, width: 14, textAlign: "center", flexShrink: 0 }} />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div style={{ borderTop: BORDER }}>

        {/* Branding */}
        <div style={{ padding: "0.5rem 0.75rem", borderBottom: BORDER }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image
              src="/powersphere-logo-icon.png"
              alt="Ammper"
              width={28}
              height={28}
              style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement
                target.style.display = "none"
                const fallback = target.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = "flex"
              }}
            />
            <i className="pi pi-compass" style={{ fontSize: 16, color: "#cc1111", display: "none", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#cc1111", fontStyle: "italic" }}>
              Empowering Businesses
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "0.375rem 0.5rem", borderBottom: BORDER, display: "flex", flexDirection: "column", gap: 1 }}>
          {/* Contact Us */}
          <button style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "0.4rem 0.625rem", borderRadius: 6,
            border: "none", cursor: "pointer", background: "transparent",
            color: "var(--text-color-secondary)",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
          >
            <i className="pi pi-id-card" style={{ fontSize: 12, width: 14, textAlign: "center", flexShrink: 0 }} />
            <span style={{ fontSize: 12 }}>Contact Us</span>
          </button>

          {/* Language */}
          <button style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "0.4rem 0.625rem", borderRadius: 6,
            border: "none", cursor: "pointer", background: "transparent",
            color: "var(--text-color-secondary)",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
          >
            <span style={{ fontSize: 12, width: 14, textAlign: "center", flexShrink: 0 }}>🇺🇸</span>
            <span style={{ fontSize: 12 }}>English</span>
          </button>

          {/* Logout */}
          <button style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "0.4rem 0.625rem", borderRadius: 6,
            border: "none", cursor: "pointer", background: "transparent",
            color: "var(--text-color-secondary)",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
          >
            <i className="pi pi-sign-out" style={{ fontSize: 12, width: 14, textAlign: "center", flexShrink: 0 }} />
            <span style={{ fontSize: 12 }}>Logout</span>
          </button>
        </div>

        {/* Privacy Notice + Dev Docs */}
        <div style={{ padding: "0.4rem 1.25rem", display: "flex", flexDirection: "column", gap: 3 }}>
          <button style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontSize: 11, color: "var(--text-color-secondary)",
            textDecoration: "underline", textDecorationStyle: "dotted",
            textAlign: "left",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-color)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-color-secondary)" }}
          >
            Privacy Notice
          </button>
          <button style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontSize: 11, color: "var(--text-color-secondary)",
            textDecoration: "underline", textDecorationStyle: "dotted",
            textAlign: "left",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-color)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-color-secondary)" }}
          >
            Developer Documentation
          </button>
        </div>

        {/* User footer */}
        <div style={{
          padding: "0.5rem 0.875rem",
          borderTop: BORDER,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: "var(--surface-section)",
            border: BORDER,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <i className="pi pi-user" style={{ fontSize: 11, color: "var(--text-color-secondary)" }} />
          </div>
          <span style={{ fontSize: 11, color: "var(--text-color-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            admin@powersphere.com
          </span>
        </div>
      </div>
    </aside>
  )
}
