import { Outlet, createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { RoutesPath } from '@/types/routes'

export const Route = createFileRoute(RoutesPath.SETTINGS_SECURITY)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ProtectedRoutes>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoutes>
  )
}
