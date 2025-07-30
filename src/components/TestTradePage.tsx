/**
 * Test Trade Page - For experimenting with trade markers
 */

import React, { useRef, useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from './ui';
import { KLineChartPro } from '@klinecharts/pro';
import { registerFigure, registerOverlay, init } from 'klinecharts';
import { CustomFastAPIDatafeed } from '../services/CustomFastAPIDatafeed';
import { useTheme } from '../lib/contexts/ThemeContext';
import { 
  generateChartStyles, 
  getKLineChartTheme 
} from '../lib/chartTheme';
import '@klinecharts/pro/dist/klinecharts-pro.css';

interface MockTrade {
  symbol: string;
  direction: 'long' | 'short';
  entryTime: number; // Unix timestamp in milliseconds
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
}

// Register custom triangle figures for trade markers
registerFigure({
  name: 'upTriangle',
  draw: (ctx, attrs, styles) => {
    const { x, y } = attrs;
    const size = 8;
    const { color } = styles;
    
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  },
  checkEventOn: (coordinate, attrs) => {
    const { x, y } = coordinate;
    const size = 8;
    return Math.abs(x - attrs.x) <= size && Math.abs(y - attrs.y) <= size;
  }
});

registerFigure({
  name: 'downTriangle', 
  draw: (ctx, attrs, styles) => {
    const { x, y } = attrs;
    const size = 8;
    const { color } = styles;
    
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.lineTo(x - size, y - size);
    ctx.lineTo(x + size, y - size);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  },
  checkEventOn: (coordinate, attrs) => {
    const { x, y } = coordinate;
    const size = 8;
    return Math.abs(x - attrs.x) <= size && Math.abs(y - attrs.y) <= size;
  }
});

// Register overlays for trade markers (following the reference exactly)
registerOverlay({
  name: 'longEntry',
  totalStep: 1,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length > 0) {
      return [{
        type: 'upTriangle',
        attrs: { x: coordinates[0].x, y: coordinates[0].y },
        styles: { color: '#10B981' }
      }];
    }
    return [];
  }
});

registerOverlay({
  name: 'longExit', 
  totalStep: 1,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length > 0) {
      return [{
        type: 'downTriangle',
        attrs: { x: coordinates[0].x, y: coordinates[0].y },
        styles: { color: '#EF4444' }
      }];
    }
    return [];
  }
});

registerOverlay({
  name: 'shortEntry',
  totalStep: 1,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length > 0) {
      return [{
        type: 'downTriangle', 
        attrs: { x: coordinates[0].x, y: coordinates[0].y },
        styles: { color: '#EF4444' }
      }];
    }
    return [];
  }
});

registerOverlay({
  name: 'shortExit',
  totalStep: 1,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length > 0) {
      return [{
        type: 'upTriangle',
        attrs: { x: coordinates[0].x, y: coordinates[0].y },
        styles: { color: '#10B981' }
      }];
    }
    return [];
  }
});

