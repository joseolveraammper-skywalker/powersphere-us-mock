"use client"

import { useRef } from "react"
import { Toolbar } from "primereact/toolbar"
import { Menu } from "primereact/menu"
import { Button } from "primereact/button"
import { useTheme } from "next-themes"
import type { MenuItem } from "primereact/menuitem"

interface HeaderProps {
  pageTitle: string
}

export function Header({ pageTitle }: HeaderProps) {
  const menuRef = useRef<Menu>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const isLight = resolvedTheme === "light"

  const menuItems: MenuItem[] = [
    {
      label: "Administration",
      icon: "pi pi-cog",
      command: () => {},
    },
    {
      label: isLight ? "Dark mode" : "Light mode",
      icon: isLight ? "pi pi-moon" : "pi pi-sun",
      command: () => setTheme(isLight ? "dark" : "light"),
    },
    { separator: true },
    {
      label: "Log out",
      icon: "pi pi-sign-out",
      command: () => {},
    },
  ]

  const start = (
    <div className="flex items-center gap-3">
      <span
        className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
        style={{ background: "rgba(204,17,17,0.12)", color: "#cc1111" }}
      >
        PowerSphere
      </span>
      <span style={{ color: "var(--surface-border)" }}>/</span>
      <h1 className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>
        {pageTitle}
      </h1>
    </div>
  )

  const end = (
    <>
      <Menu model={menuItems} popup ref={menuRef} />
      <Button
        icon="pi pi-user"
        rounded
        text
        severity="secondary"
        aria-label="User menu"
        onClick={(e) => menuRef.current?.toggle(e)}
        style={{ width: "2rem", height: "2rem" }}
      />
    </>
  )

  return (
    <Toolbar
      start={start}
      end={end}
      className="border-0 border-b rounded-none px-6 py-0 shrink-0"
      style={{
        background: "var(--surface-section)",
        borderBottom: "1px solid var(--surface-border)",
        minHeight: "48px",
      }}
    />
  )
}
