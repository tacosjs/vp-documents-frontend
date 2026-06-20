import type { LucideIcon } from 'lucide-react'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

type OrgLinkProps = {
  label: string
  tooltip: string
  icon?: LucideIcon
  onClick?: () => void
}

export const OrgLink = ({
  icon: Icon,
  label,
  onClick,
  tooltip,
}: OrgLinkProps) => {
  return (
    <DropdownMenuItem data-tooltip={tooltip} onClick={onClick}>
      {Icon && (
        <div className="flex size-6 items-center justify-center rounded-md border">
          <Icon className="size-3.5 shrink-0" />
        </div>
      )}
      {label}
    </DropdownMenuItem>
  )
}
