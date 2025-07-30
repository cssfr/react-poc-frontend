/**
 * Enhanced Chart Component with Trade Visualization
 */

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import { KLineChartPro } from '@klinecharts/pro';
import { CustomFastAPIDatafeed } from '../services/CustomFastAPIDatafeed';
import { useTheme } from '../lib/contexts/ThemeContext';
import { 
  generateChartStyles, 
  getKLineChartTheme 
} from '../lib/chartTheme';
import type { 
  EnhancedChartComponentProps, 
  ChartControlMethods, 
  TradeMarkerOptions
} from '../types/chart';
import { DEFAULT_TRADE_MARKER_OPTIONS } from '../types/chart';
import type { ProcessedTrade } from '../types/trading';
import { extractBaseSymbol, getSymbolDisplayName } from '../lib/trading/symbolUtils';
import '@klinecharts/pro/dist/klinecharts-pro.css';

const DEFAULT_PERIODS = [
  { multiplier: 1, timespan: 'minute', text: '1m' },
  { multiplier: 5, timespan: 'minute', text: '5m' },
  { multiplier: 15, timespan: 'minute', text: '15m' },
  { multiplier: 1, timespan: 'hour', text: '1h' },
  { multiplier: 4, timespan: 'hour', text: '4h' },
  { multiplier: 1, timespan: 'day', text: '1d' },
];

interface EnhancedChartRef extends ChartControlMethods {}

