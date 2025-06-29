/**
 * Professional Chart Component
 * 
 * A production-ready React component wrapping KLineChartPro with:
 * - Full theme integration with dashboard
 * - Configurable toolbar styling
 * - Type-safe configuration
 * - Automatic cleanup and memory management
 * - Future-proof extensibility
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { KLineChartPro } from '@klinecharts/pro';
import { dispose } from 'klinecharts';
import { CustomFastAPIDatafeed } from '../services/CustomFastAPIDatafeed';
import { useTheme } from '../lib/contexts/ThemeContext';
import { 
  generateChartStyles, 
  getKLineChartTheme 
} from '../lib/chartTheme';
import { ChartComponentProps, ToolbarStyle } from '../types/chart';
import '@klinecharts/pro/dist/klinecharts-pro.css';

/**
 * Generates CSS for toolbar styling
 * Minimal CSS approach to hide text labels when needed
 */
const generateToolbarCSS = (toolbarStyle: ToolbarStyle): string => {
  if (toolbarStyle !== 'icons-only') return '';
  
  return `
    /* Hide text labels in toolbar buttons, keep icons */
    .klinecharts-pro [class*="period"] button > span:last-child,
    .klinecharts-pro [class*="toolbar"] button > span:last-child,
    .klinecharts-pro [class*="header"] button > span:not(:first-child) {
      display: none !important;
    }
    
    /* Adjust button sizing for icon-only mode */
    .klinecharts-pro [class*="period"] button,
    .klinecharts-pro [class*="toolbar"] button,
    .klinecharts-pro [class*="header"] button {
      min-width: 36px;
      padding: 6px 8px;
      justify-content: center;
    }
    
    /* Ensure icons remain centered */
    .klinecharts-pro [class*="period"] button > span:first-child,
    .klinecharts-pro [class*="toolbar"] button > span:first-child,
    .klinecharts-pro [class*="header"] button > span:first-child {
      margin: 0 auto;
    }
  `;
};

/**
 * Default chart periods configuration
 * Includes all supported timeframes with proper labeling
 */
const DEFAULT_PERIODS = [
  { multiplier: 1, timespan: 'minute', text: '1m' },
  { multiplier: 3, timespan: 'minute', text: '3m' },
  { multiplier: 5, timespan: 'minute', text: '5m' },
  { multiplier: 10, timespan: 'minute', text: '10m' },
  { multiplier: 15, timespan: 'minute', text: '15m' },
  { multiplier: 1, timespan: 'hour', text: '1h' },
  { multiplier: 1, timespan: 'day', text: '1D' },
  { multiplier: 1, timespan: 'week', text: '1W' },
  { multiplier: 1, timespan: 'month', text: '1M' },
  { multiplier: 1, timespan: 'year', text: '1Y' }
] as const;

/**
 * Chart Component
 * 
 * Professional trading chart with full theme integration
 */
const ChartComponent: React.FC<ChartComponentProps> = ({ 
  width = '100%', 
  height = '400px',
  className = '',
  toolbarStyle = 'icons-only',
  theme: chartTheme = 'auto'
}) => {
  // Refs for DOM and chart instances
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<KLineChartPro | null>(null);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  
  // Get dashboard theme context
  const { theme: dashboardTheme } = useTheme();

  /**
   * Applies or updates the toolbar styling CSS
   * Uses a dedicated style element for clean management
   */
  const updateToolbarStyles = useCallback((style: ToolbarStyle) => {
    // Remove existing style element
    if (styleElementRef.current) {
      styleElementRef.current.remove();
      styleElementRef.current = null;
    }

    // Create new style element if needed
    const css = generateToolbarCSS(style);
    if (css) {
      const styleElement = document.createElement('style');
      styleElement.textContent = css;
      styleElement.setAttribute('data-chart-toolbar-styles', 'true');
      document.head.appendChild(styleElement);
      styleElementRef.current = styleElement;
    }
  }, []);

  /**
   * Updates chart theme and styles
   * Centralized theme update logic
   */
  const updateChartTheme = useCallback(() => {
    if (!chartRef.current) return;

    const klineTheme = getKLineChartTheme(dashboardTheme, chartTheme);
    const chartStyles = generateChartStyles(dashboardTheme, chartTheme);

    // Apply theme and styles to chart
    chartRef.current.setTheme(klineTheme);
    chartRef.current.setStyles(chartStyles);
  }, [dashboardTheme, chartTheme]);

  /**
   * Initialize chart instance
   * Sets up KLineChartPro with all configuration
   */
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    try {
      // Generate initial theme configuration
      const klineTheme = getKLineChartTheme(dashboardTheme, chartTheme);
      const chartStyles = generateChartStyles(dashboardTheme, chartTheme);

      // Create chart instance
      chartRef.current = new KLineChartPro({
        container: containerRef.current,
        locale: 'en-US',
        timezone: 'UTC',
        theme: klineTheme,
        styles: chartStyles,
        watermark: `<svg class="logo" viewBox="0 0 160 160"></svg>`,
        
        // Default symbol configuration
        symbol: {
          exchange: 'CME',
          market: 'FUTURES',
          name: 'E-mini S&P 500',
          shortName: 'ES',
          ticker: 'ES',
          type: 'FUT',
        },
        
        // Default period and available periods
        period: { multiplier: 1, timespan: 'hour', text: '1h' },
        periods: DEFAULT_PERIODS,
        
        // Technical indicators
        subIndicators: ['VOL'],
        
        // Data source
        datafeed: new CustomFastAPIDatafeed(
          import.meta.env.VITE_FASTAPI_URL
        )
      });
      
      console.log('📈 Chart initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize chart:', error);
    }
    
    // Cleanup function
    return () => {
      if (chartRef.current && containerRef.current) {
        try {
          dispose(containerRef.current);
          chartRef.current = null;
          console.log('🧹 Chart cleaned up');
        } catch (error) {
          console.error('⚠️ Error during chart cleanup:', error);
        }
      }
    };
  }, []); // Only run once on mount

  /**
   * React to theme changes
   * Updates chart theme when dashboard theme changes
   */
  useEffect(() => {
    updateChartTheme();
  }, [updateChartTheme]);

  /**
   * React to toolbar style changes
   * Updates CSS when toolbar style changes
   */
  useEffect(() => {
    updateToolbarStyles(toolbarStyle);
    
    // Cleanup function to remove styles on unmount
    return () => {
      if (styleElementRef.current) {
        styleElementRef.current.remove();
        styleElementRef.current = null;
      }
    };
  }, [toolbarStyle, updateToolbarStyles]);

  return (
    <div 
      ref={containerRef}
      style={{ width, height }}
      className={className}
      data-chart-theme={getKLineChartTheme(dashboardTheme, chartTheme)}
      data-toolbar-style={toolbarStyle}
    />
  );
};

export default ChartComponent;