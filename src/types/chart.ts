/**
 * Chart component configuration types
 * Provides type safety for all chart customization options
 */

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