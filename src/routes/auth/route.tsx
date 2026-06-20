import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth')({
  component: AuthSegmentLayout,
})

function AuthSegmentLayout() {
  return <Outlet />
}
