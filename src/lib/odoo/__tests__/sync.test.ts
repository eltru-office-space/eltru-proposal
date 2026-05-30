import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runFullSync } from '../sync'

// ----------------------------------------------------------------
// Mock the Odoo client module
// ----------------------------------------------------------------
vi.mock('../client', () => ({
  getOdooClient: () => ({
    searchRead: vi.fn(async (model: string) => {
      if (model === 'product.template') {
        return [
          {
            id: 1001,
            name: 'Knoll Task Chair',
            default_code: 'KTC-001',
            categ_id: [5, 'Pre-Owned Seating'],
            description_sale: 'Ergonomic task chair',
            list_price: 349.0,
            active: true,
            image_1920: false,
            product_variant_ids: [],
            attribute_line_ids: [],
            product_image_ids: [],
          },
          {
            id: 1002,
            name: 'Office Star Pro Desk',
            default_code: 'OSD-002',
            categ_id: [6, 'Office Star Desks'],
            description_sale: false,
            list_price: 799.0,
            active: true,
            image_1920: false,
            product_variant_ids: [],
            attribute_line_ids: [],
            product_image_ids: [],
          },
          {
            id: 1003,
            name: 'N9ine Standing Desk',
            default_code: false,
            categ_id: [7, 'N9ine Height Adjustable'],
            description_sale: 'Motorised sit-stand desk',
            list_price: 1299.0,
            active: true,
            image_1920: false,
            product_variant_ids: [],
            attribute_line_ids: [],
            product_image_ids: [],
          },
        ]
      }
      if (model === 'mrp.bom') return []
      return []
    }),
  }),
}))

// ----------------------------------------------------------------
// Mock Supabase client
// ----------------------------------------------------------------

function makeMockSupabase() {
  const upsertedProducts: unknown[] = []
  const logUpdates: unknown[] = []

  // Each chained call returns a thenable builder
  const makeBuilder = (returnData: unknown = null, returnError: null = null) => {
    const builder = {
      data: returnData,
      error: returnError,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: returnData, error: null }),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
    }
    return builder
  }

  const supabase = {
    _upsertedProducts: upsertedProducts,
    _logUpdates: logUpdates,

    from: vi.fn((table: string) => {
      if (table === 'odoo_sync_log') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'log-test-id' },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'log-test-id',
                  sync_type: 'full',
                  status: 'completed',
                  products_added: 3,
                  products_updated: 0,
                  products_flagged: 0,
                },
                error: null,
              }),
            }),
          }),
        }
      }

      if (table === 'product_cache') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          upsert: vi.fn((data: unknown) => {
            upsertedProducts.push(data)
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'product-cache-id' },
                  error: null,
                }),
              }),
            }
          }),
          update: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }

      if (table === 'product_images_cache') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      }

      if (table === 'kit_cache') {
        return makeBuilder({ id: 'kit-id' })
      }

      if (table === 'kit_components_cache') {
        return makeBuilder()
      }

      return makeBuilder()
    }),

    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/test.jpg' },
        }),
      }),
    },
  }

  return supabase
}

// ----------------------------------------------------------------
// Tests
// ----------------------------------------------------------------

describe('runFullSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('upserts all 3 products with correctly mapped fields', async () => {
    const supabase = makeMockSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await runFullSync(supabase as any)

    expect(supabase._upsertedProducts).toHaveLength(3)

    const [chair, desk, standing] = supabase._upsertedProducts as Array<
      Record<string, unknown>
    >

    // Product 1 — Pre-Owned
    expect(chair.odoo_id).toBe(1001)
    expect(chair.name).toBe('Knoll Task Chair')
    expect(chair.source).toBe('preowned')
    expect(chair.odoo_internal_ref).toBe('KTC-001')
    expect(chair.base_price).toBe(349.0)
    expect(chair.is_available).toBe(true)

    // Product 2 — Office Star
    expect(desk.odoo_id).toBe(1002)
    expect(desk.source).toBe('officestar')
    expect(desk.description).toBeNull() // false → null

    // Product 3 — N9ine
    expect(standing.odoo_id).toBe(1003)
    expect(standing.source).toBe('n9ine')
    expect(standing.odoo_internal_ref).toBeNull() // false → null
  })

  it('returns a sync log with status completed', async () => {
    const supabase = makeMockSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await runFullSync(supabase as any)

    expect(result.status).toBe('completed')
    expect(result.sync_type).toBe('full')
  })

  it('sets last_synced_at on every upserted product', async () => {
    const supabase = makeMockSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await runFullSync(supabase as any)

    for (const product of supabase._upsertedProducts as Array<
      Record<string, unknown>
    >) {
      expect(typeof product.last_synced_at).toBe('string')
    }
  })
})
