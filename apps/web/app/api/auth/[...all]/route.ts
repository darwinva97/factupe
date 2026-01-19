/**
 * Better-Auth API Route
 *
 * Handles all authentication endpoints via better-auth.
 */

import { auth } from '@factupe/auth/config'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
