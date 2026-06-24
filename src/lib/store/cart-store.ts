import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  color: string
  image: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (id: string, color: string) => void
  updateQuantity: (id: string, color: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.id === item.id && i.color === item.color
          )
          let newItems: CartItem[]
          if (existing) {
            newItems = state.items.map((i) =>
              i.id === item.id && i.color === item.color
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            )
          } else {
            newItems = [...state.items, { ...item, quantity: item.quantity || 1 }]
          }
          const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0)
          const totalPrice = newItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          )
          return { items: newItems, totalItems, totalPrice }
        }),

      removeItem: (id, color) =>
        set((state) => {
          const newItems = state.items.filter(
            (i) => !(i.id === id && i.color === color)
          )
          const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0)
          const totalPrice = newItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          )
          return { items: newItems, totalItems, totalPrice }
        }),

      updateQuantity: (id, color, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            const newItems = state.items.filter(
              (i) => !(i.id === id && i.color === color)
            )
            const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0)
            const totalPrice = newItems.reduce(
              (sum, i) => sum + i.price * i.quantity,
              0
            )
            return { items: newItems, totalItems, totalPrice }
          }
          const newItems = state.items.map((i) =>
            i.id === id && i.color === color ? { ...i, quantity } : i
          )
          const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0)
          const totalPrice = newItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          )
          return { items: newItems, totalItems, totalPrice }
        }),

      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),
    }),
    {
      name: 'walluxe-cart',
    }
  )
)
