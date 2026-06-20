import { useNavigate } from '@tanstack/react-router'
import {
  Building2Icon,
  ChevronsUpDownIcon,
  ShieldIcon,
  UsersIcon,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { m } from '@/paraglide/messages'
import { RoutesPath } from '@/types/routes'

import { OrgLink } from './OrgLink'

type OrgNavigationProps = {
  tenant: {
    name: string
    role: 'admin' | 'editor'
  }
}

export const OrgNavigation = ({ tenant }: OrgNavigationProps) => {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2Icon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{tenant.name}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <OrgLink
              icon={UsersIcon}
              label={m['org.navigation.members']()}
              tooltip={m['org.navigation.members']()}
              onClick={() =>
                navigate({ to: RoutesPath.ORG_MEMBERS.toString() })
              }
            />
            <OrgLink
              icon={ShieldIcon}
              label={m['org.navigation.security']()}
              tooltip={m['org.navigation.security']()}
              onClick={() =>
                navigate({ to: RoutesPath.ORG_SECURITY.toString() })
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
