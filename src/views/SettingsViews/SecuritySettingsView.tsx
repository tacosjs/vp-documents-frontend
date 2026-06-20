import { useState } from 'react'

import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import { m } from '@/paraglide/messages'
import {
  isChangePasswordWrongPasswordError,
  useChangeAccountPasswordMutation,
  useMeQuery,
} from '@/services/auth'
import {
  useGetUserKeysQuery,
  useRotateEncryptionKeysMutation,
} from '@/services/userKeys'
import { isInvalidAccountPasswordError } from '@/services/userKeys/keyRotation'
import { RoutesPath } from '@/types/routes'

export const SecuritySettingsView = () => {
  const { data: keys, isPending: keysPending } = useGetUserKeysQuery()
  const { passphrase } = useEncryptionSession()
  const { data: me } = useMeQuery()
  const rotateMutation = useRotateEncryptionKeysMutation()
  const changePasswordMutation = useChangeAccountPasswordMutation()

  const [accountPassword, setAccountPassword] = useState('')
  const [phraseCopied, setPhraseCopied] = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const handleRotate = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!accountPassword.trim()) return
    rotateMutation.mutate(
      { accountPassword },
      {
        onSuccess: () => setAccountPassword(''),
      },
    )
  }

  const copyPhrase = async () => {
    if (!passphrase) return
    await navigator.clipboard.writeText(passphrase)
    setPhraseCopied(true)
    setTimeout(() => setPhraseCopied(false), 2000)
  }

  const handleChangePassword = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!me || !passphrase || !keys) return
    if (newPw !== confirmPw) return
    if (!currentPw.trim() || !newPw.trim()) return

    changePasswordMutation.mutate(
      {
        dataPassphrase: passphrase,
        email: me.email,
        newPassword: newPw,
        oldPassword: currentPw,
      },
      {
        onSuccess: () => {
          setCurrentPw('')
          setNewPw('')
          setConfirmPw('')
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-bold">{m['security.title']()}</h1>

      <section className="flex flex-col gap-3 rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold">
          {m['security.change_password_title']()}
        </h2>
        <p className="text-muted-foreground text-sm">
          {m['security.change_password_description']()}
        </p>
        <form className="flex flex-col gap-4" onSubmit={handleChangePassword}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="sec-current-pw">
                {m['security.current_password']()}
              </FieldLabel>
              <Input
                id="sec-current-pw"
                autoComplete="current-password"
                type="password"
                value={currentPw}
                onChange={(ev) => {
                  setCurrentPw(ev.target.value)
                  changePasswordMutation.reset()
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sec-new-pw">
                {m['security.new_password']()}
              </FieldLabel>
              <Input
                id="sec-new-pw"
                autoComplete="new-password"
                type="password"
                value={newPw}
                onChange={(ev) => {
                  setNewPw(ev.target.value)
                  changePasswordMutation.reset()
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sec-confirm-pw">
                {m['security.confirm_new_password']()}
              </FieldLabel>
              <Input
                id="sec-confirm-pw"
                autoComplete="new-password"
                type="password"
                value={confirmPw}
                onChange={(ev) => {
                  setConfirmPw(ev.target.value)
                  changePasswordMutation.reset()
                }}
              />
            </Field>
            {newPw.length > 0 && confirmPw.length > 0 && newPw !== confirmPw ? (
              <p className="text-destructive text-sm">
                {m['security.passwords_mismatch']()}
              </p>
            ) : null}
            {changePasswordMutation.isError ? (
              <FieldError>
                {isChangePasswordWrongPasswordError(
                  changePasswordMutation.error,
                )
                  ? m['security.change_password_wrong_password']()
                  : m['security.change_password_error']()}
              </FieldError>
            ) : null}
            {changePasswordMutation.isSuccess ? (
              <p className="text-sm text-green-600 dark:text-green-500">
                {m['security.change_password_done']()}
              </p>
            ) : null}
          </FieldGroup>
          <Button
            type="submit"
            disabled={
              changePasswordMutation.isPending ||
              !passphrase ||
              !keys ||
              !me ||
              !currentPw.trim() ||
              !newPw.trim() ||
              newPw !== confirmPw
            }
          >
            {changePasswordMutation.isPending
              ? m['security.change_password_submitting']()
              : m['security.change_password_submit']()}
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold">
          {m['security.rotate_section_title']()}
        </h2>
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-medium">
            {m['security.recovery_title']()}
          </h3>
          <p className="text-muted-foreground text-sm">
            {m['security.recovery_body']()}
          </p>
          <Button
            className="w-fit"
            type="button"
            variant="outline"
            onClick={() => void copyPhrase()}
          >
            {phraseCopied
              ? m['security.phrase_copied']()
              : m['security.copy_phrase']()}
          </Button>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-6">
          <h3 className="text-base font-medium">
            {m['security.rotate_title']()}
          </h3>
          <p className="text-muted-foreground text-sm">
            {m['security.rotate_description']()}
          </p>
          <form className="flex flex-col gap-4" onSubmit={handleRotate}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="rotate-password">
                  {m['security.account_password']()}
                </FieldLabel>
                <FieldDescription>
                  {m['security.rotate_password_hint']()}
                </FieldDescription>
                <Input
                  id="rotate-password"
                  autoComplete="current-password"
                  type="password"
                  value={accountPassword}
                  onChange={(ev) => {
                    setAccountPassword(ev.target.value)
                    rotateMutation.reset()
                  }}
                />
              </Field>
              {rotateMutation.isError ? (
                <FieldError>
                  {isInvalidAccountPasswordError(rotateMutation.error)
                    ? m['security.rotate_wrong_password']()
                    : m['security.rotate_error']()}
                </FieldError>
              ) : null}
              {rotateMutation.isSuccess ? (
                <p className="text-sm text-green-600 dark:text-green-500">
                  {m['security.rotate_done']()}
                </p>
              ) : null}
            </FieldGroup>
            <Button
              type="submit"
              disabled={
                rotateMutation.isPending ||
                keysPending ||
                !keys ||
                !passphrase ||
                !accountPassword.trim()
              }
            >
              {rotateMutation.isPending
                ? m['security.rotating']()
                : m['security.rotate_button']()}
            </Button>
          </form>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold">
          {m['security.key_log_section_title']()}
        </h2>
        <p className="text-muted-foreground text-sm">
          {m['security.key_log_section_body']()}
        </p>
        <Button className="w-fit" variant="secondary" asChild>
          <Link to={RoutesPath.SETTINGS_SECURITY_LOGS.toString()}>
            {m['security.key_log_open']()}
          </Link>
        </Button>
      </section>
    </div>
  )
}
