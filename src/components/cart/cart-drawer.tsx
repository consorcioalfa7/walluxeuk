'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Truck,
  Lock,
  Loader2,
  Package,
  Check,
  Shield,
  X,
  CheckCircle2,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCartStore, type CartItem } from '@/lib/store/cart-store'
import { useI18n } from '@/lib/i18n/context'

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FREE_SHIPPING_THRESHOLD = 10

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } =
    useCartStore()
  const { t } = useI18n()

  const [isProcessing, setIsProcessing] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Checkout overlay state
  const [checkoutIframeUrl, setCheckoutIframeUrl] = useState<string | null>(null)
  const [iframeLoading, setIframeLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Close the checkout overlay and reset states
  const closeCheckoutOverlay = useCallback(() => {
    setCheckoutIframeUrl(null)
    setIframeLoading(false)
    setShowSuccess(false)
    setIsCheckingOut(false)
    setIsProcessing(false)
    setError(null)
  }, [])

  const prevOpenRef = useRef(open)
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      const timer = setTimeout(() => {
        setIsProcessing(false)
        setIsCheckingOut(false)
        setError(null)
      }, 400)
      return () => clearTimeout(timer)
    }
    prevOpenRef.current = open
  }, [open])

  // Block body scroll when overlay is open
  useEffect(() => {
    if (checkoutIframeUrl) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [checkoutIframeUrl])

  // XPAYMENTS_STATUS postMessage listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'XPAYMENTS_STATUS') {
        if (event.data.status === 'SUCCESS') {
          // Payment confirmed — clear cart and show success
          clearCart()
          setShowSuccess(true)
          // Auto-close after 2.5s
          setTimeout(closeCheckoutOverlay, 2500)
        } else if (event.data.status === 'CLOSED') {
          // Customer abandoned/closed
          closeCheckoutOverlay()
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [clearCart, closeCheckoutOverlay])

  const shippingProgress = useMemo(() => {
    if (totalPrice >= FREE_SHIPPING_THRESHOLD) return 100
    return Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100)
  }, [totalPrice])

  const remainingForFreeShipping = useMemo(() => {
    if (totalPrice >= FREE_SHIPPING_THRESHOLD) return 0
    return FREE_SHIPPING_THRESHOLD - totalPrice
  }, [totalPrice])

  const hasFreeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD

  const handleCheckout = async () => {
    if (items.length === 0) return

    setIsCheckingOut(true)
    setError(null)

    try {
      const currentOrderId = `WLX-${Date.now().toString(36).toUpperCase()}`

      const response = await fetch('/api/checkout/xpayments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: totalPrice,
          orderId: currentOrderId,
          email: 'guest@walluxe.com',
        }),
      })

      const data = await response.json()

      if (data.success && data.checkoutUrl) {
        // Inject theme=light parameter into the checkout URL
        const overlayUrl = new URL(data.checkoutUrl)
        overlayUrl.searchParams.append('theme', 'light')

        // Close cart sheet and open overlay
        onOpenChange(false)
        setIframeLoading(true)
        setCheckoutIframeUrl(overlayUrl.toString())
      } else {
        setError(data.error || 'Ocorreu um erro ao gerar o pagamento.')
        setIsCheckingOut(false)
      }
    } catch {
      setError('Erro de ligação ao servidor.')
      setIsCheckingOut(false)
    }
  }

  // ─── Empty Cart ─────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
          <SheetHeader className="p-5 pb-0">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900">
              <ShoppingCart className="h-5 w-5" />
              {t('cart.title')}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <div className="h-20 w-20 rounded-full bg-stone-100 flex items-center justify-center">
              <Package className="h-8 w-8 text-zinc-400" />
            </div>
            <p className="text-base font-semibold text-zinc-900">{t('cart.empty')}</p>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="mt-2 rounded-lg px-6"
            >
              {t('cart.continueShopping')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // ─── Cart with Items ────────────────────────────────────────
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">

          <SheetHeader className="flex-shrink-0 p-5 pb-3">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900">
              <ShoppingCart className="h-5 w-5" />
              {t('cart.title')}
              {totalItems > 0 && (
                <span className="text-sm font-medium text-zinc-400">({totalItems})</span>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-shrink-0 px-5 pb-3">
            <div className="rounded-lg bg-stone-50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 flex-shrink-0 text-[#c69a5c]" />
                {hasFreeShipping ? (
                  <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    {t('cart.freeShippingQualified')}
                  </span>
                ) : (
                  <span className="text-sm text-zinc-600">
                    {t('cart.freeShippingAway', {
                      amount: remainingForFreeShipping.toFixed(2),
                    })}
                  </span>
                )}
              </div>
              <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    hasFreeShipping ? 'bg-emerald-500' : 'bg-[#c69a5c]'
                  }`}
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-5 py-4 space-y-3">
              {items.map((item: CartItem) => (
                <div
                  key={`${item.id}-${item.color}`}
                  className="flex gap-3 rounded-xl border border-zinc-100 bg-white p-3"
                >
                  <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">{item.color}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.color)}
                        className="flex-shrink-0 p-1 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.color, item.quantity - 1)
                          }
                          className="px-2 py-1 hover:bg-stone-50 transition-colors"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3 text-zinc-500" />
                        </button>
                        <span className="px-2.5 py-1 text-xs font-semibold text-zinc-900 tabular-nums min-w-[1.5rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.color, item.quantity + 1)
                          }
                          className="px-2 py-1 hover:bg-stone-50 transition-colors"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3 text-zinc-500" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-zinc-900 tabular-nums">
                        €{(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-zinc-100 bg-white safe-bottom">
            <div className="px-5 pt-4 pb-2 space-y-3">

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-600">{t('cart.total')}</span>
                <span className="text-xl font-extrabold text-zinc-900 tabular-nums">
                  €{totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {hasFreeShipping && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                  <span>{t('cart.freeShippingQualified')}</span>
                </div>
              )}

              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  handleCheckout()
                }}
                disabled={isCheckingOut}
                className="w-full py-4 rounded-xl text-base font-bold bg-[#D4AF37] hover:bg-[#b5952f] text-black shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    A preparar pagamento...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t('cart.checkout') || 'Finalizar Compra Segura'}
                  </span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 pt-1">
                <Shield className="h-3 w-3 text-zinc-400" />
                <Lock className="h-3 w-3 text-zinc-400" />
                <span className="text-[10px] font-medium text-zinc-400">
                  {t('card.paymentPoweredBy')}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 pb-3">
                <span className="text-[10px] font-bold text-zinc-500 bg-stone-100 px-2 py-1 rounded">
                  VISA
                </span>
                <span className="text-[10px] font-bold text-zinc-500 bg-stone-100 px-2 py-1 rounded">
                  MC
                </span>
                <span className="text-[10px] font-bold text-zinc-500 bg-stone-100 px-2 py-1 rounded">
                  MBWay
                </span>
                <span className="text-[10px] font-bold text-zinc-500 bg-stone-100 px-2 py-1 rounded">
                  Multibanco
                </span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Checkout Overlay (Iframe Modal) ─────────────────── */}
      {checkoutIframeUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeCheckoutOverlay}
            aria-label="Fechar pagamento"
          />

          {/* Modal container */}
          <div className="relative z-10 w-full max-w-2xl h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header bar */}
            {!showSuccess && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/80 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#D4AF37]" />
                  <span className="text-sm font-semibold text-zinc-700">
                    Pagamento Seguro
                  </span>
                </div>
                <button
                  onClick={closeCheckoutOverlay}
                  className="p-1.5 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Success screen */}
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
                  onClick={closeCheckoutOverlay}
                  className="mt-4 px-8 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold"
                >
                  Continuar a Comprar
                </Button>
              </div>
            ) : (
              /* Iframe with XPayments checkout (light theme) */
              <div className="relative flex-1">
                {iframeLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                      <span className="text-sm text-zinc-400">
                        A carregar pagamento seguro...
                      </span>
                    </div>
                  </div>
                )}
                <iframe
                  key={checkoutIframeUrl}
                  src={checkoutIframeUrl}
                  className="w-full h-full border-0"
                  onLoad={() => setIframeLoading(false)}
                  title="XPayments Checkout"
                  allow="payment"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}