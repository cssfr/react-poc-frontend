import { KLineData } from 'klinecharts';
import { Datafeed, SymbolInfo, Period, DatafeedSubscribeCallback } from '@klinecharts/pro';
import { supabase } from '../supabaseClient';
import { instrumentsApi } from './api';
import type { Instrument } from '../types/instruments';

const API_VERSION = '/api/v1';

interface CacheEntry {
    data: KLineData[];
    timestamp: number;
}

interface CacheConfig {
    maxEntries: number;
    expirationTime: number; // in milliseconds
    persist: boolean;
}

interface InstrumentsCacheEntry {
    instruments: Instrument[];
    timestamp: number;
}

/**
 * Custom Datafeed implementation for FastAPI backend with caching and Supabase auth
 */
export class CustomFastAPIDatafeed implements Datafeed {
    private readonly baseUrl: string;
    private cache: Map<string, CacheEntry> = new Map();
    private readonly cacheConfig: CacheConfig;
    
    // Instruments cache
    private instrumentsCache: InstrumentsCacheEntry | null = null;
    private readonly instrumentsCacheExpiry: number = 5 * 60 * 1000; // 5 minutes
    
    constructor(
        baseUrl: string, 
        config: Partial<CacheConfig> = {}
    ) {
        this.baseUrl = baseUrl;
        this.cacheConfig = {
            maxEntries: config.maxEntries || 100,
            expirationTime: config.expirationTime || 5 * 60 * 1000,
            persist: config.persist ?? false,
        };
        this.initializeCache();
    }

    private initializeCache(): void {
        if (!this.cacheConfig.persist) {
            this.cache = new Map();
            return;
        }
        // Try to load cache from localStorage
        try {
            const savedCache = localStorage.getItem('chartCache');
            if (savedCache) {
                const parsed = JSON.parse(savedCache);
                this.cache = new Map(parsed);
                // Clean expired entries on initialization
                this.cleanExpiredEntries();
            } else {
                this.cache = new Map();
            }
        } catch (error) {
            console.warn('Failed to load cache from localStorage:', error);
            this.cache = new Map();
        }
    }

    private saveToLocalStorage(): void {
        if (!this.cacheConfig.persist) {
            return;
        }
        try {
            localStorage.setItem('chartCache', JSON.stringify([...this.cache.entries()]));
        } catch (error) {
            console.warn('Failed to save cache to localStorage:', error);
        }
    }

