import { createFileRoute } from '@tanstack/react-router'

import { SecuritySettingsView } from '@/views/SettingsViews'

export const Route = createFileRoute('/settings/security/')({
  component: SecuritySettingsView,
})
