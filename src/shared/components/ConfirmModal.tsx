import { useEffect } from 'react'
import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react'

export interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'warning' | 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !loading) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, loading, onCancel])

  if (!open) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-600" />,
          iconBg: 'bg-red-100',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          buttonText: 'text-white'
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-orange-600" />,
          iconBg: 'bg-orange-100',
          buttonBg: 'bg-orange-500 hover:bg-orange-600',
          buttonText: 'text-white'
        }
      default:
        return {
          icon: <Info className="w-6 h-6 text-[#6B4EFE]" />,
          iconBg: 'bg-[#F4F2FF]',
          buttonBg: 'bg-[#6B4EFE] hover:bg-[#5839F6]',
          buttonText: 'text-white'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <button
              onClick={onCancel}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {description}
          </p>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 ${styles.buttonBg} ${styles.buttonText}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  처리 중...
                </>
              ) : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
