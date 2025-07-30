import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, BarChart3, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '../ui';
import { Badge } from '../ui';
import { cn, formatCurrency, formatDateTime } from '../../lib/utils';
import { getSymbolDisplayName } from '../../lib/trading/symbolUtils';
import type { ProcessedTrade } from '../../types/trading';

interface TradesTableProps {
  trades: ProcessedTrade[];
  onTradeChartFocus?: (trade: ProcessedTrade) => void;
  focusedTrade?: ProcessedTrade | null;
  className?: string;
}

type SortField = 'symbol' | 'entryTime' | 'duration' | 'pnlValue' | 'quantity';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export default function TradesTable({ 
  trades, 
  onTradeChartFocus, 
  focusedTrade,
  className 
}: TradesTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'entryTime', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Parse duration to minutes for sorting
  const parseDurationToMinutes = (duration: string): number => {
    let minutes = 0;
    const hourMatch = duration.match(/(\d+)h/);
    const minMatch = duration.match(/(\d+)min/);
    const secMatch = duration.match(/(\d+)sec/);
    
    if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
    if (minMatch) minutes += parseInt(minMatch[1]);
    if (secMatch) minutes += parseInt(secMatch[1]) / 60;
    
    return minutes;
  };

  // Sorting
  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      const { field, direction } = sortConfig;
      let aValue: any = a[field];
      let bValue: any = b[field];

      // Handle duration sorting
      if (field === 'duration') {
        aValue = parseDurationToMinutes(a.duration);
        bValue = parseDurationToMinutes(b.duration);
      }

      // Handle sorting
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [trades, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTrades = sortedTrades.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
    setCurrentPage(1);
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      {sortConfig.field === field && (
        sortConfig.direction === 'desc' ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )
      )}
    </button>
  );

  const formatDuration = (duration: string) => {
    return duration.replace(/(\d+)h/, '$1h ')
                  .replace(/(\d+)min/, '$1m ')
                  .replace(/(\d+)sec/, '$1s');
  };

  if (trades.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">No trades uploaded</h3>
        <p className="text-muted-foreground">Upload a CSV file to view your trading results</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Trade Results ({sortedTrades.length} trades)
        </h3>
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="text-sm text-muted-foreground">
                <th className="text-left p-3 font-medium">
                  <SortButton field="symbol">Symbol</SortButton>
                </th>
                <th className="text-left p-3 font-medium">
                  <SortButton field="entryTime">Entry</SortButton>
                </th>
                <th className="text-left p-3 font-medium">Exit</th>
                <th className="text-right p-3 font-medium">Entry Price</th>
                <th className="text-right p-3 font-medium">Exit Price</th>
                <th className="text-right p-3 font-medium">
                  <SortButton field="quantity">Qty</SortButton>
                </th>
                <th className="text-right p-3 font-medium">
                  <SortButton field="pnlValue">P&L</SortButton>
                </th>
                <th className="text-left p-3 font-medium">
                  <SortButton field="duration">Duration</SortButton>
                </th>
                <th className="text-center p-3 font-medium">Chart</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.map((trade, index) => (
                <tr 
                  key={`${trade.symbol}-${trade.entryTime}-${index}`}
                  className={cn(
                    'border-b hover:bg-muted/50 transition-colors',
                    focusedTrade === trade && 'bg-primary/10'
                  )}
                >
                  {/* Symbol */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{trade.symbol}</span>
                        <span className="text-xs text-muted-foreground">{getSymbolDisplayName(trade.symbol)}</span>
                      </div>
                      <Badge 
                        variant={trade.direction === 'long' ? 'default' : 'secondary'}
                        className={cn(
                          'text-xs',
                          trade.direction === 'long' 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        )}
                      >
                        {trade.direction === 'long' ? (
                          <ArrowUpCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownCircle className="h-3 w-3 mr-1" />
                        )}
                        {trade.direction.toUpperCase()}
                      </Badge>
                    </div>
                  </td>

                  {/* Entry Time */}
                  <td className="p-3 text-sm">
                    <div className="text-foreground">
                      {formatDateTime(trade.boughtTimestamp).split(' ')[0]}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatDateTime(trade.boughtTimestamp).split(' ')[1]}
                    </div>
                  </td>

                  {/* Exit Time */}
                  <td className="p-3 text-sm">
                    <div className="text-foreground">
                      {formatDateTime(trade.soldTimestamp).split(' ')[0]}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatDateTime(trade.soldTimestamp).split(' ')[1]}
                    </div>
                  </td>

                  {/* Entry Price */}
                  <td className="p-3 text-right font-mono text-sm">
                    {formatCurrency(trade.entryPrice)}
                  </td>

                  {/* Exit Price */}
                  <td className="p-3 text-right font-mono text-sm">
                    {formatCurrency(trade.exitPrice)}
                  </td>

                  {/* Quantity */}
                  <td className="p-3 text-right font-mono text-sm">
                    {trade.quantity}
                  </td>

                  {/* P&L */}
                  <td className="p-3 text-right">
                    <span className={cn(
                      'font-medium',
                      trade.pnlValue > 0 
                        ? 'text-green-600' 
                        : trade.pnlValue < 0 
                          ? 'text-red-600' 
                          : 'text-muted-foreground'
                    )}>
                      {trade.pnl}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="p-3 text-sm text-muted-foreground">
                    {formatDuration(trade.duration)}
                  </td>

                  {/* Chart Button */}
                  <td className="p-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onTradeChartFocus?.(trade)}
                      className={cn(
                        'h-8 w-8 p-0',
                        focusedTrade === trade && 'bg-primary text-primary-foreground'
                      )}
                      title="Focus chart on this trade"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedTrades.length)} of {sortedTrades.length} trades
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 