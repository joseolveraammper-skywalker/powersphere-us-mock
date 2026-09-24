"use client"

import i18next from "i18next"
import { initReactI18next, I18nextProvider } from "react-i18next"
import { AmpSnackbarProvider, registerSharedTwI18n } from "@powersphere/shared-tw"
import type { ReactNode } from "react"

// Amp* components read their labels (pagination, pickers, dismiss…) from i18next and
// fall back to Spanish when no language is configured, so English must be set explicitly.
if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    initImmediate: false,
    interpolation: { escapeValue: false },
    resources: {},
  })
  registerSharedTwI18n(i18next)
}

export function SharedTwProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18next}>
      <AmpSnackbarProvider maxSnack={3}>{children}</AmpSnackbarProvider>
    </I18nextProvider>
  )
}
