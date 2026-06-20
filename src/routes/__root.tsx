import { Fragment, useCallback, useMemo, useState } from 'react'

import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'

import { PreferredLocaleSync } from '@/components/PreferredLocaleSync'
import NotFound from '@/components/NotFound'
import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools'
import { ReactQueryProvider } from '@/integrations/tanstack-query/root-provider'

import {
  AppLocaleContext,
  useAppLocale,
  type AppLocale,
} from '@/contexts/AppLocaleContext'
import { EncryptionSessionProvider } from '@/contexts/EncryptionSessionContext'

import { getLocale, setLocale } from '@/paraglide/runtime'

import appCss from '@/styles.css?url'

import { useRouter } from '@tanstack/react-router'

type MyRouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  notFoundComponent: NotFound,

  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function QueryClientShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { locale } = useAppLocale()

  return (
    <ReactQueryProvider client={router.options.context.queryClient}>
      <PreferredLocaleSync />
      {/* Match/Outlet are memoized; remount so Paraglide m.*() re-runs after locale change. */}
      <Fragment key={locale}>{children}</Fragment>
    </ReactQueryProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleTrack] = useState(() => getLocale())

  const setAppLocale = useCallback((next: AppLocale) => {
    setLocale(next, { reload: false })
    setLocaleTrack(next)
  }, [])

  const appLocaleContext = useMemo(
    () => ({ locale, setAppLocale }),
    [locale, setAppLocale],
  )

  return (
    <html lang={locale}>
      <head>
        <HeadContent />
      </head>
      <body>
        <AppLocaleContext.Provider value={appLocaleContext}>
          <EncryptionSessionProvider>
            <QueryClientShell>
              {children}
              <TanStackDevtools
                config={{
                  position: 'bottom-right',
                }}
                plugins={[
                  {
                    name: 'Tanstack Router',
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                  TanStackQueryDevtools,
                ]}
              />
            </QueryClientShell>
          </EncryptionSessionProvider>
        </AppLocaleContext.Provider>
        <Scripts />
      </body>
    </html>
  )
}
