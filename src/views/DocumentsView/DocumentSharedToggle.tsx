import { Button } from '@/components/ui/button'
import { m } from '@/paraglide/messages'
import { useUpdateDocumentMutation } from '@/services/documents'
import type { Document } from '@/services/documents'

type MessageKeys = {
  readonly pending: () => string
  readonly privateLabel: () => string
  readonly sharedLabel: () => string
  readonly toggleOff: () => string
  readonly toggleOn: () => string
}

const listMessages = (): MessageKeys => ({
  pending: () => m['documents_list.toggle_pending'](),
  privateLabel: () => m['documents_list.private_doc'](),
  sharedLabel: () => m['documents_list.shared_org'](),
  toggleOff: () => m['documents_list.toggle_shared_off'](),
  toggleOn: () => m['documents_list.toggle_shared_on'](),
})

const detailsMessages = (): MessageKeys => ({
  pending: () => m['documents_details.toggle_pending'](),
  privateLabel: () => m['documents_details.private_doc'](),
  sharedLabel: () => m['documents_details.shared_org'](),
  toggleOff: () => m['documents_details.toggle_shared_off'](),
  toggleOn: () => m['documents_details.toggle_shared_on'](),
})

export const DocumentSharedToggle = ({
  document,
  variant = 'list',
}: {
  document: Document
  variant?: 'list' | 'details'
}) => {
  const { isPending, mutateAsync } = useUpdateDocumentMutation()
  const msg = variant === 'details' ? detailsMessages() : listMessages()

  if (!document.ownedByMe) return null

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await mutateAsync({ id: document.id, input: { shared: !document.shared } })
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <span className="text-xs text-muted-foreground">
        {document.shared ? msg.sharedLabel() : msg.privateLabel()}
      </span>
      <Button
        disabled={isPending}
        size="sm"
        type="button"
        variant="outline"
        onClick={handleClick}
      >
        {isPending
          ? msg.pending()
          : document.shared
            ? msg.toggleOff()
            : msg.toggleOn()}
      </Button>
    </div>
  )
}
