import { Button } from '@/components/ui/button'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'
import type { SecurityActivityEvent } from '@/services/userKeys'
import {
  downloadSecurityActivityJson,
  useSecurityActivityQuery,
} from '@/services/userKeys'

const formatWhen = (recordedAt: number): string =>
  new Date(recordedAt).toLocaleString(getLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

const eventTitle = (e: SecurityActivityEvent): string => {
  if (e.kind === 'password_changed') {
    return m['security_logs.event_password_title']()
  }
  return m['security_logs.event_public_key_title']()
}

const eventDetail = (e: SecurityActivityEvent): string | null => {
  if (e.kind !== 'public_key' || !e.publicKeySha256Hex) {
    return null
  }
  return m['security_logs.event_fingerprint']({
    prefix: `${e.publicKeySha256Hex.slice(0, 16)}…`,
  })
}

export const SecurityKeyLogView = () => {
  const activityQuery = useSecurityActivityQuery()
  const events = activityQuery.data?.events ?? []

  const download = () => {
    if (!activityQuery.data) return
    downloadSecurityActivityJson(activityQuery.data)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{m['security_logs.title']()}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {m['security_logs.description']()}
        </p>
      </div>

      {activityQuery.isPending ? (
        <p className="text-sm text-muted-foreground">
          {m['security_logs.loading']()}
        </p>
      ) : activityQuery.isError ? (
        <p className="text-sm text-destructive">
          {m['security_logs.load_error']()}
        </p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {m['security_logs.empty']()}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {events.map((e) => {
            const detail = eventDetail(e)
            return (
              <li key={e.id} className="flex flex-col gap-1 px-3 py-3">
                <span className="font-medium text-sm">{eventTitle(e)}</span>
                {detail ? (
                  <span className="text-muted-foreground font-mono text-xs">
                    {detail}
                  </span>
                ) : null}
                <span className="text-muted-foreground text-xs">
                  {m['security_logs.event_when']({
                    date: formatWhen(e.recordedAt),
                  })}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      <Button
        className="w-fit"
        disabled={events.length === 0}
        type="button"
        variant="secondary"
        onClick={download}
      >
        {m['security_logs.download_json']()}
      </Button>
    </div>
  )
}
