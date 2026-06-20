import { Outlet, createFileRoute } from '@tanstack/react-router'

import { RoutesPath } from '@/types/routes'

export const Route = createFileRoute(RoutesPath.AUTH_ROOT)({
  component: AuthSegmentLayout,
})

function AuthSegmentLayout() {
  return <Outlet />
}
