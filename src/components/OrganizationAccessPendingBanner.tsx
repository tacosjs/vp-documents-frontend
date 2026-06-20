import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { m } from '@/paraglide/messages'
import { useMeQuery } from '@/services/auth'

export const OrganizationAccessPendingBanner = () => {
  const { data: me } = useMeQuery()
  if (!me?.tenantId || me.organizationAccessPendingValidation !== true) {
    return null
  }

  return (
    <Card className="text-amber-900 dark:text-amber-100 border-amber-500/40 bg-amber-500/10">
      <CardHeader>
        <CardTitle>{m['org.organization_access_pending.title']()}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{m['org.organization_access_pending.description']()}</p>
      </CardContent>
    </Card>
  )
}
