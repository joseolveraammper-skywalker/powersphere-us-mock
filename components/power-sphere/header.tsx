"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

const BORDER = "1px solid var(--surface-border)"

interface HeaderProps {
  pageTitle: string
}

type MenuEntry =
  | { separator: true }
  | { separator?: false; label: string; icon: string; command: () => void }

export function Header({ pageTitle }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const isLight = resolvedTheme === "light"

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const menuItems: MenuEntry[] = [
    { label: "Account Manager Console", icon: "pi pi-briefcase", command: () => router.push("/account-manager-console") },
    { label: "Administration", icon: "pi pi-cog", command: () => {} },
    {
      label: isLight ? "Dark mode" : "Light mode",
      icon: isLight ? "pi pi-moon" : "pi pi-sun",
      command: () => setTheme(isLight ? "dark" : "light"),
    },
    { separator: true },
    { label: "Log out", icon: "pi pi-sign-out", command: () => {} },
  ]

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 1.5rem", minHeight: 48, flexShrink: 0,
      background: "var(--surface-section)", borderBottom: BORDER,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em",
          padding: "2px 8px", borderRadius: 4,
          background: "rgba(204,17,17,0.12)", color: "#cc1111",
        }}>
          PowerSphere
        </span>
        <span style={{ color: "var(--surface-border)" }}>/</span>
        <h1 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text-color)" }}>
          {pageTitle}
        </h1>
      </div>

      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          aria-label="User menu"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          onMouseEnter={() => setHovered("__trigger")}
          onMouseLeave={() => setHovered(null)}
          style={{
            width: "2rem", height: "2rem", borderRadius: "50%", border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: open || hovered === "__trigger" ? "var(--surface-hover)" : "none",
            color: "var(--text-color-secondary)",
          }}
        >
          <i className="pi pi-user" style={{ fontSize: 14 }} />
        </button>

        {open && (
          <div role="menu" style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 1000, minWidth: 220,
            background: "var(--surface-card)", border: BORDER, borderRadius: 8, padding: "4px 0",
            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
          }}>
            {menuItems.map((item, i) => item.separator ? (
              <div key={`sep-${i}`} style={{ height: 1, background: "var(--surface-border)", margin: "4px 0" }} />
            ) : (
              <button
                key={item.label}
                role="menuitem"
                onClick={() => { item.command(); setOpen(false) }}
                onMouseEnter={() => setHovered(item.label)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 14px", border: "none", cursor: "pointer", textAlign: "left",
                  fontSize: 12, fontFamily: "inherit", color: "var(--text-color)",
                  background: hovered === item.label ? "var(--surface-hover)" : "none",
                }}
              >
                <i className={item.icon} style={{ fontSize: 12, color: "var(--text-color-secondary)" }} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
