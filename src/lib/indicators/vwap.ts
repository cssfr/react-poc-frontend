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
      type: 'line'
    }
  ],
  calc: (dataList: KLineData[], _indicator: any) => {
    // Add comprehensive error checking
    if (!dataList || !Array.isArray(dataList) || dataList.length === 0) {
      console.warn('VWAP calc: Invalid or empty dataList');
      return [];
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
    
    const result: VwapData[] = [];
    
    for (let i = 0; i < dataList.length; i++) {
      const kLineData = dataList[i];
      
      // Validate data item
      if (!kLineData || typeof kLineData.timestamp !== 'number') {
        result.push({ vwap: undefined });
        continue;
      }
      
      // Extract OHLCV data with validation
      const high = typeof kLineData.high === 'number' ? kLineData.high : 0;
      const low = typeof kLineData.low === 'number' ? kLineData.low : 0;
      const close = typeof kLineData.close === 'number' ? kLineData.close : 0;
      const volume = typeof kLineData.volume === 'number' ? kLineData.volume : 0;
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
      const vwapValue = cumulativeVolume > 0 ? cumulativePriceVolume / cumulativeVolume : undefined;
      
      result.push({
        vwap: vwapValue
      });
    }
    
    console.log('VWAP calc result length:', result.length, 'sample:', result.slice(0, 3));
    return result;
  }
};

export default vwap; 