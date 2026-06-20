import { Link as RouterLink } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

const Heading = ({ children }: { children: React.ReactNode }) => {
  return <h1 className="text-3xl font-title uppercase font-bold">{children}</h1>
}

const Subheading = ({ children }: { children: React.ReactNode }) => {
  return <h2 className="text-xl font-title uppercase font-bold">{children}</h2>
}

const Paragraph = ({ children }: { children: React.ReactNode }) => {
  return <p className="text-base">{children}</p>
}

const List = ({ children }: { children: React.ReactNode }) => {
  return <ul className="list-disc list-inside">{children}</ul>
}

const HelpText = ({ children }: { children: React.ReactNode }) => {
  return <p className="text-sm text-gray-700 dark:text-gray-300">{children}</p>
}

const ErrorText = ({ children }: { children: React.ReactNode }) => {
  return <p className="text-sm text-red-500 dark:text-red-300">{children}</p>
}

export const Link = ({
  children,
  className,
  to,
  underlined = false,
  variant = 'default',
}: {
  children: React.ReactNode
  to: string
  className?: string
  underlined?: boolean
  variant?: 'default' | 'muted' | 'destructive'
}) => (
  <RouterLink
    to={to}
    className={cn(
      className,
      underlined && 'underline-offset-4 underline',
      variant === 'muted' && 'text-muted-foreground',
      variant === 'destructive' && 'text-destructive',
    )}
  >
    {children}
  </RouterLink>
)

export const Typography = Object.assign({
  ErrorText,
  Heading,
  HelpText,
  Link,
  List,
  Paragraph,
  Subheading,
})

export type Typography = typeof Typography
