import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value, currency = 'USD') {
  if (value == null) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercentage(value) {
  if (value == null) return '--'
  return `${(value * 100).toFixed(2)}%`
}

export function formatDate(dateString) {
  if (!dateString) return '--'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateString) {
  if (!dateString) return '--'
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusColor(status) {
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