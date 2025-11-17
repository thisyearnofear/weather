import { describe, it, expect } from 'vitest'
import { POST } from '../app/api/predictions/route'

function mockRequest(body) {
  return {
    json: async () => body,
    headers: new Map([
      ['x-forwarded-for', '127.0.0.1'],
      ['user-agent', 'vitest']
    ])
  }
}

describe('/api/predictions POST fee', () => {
  it('serializes fee value correctly for txRequest', async () => {
    const req = mockRequest({
      marketID: 456,
      price: 0.5,
      side: 'BUY',
      size: 0.01,
      walletAddress: '0x0000000000000000000000000000000000000002'
    })
    const res = await POST(req)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.mode).toBe('client_signature_required')
    expect(json.txRequest.value).toBe('100000000000000')
  })
})