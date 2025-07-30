import React, { useState, useCallback, useRef } from 'react';
import { Alert, AlertDescription } from '../ui';
import { AlertCircle } from 'lucide-react';
import EnhancedChartComponent from '../EnhancedChartComponent';
import TradeUpload from './TradeUpload';
import TradesTable from './TradesTable';
import type { ProcessedTrade } from '../../types/trading';
import type { ChartControlMethods } from '../../types/chart';

interface ResultsPageProps {
  className?: string;
}

export default function ResultsPage({ className }: ResultsPageProps) {
  const [trades, setTrades] = useState<ProcessedTrade[]>([]);
  const [focusedTrade, setFocusedTrade] = useState<ProcessedTrade | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSymbol, setCurrentSymbol] = useState<string>('ES'); // Start with default symbol
  
  // Chart control ref
  const chartRef = useRef<ChartControlMethods>(null);

  const handleTradesUploaded = useCallback((uploadedTrades: ProcessedTrade[]) => {
    try {
      setTrades(uploadedTrades);
      setFocusedTrade(null);
      setError(null);
      console.log(`✅ Successfully loaded ${uploadedTrades.length} trades`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process uploaded trades');
    }
  }, []);

  const handleTradeChartFocus = useCallback(async (trade: ProcessedTrade) => {
    try {
      setChartLoading(true);
      setError(null);
      
      console.log(`📊 Focusing chart on trade:`, {
        symbol: trade.symbol,
        currentSymbol: currentSymbol,
        entryTime: new Date(trade.entryTime),
        exitTime: new Date(trade.exitTime),
        direction: trade.direction,
        pnl: trade.pnl
      });

      if (!trade.symbol) {
        throw new Error('Trade symbol is missing');
      }
      
      // Switch to the trade's symbol if different
      if (currentSymbol !== trade.symbol) {
        console.log(`📊 Switching from ${currentSymbol} to ${trade.symbol}`);
        await chartRef.current?.setSymbol(trade.symbol);
        setCurrentSymbol(trade.symbol);
        
        // Wait a moment for the symbol change to take effect
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Focus on the trade with appropriate padding (15 minutes)
      chartRef.current?.focusOnTrade(trade, 900000);
      
      // Set as focused trade
      setFocusedTrade(trade);
      
      console.log('✅ Trade focus completed successfully');
      
    } catch (err) {
      console.error('❌ Failed to focus chart on trade:', err);
      setError(err instanceof Error ? err.message : 'Failed to focus chart on trade');
    } finally {
      setChartLoading(false);
    }
  }, [currentSymbol]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className={className}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trading Results</h2>
          <p className="text-muted-foreground">
            Upload and analyze your trading performance with interactive charts.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={clearError}
                className="text-sm underline hover:no-underline"
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Section */}
        {trades.length === 0 ? (
          <TradeUpload onTradesUploaded={handleTradesUploaded} />
        ) : (
          <div className="space-y-6">
            {/* Chart Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Chart Analysis</h3>
                {focusedTrade && (
                  <div className="text-sm text-muted-foreground">
                    Focused on {focusedTrade.symbol} - {focusedTrade.direction.toUpperCase()} - {focusedTrade.pnl}
                  </div>
                )}
              </div>
              
              <div className="rounded-lg border bg-card relative">
                {chartLoading && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                <EnhancedChartComponent 
                  ref={chartRef}
                  height="600px"
                  className="w-full"
                  toolbarStyle="icons-only"
                  theme="auto"
                  trades={trades}
                  focusedTrade={focusedTrade}
                  symbol={currentSymbol}
                  onSymbolChange={setCurrentSymbol}
                />
              </div>
            </div>

            {/* Upload New File Option */}
            <div className="border-t pt-4">
              <TradeUpload 
                onTradesUploaded={handleTradesUploaded}
                className="max-w-md"
              />
            </div>

            {/* Trades Table */}
            <TradesTable 
              trades={trades}
              onTradeChartFocus={handleTradeChartFocus}
              focusedTrade={focusedTrade}
            />
          </div>
        )}
      </div>
    </div>
  );
} 