export default function TestTradePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const { theme: dashboardTheme } = useTheme();
  const [isChartReady, setIsChartReady] = useState(false);
  const [mockTrade, setMockTrade] = useState<MockTrade | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [markersVisible, setMarkersVisible] = useState(false);
  
     // Store overlay data for cleanup
   const markersDataRef = useRef<{
     entryOverlayId: string; exitOverlayId: string;
     chart: any; trade: MockTrade;
   } | null>(null);

  const log = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const initChart = async () => {
      try {
        log('🚀 Initializing test chart...');
        
        const klineTheme = getKLineChartTheme(dashboardTheme, 'dark');
        const chartStyles = generateChartStyles(dashboardTheme, 'dark');
        
        const datafeed = new CustomFastAPIDatafeed(import.meta.env.VITE_FASTAPI_URL);
        
        const esSymbol = {
          exchange: 'CME',
          market: 'FUTURES',
          name: 'E-mini S&P 500',
          shortName: 'ES',
          ticker: 'ES',
          type: 'FUT',
        };

        chartRef.current = new KLineChartPro({
          container: containerRef.current,
          locale: 'en-US',
          timezone: 'UTC',
          theme: klineTheme,
          styles: chartStyles,
          symbol: esSymbol,
          period: { multiplier: 15, timespan: 'minute', text: '15m' },
          periods: [
            { multiplier: 1, timespan: 'minute', text: '1m' },
            { multiplier: 5, timespan: 'minute', text: '5m' },
            { multiplier: 15, timespan: 'minute', text: '15m' },
            { multiplier: 1, timespan: 'hour', text: '1h' },
          ],
          mainIndicators: ['VWAP'],
          subIndicators: ['VOL'],
          datafeed: datafeed
        });
        
        setIsChartReady(true);
        log('✅ Chart initialized successfully');
        
                 // Create a mock trade based on recent data
         // Use a recent weekday (Thursday July 24, 2025) that has market data
         const tradeDate = new Date('2025-07-24'); // Thursday
         const entryTime = new Date(tradeDate);
         entryTime.setHours(10, 30, 0, 0); // 10:30 AM entry
         
         const exitTime = new Date(tradeDate);
         exitTime.setHours(14, 15, 0, 0); // 2:15 PM exit
         
         const trade: MockTrade = {
           symbol: 'ES',
           direction: 'long',
           entryTime: entryTime.getTime(),
           exitTime: exitTime.getTime(),
           entryPrice: 6350.25,
           exitPrice: 6375.50,
           pnl: 25.25
         };
        
        setMockTrade(trade);
        log(`📊 Mock trade created: ${trade.direction} ES ${trade.entryPrice} -> ${trade.exitPrice}`);
        
      } catch (error) {
        log(`❌ Chart initialization failed: ${error}`);
      }
    };

    initChart();
  }, [dashboardTheme]);

           // Function to explore chart instance and find coordinate conversion methods
    const exploreChart = () => {
      if (!chartRef.current) {
        log('❌ No chart instance available');
        return;
      }

      log('🔍 EXPLORING CHART COORDINATE SYSTEM:');
      log(`Chart constructor: ${chartRef.current.constructor?.name}`);
      
      // Search for coordinate conversion methods
      const coordinateMethods = [];
      const scaleMethods = [];
      const timeMethods = [];
      const priceMethods = [];

      // Deep search for coordinate-related methods
      const searchForCoordinateMethods = (obj: any, path: string = 'chartRef.current', maxDepth: number = 4) => {
        if (maxDepth <= 0 || !obj || typeof obj !== 'object') return;

        const methods = Object.getOwnPropertyNames(obj).filter(key => {
          try {
            return typeof obj[key] === 'function';
          } catch {
            return false;
          }
        });

        methods.forEach(method => {
          const lowerMethod = method.toLowerCase();
          if (lowerMethod.includes('coordinate') || lowerMethod.includes('convert') || 
              lowerMethod.includes('topixel') || lowerMethod.includes('toscreen')) {
            coordinateMethods.push(`${path}.${method}`);
          }
          if (lowerMethod.includes('scale') || lowerMethod.includes('axis')) {
            scaleMethods.push(`${path}.${method}`);
          }
          if (lowerMethod.includes('time') || lowerMethod.includes('timestamp') || 
              lowerMethod.includes('date') || lowerMethod.includes('getx')) {
            timeMethods.push(`${path}.${method}`);
          }
          if (lowerMethod.includes('price') || lowerMethod.includes('value') || 
              lowerMethod.includes('gety') || lowerMethod.includes('tovalue')) {
            priceMethods.push(`${path}.${method}`);
          }
        });

        // Search in nested objects
        Object.keys(obj).forEach(key => {
          if (key.startsWith('_') || key.includes('chart') || key.includes('Chart') || 
              key.includes('scale') || key.includes('axis') || key.includes('coordinate')) {
            try {
              searchForCoordinateMethods(obj[key], `${path}.${key}`, maxDepth - 1);
            } catch {
              // Ignore errors during nested search
            }
          }
        });
      };

      searchForCoordinateMethods(chartRef.current);

      log(`📐 COORDINATE METHODS (${coordinateMethods.length}): ${coordinateMethods.join(', ') || 'None found'}`);
      log(`📏 SCALE METHODS (${scaleMethods.length}): ${scaleMethods.join(', ') || 'None found'}`);
      log(`⏰ TIME METHODS (${timeMethods.length}): ${timeMethods.join(', ') || 'None found'}`);
      log(`💰 PRICE METHODS (${priceMethods.length}): ${priceMethods.join(', ') || 'None found'}`);

      // Try to access specific coordinate conversion paths
      const testPaths = [
        '_chartApi.convertToPixel',
        '_chartApi.timeToPixel', 
        '_chartApi.priceToPixel',
        '_chartApi.getCoordinate',
        '_chartApi._chart.timeScale',
        '_chartApi._chart.priceScale',
        '_container.querySelector("canvas").getContext("2d").measureText'
      ];

      log('🧪 TESTING COORDINATE CONVERSION PATHS:');
      testPaths.forEach(path => {
        try {
          const parts = path.split('.');
          let obj = chartRef.current;
          for (const part of parts) {
            if (obj && obj[part]) {
              obj = obj[part];
            } else {
              obj = null;
              break;
            }
          }
          if (obj && typeof obj === 'function') {
            log(`✅ Found: ${path}`);
          } else if (obj) {
            log(`🔍 Object at ${path}: ${typeof obj}`);
          } else {
            log(`❌ Not found: ${path}`);
          }
        } catch (e) {
          log(`❌ Error testing ${path}: ${e}`);
        }
      });

      // Check for event listeners
      log('🎧 CHECKING FOR EVENT SYSTEM:');
      const eventMethods = Object.getOwnPropertyNames(chartRef.current)
        .filter(key => {
          try {
            const lowerKey = key.toLowerCase();
            return typeof chartRef.current[key] === 'function' && 
                   (lowerKey.includes('addevent') || lowerKey.includes('on') || 
                    lowerKey.includes('listen') || lowerKey.includes('subscribe'));
          } catch {
            return false;
          }
        });
      log(`📡 EVENT METHODS: ${eventMethods.join(', ') || 'None found'}`);
    };



   const tryCreateMarkers = () => {
     if (!chartRef.current || !mockTrade) {
       log('Chart or trade not available');
       return;
     }
     
     const entryTimestamp = Math.floor(mockTrade.entryTime / 1000);
     const exitTimestamp = Math.floor(mockTrade.exitTime / 1000);
     
     // Use the same pattern from EnhancedChartComponent to find the real chart
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
       if (candidate && candidate.createOverlay) {
         realChart = candidate;
         log('Found real chart instance with createOverlay');
         break;
       }
     }

     if (!realChart) {
       log('Could not find real chart instance');
       return;
     }

     try {
       // Use simpleTag overlay (same as EnhancedChartComponent)
       const entryOverlayId = realChart.createOverlay({
         name: 'simpleTag',
         points: [{ 
           timestamp: entryTimestamp, 
           value: mockTrade.entryPrice 
         }],
         styles: {
           text: {
             content: `${mockTrade.direction.toUpperCase()} ENTRY`,
             color: mockTrade.direction === 'long' ? '#10B981' : '#EF4444'
           }
         }
       });

       const exitOverlayId = realChart.createOverlay({
         name: 'simpleTag',
         points: [{ 
           timestamp: exitTimestamp, 
           value: mockTrade.exitPrice 
         }],
         styles: {
           text: {
             content: `${mockTrade.direction.toUpperCase()} EXIT`,
             color: mockTrade.direction === 'long' ? '#EF4444' : '#10B981'
           }
         }
       });

       if (entryOverlayId && exitOverlayId) {
         markersDataRef.current = { entryOverlayId, exitOverlayId, chart: realChart, trade: mockTrade };
         setMarkersVisible(true);
         log('Created simpleTag overlays successfully');
       } else {
         log('Overlay creation returned null');
       }
     } catch (error) {
       log(`Overlay creation failed: ${error}`);
     }
   };

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      <div className="flex-none">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Test Trade Markers</CardTitle>
          </CardHeader>
          <CardContent>
                         <div className="flex gap-2 mb-4">
               <Button onClick={exploreChart} disabled={!isChartReady}>
                 🔍 Explore Chart
               </Button>
               <Button onClick={tryCreateMarkers} disabled={!isChartReady || !mockTrade}>
                 🎯 Create Markers
               </Button>
                                                               <Button 
                   onClick={() => {
                     // Remove overlays using stored chart instance and overlay IDs
                     if (markersDataRef.current) {
                       const data = markersDataRef.current;
                       
                       try {
                         if (data.chart && data.entryOverlayId) {
                           log('🧹 Removing entry overlay...');
                           data.chart.removeOverlay(data.entryOverlayId);
                         }
                         
                         if (data.chart && data.exitOverlayId) {
                           log('🧹 Removing exit overlay...');
                           data.chart.removeOverlay(data.exitOverlayId);
                         }
                         
                         log('🧹 Overlays removed successfully');
                       } catch (error) {
                         log(`❌ Error removing overlays: ${error}`);
                       }
                     } else {
                       log('❌ No overlay data to clear');
                     }
                     
                     setMarkersVisible(false);
                     markersDataRef.current = null;
                     log('🧹 Markers cleared');
                   }} 
                  disabled={!markersVisible}
                  variant="outline"
                >
                 🧹 Clear Markers
               </Button>
             </div>
             
             {markersVisible && (
               <div className="text-sm mb-2 p-2 bg-green-100 dark:bg-green-900 rounded">
                 <strong>✅ Markers Active:</strong> Trade markers visible with persistence enabled
               </div>
             )}
            
            {mockTrade && (
              <div className="text-sm space-y-1 bg-gray-100 dark:bg-gray-800 p-3 rounded">
                <div><strong>Mock Trade:</strong> {mockTrade.direction.toUpperCase()} {mockTrade.symbol}</div>
                <div><strong>Entry:</strong> {new Date(mockTrade.entryTime).toLocaleString()} @ {mockTrade.entryPrice}</div>
                <div><strong>Exit:</strong> {new Date(mockTrade.exitTime).toLocaleString()} @ {mockTrade.exitPrice}</div>
                <div><strong>P&L:</strong> ${mockTrade.pnl}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>📈 ES Chart</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <div 
                ref={containerRef}
                style={{ width: '100%', height: '100%' }}
                className="border rounded"
              />
            </CardContent>
          </Card>
        </div>

        {/* Debug Logs */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>📝 Debug Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1 max-h-80 overflow-y-auto font-mono">
                {logs.map((log, index) => (
                  <div key={index} className="break-words">
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 