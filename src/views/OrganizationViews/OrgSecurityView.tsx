import { OrganizationKeyCard } from '@/components/OrganizationKeyCard'
import { m } from '@/paraglide/messages'
import { useMeQuery } from '@/services/auth'

export const OrgSecurityView = () => {
  const { data: me } = useMeQuery()
  const isAdmin = me?.tenantRole === 'admin'

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{m['org.invites.admin_only']()}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <OrganizationKeyCard />
    </div>
  )
}
