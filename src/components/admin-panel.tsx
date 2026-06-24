'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X,
  Loader2,
  Truck,
  ClipboardList,
  Warehouse,
  MapPin,
  PackageCheck,
  CreditCard,
  RefreshCw,
} from 'lucide-react'

const STATUSES = [
  { key: 'payment', label: 'Em pagamento', icon: CreditCard, color: 'bg-amber-100 text-amber-700' },
  { key: 'preparing', label: 'Em preparação', icon: ClipboardList, color: 'bg-blue-100 text-blue-700' },
  { key: 'shipped', label: 'Saída do armazém', icon: Warehouse, color: 'bg-indigo-100 text-indigo-700' },
  { key: 'transit', label: 'Em transporte', icon: Truck, color: 'bg-purple-100 text-purple-700' },
  { key: 'expected', label: 'Entrega prevista', icon: MapPin, color: 'bg-orange-100 text-orange-700' },
  { key: 'delivered', label: 'Entregue', icon: PackageCheck, color: 'bg-emerald-100 text-emerald-700' },
]

interface Order {
  id: string
  trackingNumber: string
  customerEmail: string | null
  customerName: string | null
  amount: number
  currency: string
  status: string
  createdAt: string
  paidAt: string | null
}

export function AdminPanel() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders')
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
        )
      }
    } catch {
      // silently fail
    } finally {
      setUpdating(null)
    }
  }

  const getStatusInfo = (statusKey: string) =>
    STATUSES.find((s) => s.key === statusKey) || STATUSES[0]

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-stone-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#c69a5c] flex items-center justify-center">
            <Truck className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-900">Painel de Gestão</h1>
            <p className="text-[10px] text-zinc-500">{orders.length} encomendas</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.location.hash = ''}
          className="h-8 w-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4 text-zinc-600" />
        </button>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-57px)]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#c69a5c]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <PackageCheck className="h-10 w-10 text-zinc-300" />
            <p className="text-sm text-zinc-500">Sem encomendas</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              const StatusIcon = statusInfo.icon

              return (
                <div key={order.id} className="px-4 py-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold font-mono text-zinc-900">
                        {order.trackingNumber}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {order.customerName || order.customerEmail || '—'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-zinc-900">
                        €{order.amount.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusInfo.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      disabled={updating === order.id}
                      className="flex-1 h-8 text-xs rounded-lg border border-zinc-200 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-[#c69a5c]/30 disabled:opacity-50"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    {updating === order.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-[#c69a5c]" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
