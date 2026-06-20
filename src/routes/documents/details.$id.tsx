import { createFileRoute } from '@tanstack/react-router'

import { Layout } from '@/components/Layouts'
import { ProtectedRoutes } from '@/components/ProtectedRoutes'
import { DocumentDetailsView } from '@/views/DocumentsView'

export const Route = createFileRoute('/documents/details/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ProtectedRoutes>
      <Layout>
        <DocumentDetailsView />
      </Layout>
    </ProtectedRoutes>
  )
}
