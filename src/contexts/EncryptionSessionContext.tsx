import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

type EncryptionSessionContextValue = {
  encryptionUnlockId: string | null
  setEncryptionUnlockId: (value: string | null) => void
  passphrase: string | null
  clearEncryptionSession: () => void
  setPassphrase: (value: string | null) => void
}

const EncryptionSessionContext =
  createContext<EncryptionSessionContextValue | null>(null)

export const EncryptionSessionProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [passphrase, setPassphrase] = useState<string | null>(null)
  const [encryptionUnlockId, setEncryptionUnlockId] = useState<string | null>(
    null,
  )

  const clearEncryptionSession = useCallback(() => {
    setPassphrase(null)
    setEncryptionUnlockId(null)
  }, [])

  const value = useMemo(
    () => ({
      encryptionUnlockId,
      setEncryptionUnlockId,
      clearEncryptionSession,
      passphrase,
      setPassphrase,
    }),
    [clearEncryptionSession, encryptionUnlockId, passphrase],
  )

  return (
    <EncryptionSessionContext.Provider value={value}>
      {children}
    </EncryptionSessionContext.Provider>
  )
}

export const useEncryptionSession = () => {
  const ctx = useContext(EncryptionSessionContext)
  if (!ctx) {
    throw new Error(
      'useEncryptionSession must be used within EncryptionSessionProvider',
    )
  }
  return ctx
}
