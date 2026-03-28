"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

const LINK_ID = "prime-light-theme"

const BRAND_OVERRIDES = `
  :root {
    --primary-color: #cc1111;
    --primary-color-text: #ffffff;
    --highlight-bg: rgba(204,17,17,0.14);
    --highlight-text-color: #cc1111;
    --focus-ring: 0 0 0 0.2rem rgba(204,17,17,0.2);
    --surface-ground: #f4f6f9;
    --surface-section: #eef1f5;
    --surface-card: #ffffff;
    --surface-overlay: #ffffff;
    --surface-border: #d8dde6;
    --surface-hover: #e8edf4;
    --text-color: #1a1a2e;
    --text-color-secondary: #6b7280;
  }
`

export function PrimeThemeLoader() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const existing = document.getElementById(LINK_ID)

    if (resolvedTheme === "light") {
      if (!existing) {
        const link = document.createElement("link")
        link.id = LINK_ID
        link.rel = "stylesheet"
        link.href = "/prime-light.css"
        document.head.appendChild(link)

        const style = document.createElement("style")
        style.id = `${LINK_ID}-brand`
        style.textContent = BRAND_OVERRIDES
        document.head.appendChild(style)
      }
    } else {
      existing?.remove()
      document.getElementById(`${LINK_ID}-brand`)?.remove()
    }
  }, [resolvedTheme])

  return null
}
