import { createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { UserProfileView } from '@/views/SettingsViews'

export const Route = createFileRoute('/settings/profile')({
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
