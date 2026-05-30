// SERVER SIDE ONLY — never import this in client components

interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: 'call'
  id: number
  params: {
    service: string
    method: string
    args: unknown[]
  }
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: number
  result?: unknown
  error?: {
    code: number
    message: string
    data?: {
      name?: string
      message?: string
      debug?: string
    }
  }
}

export class OdooClient {
  private url: string
  private database: string
  private apiKey: string
  private uid: number | null = null
  private requestId = 0

  constructor(url: string, database: string, apiKey: string) {
    if (!url || !database || !apiKey) {
      throw new Error('Odoo connection not configured')
    }
    // Normalise — strip trailing slash, ensure /web/dataset/call_kw base
    this.url = url.replace(/\/$/, '')
    this.database = database
    this.apiKey = apiKey
    console.log(`[OdooClient] Configured for ${this.url} / db: ${this.database}`)
  }

  // ----------------------------------------------------------------
  // Low-level JSON-RPC call
  // ----------------------------------------------------------------
  private async rpc<T>(
    endpoint: string,
    service: string,
    method: string,
    args: unknown[]
  ): Promise<T> {
    const body: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'call',
      id: ++this.requestId,
      params: { service, method, args },
    }

    const response = await fetch(`${this.url}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Node 18+ built-in fetch — no timeout option; rely on Vercel function timeout
    })

    if (!response.ok) {
      throw new Error(`Odoo HTTP ${response.status}: ${response.statusText}`)
    }

    const json = (await response.json()) as JsonRpcResponse

    if (json.error) {
      const msg =
        json.error.data?.message ?? json.error.message ?? 'Unknown Odoo error'
      throw new Error(`Odoo RPC error: ${msg}`)
    }

    return json.result as T
  }

  // ----------------------------------------------------------------
  // Authenticate and cache UID (API key auth)
  // ----------------------------------------------------------------
  private async getUid(): Promise<number> {
    if (this.uid !== null) return this.uid

    const uid = await this.rpc<number>(
      '/web/dataset/call_kw',
      'common',
      'authenticate',
      [this.database, 'api_key', this.apiKey, {}]
    )

    if (!uid || typeof uid !== 'number') {
      throw new Error('Odoo authentication failed — check ODOO_API_KEY')
    }

    this.uid = uid
    return uid
  }

  // ----------------------------------------------------------------
  // Public: execute an arbitrary model method
  // ----------------------------------------------------------------
  async execute<T = unknown>(
    model: string,
    method: string,
    args: unknown[],
    kwargs: Record<string, unknown> = {}
  ): Promise<T> {
    const uid = await this.getUid()

    return this.rpc<T>('/web/dataset/call_kw', 'object', 'execute_kw', [
      this.database,
      uid,
      this.apiKey,
      model,
      method,
      args,
      kwargs,
    ])
  }

  // ----------------------------------------------------------------
  // Public: convenience wrapper for search_read
  // ----------------------------------------------------------------
  async searchRead<T = Record<string, unknown>>(
    model: string,
    domain: unknown[],
    fields: string[],
    limit = 0,
    offset = 0
  ): Promise<T[]> {
    return this.execute<T[]>(model, 'search_read', [domain], {
      fields,
      limit,
      offset,
    })
  }
}

// ----------------------------------------------------------------
// Singleton factory — reads from env vars
// Throws early with a clear message if vars are missing/placeholder
// ----------------------------------------------------------------
let _client: OdooClient | null = null

export function getOdooClient(): OdooClient {
  if (_client) return _client

  const url = process.env.ODOO_URL ?? ''
  const database = process.env.ODOO_DATABASE ?? ''
  const apiKey = process.env.ODOO_API_KEY ?? ''

  if (
    !url ||
    url.includes('your_odoo') ||
    !database ||
    database.includes('your_odoo') ||
    !apiKey ||
    apiKey.includes('your_odoo')
  ) {
    throw new Error('Odoo connection not configured')
  }

  _client = new OdooClient(url, database, apiKey)
  return _client
}
