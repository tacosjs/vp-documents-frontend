import { useEffect } from 'react'

import { useAppLocale } from '@/contexts/AppLocaleContext'
import { getLocale, locales } from '@/paraglide/runtime'
import { useMeQuery } from '@/services/auth'

/** Apply `me.preferredLocale` when it differs from the active Paraglide locale (no full reload). */
export const PreferredLocaleSync = () => {
  const { data: me } = useMeQuery()
  const { setAppLocale } = useAppLocale()

  useEffect(() => {
    if (!me?.preferredLocale) return
    if (!locales.includes(me.preferredLocale as (typeof locales)[number])) {
      return
    }
    if (getLocale() === me.preferredLocale) return
    setAppLocale(me.preferredLocale as (typeof locales)[number])
  }, [me?.preferredLocale, setAppLocale])

  return null
}
