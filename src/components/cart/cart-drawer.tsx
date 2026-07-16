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
  ArrowLeft,
  Copy,
  CheckCircle2,
  Phone,
  Clock,
  User,
  Mail,
  MapPin,
  Globe,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { useCartStore, type CartItem } from '@/lib/store/cart-store'
import { useI18n } from '@/lib/i18n/context'

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FREE_SHIPPING_THRESHOLD = 10

// European country list for address
const COUNTRIES = [
  { value: 'PT', label: 'Portugal' },
  { value: 'ES', label: 'España' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Deutschland' },
  { value: 'IT', label: 'Italia' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'NL', label: 'Nederland' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Schweiz' },
  { value: 'AT', label: 'Österreich' },
  { value: 'IE', label: 'Ireland' },
  { value: 'LU', label: 'Luxembourg' },
]

type CheckoutStep = 'cart' | 'checkout' | 'result'
type PaymentMethod = 'mb_way' | 'multibanco'
type PaymentResult = {
  method: PaymentMethod
  action: {
    message?: string
    entidade?: string
    referencia?: string
    montante?: string
  }
  orderId: string
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } =
    useCartStore()
  const { t } = useI18n()

  // Steps
  const [step, setStep] = useState<CheckoutStep>('cart')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [country, setCountry] = useState('PT')

  // Payment
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Reset on close
  const prevOpenRef = useRef(open)
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      const timer = setTimeout(() => {
        setStep('cart')
        setIsProcessing(false)
        setError(null)
        setSelectedMethod(null)
        setPaymentResult(null)
        setCopiedField(null)
      }, 400)
      return () => clearTimeout(timer)
    }
    prevOpenRef.current = open
  }, [open])

  // ─── Derived values ─────────────────────────────────────
  const shippingProgress = useMemo(() => {
    if (totalPrice >= FREE_SHIPPING_THRESHOLD) return 100
    return Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100)
  }, [totalPrice])

  const remainingForFreeShipping = useMemo(() => {
    if (totalPrice >= FREE_SHIPPING_THRESHOLD) return 0
    return FREE_SHIPPING_THRESHOLD - totalPrice
  }, [totalPrice])

  const hasFreeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD

  const goToCart = useCallback(() => {
    setStep('cart')
    setError(null)
    setPaymentResult(null)
    setSelectedMethod(null)
  }, [])

  const goToCheckout = useCallback(() => {
    setStep('checkout')
    setError(null)
  }, [])

  const closeAll = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // ─── Form validation ────────────────────────────────────
  const validateForm = (): boolean => {
    if (!customerName.trim()) { setError('Insira o seu nome.') ; return false }
    if (!customerEmail.trim() || !customerEmail.includes('@')) { setError('Insira um email válido.') ; return false }
    if (!customerPhone.trim() || customerPhone.length < 9) { setError('Insira um número de telefone válido.') ; return false }
    if (!address.trim()) { setError('Insira a morada de entrega.') ; return false }
    if (!city.trim()) { setError('Insira a cidade.') ; return false }
    if (!zipCode.trim()) { setError('Insira o código postal.') ; return false }
    if (!selectedMethod) { setError('Selecione um método de pagamento.') ; return false }
    setError(null)
    return true
  }

  // ─── Copy to clipboard ──────────────────────────────────
  const copyToClipboard = useCallback((value: string, field: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }, [])

  // ─── Process payment ────────────────────────────────────
  const handlePay = async () => {
    if (!validateForm()) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          paymentMethod: selectedMethod,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.startsWith('+') ? customerPhone.trim() : `+351${customerPhone.replace(/\s/g, '')}`,
          address: address.trim(),
          city: city.trim(),
          zipCode: zipCode.trim(),
          country,
          items: items.map(({ id, name, price, quantity, color }) => ({
            id, name, price, quantity, color,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Erro ao iniciar pagamento.')
        setIsProcessing(false)
        return
      }

      setPaymentResult({
        method: data.method,
        action: data.action,
        orderId: data.orderId,
      })
      setStep('result')
      setIsProcessing(false)
    } catch {
      setError('Erro de ligação ao servidor.')
      setIsProcessing(false)
    }
  }

  // ─── Shipping progress bar (inline, not a component) ──
  const shippingBar = (
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
  )

  // ─── Empty cart ─────────────────────────────────────────
  if (items.length === 0 && step === 'cart') {
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
            <Button onClick={closeAll} variant="outline" className="mt-2 rounded-lg px-6">
              {t('cart.continueShopping')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // ─── STEP: CART REVIEW ──────────────────────────────────
  if (step === 'cart') {
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

          {shippingBar}
          <Separator />

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-5 py-4 space-y-3">
              {items.map((item: CartItem) => (
                <div key={`${item.id}-${item.color}`} className="flex gap-3 rounded-xl border border-zinc-100 bg-white p-3">
                  <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{item.name}</p>
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
                        <button onClick={() => updateQuantity(item.id, item.color, item.quantity - 1)} className="px-2 py-1 hover:bg-stone-50 transition-colors" aria-label="Decrease">
                          <Minus className="h-3 w-3 text-zinc-500" />
                        </button>
                        <span className="px-2.5 py-1 text-xs font-semibold text-zinc-900 tabular-nums min-w-[1.5rem] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.color, item.quantity + 1)} className="px-2 py-1 hover:bg-stone-50 transition-colors" aria-label="Increase">
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
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-600">{t('cart.total')}</span>
                <span className="text-xl font-extrabold text-zinc-900 tabular-nums">
                  €{totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <Button
                type="button"
                onClick={goToCheckout}
                className="w-full py-4 rounded-xl text-base font-bold bg-[#D4AF37] hover:bg-[#b5952f] text-black shadow-lg transition-all active:scale-[0.98]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  Finalizar Compra
                </span>
              </Button>
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <Shield className="h-3 w-3 text-zinc-400" />
                <Lock className="h-3 w-3 text-zinc-400" />
                <span className="text-[10px] font-medium text-zinc-400">Pagamento seguro</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // ─── STEP: CHECKOUT FORM ────────────────────────────────
  if (step === 'checkout') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 gap-0">
          {/* Header */}
          <div className="flex-shrink-0 p-5 pb-3">
            <button
              onClick={goToCart}
              className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao carrinho
            </button>
            <SheetTitle className="text-lg font-bold text-zinc-900">Dados de Envio & Pagamento</SheetTitle>
          </div>

          <Separator />

          {/* Scrollable content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-5 py-4 space-y-5">

              {/* Order summary */}
              <div className="rounded-xl bg-stone-50 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Resumo</p>
                {items.map((item: CartItem) => (
                  <div key={`${item.id}-${item.color}`} className="flex justify-between text-sm">
                    <span className="text-zinc-600 truncate mr-2">{item.quantity}x {item.name}</span>
                    <span className="text-zinc-900 font-semibold tabular-nums">
                      €{(item.price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-stone-200">
                  <span className="text-sm font-bold text-zinc-900">Total</span>
                  <span className="text-lg font-extrabold text-zinc-900 tabular-nums">
                    €{totalPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Customer info */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Dados Pessoais</p>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Nome completo"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Telefone (ex: 912345678)"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Morada de Entrega</p>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Morada (Rua, Nº, Andar)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Cidade"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <Input
                    placeholder="Código Postal"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment method */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Método de Pagamento</p>

                <div className="grid grid-cols-2 gap-3">
                  {/* MB WAY card */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('mb_way')}
                    className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedMethod === 'mb_way'
                        ? 'border-[#D4AF37] bg-amber-50/60 shadow-md'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
                    }`}
                  >
                    {selectedMethod === 'mb_way' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-4 w-4 text-[#D4AF37]" />
                      </div>
                    )}
                    <img
                      src="/images/logo_mbway.png"
                      alt="MB WAY"
                      className="h-7 object-contain"
                    />
                    <span className="text-xs font-semibold text-zinc-700">MB WAY</span>
                  </button>

                  {/* Multibanco card */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('multibanco')}
                    className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedMethod === 'multibanco'
                        ? 'border-[#D4AF37] bg-amber-50/60 shadow-md'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
                    }`}
                  >
                    {selectedMethod === 'multibanco' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-4 w-4 text-[#D4AF37]" />
                      </div>
                    )}
                    <img
                      src="/images/logo_multibanco.png"
                      alt="Multibanco"
                      className="h-7 object-contain"
                    />
                    <span className="text-xs font-semibold text-zinc-700">Multibanco</span>
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</div>
              )}
            </div>
          </div>

          {/* Pay button */}
          <div className="flex-shrink-0 border-t border-zinc-100 bg-white safe-bottom">
            <div className="px-5 pt-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-600">Total a pagar</span>
                <span className="text-xl font-extrabold text-zinc-900 tabular-nums">
                  €{totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <Button
                type="button"
                onClick={handlePay}
                disabled={isProcessing || !selectedMethod}
                className="w-full py-4 rounded-xl text-base font-bold bg-[#D4AF37] hover:bg-[#b5952f] text-black shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    A processar pagamento...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    Pagar Agora
                  </span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5">
                <Shield className="h-3 w-3 text-zinc-400" />
                <Lock className="h-3 w-3 text-zinc-400" />
                <span className="text-[10px] font-medium text-zinc-400">Pagamento 100% seguro e encriptado</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // ─── STEP: PAYMENT RESULT ───────────────────────────────
  if (step === 'result' && paymentResult) {
    const isMbWay = paymentResult.method === 'mb_way'

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
          <SheetHeader className="flex-shrink-0 p-5 pb-3">
            <SheetTitle className="text-lg font-bold text-zinc-900">
              {isMbWay ? 'MB WAY' : 'Pagamento Multibanco'}
            </SheetTitle>
          </SheetHeader>

          <Separator />

          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
            {/* MB WAY Result */}
            {isMbWay && (
              <div className="w-full max-w-sm space-y-6 text-center">
                <div className="relative mx-auto w-fit">
                  <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center">
                    <Phone className="h-9 w-9 text-blue-500" />
                  </div>
                  <div className="absolute -inset-1.5 rounded-full border-2 border-blue-200 animate-ping opacity-30" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-zinc-900">
                    Confirme na App MB WAY
                  </h2>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {paymentResult.action.message || 'Foi enviado um pedido de confirmação para o seu telemóvel. Abra a app MB WAY para confirmar o pagamento.'}
                  </p>
                </div>

                {customerPhone && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2">
                    <Phone className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-700">
                      {customerPhone.startsWith('+') ? customerPhone : `+351 ${customerPhone}`}
                    </span>
                  </div>
                )}

                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs font-medium">
                      Aguardando confirmação... Não feche esta página.
                    </span>
                  </div>
                </div>

                <div className="text-xs text-zinc-400">
                  Encomenda: <span className="font-mono font-semibold">{paymentResult.orderId}</span>
                </div>
              </div>
            )}

            {/* Multibanco Result */}
            {!isMbWay && (
              <div className="w-full max-w-sm space-y-5">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-fit h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                    <img src="/images/logo_multibanco.png" alt="Multibanco" className="h-10 object-contain" />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    Dados para Pagamento
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Utilize estes dados para efetuar a transferência no Multibanco ou homebanking.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Entity */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Entidade</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-extrabold text-zinc-900 tracking-widest">
                        {paymentResult.action.entidade}
                      </span>
                      <button
                        onClick={() => copyToClipboard(paymentResult.action.entidade || '', 'entidade')}
                        className="p-2 rounded-lg hover:bg-stone-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                        aria-label="Copiar entidade"
                      >
                        {copiedField === 'entidade' ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Reference */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Referência</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-extrabold text-zinc-900 tracking-widest">
                        {paymentResult.action.referencia}
                      </span>
                      <button
                        onClick={() => copyToClipboard(paymentResult.action.referencia || '', 'referencia')}
                        className="p-2 rounded-lg hover:bg-stone-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                        aria-label="Copiar referência"
                      >
                        {copiedField === 'referencia' ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="rounded-xl border-2 border-[#D4AF37] bg-amber-50/50 p-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Montante</p>
                    <span className="text-2xl font-extrabold text-zinc-900">
                      {paymentResult.action.montante}
                    </span>
                  </div>
                </div>

                {/* 6H warning */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <div className="flex items-start gap-2 text-amber-800">
                    <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-medium leading-relaxed">
                      Tem <strong>6 horas</strong> para realizar o pagamento. Após confirmação pelo gateway, receberá um email com os detalhes da encomenda.
                    </span>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 text-center">
                  Encomenda: <span className="font-mono font-semibold">{paymentResult.orderId}</span>
                </div>
              </div>
            )}
          </div>

          {/* Close button */}
          <div className="flex-shrink-0 border-t border-zinc-100 bg-white safe-bottom">
            <div className="px-5 pt-4 pb-4 space-y-3">
              <Button
                type="button"
                onClick={() => {
                  if (!isMbWay) {
                    clearCart()
                  }
                  closeAll()
                }}
                className="w-full py-3.5 rounded-xl text-sm font-bold bg-zinc-900 hover:bg-zinc-800 text-white transition-all"
              >
                {!isMbWay ? 'Fechar e Limpar Carrinho' : 'Fechar'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return null
}