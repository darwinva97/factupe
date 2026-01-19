/**
 * Better-Auth Configuration
 *
 * Central authentication configuration for the Factupe system.
 * Uses better-auth with Drizzle adapter and custom session handling.
 *
 * @module auth/config
 */

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@factupe/database/client'
import * as schema from '@factupe/database/schema'

/**
 * Better-Auth instance configuration
 *
 * @example
 * ```ts
 * // In your API route
 * import { auth } from '@factupe/auth/config'
 *
 * export const { GET, POST } = auth.handler
 * ```
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
    },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  user: {
    additionalFields: {
      tenantId: {
        type: 'string',
        required: true,
      },
      role: {
        type: 'string',
        required: true,
        defaultValue: 'viewer',
      },
      permissions: {
        type: 'string[]',
        required: false,
        defaultValue: [],
      },
    },
  },

  advanced: {
    generateId: () => {
      const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
      let id = ''
      for (let i = 0; i < 16; i++) {
        id += alphabet[Math.floor(Math.random() * alphabet.length)]
      }
      return `usr_${id}`
    },
  },

  trustedOrigins: [
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ],
})

export type Auth = typeof auth
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
