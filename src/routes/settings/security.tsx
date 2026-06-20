import { Outlet, createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'

export const Route = createFileRoute('/settings/security')({
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
