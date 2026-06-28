import { useState } from 'react'

import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { m } from '@/paraglide/messages'
import type { Me } from '@/services/auth'
import {
  useDeleteAccountMutation,
  useMeQuery,
  usePatchMeMutation,
} from '@/services/auth'

const UserProfileForm = ({ me }: { me: Me }) => {
  const [displayName, setDisplayName] = useState(me.displayName ?? '')
  const [email, setEmail] = useState(me.email)
  const patchMutation = usePatchMeMutation()

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault()
    patchMutation.mutate({
      displayName,
      email,
      preferredLocale: null,
    })
  }

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          {m['user_profile.language_title']()}
        </h2>
        <p className="text-muted-foreground text-sm">
          {m['user_profile.language_description']()}
        </p>
        <LocaleSwitcher />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">
          {m['user_profile.identity_title']()}
        </h2>
        <p className="text-muted-foreground text-sm">
          {m['user_profile.identity_description']()}
        </p>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="profile-display-name">
              {m['user_profile.display_name']()}
            </FieldLabel>
            <Input
              id="profile-display-name"
              autoComplete="name"
              value={displayName}
              onChange={(ev) => {
                setDisplayName(ev.target.value)
                patchMutation.reset()
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-email">
              {m['user_profile.email']()}
            </FieldLabel>
            <FieldDescription>
              {m['user_profile.email_note']()}
            </FieldDescription>
            <Input
              id="profile-email"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(ev) => {
                setEmail(ev.target.value)
                patchMutation.reset()
              }}
            />
          </Field>
        </FieldGroup>
        {patchMutation.isError ? (
          <p className="text-destructive text-sm">
            {m['user_profile.save_error']()}
          </p>
        ) : null}
        {patchMutation.isSuccess ? (
          <p className="text-sm text-green-600 dark:text-green-500">
            {m['user_profile.saved']()}
          </p>
        ) : null}
        <Button
          disabled={patchMutation.isPending}
          type="submit"
          variant="default"
        >
          {patchMutation.isPending
            ? m['user_profile.saving']()
            : m['user_profile.save']()}
        </Button>
      </section>
    </form>
  )
}

const DeleteAccountSection = () => {
  const deleteMutation = useDeleteAccountMutation()
  const [firstOpen, setFirstOpen] = useState(false)
  const [secondOpen, setSecondOpen] = useState(false)

  return (
    <>
      <section className="flex flex-col gap-4 rounded-lg border border-destructive/25 bg-destructive/5 p-4">
        <h2 className="text-lg font-semibold text-destructive">
          {m['user_profile.delete_section_title']()}
        </h2>
        <p className="text-muted-foreground text-sm">
          {m['user_profile.delete_section_description']()}
        </p>
        <AlertDialog
          open={firstOpen}
          onOpenChange={(open) => {
            setFirstOpen(open)
            if (!open) setSecondOpen(false)
          }}
        >
          <AlertDialogTrigger asChild>
            <Button className="w-fit" type="button" variant="destructive">
              {m['user_profile.delete_open']()}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {m['user_profile.delete_step1_title']()}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {m['user_profile.delete_step1_description']()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">
                {m['user_profile.delete_cancel']()}
              </AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setFirstOpen(false)
                  setSecondOpen(true)
                }}
              >
                {m['user_profile.delete_step1_continue']()}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      <AlertDialog
        open={secondOpen}
        onOpenChange={(open) => {
          setSecondOpen(open)
          if (!open) deleteMutation.reset()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {m['user_profile.delete_step2_title']()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {m['user_profile.delete_step2_description']()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteMutation.isError ? (
            <p className="text-destructive text-sm" role="alert">
              {m['user_profile.delete_error']()}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              type="button"
            >
              {m['user_profile.delete_cancel']()}
            </AlertDialogCancel>
            <Button
              disabled={deleteMutation.isPending}
              type="button"
              variant="destructive"
              onClick={() => void deleteMutation.mutateAsync()}
            >
              {deleteMutation.isPending
                ? m['user_profile.delete_deleting']()
                : m['user_profile.delete_step2_confirm']()}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const UserProfileView = () => {
  const { data: me } = useMeQuery()

  if (!me) {
    return null
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">{m['user_profile.title']()}</h1>
      <p className="text-muted-foreground text-sm">
        {m['user_profile.description']()}
      </p>
      <UserProfileForm
        key={`${me.userId}-${me.email}-${me.displayName ?? ''}-${me.preferredLocale}`}
        me={me}
      />
      <DeleteAccountSection />
    </div>
  )
}
