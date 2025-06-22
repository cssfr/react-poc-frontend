import React, { useState, FormEvent, ChangeEvent } from 'react'
import { backtestApi, Strategy } from '../services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui'
import { Button } from './ui'
import { Input } from './ui'
import { Label } from './ui'
import { Select, SelectItem } from './ui'
import { Alert, AlertDescription } from './ui'
import { AlertCircle } from 'lucide-react'

interface CreateBacktestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strategies: Strategy[]
  onSuccess: () => void
}

interface FormData {
  name: string
  strategy: string
  symbol: string
  start_date: string
  end_date: string
  initial_capital: string
}

export default function CreateBacktestModal({ open, onOpenChange, strategies, onSuccess }: CreateBacktestModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    strategy: '',
    symbol: '',
    start_date: '',
    end_date: '',
    initial_capital: '10000'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await backtestApi.create({
        ...formData,
        initial_capital: parseFloat(formData.initial_capital)
      })
      onSuccess()
      setFormData({
        name: '',
        strategy: '',
        symbol: '',
        start_date: '',
        end_date: '',
        initial_capital: '10000'
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'SPY', 'QQQ']
  const commonStrategies = ['Buy and Hold', 'Moving Average Crossover', 'RSI Mean Reversion', 'Momentum', 'Custom']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Backtest</DialogTitle>
          <DialogDescription>
            Set up a new backtest to analyze your trading strategy performance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Backtest Name</Label>
            <Input
              id="name"
              placeholder="e.g., Apple MA Strategy Q1 2024"
              value={formData.name}
              onChange={handleInputChange('name')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy">Strategy</Label>
            <Select
              value={formData.strategy}
              onValueChange={(value) => setFormData(prev => ({ ...prev, strategy: value }))}
              placeholder="Select a strategy"
            >
              {commonStrategies.map(strategy => (
                <SelectItem key={strategy} value={strategy}>
                  {strategy}
                </SelectItem>
              ))}
              {strategies.map(strategy => (
                <SelectItem key={strategy.id} value={strategy.name}>
                  {strategy.name} (Custom)
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            <div className="flex gap-2">
              <Input
                id="symbol"
                placeholder="e.g., AAPL"
                value={formData.symbol}
                onChange={handleInputChange('symbol')}
                className="flex-1"
                required
              />
              <Select
                value=""
                onValueChange={(value) => setFormData(prev => ({ ...prev, symbol: value }))}
                placeholder="Popular"
              >
                {popularSymbols.map(symbol => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange('start_date')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleInputChange('end_date')}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial_capital">Initial Capital ($)</Label>
            <Input
              id="initial_capital"
              type="number"
              min="1000"
              step="1000"
              placeholder="10000"
              value={formData.initial_capital}
              onChange={handleInputChange('initial_capital')}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Backtest'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}