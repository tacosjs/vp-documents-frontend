import { createContext, useContext } from 'react'

// `typeof locales` needs the value import (not `import type`).
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- value required for typeof
import { locales } from '@/paraglide/runtime'

export type AppLocale = (typeof locales)[number]

export type AppLocaleContextValue = {
  locale: AppLocale
  setAppLocale: (next: AppLocale) => void
}

export const AppLocaleContext = createContext<AppLocaleContextValue | null>(
  null,
)

export const useAppLocale = () => {
  const ctx = useContext(AppLocaleContext)
  if (!ctx) {
    throw new Error(
      'useAppLocale must be used within AppLocaleContext.Provider',
    )
  }
  return ctx
}
