import { pbkdf2Sync, createHmac } from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-asana-clone-key-123456789'

/**
 * Hashes a password using PBKDF2 with a salt derived from the user's email.
 */
export function hashPassword(password: string, email: string): string {
  const salt = email.toLowerCase() + '_asana_salt_secret'
  return pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
}

/**
 * Signs a payload into a JWT-like token.
 */
export function signToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const stringifiedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${header}.${stringifiedPayload}`)
    .digest('base64url')
  return `${header}.${stringifiedPayload}.${signature}`
}

/**
 * Verifies a JWT-like token and returns the payload if valid.
 */
export function verifyToken(token: string): any | null {
  try {
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) return null
    const expectedSignature = createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url')
    if (signature !== expectedSignature) return null
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

/**
 * Gets the current user from request cookies.
 */
export function getCurrentUser(request: Request): { id: string; email: string; name: string | null } | null {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => c.trim().split('='))
    )
    const token = cookies['asana_session']
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}
