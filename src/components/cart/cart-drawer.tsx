'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
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
  const { items, totalItems, totalPrice, updateQuantity, removeItem } =
    useCartStore()
  const { t } = useI18n()

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const prevOpenRef = useRef(open)
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      const timer = setTimeout(() => {
        setIsProcessing(false)
        setError(null)
      }, 400)
      return () => clearTimeout(timer)
    }
    prevOpenRef.current = open
  }, [open])

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

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ id, name, price, quantity, color }) => ({
            id,
            name,
            price,
            quantity,
            color,
          })),
          total: totalPrice,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao processar pagamento')
        setIsProcessing(false)
        return
      }

      const paymentUrl = data?.data?.shareable_url

      if (!paymentUrl) {
        setError('URL de pagamento não recebida da API')
        setIsProcessing(false)
        return
      }

      window.location.href = paymentUrl
    } catch {
      setError('Erro de rede. Verifique a ligação.')
      setIsProcessing(false)
    }
  }

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

  return (
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
              disabled={isProcessing}
              className="w-full py-4 rounded-xl text-base font-bold bg-[#c69a5c] hover:bg-[#b0864e] text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t('card.loadingPayment')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t('cart.checkout') || 'Finalizar Compra'}
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
  )
}
