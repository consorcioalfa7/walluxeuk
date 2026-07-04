'use client'

import { useEffect, useCallback, useState } from 'react'
import { Loader2, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaymentModalProps {
  url: string
  paymentKey: string
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({
  url,
  paymentKey,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleMessage = useCallback(
    (e: MessageEvent) => {
      if (e.data === 'XPAYMENTS_PAYMENT_SUCCESS') {
        setShowSuccess(true)
        onSuccess()
        setTimeout(() => {
          onClose()
        }, 2500)
      }
    },
    [onClose, onSuccess],
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // Block body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative z-10 w-full h-full sm:w-[95vw] sm:h-[90vh] sm:max-w-3xl sm:max-h-[85vh] sm:rounded-2xl overflow-hidden bg-white shadow-2xl flex flex-col">
        {/* Header bar */}
        {!showSuccess && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/80 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
              <span className="text-sm font-semibold text-zinc-700">
                Pagamento Seguro
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-zinc-200"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Iframe or Success screen */}
        {showSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="absolute -inset-2 rounded-full bg-emerald-100/50 animate-ping" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-zinc-900">
                Pagamento Confirmado!
              </h2>
              <p className="text-sm text-zinc-500 max-w-sm">
                Pagamento confirmado com sucesso! Irá receber os detalhes por
                email.
              </p>
            </div>
            <Button
              onClick={onClose}
              className="mt-4 px-8 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold"
            >
              Continuar a Comprar
            </Button>
          </div>
        ) : (
          <div className="relative flex-1">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                  <span className="text-sm text-zinc-400">
                    A carregar pagamento...
                  </span>
                </div>
              </div>
            )}
            <iframe
              key={paymentKey}
              src={url}
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
              title="XPayments Checkout"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            />
          </div>
        )}
      </div>
    </div>
  )
}
