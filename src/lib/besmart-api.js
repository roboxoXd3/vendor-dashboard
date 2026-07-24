import { cookies } from 'next/headers'
import { getSupabaseServer, getSupabaseClient } from '@/lib/supabase-server'
import { isValidProductId } from '@/lib/validators'

export { isValidProductId }

export function getBesmartBaseUrl() {
  return (
    process.env.BESMART_API_URL ||
    process.env.NEXT_PUBLIC_BESMART_API_URL ||
    'https://api.xbesmart.com'
  )
}

function parseDeviceInfo(deviceInfo) {
  if (!deviceInfo) return {}
  if (typeof deviceInfo === 'string') {
    try {
      return JSON.parse(deviceInfo)
    } catch {
      return {}
    }
  }
  return deviceInfo
}

async function getSessionFromCookie() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('vendor_session_token')?.value

  if (!sessionToken) {
    return { error: 'Authentication required', status: 401 }
  }

  const supabase = getSupabaseServer()
  const { data: sessionData, error } = await supabase
    .from('vendor_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !sessionData) {
    return { error: 'Invalid or expired session', status: 401 }
  }

  return { sessionData }
}

async function persistDeviceInfo(sessionId, deviceInfo) {
  const supabase = getSupabaseServer()
  await supabase
    .from('vendor_sessions')
    .update({
      device_info: deviceInfo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
}

// Deduplicate concurrent Supabase JWT refreshes for the same vendor session.
// Parallel product create / media uploads near JWT expiry used to race refresh
// tokens (often single-use) and surface intermittent 401 "invalid session".
const supabaseRefreshLocks = new Map()

/** Refresh Supabase JWT using stored refresh_token; returns fresh access_token */
async function refreshSupabaseAccessToken(sessionData) {
  const lockKey = sessionData.id
  const existing = supabaseRefreshLocks.get(lockKey)
  if (existing) {
    return existing
  }

  const refreshPromise = (async () => {
    const deviceInfo = parseDeviceInfo(sessionData.device_info)
    const refreshToken = deviceInfo.supabase_refresh_token

    if (!refreshToken) {
      return deviceInfo.supabase_access_token?.trim() || null
    }

    try {
      const supabaseClient = getSupabaseClient()
      const { data, error } = await supabaseClient.auth.refreshSession({
        refresh_token: refreshToken,
      })

      if (error || !data?.session?.access_token) {
        console.error('⚠️ Supabase token refresh failed:', error?.message)
        return deviceInfo.supabase_access_token?.trim() || null
      }

      const updatedDeviceInfo = {
        ...deviceInfo,
        supabase_access_token: data.session.access_token,
        supabase_refresh_token: data.session.refresh_token,
      }

      await persistDeviceInfo(sessionData.id, updatedDeviceInfo)
      return data.session.access_token
    } catch (err) {
      console.error('⚠️ Supabase token refresh error:', err)
      return deviceInfo.supabase_access_token?.trim() || null
    } finally {
      supabaseRefreshLocks.delete(lockKey)
    }
  })()

  supabaseRefreshLocks.set(lockKey, refreshPromise)
  return refreshPromise
}

// Decodes (without verifying — verification happens server-side on the
// BeSmart API) the exp claim of a JWT so we can skip the Supabase refresh
// round-trip when the cached access token is still comfortably valid.
// Every besmartRequest() call used to unconditionally hit Supabase's auth
// endpoint before reaching Django, adding a network round-trip to every
// single API call on every page — this cuts that out for the common case.
function getJwtExpiryMs(token) {
  try {
    const payload = token.split('.')[1]
    const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    return typeof json.exp === 'number' ? json.exp * 1000 : null
  } catch {
    return null
  }
}

const TOKEN_REFRESH_SKEW_MS = 2 * 60 * 1000 // refresh if expiring within 2 minutes

export async function getBesmartAuthToken({ forceRefresh = false } = {}) {
  const result = await getSessionFromCookie()
  if (result.error) {
    return result
  }

  const deviceInfo = parseDeviceInfo(result.sessionData.device_info)
  const cachedToken = deviceInfo.supabase_access_token?.trim() || null
  const cachedExpiry = cachedToken ? getJwtExpiryMs(cachedToken) : null
  const cachedTokenIsFresh =
    !forceRefresh && cachedExpiry != null && cachedExpiry - Date.now() > TOKEN_REFRESH_SKEW_MS

  let accessToken = null
  if (cachedTokenIsFresh) {
    accessToken = cachedToken
  } else if (deviceInfo.supabase_refresh_token || forceRefresh) {
    accessToken = await refreshSupabaseAccessToken(result.sessionData)
  }
  if (!accessToken) {
    accessToken = cachedToken
  }

  if (!accessToken) {
    return {
      error: 'Missing BeSmart auth token. Please log out and log in again.',
      status: 401,
    }
  }

  return { accessToken, sessionData: result.sessionData }
}

async function executeBesmartFetch(path, options, accessToken) {
  const url = `${getBesmartBaseUrl()}${path}`
  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${accessToken}`)

  return fetch(url, {
    ...options,
    headers,
  })
}

export async function besmartRequest(path, options = {}) {
  const auth = await getBesmartAuthToken()
  if (auth.error) {
    return { response: null, error: auth.error, status: auth.status }
  }

  let response = await executeBesmartFetch(path, options, auth.accessToken)

  // Retry once with a fresh token if BeSmart rejects auth
  if (response.status === 401 || response.status === 403) {
    const refreshed = await getBesmartAuthToken({ forceRefresh: true })
    if (!refreshed.error && refreshed.accessToken !== auth.accessToken) {
      response = await executeBesmartFetch(path, options, refreshed.accessToken)
    }
  }

  return { response, error: null, status: response.status }
}

function extractBesmartTextError(rawText) {
  if (!rawText || typeof rawText !== 'string') return null

  const decoded = rawText
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')

  const htmlException = decoded.match(
    /<pre class="exception_value">([\s\S]*?)<\/pre>/i
  )?.[1]
  if (htmlException) {
    return htmlException.trim().split('\n')[0]
  }

  const plainException = decoded.match(/Exception Value:\s*(.+)/i)?.[1]
  if (plainException) {
    return plainException.trim()
  }

  const programmingError = decoded.match(
    /ProgrammingError[^\n]*\n([\s\S]*?)(?:\n\n|DETAIL:|Request Method:)/
  )?.[1]
  if (programmingError) {
    const firstLine = programmingError.trim().split('\n').find(Boolean)
    if (firstLine) return firstLine.trim()
  }

  return null
}

export function formatBesmartErrorMessage(message) {
  if (!message) return message

  if (message.includes('search_vector')) {
    return (
      'BeSmart cannot create new products right now (search_vector database error on the API server). ' +
      'Please ask the backend team to mark search_vector as read-only in ProductDetailSerializer, then retry. ' +
      'Editing existing products and uploading images/videos still works.'
    )
  }

  return message
}

export async function parseBesmartError(response, parsedData = null, rawText = null) {
  const extractFromObject = (data) => {
    if (!data || typeof data !== 'object') return null

    const direct =
      data.detail ||
      data.error ||
      data.message ||
      (Array.isArray(data.non_field_errors) ? data.non_field_errors.join(', ') : null)
    if (direct) return typeof direct === 'string' ? direct : JSON.stringify(direct)

    const fieldErrors = Object.entries(data)
      .filter(([key]) => !['detail', 'error', 'message', 'non_field_errors', 'status'].includes(key))
      .flatMap(([field, value]) => {
        if (Array.isArray(value)) return value.map((msg) => `${field}: ${msg}`)
        if (typeof value === 'string') return [`${field}: ${value}`]
        return []
      })

    if (fieldErrors.length > 0) return fieldErrors.join('; ')
    return null
  }

  const fromParsed = extractFromObject(parsedData)
  if (fromParsed) return formatBesmartErrorMessage(fromParsed)

  if (rawText) {
    const fromText = extractBesmartTextError(rawText)
    if (fromText) return formatBesmartErrorMessage(fromText)
  }

  if (response) {
    try {
      const data = parsedData || (await response.json())
      const message = extractFromObject(data)
      if (message) return formatBesmartErrorMessage(message)
    } catch {
      try {
        const text = rawText ?? (await response.text())
        const fromText = extractBesmartTextError(text)
        if (fromText) return formatBesmartErrorMessage(fromText)
      } catch {
        // fall through
      }
    }
    return formatBesmartErrorMessage(response.statusText || 'Request failed')
  }

  return 'Request failed'
}

export function appendFileToFormData(formData, fieldName, file) {
  if (!file || typeof file === 'string') return
  const fileName = file.name || 'upload.jpg'
  formData.append(fieldName, file, fileName)
}
