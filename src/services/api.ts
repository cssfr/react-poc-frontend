import { supabase } from '../supabaseClient'

const API_BASE_URL = import.meta.env.VITE_FASTAPI_URL
const API_VERSION = '/api/v1'

export interface ApiErrorData {
  detail?: string
  [key: string]: unknown
}

export class ApiError extends Error {
  status: number
  data: ApiErrorData
  constructor(message: string, status: number, data: ApiErrorData) {
    super(message)
    this.status = status
    this.data = data
  }
}

export interface Backtest {
  id: string
  name: string
  strategy: string
  symbol: string
  start_date: string
  end_date: string
  initial_capital: number
  final_value?: number
  total_return?: number
  sharpe_ratio?: number
  max_drawdown?: number
  win_rate?: number
  total_trades?: number
  status: string
  created_at: string
}

export interface Trade {
  id: string
  backtest_id: string
  symbol: string
  trade_type: 'buy' | 'sell'
  quantity: number
  price: number
  timestamp: string
}

export interface Strategy {
  id: string
  name: string
  description?: string
  is_public: boolean
  parameters?: Record<string, unknown>
  created_at: string
}

export interface User {
  id: string
  email: string
  [key: string]: unknown
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new ApiError('Not authenticated', 401, {})
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

interface ApiRequestOptions {
  method?: string
  body?: string
  headers?: Record<string, string>
}

async function apiRequest<T = unknown>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
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
    return data as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('Network error', 0, { originalError: error })
  }
}

// Backtest API
type BacktestCreate = Omit<Backtest, 'id' | 'created_at' | 'final_value' | 'total_return' | 'sharpe_ratio' | 'max_drawdown' | 'win_rate' | 'total_trades' | 'status'>
export const backtestApi = {
  getAll: (): Promise<Backtest[]> => apiRequest<Backtest[]>(`${API_VERSION}/backtests`),
  getById: (id: string): Promise<Backtest> => apiRequest<Backtest>(`${API_VERSION}/backtests/${id}`),
  create: (data: BacktestCreate): Promise<Backtest> => apiRequest<Backtest>(`${API_VERSION}/backtests`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<BacktestCreate>): Promise<Backtest> => apiRequest<Backtest>(`${API_VERSION}/backtests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => apiRequest<void>(`${API_VERSION}/backtests/${id}`, {
    method: 'DELETE',
  }),
}

// Trades API
export const tradeApi = {
  getByBacktestId: (backtestId: string): Promise<Trade[]> => apiRequest<Trade[]>(`${API_VERSION}/backtests/${backtestId}/trades`),
  create: (data: Omit<Trade, 'id'>): Promise<Trade> => apiRequest<Trade>(`${API_VERSION}/trades`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}

// Strategies API
type StrategyCreate = Omit<Strategy, 'id' | 'created_at'>
export const strategyApi = {
  getAll: (includePublic: boolean = true): Promise<Strategy[]> => apiRequest<Strategy[]>(`${API_VERSION}/strategies?include_public=${includePublic}`),
  getById: (id: string): Promise<Strategy> => apiRequest<Strategy>(`${API_VERSION}/strategies/${id}`),
  create: (data: StrategyCreate): Promise<Strategy> => apiRequest<Strategy>(`${API_VERSION}/strategies`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<StrategyCreate>): Promise<Strategy> => apiRequest<Strategy>(`${API_VERSION}/strategies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => apiRequest<void>(`${API_VERSION}/strategies/${id}`, {
    method: 'DELETE',
  }),
}

// User API
export const userApi = {
  getCurrentUser: (): Promise<User> => apiRequest<User>(`${API_VERSION}/users`),
}

// Legacy items API (for backward compatibility)
export const itemsApi = {
  getAll: (): Promise<unknown[]> => apiRequest<unknown[]>('/items'),
}

