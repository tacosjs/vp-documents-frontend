import { createFileRoute } from '@tanstack/react-router'

import { RoutesPath } from '@/types/routes'
import { SecurityKeyLogView } from '@/views/SettingsViews'

export const Route = createFileRoute(RoutesPath.SETTINGS_SECURITY_LOGS)({
  component: SecurityKeyLogView,
})
