import { useEffect, useState } from 'react'

import { useEncryptionSession } from '@/contexts/EncryptionSessionContext'
import { tryRestoreDeviceWrappedPassphrase } from '@/lib/crypto'
import { useMeQuery } from '@/services/auth'

/**
 * After a valid session is known, try to restore the data passphrase from
 * device-local AES wrap (localStorage) before showing the password unlock screen.
 */
export const useDevicePassphraseRestore = () => {
  const { data: me, isPending: mePending } = useMeQuery()
  const { setEncryptionUnlockId, passphrase, setPassphrase } =
    useEncryptionSession()

  const [restoreComplete, setRestoreComplete] = useState(false)

  useEffect(() => {
    if (mePending) return

    if (!me || passphrase) {
      setRestoreComplete(true)
      return
    }

    setRestoreComplete(false)
    let alive = true
    void tryRestoreDeviceWrappedPassphrase().then((restored) => {
      if (!alive) return
      if (restored) {
        setPassphrase(restored)
        setEncryptionUnlockId(crypto.randomUUID())
      }
      setRestoreComplete(true)
    })
    return () => {
      alive = false
    }
  }, [me, mePending, passphrase, setEncryptionUnlockId, setPassphrase])

  const waitingForDeviceRestore = Boolean(me) && !passphrase && !restoreComplete

  return { waitingForDeviceRestore }
}
