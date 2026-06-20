import type { LucideIcon } from 'lucide-react'

import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

type NavigationLinkProps = {
  label: string
  tooltip: string
  icon?: LucideIcon
  onClick?: () => void
}

export const NavigationLink = ({
  icon: Icon,
  label,
  onClick,
  tooltip,
}: NavigationLinkProps) => {
  return (
    <SidebarMenuItem className="flex items-center gap-2">
      <SidebarMenuButton tooltip={tooltip} onClick={onClick}>
        {Icon && <Icon className="size-4 shrink-0" />}
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
