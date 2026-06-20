import { createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { RoutesPath } from '@/types/routes'
import { UserProfileView } from '@/views/SettingsViews'

export const Route = createFileRoute(RoutesPath.SETTINGS_PROFILE)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ProtectedRoutes>
      <Layout>
        <UserProfileView />
      </Layout>
    </ProtectedRoutes>
  )
}
