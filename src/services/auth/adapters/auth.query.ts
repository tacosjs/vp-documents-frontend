import { ApiHttpError, apiJson, apiVoid } from '@/lib/http/apiClient'

import type { Me } from '../auth.type'

import { completeSrpLogin, registerWithSrp } from './auth.srp'

type MeApiPayload = {
  userId?: string
  email: string
  display_name?: string | null
  displayName?: string | null
  preferred_locale?: string
  preferredLocale?: string
  user_id?: string
} & Record<string, unknown>

function optionalUuidString(raw: unknown): string | null {
  if (typeof raw === 'string') return raw
  if (raw != null) return String(raw)
  return null
}

function parseTenantFromMePayload(me: Record<string, unknown>): {
  tenantId: string | null
  tenantName: string | null
  tenantRole: 'admin' | 'editor' | null
} {
  const idRaw = me.tenantId ?? me.tenant_id
  const tenantId = optionalUuidString(idRaw)

  const roleRaw = me.tenantRole ?? me.role
  const normalized =
    typeof roleRaw === 'string'
      ? roleRaw.trim().toLowerCase()
      : roleRaw != null
        ? String(roleRaw).trim().toLowerCase()
        : ''
  const tenantRole =
    normalized === 'admin' || normalized === 'editor' ? normalized : null

  const nameRaw = me.tenantName ?? me.tenant_name
  const tenantName =
    typeof nameRaw === 'string'
      ? nameRaw
      : nameRaw != null
        ? String(nameRaw)
        : null

  return { tenantId, tenantName, tenantRole }
}

function parseOptionalInt(raw: unknown): number | null {
  if (raw == null) return null
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function parseOptionalBool(raw: unknown): boolean | null {
  if (raw === true) return true
  if (raw === false) return false
  return null
}

function mapMeResponse(me: MeApiPayload): Me {
  const raw = me as Record<string, unknown>
  const { tenantId, tenantName, tenantRole } = parseTenantFromMePayload(raw)

  const userId =
    typeof me.userId === 'string'
      ? me.userId
      : typeof me.user_id === 'string'
        ? me.user_id
        : ''

  const rotationPendingSinceMs = parseOptionalInt(
    raw.rotationPendingSinceMs ?? raw.rotation_pending_since_ms,
  )
  const organizationKeyVersion = parseOptionalInt(
    raw.organizationKeyVersion ?? raw.organization_key_version,
  )
  const organizationAccessPendingValidation = parseOptionalBool(
    raw.organizationAccessPendingValidation ??
      raw.organization_access_pending_validation,
  )

  return {
    tenantId,
    userId,
    displayName: me.displayName ?? me.display_name,
    email: me.email,
    organizationAccessPendingValidation,
    organizationKeyVersion,
    preferredLocale: me.preferredLocale ?? me.preferred_locale ?? '',
    rotationPendingSinceMs,
    tenantName,
    tenantRole,
  }
}

export type PatchMeBody = {
  display_name?: string
  email?: string
  preferred_locale?: string
}

export async function fetchMe(): Promise<Me | null> {
  try {
    const me = await apiJson<MeApiPayload>('/api/me')
    return mapMeResponse(me)
  } catch (e) {
    if (e instanceof ApiHttpError && e.status === 401) return null
    throw e
  }
}

export async function patchMe(body: PatchMeBody): Promise<Me> {
  const me = await apiJson<MeApiPayload>('/api/me', {
    body: JSON.stringify(body),
    method: 'PATCH',
  })
  return mapMeResponse(me)
}

export async function postLogout(): Promise<void> {
  await apiVoid('/auth/logout', { method: 'POST' })
}

export async function deleteMe(): Promise<void> {
  await apiVoid('/api/me', { method: 'DELETE' })
}

export const useAuthQuery = () => ({
  completeSrpLogin,
  deleteMe,
  fetchMe,
  patchMe,
  postLogout,
  registerWithSrp,
})
