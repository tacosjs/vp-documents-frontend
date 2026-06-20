import { useNavigate } from '@tanstack/react-router'
import {
  EllipsisVerticalIcon,
  LogOutIcon,
  ShieldIcon,
  UserIcon,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import { m } from '@/paraglide/messages'
import { useMeQuery, useSignOut } from '@/services/auth'
import { RoutesPath } from '@/types/routes'

export const UserNavigation = () => {
  const navigate = useNavigate()
  const { signOut } = useSignOut()
  const { data: me } = useMeQuery()
  const { isMobile } = useSidebar()

  if (!me) return null

  const email = me.email
  const displayName = me.displayName?.trim()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          size="lg"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {(displayName || email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            {displayName ? (
              <>
                <span className="truncate font-medium text-foreground text-xs">
                  {displayName}
                </span>
                <span className="truncate text-muted-foreground text-xs">
                  {email}
                </span>
              </>
            ) : (
              <span className="truncate text-xs">{email}</span>
            )}
          </div>
          <EllipsisVerticalIcon className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side={isMobile ? 'top' : 'right'}
        sideOffset={4}
      >
        <DropdownMenuItem
          onClick={() =>
            navigate({ to: RoutesPath.SETTINGS_PROFILE.toString() })
          }
        >
          <UserIcon />
          {m['navigation.user_profile']()}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            navigate({ to: RoutesPath.SETTINGS_SECURITY.toString() })
          }
        >
          <ShieldIcon />
          {m['navigation.security']()}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void signOut()
          }}
        >
          <LogOutIcon />
          {m['navigation.logout']()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