    private cleanExpiredEntries(): void {
        const now = Date.now();
        let entriesRemoved = false;

        // Remove expired entries
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.cacheConfig.expirationTime) {
                this.cache.delete(key);
                entriesRemoved = true;
            }
        }

        // If we're still over the limit, remove oldest entries
        if (this.cache.size > this.cacheConfig.maxEntries) {
            const entries = [...this.cache.entries()]
                .sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const entriesToRemove = entries.slice(0, this.cache.size - this.cacheConfig.maxEntries);
            entriesToRemove.forEach(([key]) => this.cache.delete(key));
            entriesRemoved = true;
        }

        if (entriesRemoved) {
            this.saveToLocalStorage();
        }
    }

    private async getAuthToken(): Promise<string | null> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            return session?.access_token || null;
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }

    private async fetchWithAuth(url: string) {
        const token = await this.getAuthToken();
        
        if (!token) {
            throw new Error('No authentication token available');
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            // Token might be expired, try to refresh
            const { data: { session }, error } = await supabase.auth.refreshSession();
            if (error || !session) {
                throw new Error('Authentication failed - please log in again');
            }
            
            // Retry with new token
            const retryResponse = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!retryResponse.ok) {
                throw new Error(`HTTP error! status: ${retryResponse.status}`);
            }
            
            return await retryResponse.json();
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }

    async searchSymbols(search?: string): Promise<SymbolInfo[]> {
        try {
            const instruments = await this.getInstruments();
            
            if (instruments.length === 0) {
                // Fallback to hardcoded ES if no instruments available
                console.log('⚠️ No instruments available, using fallback ES');
                return [{
                    ticker: 'ES',
                    name: 'E-mini S&P 500',
                    shortName: 'ES',
                    exchange: 'CME',
                    market: 'FUTURES',
                    type: 'FUT'
                }];
            }

            // Convert all instruments to SymbolInfo format
            let symbolInfos = instruments.map(instrument => this.instrumentToSymbolInfo(instrument));

            // Apply search filter if provided
            if (search && search.trim()) {
                const searchLower = search.toLowerCase().trim();
                symbolInfos = symbolInfos.filter(symbol => 
                    symbol.ticker.toLowerCase().includes(searchLower) ||
                    (symbol.name || '').toLowerCase().includes(searchLower) ||
                    (symbol.shortName || '').toLowerCase().includes(searchLower)
                );
            }

            console.log(`📊 Returning ${symbolInfos.length} instruments for search: "${search || 'all'}"`);
            return symbolInfos;
            
        } catch (error) {
            console.error('❌ Error in searchSymbols:', error);
            
            // Ultimate fallback with all required properties
            return [{
                ticker: 'ES',
                name: 'E-mini S&P 500',
                shortName: 'ES',
                exchange: 'CME',
                market: 'FUTURES',
                type: 'FUT'
            }];
        }
    }

    /**
     * Clear the entire cache or specific entries
     * @param symbol Optional symbol to clear cache for specific symbol
     * @param period Optional period to clear cache for specific timeframe
     */
    public clearCache(symbol?: SymbolInfo, period?: Period): void {
        if (!symbol && !period) {
            this.cache.clear();
        } else {
            const prefix = symbol ? `${symbol.ticker}-` : '';
            const timeframe = period ? `${period.multiplier}${period.timespan}-` : '';
            
            for (const key of this.cache.keys()) {
                if (key.startsWith(prefix) && (!period || key.includes(timeframe))) {
                    this.cache.delete(key);
                }
            }
        }
        this.saveToLocalStorage();
    }

    /**
     * Convert period timespan to API timeframe code
     */
    private getTimeframeCode(multiplier: number, timespan: string): string {
        const timespanMap: { [key: string]: string } = {
            'minute': 'm',
            'hour': 'h', 
            'day': 'd',
            'week': 'w',
            'month': 'M',  // Capital M for month to distinguish from minute
            'year': 'Y'
        };
        
        const code = timespanMap[timespan];
        if (!code) {
            console.warn(`Unknown timespan: ${timespan}, defaulting to 'm'`);
            return `${multiplier}m`;
        }
        
        return `${multiplier}${code}`;
    }

    async getHistoryKLineData(symbol: SymbolInfo, period: Period, from: number, to: number): Promise<KLineData[]> {
        console.log('🔵 getHistoryKLineData called with symbol:', symbol.ticker, 'period:', `${period.multiplier}${period.timespan}`, 'from:', new Date(from), 'to:', new Date(to));
        
        // Clean expired entries before checking cache
        this.cleanExpiredEntries();

        // Create a cache key based on the request parameters
        const cacheKey = `${symbol.ticker}-${period.multiplier}${period.timespan}-${from}-${to}`;
        
        // Check if data exists in cache and is not expired
        const cachedEntry = this.cache.get(cacheKey);
        if (cachedEntry && (Date.now() - cachedEntry.timestamp <= this.cacheConfig.expirationTime)) {
            console.log('📦 Returning cached data for:', cacheKey);
            return cachedEntry.data;
        }

        // Fix klinecharts yearly timeframe calculation bug (minimal fix)
        let correctedFrom = from;
        let correctedTo = to;
        
        // Only fix obvious wrong dates for yearly timeframe
        if (period.timespan === 'year' && new Date(from).getFullYear() > new Date(to).getFullYear() + 10) {
            console.warn(`🚨 Detected wrong from date for yearly timeframe, correcting...`);
            correctedFrom = correctedTo - (20 * 365 * 24 * 60 * 60 * 1000); // 20 years back
            console.log(`🔧 Corrected yearly range: from=${new Date(correctedFrom)} to=${new Date(correctedTo)}`);
        }

        // If not in cache or expired, fetch from API
        const startDate = new Date(correctedFrom).toISOString().split('T')[0];
        const endDate = new Date(correctedTo).toISOString().split('T')[0];
        const timeframe = this.getTimeframeCode(period.multiplier, period.timespan);
        
        const url = `${this.baseUrl}${API_VERSION}/ohlcv/data?` + 
                   `symbol=${symbol.ticker}&start_date=${startDate}&end_date=${endDate}&` +
                   `timeframe=${timeframe}&source_resolution=1Y`;

        console.log('🌐 Fetching OHLCV data from API:', url);
        console.log('📊 Request details:', {
            symbol: symbol.ticker,
            period: `${period.multiplier}${period.timespan}`,
            startDate,
            endDate,
            timeframe
        });
        const response = await this.fetchWithAuth(url);
        
        // Handle different possible response structures
        let rawData: any[];
        if (Array.isArray(response)) {
            rawData = response;
        } else if (response.data && Array.isArray(response.data)) {
            rawData = response.data;
        } else if (response.results && Array.isArray(response.results)) {
            rawData = response.results;
        } else if (response.ohlcv && Array.isArray(response.ohlcv)) {
            rawData = response.ohlcv;
        } else if (response.values && Array.isArray(response.values)) {
            rawData = response.values;
        } else {
            console.error('Unexpected response structure:', response);
            throw new Error('Invalid data format received from API');
        }
        
        // Handle both old array format and new object format
        const data = rawData.map((item: any) => {
            if (Array.isArray(item)) {
                // Old format: [timestamp, open, high, low, close, volume]
                const [timestamp, open, high, low, close, volume] = item;
                return {
                    timestamp: timestamp * 1000,
                    open,
                    high,
                    low,
                    close,
                    volume
                };
            } else {
                // New v1 format: object with named properties
                return {
                    timestamp: (item.unix_time || item.timestamp) * 1000,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close,
                    volume: item.volume
                };
            }
        });

        // Store in cache with timestamp
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        // Save to localStorage after updating cache
        this.saveToLocalStorage();
        
        return data;
    }

    subscribe(_symbol: SymbolInfo, _period: Period, _callback: DatafeedSubscribeCallback): void {}
    unsubscribe(_symbol: SymbolInfo, _period: Period): void {}

    /**
     * Convert Instrument to SymbolInfo format required by KLineChartPro
     */
    private instrumentToSymbolInfo(instrument: Instrument): SymbolInfo {
        return {
            ticker: instrument.symbol,
            name: instrument.name || instrument.symbol, // Fallback to symbol if name is undefined
            shortName: instrument.shortName || instrument.symbol, // Fallback to symbol if shortName is undefined
            exchange: instrument.exchange || 'UNKNOWN', // Fallback if exchange is undefined
            market: instrument.market || 'UNKNOWN', // Fallback if market is undefined
            type: instrument.type || 'UNKNOWN', // Fallback if type is undefined
        };
    }

    /**
     * Get instruments from cache or API
     */
    private async getInstruments(): Promise<Instrument[]> {
        const now = Date.now();
        
        // Check if cache is valid
        if (this.instrumentsCache && 
            (now - this.instrumentsCache.timestamp) < this.instrumentsCacheExpiry) {
            console.log('📊 Returning cached instruments');
            return this.instrumentsCache.instruments;
        }

        try {
            console.log('📊 Fetching instruments from API');
            const response = await instrumentsApi.getAll();
            
            // Update cache
            this.instrumentsCache = {
                instruments: response.instruments,
                timestamp: now
            };
            
            return response.instruments;
        } catch (error) {
            console.error('❌ Failed to fetch instruments:', error);
            
            // Return cached data if available, even if expired
            if (this.instrumentsCache) {
                console.log('⚠️ Using expired cache due to API failure');
                return this.instrumentsCache.instruments;
            }
            
            // Ultimate fallback - return empty array
            return [];
        }
    }
}