export type AuthFlowLayoutProps = {
  children: React.ReactNode
}

/** Centered full-viewport shell for sign-in, unlock, and other unauthenticated flows. */
export const AuthFlowLayout = ({ children }: AuthFlowLayoutProps) => (
  <div className="flex min-h-svh w-full bg-neutral-50 items-center justify-center p-6 md:p-10">
    <div className="w-full max-w-md">{children}</div>
  </div>
)
