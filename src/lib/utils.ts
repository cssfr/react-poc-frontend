import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: (string | undefined | false | null)[]): string {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined, currency: string = 'USD'): string {
  if (value == null) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercentage(value: number | null | undefined): string {
  if (value == null) return '--'
  return `${(value * 100).toFixed(2)}%`
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '--'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '--'
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusColor(status: string | null | undefined): string {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'text-success bg-success/10 border-success/20'
    case 'running':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    case 'failed':
      return 'text-destructive bg-destructive/10 border-destructive/20'
    case 'pending':
    default:
      return 'text-warning bg-warning/10 border-warning/20'
  }
}