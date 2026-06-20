import { createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { DocumentCreationView } from '@/views/DocumentsView'

export const Route = createFileRoute('/documents/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ProtectedRoutes>
      <Layout>
        <DocumentCreationView />
      </Layout>
    </ProtectedRoutes>
  )
}
