/**
 * @factupe/auth
 *
 * Authentication package for Factupe using better-auth.
 * Provides server-side auth configuration, client utilities,
 * and RBAC permission system.
 *
 * @packageDocumentation
 * @module auth
 *
 * @example Server-side usage
 * ```ts
 * import { auth } from '@factupe/auth/config'
 *
 * // In API route
 * export const { GET, POST } = auth.handler
 *
 * // Get session in server component
 * const session = await auth.api.getSession({
 *   headers: headers()
 * })
 * ```
 *
 * @example Client-side usage
 * ```tsx
 * import { useSession, signIn, signOut } from '@factupe/auth/client'
 *
 * function UserMenu() {
 *   const { data: session } = useSession()
 *
 *   if (!session) {
 *     return <button onClick={() => signIn.email(...)}>Login</button>
 *   }
 *
 *   return <button onClick={() => signOut()}>Logout</button>
 * }
 * ```
 *
 * @example Permission checking
 * ```ts
 * import { hasPermission, can } from '@factupe/auth/permissions'
 *
 * if (hasPermission(user, 'documents:create')) {
 *   // Allow action
 * }
 *
 * if (can(user, 'documents', 'create')) {
 *   // Same as above, different syntax
 * }
 * ```
 */

export { auth, type Auth, type Session, type User } from './config'
export {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  roleHasPermission,
  hasPermission,
  getEffectivePermissions,
  can,
  type Permission,
} from './permissions'
