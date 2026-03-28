import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CounterpartyProvider } from '@/lib/counterparty-context'
import { Providers } from '@/components/providers'
import { PrimeThemeLoader } from '@/components/prime-theme-loader'
import 'primereact/resources/themes/lara-dark-teal/theme.css'
import 'primereact/resources/primereact.css'
import 'primeicons/primeicons.css'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Power Sphere - Ammper Power',
  description: 'Enterprise Energy Operations Platform',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <PrimeThemeLoader />
          <CounterpartyProvider>
            {children}
          </CounterpartyProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
