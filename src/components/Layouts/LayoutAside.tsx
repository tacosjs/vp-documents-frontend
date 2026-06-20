import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { useMeQuery } from '@/services/auth'

import { OrgNavigation, UserNavigation } from './Navigation'
import { MainNavigation } from './Navigation/MainNavigation'

export const LayoutAside = () => {
  const { data: me } = useMeQuery()

  const hasTenant = me?.tenantId !== null
  const tenant = {
    name: me?.tenantName ?? '',
    role: me?.tenantRole ?? 'editor',
  }

  return (
    <Sidebar>
      <SidebarHeader>
        {hasTenant && <OrgNavigation tenant={tenant} />}
      </SidebarHeader>
      <SidebarContent>
        <MainNavigation />
      </SidebarContent>
      <SidebarFooter>
        <UserNavigation />
      </SidebarFooter>
    </Sidebar>
  )
}
