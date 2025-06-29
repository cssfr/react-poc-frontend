/**
 * Instrument and API response types for multi-instrument support
 * Matches the backend /api/v1/ohlcv/instruments endpoint response
 */

export interface Instrument {
  symbol: string;
  exchange: string;
  market: string;
  name: string;
  shortName: string;
  ticker: string;
  type: string;
  currency: string;
  description: string;
  sector: string;
  country: string;
  dataRange: {
    earliest: string;
    latest: string;
    sources: Record<string, {
      earliest: string;
      latest: string;
    }>;
  };
}

export interface InstrumentsResponse {
  count: number;
  instruments: Instrument[];
  lastUpdated: string;
} 