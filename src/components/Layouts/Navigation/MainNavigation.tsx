import { useNavigate } from '@tanstack/react-router'
import { FileIcon, LayoutDashboardIcon } from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from '@/components/ui/sidebar'
import { m } from '@/paraglide/messages'
import { RoutesPath } from '@/types/routes'

import { NavigationLink } from './NavigationLink'

export const MainNavigation = () => {
  const navigate = useNavigate()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <NavigationLink
            icon={LayoutDashboardIcon}
            label={m['navigation.dashboard']()}
            tooltip={m['navigation.dashboard']()}
            onClick={() => navigate({ to: RoutesPath.HOME.toString() })}
          />

          <NavigationLink
            icon={FileIcon}
            label={m['navigation.documents']()}
            tooltip={m['navigation.documents']()}
            onClick={() =>
              navigate({ to: RoutesPath.DOCUMENTS_LIST.toString() })
            }
          />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
