/**
 * Role-Based Access Control (RBAC) System
 *
 * Defines roles, permissions, and authorization utilities
 * for the Factupe billing system.
 *
 * @module auth/permissions
 */

import type { UserRole } from '@factupe/database/schema'

/**
 * Available permissions in the system
 */
export const PERMISSIONS = {
  // Document permissions
  'documents:create': 'Create documents (invoices, receipts, etc.)',
  'documents:read': 'View documents',
  'documents:update': 'Edit draft documents',
  'documents:delete': 'Delete draft documents',
  'documents:void': 'Void sent documents',
  'documents:send': 'Send documents to SUNAT',
  'documents:export': 'Export documents (PDF, XML)',

  // Customer permissions
  'customers:create': 'Create customers',
  'customers:read': 'View customers',
  'customers:update': 'Edit customers',
  'customers:delete': 'Delete customers',

  // Product permissions
  'products:create': 'Create products',
  'products:read': 'View products',
  'products:update': 'Edit products',
  'products:delete': 'Delete products',

  // User management permissions
  'users:create': 'Create users',
  'users:read': 'View users',
  'users:update': 'Edit users',
  'users:delete': 'Delete users',

  // Tenant/Settings permissions
  'settings:read': 'View settings',
  'settings:update': 'Edit settings',
  'settings:billing': 'Manage billing/subscription',

  // Reports permissions
  'reports:view': 'View reports',
  'reports:export': 'Export reports',

  // API permissions
  'api:manage': 'Manage API keys',
} as const

export type Permission = keyof typeof PERMISSIONS

/**
 * Role definitions with their default permissions
 *
 * Roles are hierarchical - higher roles inherit lower role permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[] | ['*']> = {
  /**
   * Owner - Full access to everything
   */
  owner: ['*'],

  /**
   * Admin - Full access except billing
   */
  admin: [
    'documents:create',
    'documents:read',
    'documents:update',
    'documents:delete',
    'documents:void',
    'documents:send',
    'documents:export',
    'customers:create',
    'customers:read',
    'customers:update',
    'customers:delete',
    'products:create',
    'products:read',
    'products:update',
    'products:delete',
    'users:read',
    'users:create',
    'users:update',
    'settings:read',
    'settings:update',
    'reports:view',
    'reports:export',
    'api:manage',
  ],

  /**
   * Accountant - Full document access, read-only for customers/products
   */
  accountant: [
    'documents:create',
    'documents:read',
    'documents:update',
    'documents:delete',
    'documents:void',
    'documents:send',
    'documents:export',
    'customers:read',
    'products:read',
    'reports:view',
    'reports:export',
  ],

  /**
   * Sales - Create documents, manage customers
   */
  sales: [
    'documents:create',
    'documents:read',
    'documents:export',
    'customers:create',
    'customers:read',
    'customers:update',
    'products:read',
  ],

  /**
   * Viewer - Read-only access
   */
  viewer: ['documents:read', 'customers:read', 'products:read'],
}

/**
 * Check if a role has a specific permission
 *
 * @param role - User role
 * @param permission - Permission to check
 * @returns Whether the role has the permission
 *
 * @example
 * ```ts
 * if (roleHasPermission('accountant', 'documents:create')) {
 *   // Allow document creation
 * }
 * ```
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const rolePerms = ROLE_PERMISSIONS[role]

  // Owner has all permissions
  if (rolePerms.includes('*')) {
    return true
  }

  return (rolePerms as Permission[]).includes(permission)
}

/**
 * Check if a user has a specific permission
 * Considers both role permissions and custom user permissions
 *
 * @param user - User object with role and permissions
 * @param permission - Permission to check
 * @returns Whether the user has the permission
 *
 * @example
 * ```ts
 * const user = { role: 'sales', permissions: ['documents:void'] }
 * if (hasPermission(user, 'documents:void')) {
 *   // User has custom permission to void documents
 * }
 * ```
 */
export function hasPermission(
  user: { role: UserRole; permissions?: string[] },
  permission: Permission
): boolean {
  // Check role permissions first
  if (roleHasPermission(user.role, permission)) {
    return true
  }

  // Check custom permissions
  if (user.permissions?.includes(permission)) {
    return true
  }

  // Check wildcard permissions (e.g., 'documents:*')
  const [resource] = permission.split(':')
  if (user.permissions?.includes(`${resource}:*`)) {
    return true
  }

  return false
}

/**
 * Get all effective permissions for a user
 *
 * @param user - User object with role and permissions
 * @returns Array of all permissions the user has
 */
export function getEffectivePermissions(user: { role: UserRole; permissions?: string[] }): Permission[] {
  const rolePerms = ROLE_PERMISSIONS[user.role]

  // Owner has all permissions
  if (rolePerms.includes('*')) {
    return Object.keys(PERMISSIONS) as Permission[]
  }

  const permissions = new Set<Permission>(rolePerms as Permission[])

  // Add custom permissions
  if (user.permissions) {
    for (const perm of user.permissions) {
      if (perm in PERMISSIONS) {
        permissions.add(perm as Permission)
      }
    }
  }

  return Array.from(permissions)
}

/**
 * Check if user can perform an action on a resource
 *
 * @param user - User object
 * @param resource - Resource name (documents, customers, etc.)
 * @param action - Action name (create, read, update, delete)
 * @returns Whether the user can perform the action
 */
export function can(
  user: { role: UserRole; permissions?: string[] },
  resource: string,
  action: string
): boolean {
  const permission = `${resource}:${action}` as Permission
  return hasPermission(user, permission)
}
