/**
 * VWAP (Volume Weighted Average Price) Indicator
 * 
 * Calculates the volume-weighted average price, which resets daily.
 * Uses typical price (H+L+C)/3 weighted by volume.
 */

import type { KLineData } from 'klinecharts'

interface VwapData {
  vwap?: number
}

/**
 * VWAP Indicator Template
 */
const vwap = {
  name: 'VWAP',
  shortName: 'VWAP',
  series: 'price' as any,
  calcParams: [],
  precision: 2,
  shouldOhlc: false,
  shouldFormatBigNumber: false,
  visible: true,
  zLevel: 0,
  figures: [
    {
      key: 'vwap',
      title: 'VWAP: ',
      type: 'line',
      styles: () => ({
        color: '#FF6600'
      })
    }
  ],
  calc: (dataList: KLineData[]) => {
    if (!dataList || dataList.length === 0) {
      return {};
    }
    
    let cumulativePriceVolume = 0;
    let cumulativeVolume = 0;
    let currentDay: string | null = null;
    
    // Helper function to get day from timestamp
    function getDay(timestamp: number): string {
      const date = new Date(timestamp);
      return date.getUTCFullYear() + '-' + 
             String(date.getUTCMonth() + 1).padStart(2, '0') + '-' + 
             String(date.getUTCDate()).padStart(2, '0');
    }
    
    return dataList.reduce((prev: Record<number, VwapData>, kLineData: KLineData) => {
      // Extract OHLCV data
      const high = kLineData.high || 0;
      const low = kLineData.low || 0;
      const close = kLineData.close || 0;
      const volume = kLineData.volume || 0;
      const timestamp = kLineData.timestamp;
      
      // Calculate typical price
      const typicalPrice = (high + low + close) / 3;
      
      // Check if we're on a new day (reset VWAP calculation)
      const day = getDay(timestamp);
      if (currentDay !== day) {
        currentDay = day;
        cumulativePriceVolume = 0;
        cumulativeVolume = 0;
      }
      
      // Update cumulative values
      if (volume > 0) {
        cumulativePriceVolume += typicalPrice * volume;
        cumulativeVolume += volume;
      }
      
      // Calculate VWAP
      const vwapResult: VwapData = {};
      if (cumulativeVolume > 0) {
        vwapResult.vwap = cumulativePriceVolume / cumulativeVolume;
      }
      
      // Store result with timestamp as key
      prev[timestamp] = vwapResult;
      return prev;
    }, {});
  },
  
  createTooltipDataSource: (params: any) => {
    const { indicator, calculation } = params;
    
    return {
      name: indicator.shortName || indicator.name,
      calcParamsText: '',
      icons: [],
      values: [
        {
          title: 'VWAP: ',
          value: calculation.vwap ? calculation.vwap.toFixed(indicator.precision || 2) : '--'
        }
      ]
    };
  }
} as any;

export default vwap; 