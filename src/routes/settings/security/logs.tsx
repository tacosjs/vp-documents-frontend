import { createFileRoute } from '@tanstack/react-router'

import { SecurityKeyLogView } from '@/views/SettingsViews'

export const Route = createFileRoute('/settings/security/logs')({
  component: SecurityKeyLogView,
})
