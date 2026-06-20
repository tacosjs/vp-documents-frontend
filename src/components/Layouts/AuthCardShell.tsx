import type { ReactNode } from 'react'

import { LocaleSwitcher } from '@/components/LocaleSwitcher'

type AuthCardShellProps = {
  children: ReactNode
}

export const AuthCardShell = ({ children }: AuthCardShellProps) => {
  return (
    <div className="relative w-full pt-10">
      <div className="absolute end-0 top-0 z-10">
        <LocaleSwitcher size="sm" triggerClassName="min-w-[8.5rem] shadow-xs" />
      </div>
      {children}
    </div>
  )
}
