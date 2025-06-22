import React, { useEffect, useRef } from 'react';
import { KLineChartPro } from '@klinecharts/pro';
import { dispose } from 'klinecharts';
import { CustomFastAPIDatafeed } from '../services/CustomFastAPIDatafeed';
import '@klinecharts/pro/dist/klinecharts-pro.css';

interface ChartComponentProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ 
  width = '100%', 
  height = '400px',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<KLineChartPro | null>(null);

  useEffect(() => {
    if (containerRef.current && !chartRef.current) {
      chartRef.current = new KLineChartPro({
        container: containerRef.current,
        locale: 'en-US',
        timezone: 'UTC',
        watermark: `<svg class="logo" viewBox="0 0 160 160"></svg>`,
        symbol: {
          exchange: 'CME',
          market: 'FUTURES',
          name: 'E-mini S&P 500',
          shortName: 'ES',
          ticker: 'ES',
          type: 'FUT',
        },
        period: { multiplier: 5, timespan: 'minute', text: '5m' },
        subIndicators: ['VOL'],
        datafeed: new CustomFastAPIDatafeed(
          import.meta.env.VITE_FASTAPI_URL
        )
      });
      console.log('Chart initialized');
    }
    
    return () => {
      if (chartRef.current && containerRef.current) {
        dispose(containerRef.current);
        chartRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ width, height }}
      className={className}
    />
  );
};

export default ChartComponent;