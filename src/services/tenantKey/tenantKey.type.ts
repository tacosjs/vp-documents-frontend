export type TenantKeyWrappingDto = {
  okKeyVersion: number
  wrappedTenantKey: string
}

export type PostTenantKeyWrappingBody = {
  userId: string
  wrappedTenantKey: string
  /** When omitted, the server defaults to the workspace's current rotation generation. */
  okKeyVersion?: number
}
