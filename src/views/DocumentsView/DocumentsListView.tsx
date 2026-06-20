import { Link, useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'
import { useDocumentsListQuery } from '@/services/documents'
import type { Document } from '@/services/documents'
import { RoutesPath } from '@/types/routes'

import { DocumentSharedToggle } from './DocumentSharedToggle'

export const DocumentsListView = () => {
  const navigate = useNavigate()
  const { data: documents, isPending } = useDocumentsListQuery()

  const sortedByUpdatedAt = documents
    ? [...documents].sort((a, b) => b.updatedAt - a.updatedAt)
    : undefined

  const handleAddDocument = () => {
    navigate({ to: RoutesPath.DOCUMENTS_CREATE.toString() })
  }

  const renderContent = () => {
    if (isPending) return <LoadingDocumentsList />
    if (sortedByUpdatedAt?.length)
      return <DocumentsList documents={sortedByUpdatedAt} />
    return <EmptyDocumentsList />
  }

  return (
    <div className="flex flex-col gap-4">
      <DocumentsHeader onAdd={handleAddDocument} />
      {renderContent()}
    </div>
  )
}

const DocumentsHeader = ({ onAdd }: { onAdd: () => void }) => (
  <div className="flex flex-col gap-4">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">{m['documents_list.title']()}</h1>
      <Button variant="outline" onClick={onAdd}>
        {m['documents_list.add_document']()}
      </Button>
    </div>
    <div className="text-sm text-gray-500">
      {m['documents_list.description']()}
    </div>
  </div>
)

const LoadingDocumentsList = () => {
  return (
    <span
      className="text-center flex items-center justify-center"
      title={m['documents_list.loading']()}
    >
      <Spinner />
    </span>
  )
}

const EmptyDocumentsList = () => {
  return (
    <div className="w-full text-center text-sm text-muted-foreground">
      {m['documents_list.empty']()}
    </div>
  )
}

const DocumentsList = ({ documents }: { documents: Array<Document> }) => {
  const locale = getLocale()
  return (
    <ul className="flex flex-col gap-2">
      {documents.map((document) => (
        <li key={document.id}>
          <Card className="flex flex-row items-stretch gap-2 overflow-hidden">
            <Link
              className="flex-1 min-w-0 hover:bg-muted/50 transition-colors"
              params={{ id: document.id }}
              to="/documents/details/$id"
            >
              <CardContent className="flex flex-col gap-2">
                <CardTitle className="truncate">{document.id}</CardTitle>
                <CardDescription>
                  {m['documents_list.updated_at']({
                    date: new Date(document.updatedAt).toLocaleString(locale),
                  })}
                </CardDescription>
              </CardContent>
            </Link>
            <DocumentSharedToggle document={document} variant="list" />
          </Card>
        </li>
      ))}
    </ul>
  )
}
