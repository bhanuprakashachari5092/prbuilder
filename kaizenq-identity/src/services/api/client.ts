/**
 * Central API Client Abstraction for KaizenQ Identity
 * Production-ready interface prepared for future backend integration
 */

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export class ApiError extends Error {
  statusCode: number
  errors?: Record<string, string[]>

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errors = errors
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl
  }

  // Pre-configured for future endpoints
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const targetUrl = `${this.baseUrl}${endpoint}`
      // In initial frontend architecture phase, returns structured mock envelope
      return {
        data: null as unknown as T,
        success: true,
        message: `Endpoint ${targetUrl} ready for backend connection`,
      }
    } catch (error) {
      throw new ApiError(500, error instanceof Error ? error.message : 'Unknown network failure')
    }
  }

  async post<T, B = unknown>(endpoint: string, body: B): Promise<ApiResponse<T>> {
    const targetUrl = `${this.baseUrl}${endpoint}`
    void body
    return {
      data: null as unknown as T,
      success: true,
      message: `Payload received for ${targetUrl}`,
    }
  }
}

export const api = new ApiClient()
