import { useState } from 'react'

import { useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import {
  encryptDocumentBodyWithItemKey,
  generateItemKey,
  wrapItemKeyWithPublicKey,
  wrapRawKeyWithAes256Gcm,
} from '@/lib/crypto'
import { m } from '@/paraglide/messages'
import { useMeQuery } from '@/services/auth'
import { useCreateDocumentMutation } from '@/services/documents'
import { useEncryption } from '@/services/encryption'
import { useTenantSymmetricKeyQuery } from '@/services/tenantKey'
import { useGetUserKeysQuery } from '@/services/userKeys'
import { RoutesPath } from '@/types/routes'

export const DocumentCreationView = () => {
  const navigate = useNavigate()
  const { userKeys } = useEncryption()
  const { data: keys } = useGetUserKeysQuery()
  const { isPending, mutateAsync: createDocument } = useCreateDocumentMutation()
  const { data: me } = useMeQuery()
  const tenantKeyQuery = useTenantSymmetricKeyQuery()
  const isAdmin = me?.tenantRole === 'admin'
  const [error, setError] = useState<string | null>(null)
  const [shareOrg, setShareOrg] = useState(false)

  const handleCancel = () => {
    navigate({ to: RoutesPath.DOCUMENTS_LIST.toString() })
  }

  const handleCreateDocument = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault()

    const formData = new FormData(e.target)
    const message = formData.get('message') as string
    if (!message) throw new Error('Message is required')

    try {
      setError(null)

      if (shareOrg) {
        if (!me?.tenantId) {
          setError(
            isAdmin
              ? m['documents_details.create_need_organization_key']()
              : m['documents_details.create_need_organization_key_editor'](),
          )
          return
        }
        if (tenantKeyQuery.isPending) {
          return
        }
        if (!tenantKeyQuery.isSuccess) {
          setError(
            isAdmin
              ? m['documents_details.create_need_organization_key']()
              : m['documents_details.create_need_organization_key_editor'](),
          )
          return
        }
        const tsk = tenantKeyQuery.data
        const ik = generateItemKey()
        const encryptedMessage = await encryptDocumentBodyWithItemKey(
          message,
          ik,
        )
        const histJson = JSON.stringify({
          editorUserId: me.userId,
          editedAtIso: new Date().toISOString(),
          snapshot: message,
        })
        const encryptedHistoryPayload = await encryptDocumentBodyWithItemKey(
          histJson,
          ik,
        )
        const wrappedItemKey = await wrapRawKeyWithAes256Gcm(ik, tsk)
        const okKeyVersion = me.organizationKeyVersion ?? 1
        await createDocument({
          encryptedData: encryptedMessage,
          encryptedHistoryPayload,
          okKeyVersion,
          shared: true,
          wrappedItemKey,
          wrapScheme: 'organization_aes',
        })
      } else {
        if (!keys) throw new Error('No encryption keys available')
        const ik = generateItemKey()
        const encryptedMessage = await encryptDocumentBodyWithItemKey(
          message,
          ik,
        )
        const wrappedItemKey = await wrapItemKeyWithPublicKey(
          ik,
          keys.publicKey,
        )
        await createDocument({
          encryptedData: encryptedMessage,
          shared: false,
          wrappedItemKey,
          wrapScheme: 'self_pgp',
        })
      }
      navigate({ to: RoutesPath.DOCUMENTS_LIST.toString() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Create Document</h1>
      <form className="flex flex-col gap-4" onSubmit={handleCreateDocument}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="message">Message</FieldLabel>
            <FieldDescription>
              This message will be encrypted and stored in the database.
            </FieldDescription>
            <Textarea
              id="message"
              name="message"
              placeholder="Type your message here."
              required
            />
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
              <input
                checked={shareOrg}
                className="mt-1"
                type="checkbox"
                onChange={(ev) => setShareOrg(ev.target.checked)}
              />
              <span>{m['documents_details.share_org_encrypt']()}</span>
            </label>
            {shareOrg && tenantKeyQuery.isPending ? (
              <p className="flex items-center gap-2 text-muted-foreground text-sm">
                <Spinner className="size-4" />
                {m['documents_details.organization_key_loading']()}
              </p>
            ) : null}
            {shareOrg &&
            !tenantKeyQuery.isPending &&
            !tenantKeyQuery.isSuccess ? (
              <p className="text-muted-foreground text-sm">
                {isAdmin
                  ? m['documents_details.create_need_organization_key']()
                  : m[
                      'documents_details.create_need_organization_key_editor'
                    ]()}
              </p>
            ) : null}
            <FieldError>{error}</FieldError>
          </Field>
        </FieldGroup>
        <div className="flex gap-2">
          <Button
            disabled={isPending}
            type="button"
            variant="destructive"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            isLoading={isPending}
            type="submit"
            disabled={
              isPending ||
              !userKeys ||
              (shareOrg &&
                (tenantKeyQuery.isPending || !tenantKeyQuery.isSuccess))
            }
          >
            Create Document
          </Button>
        </div>
      </form>
    </div>
  )
}
