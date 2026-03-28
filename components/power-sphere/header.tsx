interface HeaderProps {
  pageTitle: string
}

export function Header({ pageTitle }: HeaderProps) {
  return (
    <header className="h-12 bg-secondary border-b border-border flex items-center px-6 shrink-0">
      <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>
    </header>
  )
}
