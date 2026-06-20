import { createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { DocumentsListView } from '@/views/DocumentsView'

export const Route = createFileRoute('/documents/list')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ProtectedRoutes>
      <Layout>
        <DocumentsListView />
      </Layout>
    </ProtectedRoutes>
  )
}
