import React, { useState, FormEvent, ChangeEvent } from 'react'
import { strategyApi } from '../services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui'
import { Button } from './ui'
import { Input } from './ui'
import { Label } from './ui'
import { Alert, AlertDescription } from './ui'
import { AlertCircle } from 'lucide-react'

interface CreateStrategyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface FormData {
  name: string
  description: string
  is_public: boolean
  parameters: Record<string, unknown>
}

export default function CreateStrategyModal({ open, onOpenChange, onSuccess }: CreateStrategyModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    is_public: false,
    parameters: {}
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await strategyApi.create(formData)
      onSuccess()
      setFormData({
        name: '',
        description: '',
        is_public: false,
        parameters: {}
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = field === 'is_public' && 'checked' in e.target ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Strategy</DialogTitle>
          <DialogDescription>
            Create a reusable trading strategy template for your backtests.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="strategy-name">Strategy Name</Label>
            <Input
              id="strategy-name"
              placeholder="e.g., Moving Average Crossover"
              value={formData.name}
              onChange={handleInputChange('name')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Describe your strategy logic and parameters..."
              value={formData.description}
              onChange={handleInputChange('description')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="is-public"
              type="checkbox"
              checked={formData.is_public}
              onChange={handleInputChange('is_public')}
              className="h-4 w-4 rounded border border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <Label htmlFor="is-public" className="text-sm font-normal">
              Make this strategy public (others can see and use it)
            </Label>
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
              {loading ? 'Creating...' : 'Create Strategy'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}