import { createFileRoute } from '@tanstack/react-router'

import { RoutesPath } from '@/types/routes'
import { SecuritySettingsView } from '@/views/SettingsViews'

export const Route = createFileRoute(RoutesPath.SETTINGS_SECURITY)({
  component: SecuritySettingsView,
})
