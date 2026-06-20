import { createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { RoutesPath } from '@/types/routes'

export const Route = createFileRoute(RoutesPath.HOME)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ProtectedRoutes>
      <Layout>
        <div>
          <h1>Home</h1>
        </div>
      </Layout>
    </ProtectedRoutes>
  )
}
