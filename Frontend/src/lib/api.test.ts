import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchApi, getApiErrorMessage } from './api'

describe('fetchApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns json body for successful responses', async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', mockFetch)

    await expect(fetchApi<{ ok: boolean }>('/health')).resolves.toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('returns undefined on 204 responses', async () => {
    const mockFetch = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', mockFetch)

    await expect(fetchApi('/empty')).resolves.toBeUndefined()
  })

  it('throws ApiError for error responses', async () => {
    const mockFetch = vi.fn(async () => new Response('bad request', { status: 400 }))
    vi.stubGlobal('fetch', mockFetch)

    await expect(fetchApi('/fail')).rejects.toEqual(expect.objectContaining({ status: 400 }))
  })
})

describe('getApiErrorMessage', () => {
  it('extracts validation errors when present', () => {
    const error = new ApiError(
      400,
      JSON.stringify({ errors: { email: ['Email is required'], password: ['Password is required'] } }),
    )

    expect(getApiErrorMessage(error)).toBe('Email is required Password is required')
  })

  it('uses detail, then title fallback for ApiError payloads', () => {
    const detailError = new ApiError(400, JSON.stringify({ detail: 'Detail message', title: 'Title message' }))
    const titleError = new ApiError(400, JSON.stringify({ title: 'Title only' }))

    expect(getApiErrorMessage(detailError)).toBe('Detail message')
    expect(getApiErrorMessage(titleError)).toBe('Title only')
  })

  it('falls back to default for unknown errors', () => {
    expect(getApiErrorMessage({})).toBe('Something went wrong. Please try again.')
  })
})
