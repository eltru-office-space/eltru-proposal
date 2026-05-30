// ============================================================
// Central environment variable registry
//
// SERVER-SIDE VARS (supabase.serviceRoleKey, anthropic.apiKey,
// odoo.*, app.adminInviteSecret) must NEVER be imported in
// client components or passed to the browser.
//
// Client-safe vars are prefixed NEXT_PUBLIC_ and are fine in
// both server and client contexts.
//
// Values are read lazily (on first access) so this module can
// be imported without throwing during test setup.
// ============================================================

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function lazyEnv(key: string): string {
  // Resolved at access time — safe to import in test files
  return requireEnv(key)
}

export const env = {
  supabase: {
    get url() { return lazyEnv('NEXT_PUBLIC_SUPABASE_URL') },
    get anonKey() { return lazyEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') },
    /** SERVER SIDE ONLY */
    get serviceRoleKey() { return lazyEnv('SUPABASE_SERVICE_ROLE_KEY') },
  },
  /** SERVER SIDE ONLY */
  anthropic: {
    get apiKey() { return lazyEnv('ANTHROPIC_API_KEY') },
  },
  /** SERVER SIDE ONLY */
  odoo: {
    get url() { return lazyEnv('ODOO_URL') },
    get database() { return lazyEnv('ODOO_DATABASE') },
    get apiKey() { return lazyEnv('ODOO_API_KEY') },
  },
  app: {
    get url() { return lazyEnv('NEXT_PUBLIC_APP_URL') },
    /** SERVER SIDE ONLY */
    get adminInviteSecret() { return lazyEnv('ADMIN_INVITE_SECRET') },
  },
}
