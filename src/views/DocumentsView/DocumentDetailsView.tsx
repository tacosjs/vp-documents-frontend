import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import {
  encryptDocumentBodyWithItemKey,
  generateItemKey,
  wrapRawKeyWithAes256Gcm,
} from '@/lib/crypto'
import { ApiHttpError } from '@/lib/http/apiClient'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'
import { useMeQuery } from '@/services/auth'
import { useCollectionSymmetricKeyQuery } from '@/services/collections'
import {
  useDocumentQuery,
  useDocumentVersionsQuery,
  useUpdateDocumentMutation,
} from '@/services/documents'
import type { Document, DocumentVersion } from '@/services/documents'
import { useDecryptedDocumentPreview } from '@/services/encryption'
import {
  decryptDocumentHistoryPayload,
  documentHasVersionHistory,
  documentNeedsOrganizationKey,
} from '@/services/encryption/encryption.query'
import { documentsKeys } from '@/services/queryKeys'
import { useTenantSymmetricKeyQuery } from '@/services/tenantKey'
import { useGetUserKeysQuery } from '@/services/userKeys'
import type { UserKeys } from '@/services/userKeys/userKeys.type'

import { DocumentSharedToggle } from './DocumentSharedToggle'

type HistoryPayload = {
  editorUserId: string
  editedAtIso: string
  snapshot?: string
}

const HistoryRow = ({
  collectionSymmetricKey,
  document,
  passphrase,
  row,
  tenantSymmetricKey,
  userKeys,
}: {
  document: Document
  passphrase: string
  row: DocumentVersion
  userKeys: UserKeys
  collectionSymmetricKey?: Uint8Array
  tenantSymmetricKey?: Uint8Array
}) => {
  const scheme = document.wrapScheme
  const { data, error, isPending } = useQuery({
    enabled: Boolean(passphrase && userKeys),
    queryFn: () =>
      decryptDocumentHistoryPayload({
        collectionSymmetricKey,
        document,
        encryptedPayload: row.encryptedPayload,
        encryptedPrivateKey: userKeys.encryptedPrivateKey,
        passphrase,
        tenantSymmetricKey,
      }),
    queryKey: [
      ...documentsKeys.versions(document.id),
      'decrypt',
      row.version,
      scheme,
    ],
  })

  let payload: HistoryPayload | null = null
  if (data) {
    try {
      payload = JSON.parse(data) as HistoryPayload
    } catch {
      payload = null
    }
  }

  return (
    <li className="border-b border-border py-3 text-sm last:border-0">
      <p className="font-medium">v{row.version}</p>
      {isPending ? (
        <Spinner className="size-4 mt-1" />
      ) : error ? (
        <p className="text-destructive mt-1">
          {m['documents_details.history_decrypt_error']()}
        </p>
      ) : payload ? (
        <div className="mt-1 space-y-1 text-muted-foreground">
          <p className="break-all">{payload.snapshot ?? '—'}</p>
          <p className="text-xs">
            {payload.editedAtIso
              ? new Date(payload.editedAtIso).toLocaleString(getLocale())
              : ''}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground mt-1">{data}</p>
      )}
    </li>
  )
}

export const DocumentDetailsView = () => {
  const { id } = useParams({ from: '/documents/details/$id' })
  const { data: document, isPending } = useDocumentQuery(id)
  const locale = getLocale()

  if (isPending) return <div>{m['documents_details.loading']()}</div>
  if (!document) return <div>{m['documents_details.not_found']()}</div>

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="break-all">{document.id}</CardTitle>
          <CardDescription>
            {m['documents_details.updated_at']({
              date: new Date(document.updatedAt).toLocaleString(locale),
            })}
          </CardDescription>
        </div>
        <DocumentSharedToggle document={document} variant="details" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <CardDescription>
          {m['documents_details.encrypted_preview']({
            snippet: document.encryptedData.slice(0, 50),
          })}
        </CardDescription>
        <DecryptedContent document={document} />
        <DocumentHistorySection document={document} />
      </CardContent>
    </Card>
  )
}

