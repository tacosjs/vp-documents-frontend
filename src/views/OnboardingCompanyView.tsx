import { useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { m } from '@/paraglide/messages'
import { useSignOut } from '@/services/auth'
import { tryBootstrapWorkspaceKeyForTenant } from '@/services/tenantKey'
import { useCreateTenantMutation } from '@/services/tenants'
import { RoutesPath } from '@/types/routes'

export const OnboardingCompanyView = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { signOut } = useSignOut()
  const createTenant = useCreateTenantMutation()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError(m['onboarding.company.error_name']())
      return
    }
    try {
      const tenant = await createTenant.mutateAsync({ name: trimmed })
      try {
        await tryBootstrapWorkspaceKeyForTenant(tenant.id)
        await queryClient.invalidateQueries({
          queryKey: ['tenantSymmetricKey'],
        })
      } catch {
        // Keys may not exist yet; user can generate from Team later.
      }
      await navigate({ to: RoutesPath.HOME.toString() })
    } catch {
      setError(m['onboarding.company.error_create']())
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{m['onboarding.company.title']()}</CardTitle>
          <CardDescription>
            {m['onboarding.company.description']()}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">
                {m['onboarding.company.name_label']()}
              </Label>
              <Input
                id="company-name"
                autoComplete="organization"
                placeholder={m['onboarding.company.name_placeholder']()}
                value={name}
                onChange={(ev) => setName(ev.target.value)}
              />
            </div>
            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}

            <Button
              className="w-full"
              disabled={createTenant.isPending}
              type="submit"
            >
              {createTenant.isPending ? (
                <Spinner className="size-4" />
              ) : (
                m['onboarding.company.submit']()
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
      <Button
        className="text-muted-foreground"
        type="button"
        variant="ghost"
        onClick={async () => {
          await signOut()
          await navigate({ to: RoutesPath.SIGN_IN.toString() })
        }}
      >
        {m['onboarding.company.sign_out']()}
      </Button>
    </div>
  )
}
