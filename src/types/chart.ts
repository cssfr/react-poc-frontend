/**
 * Chart component configuration types
 * Provides type safety for all chart customization options
 */

import type { ProcessedTrade } from './trading';

export type ChartTheme = 'light' | 'dark' | 'auto';
export type ToolbarStyle = 'default' | 'icons-only';

/**
 * Chart component props interface
 */
export interface ChartComponentProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  toolbarStyle?: ToolbarStyle;
  theme?: ChartTheme;
}

/**
 * Enhanced chart component props with trade visualization support
 */
export interface EnhancedChartComponentProps extends ChartComponentProps {
  // Trade visualization
  trades?: ProcessedTrade[]
  focusedTrade?: ProcessedTrade | null
  onTradeFocus?: (trade: ProcessedTrade | null) => void
  
  // Symbol and time control  
  symbol?: string
  onSymbolChange?: (symbol: string) => void
  timeRange?: { from: number; to: number }
  onTimeRangeChange?: (range: { from: number; to: number }) => void
  
  // Chart control methods ref
  chartRef?: React.RefObject<ChartControlMethods>
}

/**
 * Chart color scheme configuration
 */
export interface ChartColorScheme {
  // Candle colors
  upColor: string;
  downColor: string;
  upBorderColor: string;
  downBorderColor: string;
  upWickColor: string;
  downWickColor: string;
  
  // UI colors
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  gridColor: string;
  mutedTextColor: string;
}

/**
 * Complete chart style configuration
 * Maps to KLineChartPro's style API
 */
export interface ChartStyleConfig {
  candle: {
    bar: {
      upColor: string;
      downColor: string;
      upBorderColor: string;
      downBorderColor: string;
      upWickColor: string;
      downWickColor: string;
    };
  };
  grid: {
    horizontal: { color: string };
    vertical: { color: string };
  };
  xAxis: {
    axisLine: { color: string };
    tickText: { color: string };
  };
  yAxis: {
    axisLine: { color: string };
    tickText: { color: string };
  };
  crosshair: {
    horizontal: {
      line: { color: string };
      text: { backgroundColor: string; color: string };
    };
    vertical: {
      line: { color: string };
      text: { backgroundColor: string; color: string };
    };
  };
} 

/**
 * Chart control methods interface
 */
export interface ChartControlMethods {
  // Symbol control
  setSymbol: (symbol: string) => Promise<void>
  getSymbol: () => string
  
  // Time range control  
  setTimeRange: (from: number, to: number, padding?: number) => void
  getTimeRange: () => { from: number; to: number }
  
  // Period/timeframe control
  setPeriod: (period: string) => void // '1m', '5m', '15m', '1h', '4h', '1d'
  getPeriod: () => string
  
  // Trade overlays
  addTradeMarkers: (trades: ProcessedTrade[]) => void
  clearTradeMarkers: () => void
  focusOnTrade: (trade: ProcessedTrade, padding?: number) => void
  
  // Chart instance access
  getChart: () => any // KLineChartPro instance
}

/**
 * Trade marker visualization options
 */
export interface TradeMarkerOptions {
  entryColor: string
  exitColor: string
  connectingLineColor: string
  connectingLineStyle: 'solid' | 'dashed' | 'dotted'
  markerSize: number
  showLabels: boolean
  labelFont: string
}

// Default trade marker options
export const DEFAULT_TRADE_MARKER_OPTIONS: TradeMarkerOptions = {
  entryColor: '#22c55e', // green for entry
  exitColor: '#ef4444',  // red for exit
  connectingLineColor: '#6b7280', // gray for connecting line
  connectingLineStyle: 'dashed',
  markerSize: 8,
  showLabels: true,
  labelFont: '12px Inter, system-ui, sans-serif'
} 