# Walluxe UK — Premium Acoustic Wood Panels

## 🏪 E-commerce Store

Single-page e-commerce application for premium acoustic wood panels, built with **Next.js 16 App Router**, **TypeScript**, **Tailwind CSS 4**, and **shadcn/ui**.

Deployed on **Vercel** — fully serverless, stateless checkout via **XPayments**.

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────┐
│                   Vercel Edge                      │
│  ┌─────────────────────────────────────────────┐  │
│  │         Next.js 16 App Router               │  │
│  │  ┌───────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │  SPA Page  │  │ Cart UI  │  │ Payment  │ │  │
│  │  │ (14 secs)  │  │ (Zustand)│  │  Modal   │ │  │
│  │  └─────┬─────┘  └────┬─────┘  └────┬─────┘ │  │
│  └────────┼─────────────┼─────────────┼────────┘  │
│           │             │             │           │
│  ┌────────▼─────────────▼─────────────▼────────┐  │
│  │         API Routes (Stateless)               │  │
│  │  POST /api/checkout/xpayments                │  │
│  └────────────────────┬────────────────────────┘  │
└───────────────────────┼───────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   XPayments API  │
              │  (B2B Sessions)  │
              │                  │
              │ • Checkout URL   │
              │ • Payment page   │
              │ • postMessage    │
              │ • Email receipt  │
              └──────────────────┘
```

### Key Design Decisions

| Aspect | Decision | Reason |
|--------|----------|--------|
| **Database** | No DB for checkout | SQLite does not work in Vercel serverless (no filesystem persistence) |
| **Source of Truth** | XPayments API | All order/payment state managed by XPayments |
| **Payment Flow** | Iframe modal + postMessage | Keeps user on-site, seamless UX |
| **Cart State** | Zustand + localStorage | Client-side persistence, no server needed |
| **Architecture** | Stateless / Headless | 100% serverless-compatible on Vercel |

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Icons | Lucide React |
| State | Zustand (client cart) |
| Animations | Framer Motion |
| Payment | XPayments (Checkout Sessions) |
| Deployment | Vercel |

---

## 💳 Payment Flow (Stateless — XPayments)

### How it works (4 steps):

**Step 1** — User clicks "Finalizar Compra Segura" in the Cart Drawer.

**Step 2** — Frontend calls `POST /api/checkout/xpayments` with cart items, total, and customer info.

**Step 3** — The API route (stateless, no database) creates an XPayments Checkout Session:
- Generates a `WLX-XXXXXX` tracking number
- Sends full cart in the `metadata` field
- Returns the checkout URL

**Step 4** — A full-screen **iframe modal** opens with the XPayments checkout page.
- On successful payment, XPayments sends `window.postMessage('XPAYMENTS_PAYMENT_SUCCESS')`
- Frontend catches the message, shows success screen, and clears the cart
- **No webhooks, no local database updates — XPayments handles everything.**

### Success Message:
> "Pagamento confirmado com sucesso! Irá receber os detalhes por email."

---

## 🔑 Environment Variables

```env
# XPayments Gateway (REQUIRED for checkout)
XPAYMENTS_SECRET_KEY="sk_live_..."
XPAYMENTS_STORE_ID="uuid-store-id"
NEXT_PUBLIC_XPAYMENTS_API="https://api.xpayments.digital"

# Database (local dev only — NOT used in checkout flow)
DATABASE_URL="file:./db/custom.db"

# NeXFlowX (legacy — not active)
NEXFLOWX_API_KEY=""
NEXFLOWX_WEBHOOK_SECRET=""
```

> **Security Note:** `XPAYMENTS_SECRET_KEY` has no `NEXT_PUBLIC_` prefix — it is server-side only and never exposed to the browser.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout + SEO metadata + I18nProvider
│   ├── page.tsx                # Single-page app (14 sections)
│   └── api/
│       ├── checkout/
│       │   ├── route.ts        # Legacy NeXFlowX proxy
│       │   └── xpayments/
│       │       └── route.ts    # ⭐ Stateless XPayments checkout
│       ├── detect-locale/
│       │   └── route.ts        # GeoIP language detection
│       ├── tracking/
│       │   └── [number]/
│       │       └── route.ts    # Order tracking (local DB)
│       └── admin/
│           └── orders/
│               ├── route.ts    # List orders (local DB)
│               └── [id]/
│                   └── status/
│                       └── route.ts  # Update order status
├── components/
│   ├── cart/
│   │   ├── cart-drawer.tsx     # Cart sheet + checkout trigger
│   │   └── payment-modal.tsx   # ⭐ Iframe modal with postMessage
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── db.ts                   # Prisma client (local dev only)
│   ├── i18n/
│   │   ├── context.tsx         # I18n provider
│   │   └── translations.ts     # 6-language translation strings
│   └── store/
│       └── cart-store.ts       # Zustand cart (localStorage)
└── sections/                   # Page section components
```

---

## 🌍 Internationalization (i18n)

Supports 6 languages with auto-detection via `/api/detect-locale`:

| Code | Language |
|------|----------|
| `pt` | Português (default) |
| `es` | Español |
| `it` | Italiano |
| `de` | Deutsch |
| `fr` | Français |
| `en` | English |

---

## 🚀 Deployment

### Vercel (Production)

1. Push to `main` branch → auto-deploys
2. Set environment variables in Vercel Dashboard:
   - `XPAYMENTS_SECRET_KEY`
   - `XPAYMENTS_STORE_ID`
   - `NEXT_PUBLIC_XPAYMENTS_API`
3. No database, no migration, no build hooks needed

### Local Development

```bash
# Install dependencies
bun install

# Generate Prisma client (optional, for local DB features)
bun run db:generate
bun run db:push

# Start dev server
bun run dev

# Lint
bun run lint
```

---

## 🔄 Version History

| Version | Description |
|---------|-------------|
| **v4 (current)** | Stateless checkout — removed Prisma from payment flow, iframe modal, metadata-based cart |
| v3 | XPayments iframe modal + postMessage auto-close |
| v2 | Simplified XPayments sessions (no signature validation) |
| v1 | Initial XPayments integration with DB + redirect |

---

## 📄 License

Private repository — Walluxe UK.