const DecryptedContent = ({ document }: { document: Document }) => {
  const { data: decrypted, isPending } = useDecryptedDocumentPreview(document)

  const tenantKeyQuery = useTenantSymmetricKeyQuery()
  const updateMutation = useUpdateDocumentMutation()
  const { data: me } = useMeQuery()
  const queryClient = useQueryClient()
  const scheme = document.wrapScheme

  const needsTenantKey = documentNeedsOrganizationKey(scheme)
  const is404 =
    tenantKeyQuery.isError &&
    tenantKeyQuery.error instanceof ApiHttpError &&
    tenantKeyQuery.error.status === 404

  if (needsTenantKey && tenantKeyQuery.isPending) {
    return <Spinner />
  }

  if (needsTenantKey && tenantKeyQuery.isError && is404) {
    return (
      <p className="text-muted-foreground text-sm">
        {me?.tenantRole === 'admin'
          ? m['documents_details.tenant_key_missing']()
          : m['documents_details.tenant_key_missing_editor']()}
      </p>
    )
  }

  if (needsTenantKey && tenantKeyQuery.isError && !is404) {
    return (
      <p className="text-destructive text-sm">
        {m['documents_details.tenant_key_error']()}
      </p>
    )
  }

  if (isPending) return <Spinner />

  const canUpgrade =
    document.shared &&
    document.ownedByMe &&
    tenantKeyQuery.isSuccess &&
    decrypted &&
    scheme === 'organization_aes'

  const handleUpgrade = async () => {
    if (!decrypted || !me || !tenantKeyQuery.isSuccess) return
    const tsk = tenantKeyQuery.data
    const okKeyVersion = me.organizationKeyVersion ?? 1
    const ik = generateItemKey()
    const enc = await encryptDocumentBodyWithItemKey(decrypted, ik)
    const hist = JSON.stringify({
      editorUserId: me.userId,
      editedAtIso: new Date().toISOString(),
      snapshot: decrypted,
    })
    const histEnc = await encryptDocumentBodyWithItemKey(hist, ik)
    const wrappedItemKey = await wrapRawKeyWithAes256Gcm(ik, tsk)
    await updateMutation.mutateAsync({
      id: document.id,
      input: {
        encryptedData: enc,
        encryptedHistoryPayload: histEnc,
        okKeyVersion,
        shared: true,
        wrappedItemKey,
        wrapScheme: 'organization_aes',
      },
    })
    await queryClient.invalidateQueries({
      queryKey: documentsKeys.versions(document.id),
    })
  }

  return (
    <div className="space-y-3">
      <pre className="w-3xl overflow-x-auto mt-2 rounded-md bg-muted p-4 text-sm">
        {decrypted}
      </pre>
      {canUpgrade ? (
        <Button
          disabled={updateMutation.isPending}
          type="button"
          variant="secondary"
          onClick={() => void handleUpgrade()}
        >
          {updateMutation.isPending
            ? m['documents_details.migrate_pending']()
            : m['documents_details.migrate_to_tenant']()}
        </Button>
      ) : null}
    </div>
  )
}

const DocumentHistorySection = ({ document }: { document: Document }) => {
  const { data: versions, isPending } = useDocumentVersionsQuery(document.id)
  const { passphrase } = useEncryptionSession()
  const { data: keys } = useGetUserKeysQuery()
  const scheme = document.wrapScheme
  const tenantKeyQuery = useTenantSymmetricKeyQuery()
  const collectionKeyQuery = useCollectionSymmetricKeyQuery(
    scheme === 'collection_aes' ? document.collectionId : null,
  )

  if (!document.shared || !documentHasVersionHistory(scheme)) return null

  if (!passphrase || !keys) return null

  const tenantReady =
    scheme === 'organization_aes'
      ? tenantKeyQuery.isSuccess && !!tenantKeyQuery.data
      : true
  const collectionReady =
    scheme !== 'collection_aes' ||
    (collectionKeyQuery.isSuccess && !!collectionKeyQuery.data)

  if (!tenantReady || !collectionReady) {
    return (
      <div className="mt-4">
        <div className="font-medium">
          {m['documents_details.history_title']()}
        </div>
        <Spinner className="size-4 mt-2" />
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="font-medium mb-2">
        {m['documents_details.history_title']()}
      </div>
      {isPending ? (
        <Spinner className="size-4" />
      ) : !versions || versions.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {m['documents_details.history_empty']()}
        </p>
      ) : (
        <ul className="list-none pl-0">
          {versions.map((row) => (
            <HistoryRow
              key={row.version}
              collectionSymmetricKey={collectionKeyQuery.data}
              document={document}
              passphrase={passphrase}
              row={row}
              tenantSymmetricKey={tenantKeyQuery.data}
              userKeys={keys}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
