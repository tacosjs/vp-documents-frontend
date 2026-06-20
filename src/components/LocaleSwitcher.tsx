import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppLocale } from '@/contexts/AppLocaleContext'
import { m } from '@/paraglide/messages'
import { locales } from '@/paraglide/runtime'
import { useMeQuery, usePatchMeMutation } from '@/services/auth'

const localeLabel = (locale: (typeof locales)[number]): string => {
  switch (locale) {
    case 'en':
      return m['locale_switcher.option_en']()
    case 'fr':
      return m['locale_switcher.option_fr']()
    default:
      return ''
  }
}

type LocaleSwitcherProps = {
  /** Compact trigger for auth header */
  size?: 'sm' | 'default'
  triggerClassName?: string
}

export const LocaleSwitcher = ({
  size = 'default',
  triggerClassName,
}: LocaleSwitcherProps) => {
  const { locale: currentLocale, setAppLocale } = useAppLocale()
  const { data: me } = useMeQuery()
  const patchMe = usePatchMeMutation()

  return (
    <Select
      value={currentLocale}
      onValueChange={async (value) => {
        if (!locales.includes(value as (typeof locales)[number])) return
        if (me) {
          try {
            await patchMe.mutateAsync({ preferred_locale: value })
          } catch {
            return
          }
        }
        setAppLocale(value as (typeof locales)[number])
      }}
    >
      <SelectTrigger
        aria-label={m['locale_switcher.language_label']()}
        className={triggerClassName}
        size={size}
      >
        <SelectValue placeholder={localeLabel(currentLocale)} />
      </SelectTrigger>
      <SelectContent align="end">
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {localeLabel(locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
