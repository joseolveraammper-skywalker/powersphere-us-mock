"use client"

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { ChevronDown, ChevronRight, Compass, IdCard, LogOut, User } from "lucide-react"
import { AmpBox, AmpCollapse, AmpIcon, AmpStack, AmpTypography } from "@powersphere/shared-tw"

type NavChild = {
  name: string
  href: string
}

type NavItem = {
  name: string
  href?: string
  children?: NavChild[]
  defaultOpen?: boolean
}

const navItems: NavItem[] = [
  { name: "Retail Customer", href: "/retail-customer" },
  { name: "Meter Readings",  href: "/meter-readings" },
  {
    name: "Operations",
    defaultOpen: true,
    children: [
      { name: "Client Configuration", href: "/client-configuration" },
      { name: "Document Repository",  href: "/document-repository" },
      { name: "Real Time Operations", href: "/real-time-operations" },
      { name: "Prospect",             href: "/prospect" },
    ],
  },
  {
    name: "Market Desk",
    children: [
      { name: "Market Transactions", href: "/market-transactions/scheduling" },
    ],
  },
  { name: "ETRM",            href: "/etrm" },
  { name: "Demand Response", href: "/demand-response" },
]

const DIVIDER = "1px solid var(--color-border)"

// No shipped ps: class covers a left-only border, so width/style go inline and the class sets the color
const rowStyle: CSSProperties = { borderLeftWidth: 2, borderLeftStyle: "solid", textDecoration: "none" }
const rowClass = (active: boolean) =>
  "ps:block ps:w-full ps:text-left ps:cursor-pointer ps:rounded-md ps:transition-colors " +
  (active
    ? "ps:bg-primary/10 ps:text-primary ps:border-primary"
    : "ps:text-muted-foreground ps:border-transparent ps:hover:bg-muted ps:hover:text-foreground")

function RowContent({ icon, label, active, trailing }: { icon?: ReactNode; label: string; active?: boolean; trailing?: ReactNode }) {
  return (
    <AmpStack direction="row" align="center" justify="between" gap="sm" px="sm" py={6}>
      <AmpStack direction="row" align="center" gap="sm" minW={0}>
        {icon}
        <AmpBox truncate minW={0}>
          <AmpTypography variant="body-sm" color="inherit" weight={active ? "semibold" : "normal"}>{label}</AmpTypography>
        </AmpBox>
      </AmpStack>
      {trailing}
    </AmpStack>
  )
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={rowClass(active)} style={rowStyle} aria-current={active ? "page" : undefined}>
      <RowContent label={label} active={active} />
    </Link>
  )
}

function ActionRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button type="button" className={rowClass(false)} style={{ ...rowStyle, background: "none" }}>
      <RowContent icon={icon} label={label} />
    </button>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const hasActiveChild = (item: NavItem) => (item.children ?? []).some(c => c.href === pathname)

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navItems.filter(i => i.children).map(i => [i.name, !!i.defaultOpen || hasActiveChild(i)]))
  )

  useEffect(() => {
    const activeGroup = navItems.find(hasActiveChild)
    if (activeGroup) setOpenGroups(g => ({ ...g, [activeGroup.name]: true }))
  }, [pathname])

  return (
    <AmpStack as="aside" w={216} h="full" gap="none" bg="card" style={{ flexShrink: 0, borderRight: DIVIDER }}>
      <AmpBox px="md" py="md" style={{ borderBottom: DIVIDER }}>
        <Image
          src="/powersphere-logo.png"
          alt="Ammper Power Sphere"
          width={148}
          height={58}
          priority
          style={{ width: "auto", height: 44, objectFit: "contain" }}
        />
      </AmpBox>

      <AmpBox as="nav" grow overflow="auto" p="sm">
        <AmpStack gap="xs">
          {navItems.map(item => {
            if (!item.children) {
              return <NavLink key={item.name} href={item.href!} label={item.name} active={pathname === item.href} />
            }

            const groupActive = hasActiveChild(item)
            return (
              <AmpCollapse
                key={item.name}
                open={openGroups[item.name]}
                onOpenChange={open => setOpenGroups(g => ({ ...g, [item.name]: open }))}
                trigger={({ open, toggle }) => (
                  <button type="button" onClick={toggle} aria-expanded={open} className={rowClass(groupActive)} style={{ ...rowStyle, background: groupActive ? undefined : "none" }}>
                    <RowContent
                      label={item.name}
                      active={groupActive}
                      trailing={<AmpIcon icon={open ? ChevronDown : ChevronRight} size="xs" color="inherit" />}
                    />
                  </button>
                )}
              >
                <AmpStack gap="xs" pl="sm" pt="xs">
                  {item.children.map(child => (
                    <NavLink key={child.name} href={child.href} label={child.name} active={pathname === child.href} />
                  ))}
                </AmpStack>
              </AmpCollapse>
            )
          })}
        </AmpStack>
      </AmpBox>

      <AmpStack gap="none" style={{ borderTop: DIVIDER }}>
        <AmpStack direction="row" align="center" gap="sm" px="md" py="sm" style={{ borderBottom: DIVIDER }}>
          <AmpIcon icon={Compass} size="md" color="primary" />
          <AmpTypography variant="caption" weight="semibold" color="primary" style={{ fontStyle: "italic" }}>
            Empowering Businesses
          </AmpTypography>
        </AmpStack>

        <AmpStack gap="xs" p="sm" style={{ borderBottom: DIVIDER }}>
          <ActionRow icon={<AmpIcon icon={IdCard} size="sm" color="inherit" />} label="Contact Us" />
          <ActionRow icon={<AmpTypography variant="body-sm" as="span" aria-hidden>🇺🇸</AmpTypography>} label="English" />
          <ActionRow icon={<AmpIcon icon={LogOut} size="sm" color="inherit" />} label="Logout" />
        </AmpStack>

        <AmpStack gap="xs" px="md" py="sm" align="start">
          {["Privacy Notice", "Developer Documentation"].map(label => (
            <button
              key={label}
              type="button"
              className="ps:cursor-pointer ps:text-left ps:text-muted-foreground ps:hover:text-foreground ps:transition-colors"
              style={{ background: "none", textDecoration: "underline dotted" }}
            >
              <AmpTypography variant="footnote" color="inherit">{label}</AmpTypography>
            </button>
          ))}
        </AmpStack>

        <AmpStack direction="row" align="center" gap="sm" px="md" py="sm" style={{ borderTop: DIVIDER }}>
          <AmpStack w={26} h={26} align="center" justify="center" bg="muted" border rounded="sm" style={{ flexShrink: 0 }}>
            <AmpIcon icon={User} size="xs" color="muted" />
          </AmpStack>
          <AmpBox truncate minW={0}>
            <AmpTypography variant="footnote" color="muted">admin@powersphere.com</AmpTypography>
          </AmpBox>
        </AmpStack>
      </AmpStack>
    </AmpStack>
  )
}
