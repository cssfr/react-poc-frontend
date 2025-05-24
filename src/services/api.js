import { supabase } from '../supabaseClient'

const API_BASE_URL = import.meta.env.VITE_FASTAPI_URL

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new ApiError('Not authenticated', 401)
  
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

async function apiRequest(endpoint, options = {}) {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(data.detail || 'API request failed', response.status, data)
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('Network error', 0, { originalError: error })
  }
}

// Backtest API
export const backtestApi = {
  getAll: () => apiRequest('/api/backtests'),
  
  getById: (id) => apiRequest(`/api/backtests/${id}`),
  
  create: (data) => apiRequest('/api/backtests', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id, data) => apiRequest(`/api/backtests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => apiRequest(`/api/backtests/${id}`, {
    method: 'DELETE',
  }),
}

// Trades API
export const tradeApi = {
  getByBacktestId: (backtestId) => apiRequest(`/api/backtests/${backtestId}/trades`),
  
  create: (data) => apiRequest('/api/trades', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}

// Strategies API
export const strategyApi = {
  getAll: (includePublic = true) => apiRequest(`/api/strategies?include_public=${includePublic}`),
  
  getById: (id) => apiRequest(`/api/strategies/${id}`),
  
  create: (data) => apiRequest('/api/strategies', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id, data) => apiRequest(`/api/strategies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => apiRequest(`/api/strategies/${id}`, {
    method: 'DELETE',
  }),
}

// User API
export const userApi = {
  getCurrentUser: () => apiRequest('/api/user'),
}

// Legacy items API (for backward compatibility)
export const itemsApi = {
  getAll: () => apiRequest('/items'),
}