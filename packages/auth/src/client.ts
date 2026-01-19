/**
 * Better-Auth Client
 *
 * Client-side authentication utilities for React applications.
 *
 * @module auth/client
 */

import { createAuthClient } from 'better-auth/react'

/**
 * Auth client for client-side authentication
 *
 * @example
 * ```tsx
 * import { authClient } from '@factupe/auth/client'
 *
 * function LoginButton() {
 *   const { signIn } = authClient
 *
 *   return (
 *     <button onClick={() => signIn.email({ email, password })}>
 *       Sign In
 *     </button>
 *   )
 * }
 * ```
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient
