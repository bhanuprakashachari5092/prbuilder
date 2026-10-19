export type AdminTab =
  | 'overview'
  | 'users'
  | 'resumes'
  | 'portfolios'
  | 'analytics'
  | 'reports'
  | 'audit-logs'
  | 'settings'

export interface AdminConfirmationModalState {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  confirmVariant?: 'danger' | 'primary' | 'warning'
  onConfirm: () => Promise<void> | void
  isProcessing?: boolean
}
