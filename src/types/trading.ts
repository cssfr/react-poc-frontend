/**
 * Trading data types for CSV upload and visualization
 */

export interface ProcessedTrade {
  // Core trade data
  symbol: string
  buyPrice: number
  sellPrice: number
  quantity: number
  pnl: string // Original formatted PnL (e.g., "$50.00" or "$(25.00)")
  pnlValue: number // Parsed numeric value for sorting/calculations
  boughtTimestamp: string // Original timestamp string
  soldTimestamp: string // Original timestamp string
  duration: string
  
  // Calculated fields
  direction: 'long' | 'short' // Determined by buy vs sell price
  entryTime: number // Unix timestamp for chart
  exitTime: number // Unix timestamp for chart
  entryPrice: number // Entry price (could be buy or sell depending on direction)
  exitPrice: number // Exit price
  
  // Additional fields from CSV
  buyFillId: string
  sellFillId: string
  priceFormat: number
  priceFormatType: number
  tickSize: number
}

export interface CSVTradeRow {
  symbol: string
  _priceFormat: string
  _priceFormatType: string
  _tickSize: string
  buyFillId: string
  sellFillId: string
  qty: string
  buyPrice: string
  sellPrice: string
  pnl: string
  boughtTimestamp: string
  soldTimestamp: string
  duration: string
}

export interface TradeOverlay {
  id: string
  trade: ProcessedTrade
  entryMarker: any // KLineChart shape reference
  exitMarker: any // KLineChart shape reference
  connectingLine: any // KLineChart shape reference
}

export interface TradeUploadError {
  row: number
  field: string
  value: string
  message: string
}

export interface TradeUploadResult {
  success: boolean
  data: ProcessedTrade[]
  errors: TradeUploadError[]
  totalRows: number
  validRows: number
}

/**
 * Trade overlay configuration for chart visualization
 */
export interface TradeOverlayConfig {
  showEntryExitMarkers: boolean
  showConnectingLines: boolean
  markerSize: number
  lineStyle: 'solid' | 'dashed' | 'dotted'
  colors: {
    longEntry: string
    longExit: string
    shortEntry: string
    shortExit: string
    connectingLine: string
  }
}

/**
 * Chart focus configuration for centering on trades
 */
export interface ChartFocusConfig {
  symbol: string
  centerTime: number
  timeframe: string
  paddingMinutes: number
} 