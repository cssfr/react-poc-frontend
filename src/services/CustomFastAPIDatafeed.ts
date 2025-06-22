import { KLineData } from 'klinecharts';
import { Datafeed, SymbolInfo, Period, DatafeedSubscribeCallback } from '@klinecharts/pro';
import { supabase } from '../supabaseClient';

interface CacheEntry {
    data: KLineData[];
    timestamp: number;
}

interface CacheConfig {
    maxEntries: number;
    expirationTime: number; // in milliseconds
    persist: boolean;
}

/**
 * Custom Datafeed implementation for FastAPI backend with caching and Supabase auth
 */
export class CustomFastAPIDatafeed implements Datafeed {
    private readonly baseUrl: string;
    private cache: Map<string, CacheEntry> = new Map();
    private readonly cacheConfig: CacheConfig;
    
    constructor(
        baseUrl: string, 
        config: Partial<CacheConfig> = {}
    ) {
        this.baseUrl = baseUrl;
        this.cacheConfig = {
            maxEntries: config.maxEntries || 100, // Default max cache entries
            expirationTime: config.expirationTime || 5 * 60 * 1000, // Default 5 minutes
            persist: config.persist ?? false, // Default to false, if true, cache will be saved to localStorage
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

    async searchSymbols(_search?: string): Promise<SymbolInfo[]> {
        // Static implementation - extend this if you need dynamic symbol search
        return [{
            ticker: 'ES',
            name: 'E-mini S&P 500',
            shortName: 'ES',
            exchange: 'CME',
            market: 'FUTURES'
        }];
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

    async getHistoryKLineData(symbol: SymbolInfo, period: Period, from: number, to: number): Promise<KLineData[]> {
        // Clean expired entries before checking cache
        this.cleanExpiredEntries();

        // Create a cache key based on the request parameters
        const cacheKey = `${symbol.ticker}-${period.multiplier}${period.timespan}-${from}-${to}`;
        
        // Check if data exists in cache and is not expired
        const cachedEntry = this.cache.get(cacheKey);
        if (cachedEntry && (Date.now() - cachedEntry.timestamp <= this.cacheConfig.expirationTime)) {
            console.log('Returning cached data for:', cacheKey);
            return cachedEntry.data;
        }

        // If not in cache or expired, fetch from API
        const startDate = new Date(from).toISOString().split('T')[0];
        const endDate = new Date(to).toISOString().split('T')[0];
        const timeframe = `${period.multiplier}${period.timespan.charAt(0)}`;
        
        const url = `${this.baseUrl}/api/ohlcv/data/${symbol.ticker}?` + 
                   `start_date=${startDate}&end_date=${endDate}&` +
                   `timeframe=${timeframe}&source_resolution=1Y`;

        console.log('Fetching data from:', url);
        const response = await this.fetchWithAuth(url);
        
        const data = response.data.map(([timestamp, open, high, low, close, volume]: number[]) => ({
            timestamp: timestamp * 1000,
            open,
            high,
            low,
            close,
            volume
        }));

        // Store in cache with timestamp
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        // Save to localStorage after updating cache
        this.saveToLocalStorage();
        
        return data;
    }

    // No-op implementations for real-time methods as they're not needed
    subscribe(_symbol: SymbolInfo, _period: Period, _callback: DatafeedSubscribeCallback): void {}
    unsubscribe(_symbol: SymbolInfo, _period: Period): void {}
}