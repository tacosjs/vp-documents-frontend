import type { PropsWithChildren } from 'react'

import { SidebarProvider } from '@/components/ui/sidebar'
import {
  useAutoDistributeOrganizationKeyWraps,
  usePendingOrganizationKeyRotation,
} from '@/services/tenantKey'

import { LayoutAside } from './LayoutAside'
import { LayoutContent } from './LayoutContent'

type LayoutProps = {}

export const Layout = ({ children }: PropsWithChildren<LayoutProps>) => {
  usePendingOrganizationKeyRotation()
  useAutoDistributeOrganizationKeyWraps()
  return (
    <SidebarProvider>
      <LayoutAside />
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  )
}
