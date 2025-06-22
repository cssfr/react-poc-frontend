import React, { useState, useEffect } from 'react'
import { backtestApi, tradeApi, Backtest, Trade } from '../services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui'
import { Button } from './ui'
import { Badge } from './ui'
import { Card, CardHeader, CardTitle, CardContent } from './ui'
import { Alert, AlertDescription } from './ui'
import { cn, formatCurrency, formatPercentage, formatDate, formatDateTime, getStatusColor } from '../lib/utils'
import {
  TrendingUp, TrendingDown, DollarSign, BarChart3, Activity,
  Calendar, Target, Trash2, AlertCircle, RefreshCw
} from 'lucide-react'

interface BacktestDetailsModalProps {
  backtest: Backtest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export default function BacktestDetailsModal({ backtest, open, onOpenChange, onUpdate }: BacktestDetailsModalProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (backtest && open) {
      loadTrades()
    }
  }, [backtest, open])

  const loadTrades = async () => {
    if (!backtest) return
    
    setLoading(true)
    try {
      const tradesData = await tradeApi.getByBacktestId(backtest.id)
      setTrades(tradesData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!backtest || !confirm('Are you sure you want to delete this backtest? This action cannot be undone.')) {
      return
    }

    setDeleteLoading(true)
    try {
      await backtestApi.delete(backtest.id)
      onUpdate()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!backtest) return null

  const isCompleted = backtest.status === 'completed'
  const isProfit = (backtest.total_return || 0) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{backtest.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={getStatusColor(backtest.status)}>
                  {backtest.status}
                </Badge>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{backtest.strategy}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{backtest.symbol}</span>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Performance Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Total Return</p>
                </div>
                <p className={cn(
                  'text-2xl font-bold',
                  isCompleted && isProfit ? 'text-success' : isCompleted ? 'text-destructive' : ''
                )}>
                  {isCompleted ? formatPercentage(backtest.total_return) : '--'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Max Drawdown</p>
                </div>
                <p className="text-2xl font-bold">
                  {isCompleted && backtest.max_drawdown 
                    ? formatPercentage(backtest.max_drawdown) 
                    : '--'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Sharpe Ratio</p>
                </div>
                <p className="text-2xl font-bold">
                  {isCompleted && backtest.sharpe_ratio 
                    ? backtest.sharpe_ratio.toFixed(2) 
                    : '--'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                </div>
                <p className="text-2xl font-bold">
                  {isCompleted && backtest.win_rate 
                    ? formatPercentage(backtest.win_rate)
                    : '--'
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Backtest Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Backtest Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Period</p>
                  <p className="font-medium">
                    {formatDate(backtest.start_date)} - {formatDate(backtest.end_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Initial Capital</p>
                  <p className="font-medium">{formatCurrency(backtest.initial_capital)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Final Value</p>
                  <p className="font-medium">
                    {isCompleted && backtest.final_value 
                      ? formatCurrency(backtest.final_value)
                      : '--'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Trades</p>
                  <p className="font-medium">{backtest.total_trades || 0}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Created</p>
                <p className="font-medium">{formatDateTime(backtest.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Trades History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Trade History ({trades.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadTrades}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : trades.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {trades.map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={trade.trade_type === 'buy' ? 'default' : 'secondary'}
                          className={cn(
                            trade.trade_type === 'buy' 
                              ? 'bg-success/10 text-success border-success/20' 
                              : 'bg-destructive/10 text-destructive border-destructive/20'
                          )}
                        >
                          {trade.trade_type.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-medium">{trade.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(trade.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {trade.quantity} @ {formatCurrency(trade.price)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total: {formatCurrency(trade.quantity * trade.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trades recorded for this backtest.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}