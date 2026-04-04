import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number | string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'badge-success',
    APPROVED: 'badge-success',
    COMPLETED: 'badge-success',
    PENDING: 'badge-warning',
    PARTIAL: 'badge-warning',
    QUEUED: 'badge-info',
    ESCALATED: 'badge-danger',
    REJECTED: 'badge-danger',
    LAPSED: 'badge-danger',
    CANCELLED: 'badge-danger',
    FAILED: 'badge-danger',
  }
  return map[status] ?? 'badge-info'
}
