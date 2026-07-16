# Walluxe UK — Premium Acoustic Wood Panels

## E-commerce Store

Single-page e-commerce application for premium acoustic wood panels, built with **Next.js 16 App Router**, **TypeScript**, **Tailwind CSS 4**, and **shadcn/ui**.

Deployed on **Vercel** at [walluxe.xdeals.online](https://walluxe.xdeals.online) — fully serverless, integrated checkout via **XPayments V3 S2S Charge API**.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      Vercel Edge / Serverless                   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Next.js 16 App Router                   │  │
│  │                                                          │  │
│  │  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  │  │
│  │  │  SPA Page    │  │  Cart Drawer  │  │ Admin Panel  │  │  │
│  │  │  (sections)  │  │  (3 steps)    │  │  (#admin)    │  │  │
│  │  └──────┬───────┘  └───────┬───────┘  └──────┬───────┘  │  │
│  └─────────┼──────────────────┼─────────────────┼──────────┘  │
│            │                  │                 │             │
│  ┌─────────▼──────────────────▼─────────────────▼──────────┐  │
│  │              API Routes (Stateless)                      │  │
│  │                                                         │  │
│  │  POST /api/payments/charge      ──► XPayments S2S       │  │
│  │  POST /api/payments/webhook     ◄── XPayments callback  │  │
│  │  GET  /api/detect-locale        ──► GeoIP detection     │  │
│  │  GET  /api/tracking/[number]    ──► Order tracking      │  │
│  │  GET/POST /api/admin/orders/*   ──► Order management    │  │
│  └─────────┬──────────────────┬───────────────────────────┘  │
└────────────┼──────────────────┼───────────────────────────────┘
             │                  │
             ▼                  ▼
   ┌─────────────────┐  ┌──────────────────┐
   │  XPayments V3   │  │  SQLite (local)  │
   │  S2S Charge API │  │  Tracking/Admin  │
   │                 │  │  (dev only)      │
   │  • MB WAY       │  └──────────────────┘
   │  • Multibanco   │
   │  • Webhook      │
   └─────────────────┘
```

### Key Design Decisions

| Aspect | Decision | Reason |
|--------|----------|--------|
| **Database** | No DB for checkout | SQLite does not work in Vercel serverless (no filesystem persistence) |
| **Source of Truth** | XPayments API | All payment state managed by XPayments |
| **Payment Flow** | Integrated in-cart (S2S) | No redirect/iframe — customer never leaves the page |
| **Cart State** | Zustand + localStorage | Client-side persistence, no server needed |
| **Architecture** | Stateless / Headless | 100% serverless-compatible on Vercel |
| **Amount Format** | Integer cents | XPayments V3 requires `amount` as integer in cents (1400 = EUR 14.00) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Icons | Lucide React |
| State | Zustand (client cart with localStorage persistence) |
| Animations | Framer Motion |
| Payment | XPayments V3 S2S Charge API (MB WAY + Multibanco) |
| Deployment | Vercel |

---

## Integrated Checkout Flow (3 Steps)

### Step 1 — Cart Review
- User opens the cart drawer from the header icon
- Reviews items, quantities, and pricing
- Free shipping progress bar (threshold: 10 items)
- Clicks **"Finalizar Compra"** to proceed

### Step 2 — Checkout Form + Payment Method

**Customer Details Form:**
- Nome completo
- Email
- Telefone (auto-formatado para MB WAY: +351{numero})
- Morada (endereco completo)
- Cidade
- Codigo Postal
- Pais (dropdown com 12 paises europeus: PT, ES, FR, DE, IT, GB, NL, BE, CH, AT, IE, LU)

**Payment Method Cards:**
- **MB WAY** — card com logo oficial, selecionavel com clique
- **Multibanco** — card com logo oficial, selecionavel com clique

**Validation:**
- Todos os campos obrigatorios validados antes de submeter
- Email validado com regex
- Telefone deve ter minimo 9 digitos
- Botao **"Pagar Agora"** com loading state

### Step 3 — Payment Result

**Se MB WAY:**
```
┌─────────────────────────────────┐
│  📱 MB WAY                     │
│                                 │
│  ⚡ Push enviado!              │
│  Confirme a pagamento          │
│  na App MB WAY.                │
│                                 │
│  [animacao ping aguardando]     │
└─────────────────────────────────┘
```
- Exibe mensagem: "Confirme na App MB WAY"
- Animacao pulsante indicando aguardo
- Pedido #WLX-XXXXXX mostrado

**Se Multibanco:**
```
┌─────────────────────────────────┐
│  🏦 MULTIBANCO                 │
│                                 │
│  Entidade:    12345    [copiar] │
│  Referencia:  987 654 321 [copiar]│
│  Montante:    EUR 14.00 [copiar]│
│                                 │
│  ⏰ Tem 6 horas para realizar  │
│     o pagamento.               │
│                                 │
│  [Fechar]                      │
└─────────────────────────────────┘
```
- Entidade, Referencia e Montante com botao de copiar para clipboard
- Aviso de 6 horas para realizar o pagamento
- Botao "Fechar" limpa o carrinho (pagamento e assincrono)
- Pedido #WLX-XXXXXX mostrado

---

## API Routes

### `POST /api/payments/charge`

Server-to-server charge creation. The backend proxies the request to XPayments with the secret API key (never exposed to the client).

**Request Body:**
```json
{
  "amount": 14.00,
  "paymentMethod": "mb_way",
  "customerName": "Joao Silva",
  "customerEmail": "joao@email.com",
  "customerPhone": "912345678",
  "orderId": "WLX-M3K9Q2"
}
```

**Backend forwards to XPayments:**
```json
POST https://api.xpayments.digital/api/v1/payments/charge
Headers:
  Content-Type: application/json
  x-api-key: sk_live_...

Body:
{
  "amount": 1400,
  "currency": "EUR",
  "payment_method_types": ["mb_way"],
  "metadata": { "order_id": "WLX-M3K9Q2" },
  "customer": {
    "name": "Joao Silva",
    "email": "joao@email.com",
    "phone": "+351912345678"
  }
}
```

**Response (MB WAY):**
```json
{
  "success": true,
  "status": "requires_action",
  "method": "mb_way",
  "action": { "message": "Push enviado. Confirme na App." },
  "orderId": "WLX-M3K9Q2"
}
```

**Response (Multibanco):**
```json
{
  "success": true,
  "status": "requires_action",
  "method": "multibanco",
  "action": {
    "entidade": "12345",
    "referencia": "987 654 321",
    "montante": "EUR 14.00"
  },
  "orderId": "WLX-M3K9Q2"
}
```

### `POST /api/payments/webhook`

Receives async payment confirmation from XPayments.

**Expected payload:**
```json
{
  "event": "payment.succeeded",
  "status": "paid",
  "method": "multibanco",
  "amount": 1400,
  "metadata": { "order_id": "WLX-M3K9Q2" }
}
```

- Logs the confirmation with order ID and amount
- Returns `{ received: true }` to acknowledge

### Other API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/detect-locale` | GET | GeoIP-based language detection |
| `/api/tracking/[number]` | GET | Order tracking lookup (local DB) |
| `/api/admin/orders` | GET | List all orders (local DB) |
| `/api/admin/orders/[id]/status` | POST | Update order status (local DB) |
| `/api/payments/webhook` | GET | Health check — returns `{ status: "ok" }` |

---

## Environment Variables

### Production (Vercel)

```env
# XPayments V3 — S2S Charge API (REQUIRED)
# Used in header: x-api-key
XPAY_SECRET_KEY="sk_live_..."
```

> Only **one** environment variable is needed for the payment flow.
> The key is server-side only (no `NEXT_PUBLIC_` prefix) and never exposed to the browser.

### Local Development

```env
# Database (local dev only — NOT used in checkout flow)
DATABASE_URL="file:/home/z/my-project/db/custom.db"

# XPayments V3 — S2S Charge API
XPAY_SECRET_KEY="sk_live_..."

# NeXFlowX (legacy — not active)
NEXFLOWX_API_KEY=""
NEXFLOWX_WEBHOOK_SECRET=""
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout + SEO metadata + I18nProvider
│   ├── page.tsx                    # Single-page app (all sections inline)
│   └── api/
│       ├── payments/
│       │   ├── charge/route.ts     # S2S XPayments V3 charge (x-api-key, cents)
│       │   └── webhook/route.ts    # XPayments async payment confirmation
│       ├── detect-locale/route.ts  # GeoIP language detection
│       ├── tracking/
│       │   └── [number]/route.ts   # Order tracking (local DB)
│       ├── checkout/route.ts       # Legacy NeXFlowX proxy
│       └── admin/
│           └── orders/
│               ├── route.ts        # List orders (local DB)
│               └── [id]/status/
│                   └── route.ts    # Update order status
├── components/
│   ├── cart/
│   │   └── cart-drawer.tsx         # 3-step integrated checkout
│   │                               #   Step 1: Cart review
│   │                               #   Step 2: Form + MB WAY/Multibanco cards
│   │                               #   Step 3: Inline result display
│   ├── admin-panel.tsx             # Order management (#admin route)
│   └── ui/                         # shadcn/ui component library
├── lib/
│   ├── db.ts                       # Prisma client (local dev only)
│   ├── i18n/
│   │   ├── context.tsx             # I18n provider with 6 languages
│   │   └── translations.ts         # 600+ translation strings
│   └── store/
│       └── cart-store.ts           # Zustand cart (localStorage persistence)
public/
├── images/                         # Product images, logos
│   ├── logo_mbway.png              # MB WAY official logo
│   └── logo_multibanco.png         # Multibanco official logo
├── favicon.svg
├── apple-touch-icon.svg
└── robots.txt
```

---

## Internationalization (i18n)

Supports 6 languages with auto-detection via `/api/detect-locale`:

| Code | Language |
|------|----------|
| `pt` | Portugues (default) |
| `es` | Espanol |
| `it` | Italiano |
| `de` | Deutsch |
| `fr` | Francais |
| `en` | English |

---

## Deployment

### Vercel (Production)

1. Push to `main` branch - auto-deploys
2. Set environment variable in Vercel Dashboard:
   - `XPAY_SECRET_KEY` - your XPayments API secret key
3. Configure webhook in XPayments Dashboard:
   - **URL:** `https://walluxe.xdeals.online/api/payments/webhook`
   - **Events:** `payment.succeeded`
4. No database, no migration, no build hooks needed

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

## Version History

| Version | Description |
|---------|-------------|
| **v5 (current)** | Integrated checkout — S2S Charge API, MB WAY/Multibanco cards, inline results, webhook |
| v4 | Stateless checkout — removed Prisma from payment flow, iframe modal, metadata-based cart |
| v3 | XPayments iframe modal + postMessage auto-close |
| v2 | Simplified XPayments sessions (no signature validation) |
| v1 | Initial XPayments integration with DB + redirect |

---

## Security Notes

- `XPAY_SECRET_KEY` is server-side only — never prefixed with `NEXT_PUBLIC_`
- Amount conversion (EUR to cents) happens server-side, never trusted from client
- Payment method validation is enforced on both client and server
- All XPayments communication is S2S (server-to-server) — no client-side API calls
- `.env` is gitignored and purged from git history

---

## License

Private repository — Walluxe UK.