/**
 * Chart Theme Configuration
 * 
 * This module provides a centralized theming system for KLineChartPro
 * that integrates seamlessly with the dashboard's theme system.
 * 
 * Features:
 * - Automatic theme detection and switching
 * - Dashboard theme integration using CSS custom properties
 * - Modular color scheme management
 * - Extensible for future customizations
 */

import { ChartColorScheme, ChartStyleConfig, ChartTheme } from '../types/chart';

/**
 * Light theme color scheme
 * Uses dashboard's light theme colors via CSS custom properties
 */
const LIGHT_COLOR_SCHEME: ChartColorScheme = {
  // Candle colors - using dashboard success/destructive colors
  upColor: '#059669',        // Success green
  downColor: '#dc2626',      // Destructive red
  upBorderColor: '#059669',
  downBorderColor: '#dc2626',
  upWickColor: '#059669',
  downWickColor: '#dc2626',
  
  // UI colors - using dashboard CSS custom properties
  backgroundColor: '#ffffff',           // --background light
  textColor: '#0f172a',                // --foreground light  
  borderColor: '#e2e8f0',              // --border light
  gridColor: '#f1f5f9',                // Lighter border for grid
  mutedTextColor: '#64748b',           // --muted-foreground light
};

/**
 * Dark theme color scheme
 * Uses dashboard's dark theme colors via CSS custom properties
 */
const DARK_COLOR_SCHEME: ChartColorScheme = {
  // Candle colors - adjusted for dark theme
  upColor: '#10b981',        // Brighter success green for dark
  downColor: '#ef4444',      // Brighter destructive red for dark
  upBorderColor: '#10b981',
  downBorderColor: '#ef4444',
  upWickColor: '#10b981',
  downWickColor: '#ef4444',
  
  // UI colors - using dashboard dark theme
  backgroundColor: '#0f172a',          // --background dark
  textColor: '#f8fafc',               // --foreground dark
  borderColor: '#334155',             // --border dark
  gridColor: '#1e293b',               // Darker border for grid
  mutedTextColor: '#94a3b8',          // --muted-foreground dark
};

/**
 * Detects if system is in dark mode
 * Used for 'auto' theme detection
 */
const isSystemDarkMode = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Resolves the effective theme based on user preference and system settings
 * 
 * @param dashboardTheme - Current dashboard theme ('light' | 'dark' | 'system')
 * @param chartTheme - Chart-specific theme override ('light' | 'dark' | 'auto')
 * @returns Resolved theme ('light' | 'dark')
 */
export const resolveEffectiveTheme = (
  dashboardTheme: string, 
  chartTheme: ChartTheme = 'auto'
): 'light' | 'dark' => {
  // If chart has specific theme preference, use it
  if (chartTheme === 'light' || chartTheme === 'dark') {
    return chartTheme;
  }
  
  // Otherwise follow dashboard theme
  if (dashboardTheme === 'dark') return 'dark';
  if (dashboardTheme === 'light') return 'light';
  
  // For 'system' or 'auto', detect system preference
  return isSystemDarkMode() ? 'dark' : 'light';
};

/**
 * Gets the color scheme for the specified theme
 * 
 * @param theme - Theme to get colors for
 * @returns Color scheme object
 */
export const getColorScheme = (theme: 'light' | 'dark'): ChartColorScheme => {
  return theme === 'dark' ? DARK_COLOR_SCHEME : LIGHT_COLOR_SCHEME;
};

/**
 * Converts color scheme to KLineChartPro style configuration
 * This is where all future chart customizations will be added
 * 
 * @param colorScheme - Color scheme to convert
 * @returns Complete style configuration for KLineChartPro
 */
export const createChartStyleConfig = (colorScheme: ChartColorScheme): ChartStyleConfig => {
  return {
    // Candlestick appearance
    candle: {
      bar: {
        upColor: colorScheme.upColor,
        downColor: colorScheme.downColor,
        upBorderColor: colorScheme.upBorderColor,
        downBorderColor: colorScheme.downBorderColor,
        upWickColor: colorScheme.upWickColor,
        downWickColor: colorScheme.downWickColor,
      },
    },
    
    // Grid lines
    grid: {
      horizontal: {
        color: colorScheme.gridColor,
      },
      vertical: {
        color: colorScheme.gridColor,
      },
    },
    
    // X-axis (time axis)
    xAxis: {
      axisLine: {
        color: colorScheme.borderColor,
      },
      tickText: {
        color: colorScheme.mutedTextColor,
      },
    },
    
    // Y-axis (price axis)
    yAxis: {
      axisLine: {
        color: colorScheme.borderColor,
      },
      tickText: {
        color: colorScheme.mutedTextColor,
      },
    },
    
    // Crosshair (cursor lines)
    crosshair: {
      horizontal: {
        line: {
          color: colorScheme.borderColor,
        },
        text: {
          backgroundColor: colorScheme.textColor,
          color: colorScheme.backgroundColor,
        },
      },
      vertical: {
        line: {
          color: colorScheme.borderColor,
        },
        text: {
          backgroundColor: colorScheme.textColor,
          color: colorScheme.backgroundColor,
        },
      },
    },
  };
};

/**
 * Main function to generate chart styles
 * Combines theme resolution and style generation
 * 
 * @param dashboardTheme - Current dashboard theme
 * @param chartTheme - Chart-specific theme preference
 * @returns Complete style configuration for KLineChartPro
 */
export const generateChartStyles = (
  dashboardTheme: string,
  chartTheme: ChartTheme = 'auto'
): ChartStyleConfig => {
  const effectiveTheme = resolveEffectiveTheme(dashboardTheme, chartTheme);
  const colorScheme = getColorScheme(effectiveTheme);
  return createChartStyleConfig(colorScheme);
};

/**
 * Gets the KLineChartPro theme string
 * 
 * @param dashboardTheme - Current dashboard theme
 * @param chartTheme - Chart-specific theme preference
 * @returns KLineChartPro theme string
 */
export const getKLineChartTheme = (
  dashboardTheme: string,
  chartTheme: ChartTheme = 'auto'
): 'light' | 'dark' => {
  return resolveEffectiveTheme(dashboardTheme, chartTheme);
}; 