const EnhancedChartComponent = forwardRef<EnhancedChartRef, EnhancedChartComponentProps>((props, ref) => {
  const {
    width = '100%',
    height = '400px',
    className = '',
    toolbarStyle = 'default',
    theme = 'auto',
    trades = [],
    focusedTrade = null,
    onTradeFocus,
    symbol,
    onSymbolChange,
    timeRange,
    onTimeRangeChange
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const tradeMarkersRef = useRef<Map<string, any>>(new Map());
  const { theme: dashboardTheme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get effective theme
  const getEffectiveTheme = (themeValue: string) => {
    if (themeValue === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeValue as 'light' | 'dark';
  };
  
  const chartTheme = theme === 'auto' ? getEffectiveTheme(dashboardTheme) : getEffectiveTheme(theme);

     /**
    * Actually create trade markers using KLineCharts overlay system
    */
  const createTradeMarkers = useCallback((trade: ProcessedTrade): any[] => {
    if (!chartRef.current) {
      console.log('❌ Chart not available for trade markers');
      return [];
    }

    console.log('🎯 ACTUALLY creating trade markers for:', {
      symbol: trade.symbol,
      direction: trade.direction,
      entryTime: new Date(trade.entryTime),
      exitTime: new Date(trade.exitTime),
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice
    });

         // FIND THE ACTUAL KLINECHARTS INSTANCE
     console.log('🔍 DEEP SEARCH FOR REAL CHART INSTANCE:');
     console.log('Chart wrapper structure:', {
       keys: Object.keys(chartRef.current),
       _chartApi: Object.keys(chartRef.current._chartApi || {}),
       _container: chartRef.current._container
     });

     // Try to find the real chart instance in various locations
     let realChart = null;
     const searchLocations = [
       chartRef.current._chart,
       chartRef.current._instance, 
       chartRef.current._klineChart,
       chartRef.current.chart,
       chartRef.current.instance,
       chartRef.current._chartApi?._chart,
       chartRef.current._chartApi?.chart,
       chartRef.current._chartApi?.instance
     ];

     for (let i = 0; i < searchLocations.length; i++) {
       const candidate = searchLocations[i];
       if (candidate && typeof candidate === 'object') {
         console.log(`🔹 Checking location ${i}:`, {
           constructor: candidate.constructor?.name,
           keys: Object.keys(candidate).slice(0, 10),
           hasCreateOverlay: !!candidate.createOverlay,
           hasSetVisibleRange: !!candidate.setVisibleRange
         });
         
         // Look for key KLineCharts methods
         if (candidate.createOverlay || candidate.setVisibleRange || candidate.scrollToRealTime) {
           realChart = candidate;
           console.log('✅ FOUND REAL CHART INSTANCE at location', i);
           break;
         }
       }
     }

     if (!realChart) {
       console.log('🔍 Checking _container for chart instance...');
       const container = chartRef.current._container;
       if (container) {
         // Sometimes the chart instance is stored in the DOM element
         const chartInstance = container._chart || container.__chart__ || container.chart;
         if (chartInstance) {
           console.log('📍 Found chart in container:', {
             constructor: chartInstance.constructor?.name,
             methods: Object.keys(chartInstance).filter(k => typeof chartInstance[k] === 'function').slice(0, 20)
           });
           realChart = chartInstance;
         }
       }
     }

     if (!realChart) {
       console.error('❌ Could not find real KLineCharts instance');
       console.log('📋 Available chart wrapper methods:', Object.keys(chartRef.current).filter(k => typeof chartRef.current[k] === 'function'));
       return [];
     }

     console.log('📋 REAL CHART INSTANCE FOUND:');
     console.log('Chart constructor:', realChart.constructor?.name);
     
     // Get methods from the real chart instance
     const chartMethods = Object.keys(realChart).filter(key => typeof realChart[key] === 'function');
     const chartProperties = Object.keys(realChart).filter(key => typeof realChart[key] !== 'function');
     
     console.log('🔧 REAL CHART METHODS (' + chartMethods.length + '):', chartMethods.sort());
     console.log('📊 REAL CHART PROPERTIES (' + chartProperties.length + '):', chartProperties.sort());

         // Look for overlay/figure methods
     const overlayMethods = chartMethods.filter((method: string) => 
       method.toLowerCase().includes('overlay') ||
       method.toLowerCase().includes('figure') ||
       method.toLowerCase().includes('supported')
     );
     console.log('🎯 OVERLAY/FIGURE METHODS:', overlayMethods);

     const markers: any[] = [];

     try {
       // KLineCharts approach: Use overlays for trade markers
       
       // First, try to get supported overlays
       if (realChart.getSupportedOverlays) {
         try {
           const supportedOverlays = realChart.getSupportedOverlays();
           console.log('📋 Supported overlays:', supportedOverlays);
         } catch (error) {
           console.warn('getSupportedOverlays failed:', error);
         }
       }

       // Try to get supported figures
       if (realChart.getSupportedFigures) {
         try {
           const supportedFigures = realChart.getSupportedFigures();
           console.log('📋 Supported figures:', supportedFigures);
         } catch (error) {
           console.warn('getSupportedFigures failed:', error);
         }
       }

       // Approach 1: Create overlay for trade markers
       if (realChart.createOverlay) {
         try {
           console.log('🔹 Trying createOverlay with trade points...');
           
           const tradeOverlay = {
             name: 'trade_marker',
             points: [
               { 
                 timestamp: Math.floor(trade.entryTime / 1000), 
                 value: trade.entryPrice 
               },
               { 
                 timestamp: Math.floor(trade.exitTime / 1000), 
                 value: trade.exitPrice 
               }
             ],
             styles: {
               point: {
                 color: trade.direction === 'long' ? '#10B981' : '#EF4444',
                 radius: 6
               }
             }
           };

           const overlayId = realChart.createOverlay(tradeOverlay);
           if (overlayId) {
             markers.push(overlayId);
             console.log('✅ Created trade overlay:', overlayId);
           }
         } catch (error) {
           console.warn('createOverlay failed:', error);
         }
       }

       // Approach 2: Use simpleTag overlay (common in KLineCharts)
       if (realChart.createOverlay && markers.length === 0) {
         try {
           console.log('🔹 Trying simpleTag overlay...');
           
           // Entry marker
           const entryOverlayId = realChart.createOverlay({
             name: 'simpleTag',
             points: [{ 
               timestamp: Math.floor(trade.entryTime / 1000), 
               value: trade.entryPrice 
             }],
             styles: {
               text: {
                 content: `${trade.direction.toUpperCase()} ENTRY`,
                 color: trade.direction === 'long' ? '#10B981' : '#EF4444'
               }
             }
           });

           // Exit marker  
           const exitOverlayId = realChart.createOverlay({
             name: 'simpleTag',
             points: [{ 
               timestamp: Math.floor(trade.exitTime / 1000), 
               value: trade.exitPrice 
             }],
             styles: {
               text: {
                 content: `${trade.direction.toUpperCase()} EXIT`,
                 color: trade.direction === 'long' ? '#EF4444' : '#10B981'
               }
             }
           });

           if (entryOverlayId) markers.push(entryOverlayId);
           if (exitOverlayId) markers.push(exitOverlayId);
           
           console.log('✅ Created simpleTag overlays:', { entry: entryOverlayId, exit: exitOverlayId });
         } catch (error) {
           console.warn('simpleTag overlay failed:', error);
         }
       }

       // Approach 3: Try any available overlay methods
       for (const method of overlayMethods) {
         if (markers.length > 0) break;
         
         try {
           console.log(`🔹 Trying ${method}...`);
           const result = realChart[method]();
           console.log(`${method} result:`, result);
         } catch (error) {
           console.warn(`${method} failed:`, error);
         }
       }

      if (markers.length === 0) {
        console.warn('❌ NO WORKING OVERLAY METHOD FOUND!');
        console.log('💡 Need to implement custom overlay registration or use different approach');
      } else {
        console.log('✅ Successfully created', markers.length, 'trade markers');
      }

    } catch (error) {
      console.error('❌ Failed to create trade markers:', error);
    }

    return markers;
  }, []);

  /**
   * Add trade markers to chart
   */
  const addTradeMarkers = useCallback((tradesToAdd: ProcessedTrade[]) => {
    if (!chartRef.current) return;

    console.log('📊 Adding trade markers for', tradesToAdd.length, 'trades');
    
    tradesToAdd.forEach(trade => {
      const tradeKey = `${trade.symbol}-${trade.entryTime}-${trade.exitTime}`;
      
      if (tradeMarkersRef.current.has(tradeKey)) {
        console.log('⏭️ Skipping duplicate trade:', tradeKey);
        return;
      }

      const markers = createTradeMarkers(trade);
      if (markers.length > 0) {
        tradeMarkersRef.current.set(tradeKey, markers);
        console.log('✅ Added markers for trade:', tradeKey);
      } else {
        console.warn('❌ No markers created for trade:', tradeKey);
      }
    });
  }, [createTradeMarkers]);

     /**
    * Clear all trade markers using KLineCharts API
    */
  const clearTradeMarkers = useCallback(() => {
    if (!chartRef.current) return;

         console.log('🧹 Clearing trade markers...');
     
     // Find the real chart instance (same search as in createTradeMarkers)
     let realChart = null;
     const searchLocations = [
       chartRef.current._chart,
       chartRef.current._instance, 
       chartRef.current._klineChart,
       chartRef.current.chart,
       chartRef.current.instance,
       chartRef.current._chartApi?._chart,
       chartRef.current._chartApi?.chart,
       chartRef.current._chartApi?.instance
     ];

     for (const candidate of searchLocations) {
       if (candidate && (candidate.removeOverlay || candidate.removeAllOverlays)) {
         realChart = candidate;
         break;
       }
     }

     if (!realChart) {
       console.error('❌ Could not find real chart instance for clearing markers');
       return;
     }
     
     // Try KLineCharts overlay removal methods
     if (realChart.removeOverlay) {
       // Remove each stored marker by ID
       tradeMarkersRef.current.forEach((markers, tradeKey) => {
         markers.forEach((markerId: string) => {
           try {
             realChart.removeOverlay(markerId);
             console.log('✅ Removed overlay:', markerId);
           } catch (error) {
             console.warn('Failed to remove overlay:', markerId, error);
           }
         });
       });
     }
     
     // Try remove all overlays
     if (realChart.removeAllOverlays) {
       try {
         realChart.removeAllOverlays();
         console.log('✅ Removed all overlays');
       } catch (error) {
         console.warn('removeAllOverlays failed:', error);
       }
     }

    tradeMarkersRef.current.clear();
    console.log('✅ Trade markers cleared');
  }, []);

     /**
    * ACTUALLY focus chart on trade dates (not today's date)
    */
  const focusOnTrade = useCallback(async (trade: ProcessedTrade, padding: number = 900000) => {
    if (!chartRef.current) {
      console.error('❌ Chart not available for focusing');
      return;
    }

    const startTime = Math.min(trade.entryTime, trade.exitTime) - padding;
    const endTime = Math.max(trade.entryTime, trade.exitTime) + padding;

    console.log('🎯 ACTUALLY focusing on trade times:', {
      entryTime: new Date(trade.entryTime),
      exitTime: new Date(trade.exitTime), 
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      startTimeSeconds: Math.floor(startTime / 1000),
      endTimeSeconds: Math.floor(endTime / 1000)
    });

         try {
      let rangeSet = false;

             // FIND THE REAL CHART INSTANCE FOR TIME CONTROL
       let realChart = null;
       const searchLocations = [
         chartRef.current._chart,
         chartRef.current._instance, 
         chartRef.current._klineChart,
         chartRef.current.chart,
         chartRef.current.instance,
         chartRef.current._chartApi?._chart,
         chartRef.current._chartApi?.chart,
         chartRef.current._chartApi?.instance
       ];

       for (const candidate of searchLocations) {
         if (candidate && typeof candidate === 'object') {
           const methods = Object.keys(candidate).filter(k => typeof candidate[k] === 'function');
           const hasTimeMethod = methods.some(m => 
             m.toLowerCase().includes('visible') || 
             m.toLowerCase().includes('scroll') || 
             m.toLowerCase().includes('range')
           );
           if (hasTimeMethod) {
             realChart = candidate;
             console.log('✅ Found real chart for time control:', {
               constructor: candidate.constructor?.name,
               timeMethods: methods.filter(m => m.toLowerCase().includes('time') || m.toLowerCase().includes('range') || m.toLowerCase().includes('visible'))
             });
             break;
           }
         }
       }

       if (!realChart) {
         console.error('❌ Could not find real chart instance for time control');
         return;
       }

       console.log('📋 REAL CHART TIME CONTROL DEBUG:');
       
       // Get methods from the real chart instance
       const chartMethods = Object.keys(realChart).filter(key => typeof realChart[key] === 'function');
       
       const timeMethods = chartMethods.filter(method => 
         method.toLowerCase().includes('time') || 
         method.toLowerCase().includes('range') ||
         method.toLowerCase().includes('visible') ||
         method.toLowerCase().includes('scale') ||
         method.toLowerCase().includes('zoom') ||
         method.toLowerCase().includes('scroll') ||
         method.toLowerCase().includes('pan') ||
         method.toLowerCase().includes('move') ||
         method.toLowerCase().includes('goto') ||
         method.toLowerCase().includes('seek')
       );

       console.log('🕐 REAL CHART TIME METHODS (' + timeMethods.length + '):', timeMethods.sort());

       // Check for nested objects in the real chart
       const nestedTimeObjects = [];
       for (const key of Object.keys(realChart)) {
         if (typeof realChart[key] === 'object' && realChart[key] !== null) {
           const nestedMethods = Object.keys(realChart[key]).filter(nestedKey => 
             typeof realChart[key][nestedKey] === 'function' &&
             (nestedKey.toLowerCase().includes('time') || 
              nestedKey.toLowerCase().includes('range') ||
              nestedKey.toLowerCase().includes('visible') ||
              nestedKey.toLowerCase().includes('scale'))
           );
           if (nestedMethods.length > 0) {
             nestedTimeObjects.push({ object: key, methods: nestedMethods });
           }
         }
       }
       
       console.log('🔗 NESTED TIME OBJECTS:', nestedTimeObjects);

      // Try KLineCharts Pro specific methods for time range
      const klineTimeMethods = [
        'setVisibleRange',
        'setVisibleLogicalRange', 
        'setTimeScale',
        'scrollToTime',
        'scrollToBar',
        'scrollToRealTime',
        'zoomToTime',
        'setRange',
        'setViewport',
        'moveTo',
        'scrollTo',
        'centerTime',
        'focusTime',
        'gotoTime',
        'seekTime'
      ];

             console.log('🔄 Trying KLineCharts time methods...');
       for (const methodName of klineTimeMethods) {
         if (rangeSet) break;
         
         if (realChart[methodName] && typeof realChart[methodName] === 'function') {
          try {
            console.log(`🔹 Trying ${methodName}...`);
            
            // Try different parameter formats
            const formats = [
              { from: Math.floor(startTime / 1000), to: Math.floor(endTime / 1000) },
              { start: Math.floor(startTime / 1000), end: Math.floor(endTime / 1000) },
              [Math.floor(startTime / 1000), Math.floor(endTime / 1000)],
              Math.floor((startTime + endTime) / 2000), // Center time
              { timestamp: Math.floor((startTime + endTime) / 2000) }
            ];

            for (const format of formats) {
               try {
                 await realChart[methodName](format);
                 console.log(`✅ Successfully focused using ${methodName} with format:`, format);
                 rangeSet = true;
                 break;
               } catch (error) {
                 // Try next format
               }
             }
            
            if (rangeSet) break;
          } catch (error) {
            console.warn(`${methodName} failed:`, error);
          }
        }
      }

      // Try nested time objects
      if (!rangeSet) {
        console.log('🔄 Trying nested time objects...');
        for (const nested of nestedTimeObjects) {
          if (rangeSet) break;
          
          for (const method of nested.methods) {
             try {
               console.log(`🔹 Trying ${nested.object}.${method}...`);
               await realChart[nested.object][method]({
                 from: Math.floor(startTime / 1000),
                 to: Math.floor(endTime / 1000)
               });
               console.log(`✅ Successfully focused using ${nested.object}.${method}`);
               rangeSet = true;
               break;
             } catch (error) {
               console.warn(`${nested.object}.${method} failed:`, error);
             }
           }
        }
      }

      // Try chart.scrollTo or chart.moveTo patterns
      if (!rangeSet && realChart.chart) {
        try {
          console.log('🔹 Trying chart sub-object methods...');
          const chartObj = realChart.chart;
          const subChartMethods = Object.keys(chartObj).filter(key => typeof chartObj[key] === 'function');
          console.log('📊 Chart sub-object methods:', subChartMethods);
         
         for (const method of subChartMethods) {
           if (method.toLowerCase().includes('scroll') || method.toLowerCase().includes('move') || method.toLowerCase().includes('time')) {
             try {
               await chartObj[method](Math.floor((startTime + endTime) / 2000));
               console.log(`✅ Successfully focused using chart.${method}`);
               rangeSet = true;
               break;
             } catch (error) {
               // Continue trying
             }
           }
         }
        } catch (error) {
          console.warn('Chart sub-object access failed:', error);
        }
      }

      if (!rangeSet) {
        console.warn('❌ NO TIME RANGE METHOD WORKED!');
        console.log('💡 SUGGESTION: Chart might need to load data first, or time control might be different');
        console.log('📋 All chart methods:', chartMethods.sort());
        console.log('📊 Real chart type:', realChart.constructor?.name);
      }

    } catch (error) {
      console.error('❌ Failed to focus on trade:', error);
    }
  }, []);

  /**
   * Set chart symbol programmatically
   */
  const setSymbol = useCallback(async (newSymbol: string) => {
    if (!chartRef.current || !newSymbol) return;

    try {
      const baseSymbol = extractBaseSymbol(newSymbol);
      const displayName = getSymbolDisplayName(newSymbol);
      
      console.log('🔄 Switching chart symbol:', {
        originalSymbol: newSymbol,
        baseSymbol: baseSymbol,
        displayName: displayName
      });
      
      clearTradeMarkers();
      
      const newSymbolObj = {
        exchange: 'CME',
        market: 'FUTURES',
        name: displayName,
        shortName: baseSymbol,
        ticker: baseSymbol,
        type: 'FUT',
      };
     
      let symbolChanged = false;
      
      if (chartRef.current.changeSymbol && typeof chartRef.current.changeSymbol === 'function') {
        try {
          console.log('🔹 Using changeSymbol method...');
          await chartRef.current.changeSymbol(newSymbolObj);
          symbolChanged = true;
          console.log('✅ Symbol changed successfully using changeSymbol');
        } catch (error) {
          console.warn('changeSymbol method failed:', error);
        }
      }
      
      if (!symbolChanged && chartRef.current.setSymbol && typeof chartRef.current.setSymbol === 'function') {
        try {
          console.log('🔹 Using setSymbol method...');
          await chartRef.current.setSymbol(newSymbolObj);
          symbolChanged = true;
          console.log('✅ Symbol changed successfully using setSymbol');
        } catch (error) {
          console.warn('setSymbol method failed:', error);
        }
      }
      
      if (!symbolChanged) {
        console.warn('❌ No working symbol change method found');
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
     
     onSymbolChange?.(newSymbol);
     console.log('✅ Chart symbol switching completed for:', newSymbol);
     
   } catch (error) {
     console.error('❌ Failed to set symbol:', error);
   }
 }, [clearTradeMarkers, onSymbolChange]);

  /**
   * Get current symbol
   */
  const getSymbol = useCallback(() => {
    if (!chartRef.current) return '';
    
    try {
      if (typeof chartRef.current.symbol === 'function') {
        const result = chartRef.current.symbol();
        return result?.ticker || result || '';
      } else if (chartRef.current.symbol && typeof chartRef.current.symbol === 'object') {
        return chartRef.current.symbol.ticker || '';
      } else if (typeof chartRef.current.symbol === 'string') {
        return chartRef.current.symbol;
      }
      
      if (chartRef.current.getSymbol && typeof chartRef.current.getSymbol === 'function') {
        const result = chartRef.current.getSymbol();
        return result?.ticker || result || '';
      }
      
      return '';
    } catch (error) {
      console.warn('Failed to get current symbol:', error);
      return '';
    }
  }, []);

  /**
   * Set time range with optional padding
   */
  const setTimeRange = useCallback((from: number, to: number, padding: number = 0) => {
    if (!chartRef.current) return;

    try {
      chartRef.current.setVisibleRange?.({
        from: Math.floor((from - padding) / 1000),
        to: Math.floor((to + padding) / 1000)
      });
    } catch (error) {
      console.warn('Failed to set time range:', error);
    }
  }, []);

  /**
   * Get current time range
   */
  const getTimeRange = useCallback(() => {
    if (!chartRef.current) return { from: 0, to: 0 };
    
    try {
      const range = chartRef.current.getVisibleRange?.() || { from: 0, to: 0 };
      return {
        from: range.from * 1000,
        to: range.to * 1000
      };
    } catch (error) {
      console.warn('Failed to get time range:', error);
      return { from: 0, to: 0 };
    }
  }, []);

  /**
   * Set chart period/timeframe
   */
  const setPeriod = useCallback((period: string) => {
    if (!chartRef.current) return;

    const periodMap: Record<string, any> = {
      '1m': { multiplier: 1, timespan: 'minute', text: '1m' },
      '5m': { multiplier: 5, timespan: 'minute', text: '5m' },
      '15m': { multiplier: 15, timespan: 'minute', text: '15m' },
      '1h': { multiplier: 1, timespan: 'hour', text: '1h' },
      '4h': { multiplier: 4, timespan: 'hour', text: '4h' },
      '1d': { multiplier: 1, timespan: 'day', text: '1d' },
    };

    const periodConfig = periodMap[period];
    if (periodConfig && chartRef.current.setResolution) {
      try {
        chartRef.current.setResolution(periodConfig);
      } catch (error) {
        console.warn('Failed to set period:', error);
      }
    }
  }, []);

  /**
   * Get current period
   */
  const getPeriod = useCallback(() => {
    if (!chartRef.current) return '15m';
    
    try {
      const resolution = chartRef.current.resolution?.();
      return resolution?.text || '15m';
    } catch (error) {
      console.warn('Failed to get period:', error);
      return '15m';
    }
  }, []);

  /**
   * Get chart instance
   */
  const getChart = useCallback(() => {
    return chartRef.current;
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    setSymbol,
    getSymbol,
    setTimeRange,
    getTimeRange,
    setPeriod,
    getPeriod,
    addTradeMarkers,
    clearTradeMarkers,
    focusOnTrade,
    getChart
  }), [setSymbol, getSymbol, setTimeRange, getTimeRange, setPeriod, getPeriod, addTradeMarkers, clearTradeMarkers, focusOnTrade, getChart]);

  /**
   * Generate toolbar CSS based on style preference
   */
  const updateToolbarStyles = useCallback((style: typeof toolbarStyle) => {
    if (styleElementRef.current) {
      styleElementRef.current.remove();
      styleElementRef.current = null;
    }

    if (style === 'icons-only') {
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .klinecharts-pro .item.tools span {
          display: none !important;
        }
        .klinecharts-pro .item.tools {
          min-width: 36px !important;
          padding: 6px 8px !important;
          justify-content: center !important;
        }
      `;
      document.head.appendChild(styleElement);
      styleElementRef.current = styleElement;
    }
  }, []);

  /**
   * Update chart theme
   */
  const updateChartTheme = useCallback(() => {
    if (!chartRef.current) return;

    const klineTheme = getKLineChartTheme(dashboardTheme, chartTheme);
    const chartStyles = generateChartStyles(dashboardTheme, chartTheme);

    try {
      chartRef.current.setTheme?.(klineTheme);
      chartRef.current.setStyles?.(chartStyles);
    } catch (error) {
      console.warn('Failed to update chart theme:', error);
    }
  }, [dashboardTheme, chartTheme]);

  /**
   * Initialize chart instance
   */
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const initializeChart = async () => {
      try {
        if (!containerRef.current) return;

        const klineTheme = getKLineChartTheme(dashboardTheme, chartTheme);
        const chartStyles = generateChartStyles(dashboardTheme, chartTheme);
        
        const datafeed = new CustomFastAPIDatafeed(import.meta.env.VITE_FASTAPI_URL);
        
        let defaultSymbol;
        try {
          const symbols = await datafeed.searchSymbols();
          if (symbols.length > 0) {
            const esSymbol = symbols.find(s => s.ticker === 'ES');
            const selectedSymbol = esSymbol || symbols[0];
            
            defaultSymbol = {
              exchange: selectedSymbol.exchange || 'UNKNOWN',
              market: selectedSymbol.market || 'UNKNOWN',
              name: selectedSymbol.name || selectedSymbol.ticker,
              shortName: selectedSymbol.shortName || selectedSymbol.ticker,
              ticker: selectedSymbol.ticker,
              type: selectedSymbol.type || 'FUT',
            };
          } else {
            throw new Error('No symbols available');
          }
        } catch (error) {
          console.error('⚠️ Using fallback ES:', error);
          defaultSymbol = {
            exchange: 'CME',
            market: 'FUTURES',
            name: 'E-mini S&P 500',
            shortName: 'ES',
            ticker: 'ES',
            type: 'FUT',
          };
        }

        chartRef.current = new KLineChartPro({
          container: containerRef.current,
          locale: 'en-US',
          timezone: 'UTC',
          theme: klineTheme,
          styles: chartStyles,
          watermark: `<svg class="logo" viewBox="0 0 160 160"></svg>`,
          
          symbol: defaultSymbol,
          period: { multiplier: 15, timespan: 'minute', text: '15m' },
          periods: DEFAULT_PERIODS,
          
          mainIndicators: ['VWAP'],
          subIndicators: ['VOL'],
          datafeed: datafeed
        });
        
        setIsInitialized(true);
        console.log('📈 Enhanced chart initialized successfully with symbol:', defaultSymbol.ticker);
        
        if (onSymbolChange && defaultSymbol.ticker) {
          onSymbolChange(defaultSymbol.ticker);
        }
        
      } catch (error) {
        console.error('❌ Failed to initialize enhanced chart:', error);
      }
    };

    initializeChart();
    
    return () => {
      if (chartRef.current && containerRef.current) {
        try {
          clearTradeMarkers();
          chartRef.current = null;
          console.log('🧹 Enhanced chart cleaned up');
        } catch (error) {
          console.error('⚠️ Error during chart cleanup:', error);
        }
      }
    };
  }, []);

  // Update chart theme when theme changes
  useEffect(() => {
    updateChartTheme();
  }, [updateChartTheme]);

  // Update toolbar styles when style changes
  useEffect(() => {
    updateToolbarStyles(toolbarStyle);
    
    return () => {
      if (styleElementRef.current) {
        styleElementRef.current.remove();
        styleElementRef.current = null;
      }
    };
  }, [toolbarStyle, updateToolbarStyles]);

  // Handle trade markers updates
  useEffect(() => {
    if (!isInitialized || !trades.length) return;

    clearTradeMarkers();
    addTradeMarkers(trades);
  }, [isInitialized, trades, clearTradeMarkers, addTradeMarkers]);

  // Handle focused trade changes
  useEffect(() => {
    if (!isInitialized || !focusedTrade) return;

    console.log('🎯 Focused trade changed, focusing chart...');
    focusOnTrade(focusedTrade);
    onTradeFocus?.(focusedTrade);
  }, [isInitialized, focusedTrade, focusOnTrade, onTradeFocus]);

  // Handle time range changes
  useEffect(() => {
    if (!isInitialized || !timeRange) return;

    setTimeRange(timeRange.from, timeRange.to);
  }, [isInitialized, timeRange, setTimeRange]);

  return (
    <div 
      ref={containerRef}
      style={{ width, height }}
      className={className}
      data-chart-theme={getKLineChartTheme(dashboardTheme, chartTheme)}
      data-toolbar-style={toolbarStyle}
    />
  );
});

EnhancedChartComponent.displayName = 'EnhancedChartComponent';

export default EnhancedChartComponent; 