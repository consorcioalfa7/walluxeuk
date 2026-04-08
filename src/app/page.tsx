'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AdminPanel } from '@/components/admin-panel'
import {
  X,
  Truck,
  Menu,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Star,
  Flame,
  Minus,
  Plus,
  Package,
  ScanLine,
  Mail,
  ShieldCheck,
  ClipboardList,
  Scissors,
  Hammer,
  Play,
  CreditCard,
  RefreshCw,
  MessageCircle,
  Home as HomeIcon,
  Search,
  CheckCircle,
  Globe,
  Loader2,
  CircleCheckBig,
  Circle,
  Clock,
  MapPin,
  PackageCheck,
  Warehouse,
} from 'lucide-react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCartStore } from '@/lib/store/cart-store'
import { useI18n, type Locale } from '@/lib/i18n/context'
import { CartDrawer } from '@/components/cart/cart-drawer'

// ─── Data ────────────────────────────────────────────────────────────────────

const productImages = [
  '/images/img1.png',
  '/images/img2.png',
  '/images/img3.png',
  '/images/img4.png',
  '/images/img5.png',
  '/images/img6.png',
  '/images/img7.png',
  '/images/img8.png',
]

const colorVariantKeys: { nameKey: string; image: string }[] = [
  { nameKey: 'color.oak', image: '/images/img1.png' },
  { nameKey: 'color.lightOak', image: '/images/var2.png' },
  { nameKey: 'color.black', image: '/images/var3.png' },
  { nameKey: 'color.gray', image: '/images/var4.png' },
  { nameKey: 'color.walnut', image: '/images/var5.png' },
  { nameKey: 'color.ivory', image: '/images/var6.png' },
  { nameKey: 'color.graphite', image: '/images/var7.png' },
]

const accessoryKeys = [
  { nameKey: 'accessories.ledStrip', brand: 'Walluxe', price: 5.0, image: '/images/bump1.png' },
  { nameKey: 'accessories.installationGlue', brand: 'Walluxe', price: 2.99, image: '/images/bump2.png' },
  { nameKey: 'accessories.glueApplicator', brand: 'Walluxe', price: 3.99, image: '/images/bump3.png' },
  { nameKey: 'accessories.installationKit', brand: 'Walluxe', price: 2.99, image: '/images/bump4.png' },
]

const reviews = [
  { name: 'Marcio S.', image: '/images/r1.jpg', rating: 5, textKey: 'review.marcio' },
  { name: 'Pedro M.', image: '/images/r2.jpg', rating: 5, textKey: 'review.pedro' },
  { name: 'Gabriela L.', image: '/images/r3.jpg', rating: 5, textKey: 'review.gabriela' },
  { name: 'Monica P.', image: '/images/r4.jpg', rating: 5, textKey: 'review.monica' },
  { name: 'Santiago T.', image: '/images/r5.png', rating: 5, textKey: 'review.santiago' },
  { name: 'Eduarda A.', image: '/images/r6.jpg', rating: 5, textKey: 'review.eduarda' },
  { name: 'Sandrine B.', image: '/images/r7.jpg', rating: 5, textKey: 'review.sandrine' },
  { name: 'Paulo S.', image: '/images/r8.jpg', rating: 5, textKey: 'review.paulo' },
  { name: 'Frederico M.', image: '/images/r9.jpg', rating: 5, textKey: 'review.frederico' },
]

const reviewTexts: Record<string, Record<Locale, string>> = {
  'review.marcio': {
    pt: 'Fiquei surpreendido! A madeira é lindíssima e o painel acústico transformou verdadeiramente o ambiente, superando todas as minhas expectativas.',
    en: 'I was amazed! The wood is beautiful and the acoustic panel truly transformed the space, exceeding all my expectations.',
    es: '¡Quedé sorprendido! La madera es preciosa y el panel acústico realmente transformó el ambiente, superando todas mis expectativas.',
    fr: "J'étais étonné ! Le bois est magnifique et le panneau acoustique a véritablement transformé l'espace, dépassant toutes mes attentes.",
    de: 'Ich war überrascht! Das Holz ist wunderschön und das Akustikpaneel hat den Raum wirklich verwandelt und alle meine Erwartungen übertroffen.',
    it: "Sono rimasto sorpreso! Il legno è bellissimo e il pannello acustico ha trasformato veramente l'ambiente, superando tutte le mie aspettative.",
  },
  'review.pedro': {
    pt: 'Os painéis em carvalho natural que comprei para a minha casa fizeram uma diferença incrível na decoração, criando uma atmosfera completamente nova.',
    en: 'The natural oak panels I bought for my home made an incredible difference to the decor, creating a completely new atmosphere.',
    es: 'Los paneles de roble natural que compré para mi casa hicieron una diferencia increíble en la decoración, creando una atmósfera completamente nueva.',
    fr: "Les panneaux en chêne naturel que j'ai achetés pour ma maison ont fait une différence incroyable dans la décoration, créant une atmosphère complètement nouvelle.",
    de: 'Die Natur-Eichenpaneele, die ich für mein Zuhause gekauft habe, haben einen unglaublichen Unterschied in der Dekoration gemacht und eine völlig neue Atmosphäre geschaffen.',
    it: "I pannelli in rovere naturale che ho comprato per casa mia hanno fatto una differenza incredibile nella decorazione, creando un'atmosfera completamente nuova.",
  },
  'review.gabriela': {
    pt: 'A instalação foi extremamente simples, o resultado visual é fantástico e a entrega gratuita foi uma grande vantagem.',
    en: 'The installation was extremely simple, the visual result is fantastic and the free delivery was a great advantage.',
    es: 'La instalación fue extremadamente sencilla, el resultado visual es fantástico y la entrega gratuita fue una gran ventaja.',
    fr: "L'installation était extrêmement simple, le résultat visuel est fantastique et la livraison gratuite a été un grand avantage.",
    de: 'Die Montage war extrem einfach, das visuelle Ergebnis ist fantastisch und die kostenlose Lieferung war ein großer Vorteil.',
    it: "L'installazione è stata estremamente semplice, il risultato visivo è fantastico e la spedizione gratuita è stata un grande vantaggio.",
  },
  'review.monica': {
    pt: 'Eu adorei! E a qualidade é ótima; o tom de nogueira é lindo. O que interessa é a qualidade.',
    en: "I loved it! And the quality is excellent; the walnut tone is beautiful. What matters is quality.",
    es: '¡Me encantó! Y la calidad es excelente; el tono de nogal es precioso. Lo que importa es la calidad.',
    fr: "J'ai adoré ! Et la qualité est excellente ; le ton noyer est magnifique. Ce qui compte, c'est la qualité.",
    de: 'Ich habe es geliebt! Und die Qualität ist hervorragend; der Walnusston ist wunderschön. Was zählt, ist die Qualität.',
    it: "Mi è piaciuto tantissimo! E la qualità è eccellente; il tono noce è bellissimo. Quello che conta è la qualità.",
  },
  'review.santiago': {
    pt: 'Foi uma ótima compra, adorei as luzes, ficou perfeito nos painéis.',
    en: 'It was a great purchase, I loved the lights, it looked perfect on the panels.',
    es: 'Fue una excelente compra, me encantaron las luces, quedó perfecto en los paneles.',
    fr: "C'était un excellent achat, j'ai adoré les lumières, c'était parfait sur les panneaux.",
    de: 'Es war ein toller Kauf, ich habe die Lichter geliebt, es sah perfekt auf den Paneelen aus.',
    it: "È stato un ottimo acquisto, ho adorato le luci, è venuto perfetto sui pannelli.",
  },
  'review.eduarda': {
    pt: 'O nosso quarto parece ter sido rejuvenescido em 20 anos!',
    en: 'Our bedroom seems to have been rejuvenated by 20 years!',
    es: '¡Nuestro dormitorio parece haberse rejuvenecido 20 años!',
    fr: 'Notre chambre semble avoir rajeuni de 20 ans !',
    de: 'Unser Schlafzimmer wirkt um 20 Jahre verjüngt!',
    it: 'La nostra camera da letto sembra ringiovanita di 20 anni!',
  },
  'review.sandrine': {
    pt: 'Painéis com muita qualidade! Recomendo.',
    en: 'Very high quality panels! I recommend.',
    es: '¡Paneles de mucha calidad! Recomendados.',
    fr: 'Panneaux de très grande qualité ! Je recommande.',
    de: 'Sehr hochwertige Paneele! Ich empfehle.',
    it: 'Pannelli di altissima qualità! Lo consiglio.',
  },
  'review.paulo': {
    pt: 'A instalação é fácil. Fixei com fita adesiva de espuma e não tive qualquer problema. Uma ótima compra.',
    en: 'Installation is easy. I fixed it with foam tape and had no issues at all. A great purchase.',
    es: 'La instalación es fácil. Lo fijé con cinta adhesiva de espuma y no tuve ningún problema. Una gran compra.',
    fr: "L'installation est facile. Je l'ai fixé avec du ruban adhésif en mousse et je n'ai eu aucun problème. Un excellent achat.",
    de: 'Die Montage ist einfach. Ich habe es mit Schaumstoffband befestigt und hatte keine Probleme. Ein toller Kauf.',
    it: "L'installazione è facile. L'ho fissato con nastro adesivo in schiuma e non ho avuto alcun problema. Un ottimo acquisto.",
  },
  'review.frederico': {
    pt: 'Eu compraria de novo. Recomendei aos meus amigos porque são feitos de materiais excelentes.',
    en: 'I would buy again. I recommended to my friends because they are made from excellent materials.',
    es: 'Volvería a comprar. Se lo recomendé a mis amigos porque están hechos de materiales excelentes.',
    fr: "Je le rachèterais. Je l'ai recommandé à mes amis car ils sont fabriqués avec des matériaux excellents.",
    de: 'Ich würde wieder kaufen. Ich habe es meinen Freunden empfohlen, weil sie aus ausgezeichneten Materialien bestehen.',
    it: 'Lo ricomprerei. L\'ho consigliato ai miei amici perché sono fatti di materiali eccellenti.',
  },
}

const videoThumbnails = [
  { image: '/images/img1.png', titleKey: 'videos.installationGuide' },
  { image: '/images/img3.png', titleKey: 'videos.productOverview' },
  { image: '/images/img5.png', titleKey: 'videos.beforeAfter' },
  { image: '/images/img7.png', titleKey: 'videos.customerTestimonials' },
  { image: '/images/img2.png', titleKey: 'videos.colorOptions' },
  { image: '/images/img4.png', titleKey: 'videos.roomTransformation' },
]

// ─── Component: Announcement Banner ─────────────────────────────────────────

function AnnouncementBanner() {
  const [visible, setVisible] = useState(true)
  const { t } = useI18n()

  if (!visible) return null

  return (
    <div className="relative bg-zinc-950 py-2.5 text-center text-white text-xs">
      <div className="flex items-center justify-center gap-2">
        <Truck className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="font-medium">{t('announcement.freeShipping')}</span>
        <Truck className="h-3.5 w-3.5 flex-shrink-0" />
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
        aria-label="Close banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── Component: Side Menu ───────────────────────────────────────────────────

function SideMenu() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  const scrollToSection = (sectionId: string | null) => {
    setOpen(false)
    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setTimeout(() => {
      const target = document.getElementById(sectionId)
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const navItems = [
    { icon: HomeIcon, label: t('nav.home'), sectionId: null },
    { icon: Search, label: t('nav.products') ?? 'Products', sectionId: 'product' },
    { icon: Plus, label: t('accessories.title') ?? 'Accessories', sectionId: 'accessories' },
    { icon: Star, label: t('reviews.title') ?? 'Reviews', sectionId: 'reviews' },
    { icon: Hammer, label: t('installation.title') ?? 'Installation', sectionId: 'installation' },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button aria-label="Open menu" className="p-1.5 -ml-1.5 hover:bg-stone-100 rounded-lg transition-colors">
          <Menu className="h-5 w-5 text-zinc-800" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <img src="/images/walluxe-logo-nome.png" alt="Walluxe" className="h-8" />
            <SheetClose asChild>
              <button className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>
        <nav className="px-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.sectionId ?? 'home'}
                href={item.sectionId ? `#${item.sectionId}` : '#'}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(item.sectionId)
                }}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-900 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <item.icon className="h-4 w-4 text-zinc-500" />
                {item.label}
              </a>
            ))}
          </div>
        </nav>
        <SheetFooter className="mt-auto p-6 border-t border-stone-100">
          <p className="text-xs text-zinc-400">{t('footer.copyright')}</p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Component: Header ──────────────────────────────────────────────────────

function Header({ onCartOpen }: { onCartOpen: () => void }) {
  const totalItems = useCartStore((s) => s.totalItems)
  const { locale, setLocale, availableLocales, localeNames } = useI18n()

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-100">
      <div className="flex items-center justify-between px-4 h-14">
        <SideMenu />
        <img src="/images/walluxe-logo-nome.png" alt="Walluxe" className="h-10" />
        <div className="flex items-center gap-1.5">
          {/* Language selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Change language" className="flex items-center gap-1 p-1.5 hover:bg-stone-100 rounded-lg transition-colors">
                <Globe className="h-4 w-4 text-zinc-600" />
                <span className="text-xs font-semibold text-zinc-600 uppercase">{locale}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {availableLocales.map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={loc === locale ? 'bg-stone-100 font-semibold' : ''}
                >
                  <span className="text-xs uppercase text-zinc-400 w-6">{loc}</span>
                  <span>{localeNames[loc]}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cart button */}
          <button
            onClick={onCartOpen}
            className="relative p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="h-5 w-5 text-zinc-800" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#c69a5c] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

// ─── Component: Image Gallery ───────────────────────────────────────────────

function ImageGallery({ currentVariantImage }: { currentVariantImage: string }) {
  const [currentImage, setCurrentImage] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const images = useMemo(() => {
    const filtered = productImages.filter((img) => img !== currentVariantImage)
    return [currentVariantImage, ...filtered]
  }, [currentVariantImage])

  const goTo = useCallback(
    (index: number) => {
      setCurrentImage((index + images.length) % images.length)
    },
    [images.length]
  )

  const next = useCallback(() => goTo(currentImage + 1), [currentImage, goTo])
  const prev = useCallback(() => goTo(currentImage - 1), [currentImage, goTo])

  // Auto-play
  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % images.length)
      }, 4000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isAutoPlaying, images.length])

  // Scroll thumbnail into view
  useEffect(() => {
    if (scrollRef.current) {
      const thumb = scrollRef.current.children[currentImage] as HTMLElement | undefined
      if (thumb) {
        thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [currentImage])

  return (
    <div className="relative">
      {/* Main image */}
      <div
        className="relative aspect-square bg-stone-100 overflow-hidden rounded-xl"
        onTouchStart={() => setIsAutoPlaying(false)}
        onMouseDown={() => setIsAutoPlaying(false)}
      >
        <img
          src={images[currentImage]}
          alt={`Product image ${currentImage + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md p-2 hover:bg-stone-50 transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-4 w-4 text-zinc-700" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md p-2 hover:bg-stone-50 transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="h-4 w-4 text-zinc-700" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {images.slice(0, 8).map((_, idx) => (
            <div
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                idx === currentImage
                  ? 'bg-white w-5 h-2'
                  : 'bg-white/50 w-2 h-2'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div
        ref={scrollRef}
        className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide px-1 pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.slice(0, 8).map((img, idx) => (
          <button
            key={img}
            onClick={() => {
              setCurrentImage(idx)
              setIsAutoPlaying(false)
            }}
            className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
              idx === currentImage
                ? 'border-zinc-900 opacity-100'
                : 'border-transparent opacity-50 hover:opacity-75'
            }`}
          >
            <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Component: Accessories ─────────────────────────────────────────────────

function Accessories() {
  const addItem = useCartStore((s) => s.addItem)
  const { t } = useI18n()

  const addAccessory = (item: (typeof accessoryKeys)[number]) => {
    addItem({
      id: `accessory-${item.nameKey}`,
      name: t(item.nameKey),
      price: item.price,
      quantity: 1,
      color: 'Default',
      image: item.image,
    })
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-zinc-900">{t('accessories.title')}</h2>
      <div className="space-y-3">
        {accessoryKeys.map((item) => (
          <div key={item.nameKey} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3">
            <img src={item.image} alt={t(item.nameKey)} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900">{t(item.nameKey)}</p>
              <p className="text-xs text-zinc-500">{item.brand}</p>
              <p className="text-sm font-bold text-zinc-900">€{item.price.toFixed(2).replace('.', ',')}</p>
            </div>
            <button
              onClick={() => addAccessory(item)}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors active:scale-95 bg-stone-100 text-zinc-900 hover:bg-stone-200"
              aria-label={t('accessories.add')}
            >
              <Plus className="h-3 w-3" />
              {t('accessories.add')}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Component: Order Tracking ──────────────────────────────────────────────

const STATUS_ICONS: Record<string, typeof Circle> = {
  payment: CreditCard,
  preparing: ClipboardList,
  shipped: Warehouse,
  transit: Truck,
  expected: MapPin,
  delivered: PackageCheck,
}

const STATUS_COLORS: Record<string, string> = {
  payment: 'text-amber-500',
  preparing: 'text-blue-500',
  shipped: 'text-indigo-500',
  transit: 'text-purple-500',
  expected: 'text-orange-500',
  delivered: 'text-emerald-500',
}

function OrderTracking() {
  const { t } = useI18n()
  const [trackingCode, setTrackingCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    const code = trackingCode.trim().toUpperCase()
    if (!code) return

    setLoading(true)
    setError(null)
    setResult(null)
    setSearched(true)

    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(code)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('tracking.notFound'))
        return
      }

      setResult(data)
    } catch {
      setError(t('tracking.searchError'))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <section className="space-y-4">
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Package className="h-5 w-5 text-zinc-700" />
          <h2 className="text-base font-bold text-zinc-900">{t('tracking.title')}</h2>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          {t('tracking.description')}
        </p>
      </div>

      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="WLX-XXXXXX"
            maxLength={12}
            className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#c69a5c]/30 focus:border-[#c69a5c] placeholder:text-zinc-400 uppercase tracking-wider font-mono"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !trackingCode.trim()}
          className="h-10 px-4 rounded-lg bg-[#c69a5c] hover:bg-[#b0864e] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {t('tracking.search') || 'Pesquisar'}
        </button>
      </div>

      {/* Error */}
      {error && searched && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Result: Timeline */}
      {result && (
        <div className="rounded-xl border border-zinc-100 bg-white p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {/* Order info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">
                {t('tracking.orderNumber') || 'Encomenda'}
              </p>
              <p className="text-sm font-bold font-mono text-zinc-900">
                {result.trackingNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">{t('cart.total')}</p>
              <p className="text-sm font-bold text-zinc-900">
                €{result.amount.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>

          {/* Current status badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50">
            {(() => {
              const StatusIcon = STATUS_ICONS[result.status] || Circle
              return <StatusIcon className="h-4 w-4 text-[#c69a5c]" />
            })()}
            <span className="text-sm font-semibold text-zinc-900">
              {result.statusLabel}
            </span>
          </div>

          {/* Timeline */}
          <div className="space-y-0">
            {result.timeline.map(
              (step: { key: string; label: string; completed: boolean; active: boolean; upcoming: boolean }, i: number) => {
                const StepIcon = STATUS_ICONS[step.key] || Circle
                const isLast = i === result.timeline.length - 1

                return (
                  <div key={step.key} className="flex gap-3">
                    {/* Line + dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.active
                            ? 'bg-[#c69a5c] text-white ring-4 ring-[#c69a5c]/10'
                            : step.completed
                              ? 'bg-emerald-500 text-white'
                              : 'bg-stone-100 text-zinc-300'
                        }`}
                      >
                        <StepIcon className="h-3.5 w-3.5" />
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 h-6 ${
                            step.completed ? 'bg-emerald-400' : 'bg-stone-200'
                          }`}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div className={`pt-1 ${isLast ? 'pb-0' : ''}`}>
                      <p
                        className={`text-xs font-medium ${
                          step.active
                            ? 'text-zinc-900'
                            : step.completed
                              ? 'text-zinc-500'
                              : 'text-zinc-300'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        </div>
      )}

      {/* Info cards (only show when no result) */}
      {!result && !error && (
        <div className="space-y-2.5">
          {[
            {
              icon: ScanLine,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              title: t('tracking.autoCode'),
              description: t('tracking.autoCodeDesc'),
            },
            {
              icon: Mail,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              title: t('tracking.emailSent'),
              description: t('tracking.emailSentDesc'),
            },
            {
              icon: ShieldCheck,
              color: 'text-violet-600',
              bg: 'bg-violet-50',
              title: t('tracking.securePurchase'),
              description: t('tracking.securePurchaseDesc'),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl bg-stone-100/80 p-3 flex items-start gap-3"
            >
              <div
                className={`h-9 w-9 rounded-lg ${feature.bg} flex items-center justify-center flex-shrink-0`}
              >
                <feature.icon className={`h-4 w-4 ${feature.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  {feature.title}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Component: Product Description ─────────────────────────────────────────

function ProductDescription() {
  const { t } = useI18n()

  return (
    <section className="space-y-5">
      <h2 className="text-lg font-bold text-zinc-900">{t('description.title')}</h2>

      <div className="space-y-4 text-sm text-zinc-500 leading-relaxed">
        <p>{t('description.maintenance')}</p>

        <div>
          <h3 className="text-base font-semibold text-zinc-900 mb-2">{t('description.dimensions')}</h3>
          <p className="text-sm text-zinc-500">{t('description.totalDimensions')}</p>
          <p className="text-sm text-zinc-500">{t('description.slats')}</p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-zinc-900 mb-2">{t('description.advantages')}</h3>
          <ul className="space-y-2">
            {[t('description.adv1'), t('description.adv2'), t('description.adv3'), t('description.adv4')].map((text, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-zinc-500">{t('description.closing')}</p>
        </div>
      </div>
    </section>
  )
}

// ─── Component: Customer Reviews ────────────────────────────────────────────

function CustomerReviews() {
  const { t, locale } = useI18n()
  const allReviews = [...reviews, ...reviews]

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-zinc-900">{t('reviews.title')}</h2>
      <div
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allReviews.map((review, idx) => (
          <div
            key={`${review.name}-${idx}`}
            className="flex-shrink-0 w-[280px] snap-start bg-white rounded-xl border border-zinc-100 overflow-hidden shadow-sm"
          >
            <div className="h-48 overflow-hidden">
              <img
                src={review.image}
                alt={`${review.name}'s review`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 space-y-2.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed line-clamp-3">
                &ldquo;{reviewTexts[review.textKey]?.[locale] || ''}&rdquo;
              </p>
              <div className="flex items-center gap-2.5 pt-1">
                <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600">
                  {review.name.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-zinc-900">{review.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Component: Installation Steps ──────────────────────────────────────────

function InstallationSteps() {
  const { t } = useI18n()
  const steps = [
    { number: 1, icon: ClipboardList, title: t('installation.preparation'), description: t('installation.preparationDesc') },
    { number: 2, icon: Scissors, title: t('installation.cutting'), description: t('installation.cuttingDesc') },
    { number: 3, icon: Hammer, title: t('installation.application'), description: t('installation.applicationDesc') },
  ]

  return (
    <section className="space-y-5">
      <h2 className="text-lg font-bold text-zinc-900 text-center">{t('installation.title')}</h2>
      <div className="grid grid-cols-3 gap-4">
        {steps.map((step) => (
          <div key={step.number} className="text-center space-y-3">
            <div className="relative mx-auto w-16 h-16">
              <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center">
                <step.icon className="h-7 w-7 text-zinc-600" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-[#c69a5c] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {step.number}
              </div>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">{step.title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Component: Video Section ───────────────────────────────────────────────

function VideoSection() {
  const { t } = useI18n()

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-zinc-900">{t('videos.title')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {videoThumbnails.map((video, idx) => (
          <button
            key={idx}
            className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 group"
          >
            <img
              src={video.image}
              alt={t(video.titleKey)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="h-5 w-5 text-zinc-900 ml-0.5" fill="currentColor" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

// ─── Component: Why Buy From Us ─────────────────────────────────────────────

function WhyBuyFromUs() {
  const { t } = useI18n()
  const reasons = [
    { icon: Truck, title: t('whyBuy.freeShipping'), description: t('whyBuy.freeShippingDesc') },
    { icon: CreditCard, title: t('whyBuy.securePurchase'), description: t('whyBuy.securePurchaseDesc') },
    { icon: RefreshCw, title: t('whyBuy.easyReturns'), description: t('whyBuy.easyReturnsDesc') },
    { icon: MessageCircle, title: t('whyBuy.customerSupport'), description: t('whyBuy.customerSupportDesc') },
  ]

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-zinc-900">{t('whyBuy.title')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {reasons.map((reason) => (
          <div key={reason.title} className="text-center space-y-2 p-3 rounded-xl bg-stone-50">
            <div className="mx-auto h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center">
              <reason.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">{reason.title}</h3>
            <p className="text-xs text-zinc-500">{reason.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Component: About Section ───────────────────────────────────────────────

function AboutSection() {
  const { t } = useI18n()

  return (
    <section className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-3 px-6">
            <div className="h-16 w-16 mx-auto rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <img src="/images/walluxe-logo-nome.png" alt="Walluxe" className="h-8" />
            </div>
            <p className="text-white/80 text-xs font-medium tracking-wider uppercase">{t('about.team')}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-zinc-900 leading-snug">{t('about.title')}</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          <strong className="text-zinc-900">{t('about.description')}</strong>
        </p>
      </div>
    </section>
  )
}

// ─── Component: Footer ──────────────────────────────────────────────────────

function Footer() {
  const { t } = useI18n()
  const links = [
    { key: 'footer.shipping', href: '#tracking', sectionId: 'tracking' },
    { key: 'footer.privacy', href: '#', sectionId: null },
    { key: 'footer.returns', href: '#why-buy', sectionId: 'why-buy' },
    { key: 'footer.terms', href: '#', sectionId: null },
    { key: 'footer.contact', href: '#about', sectionId: 'about' },
  ]

  const handleFooterClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string | null) => {
    if (!sectionId) return
    e.preventDefault()
    const target = document.getElementById(sectionId)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <footer className="bg-zinc-950 text-white mt-8">
      <div className="space-y-6 py-8 px-6">
        <div className="flex justify-center">
          <img src="/images/walluxe-logo-nome.png" alt="Walluxe" className="h-8 brightness-0 invert opacity-90" />
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={(e) => handleFooterClick(e, link.sectionId)}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>
        <div className="border-t border-zinc-800 pt-4 text-center">
          <p className="text-xs text-zinc-500">{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}

// ─── Product Details Section ────────────────────────────────────────────────

function ProductDetailsSection({
  selectedColor,
  onColorChange,
  onCartOpen,
}: {
  selectedColor: number
  onColorChange: (idx: number) => void
  onCartOpen: () => void
}) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((s) => s.addItem)
  const { t } = useI18n()

  const handleAddToCart = () => {
    addItem({
      id: 'flexible-acoustic-panel',
      name: t('product.title'),
      price: 5.0,
      quantity,
      color: t(colorVariantKeys[selectedColor].nameKey),
      image: colorVariantKeys[selectedColor].image,
    })
  }

  const handleBuyNow = () => {
    handleAddToCart()
    onCartOpen()
  }

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 leading-tight">
          {t('product.title')}
        </h1>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span className="text-sm text-zinc-500">{t('product.reviews')}</span>
      </div>

      {/* High demand badge */}
      <div className="inline-flex items-center gap-1.5 bg-stone-100 rounded-full px-3 py-1">
        <Flame className="h-3.5 w-3.5 text-orange-500" />
        <span className="text-xs font-medium text-zinc-700">{t('product.highDemand')}</span>
      </div>

      {/* Price */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-3xl font-extrabold text-zinc-900">€5.00</span>
        <span className="text-lg text-zinc-400 line-through">€21.00</span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-[#ef2f1f]">
          {t('product.saveAmount')}
        </span>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-zinc-600">{t('product.quantity')}</span>
        <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 hover:bg-stone-50 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4 text-zinc-600" />
          </button>
          <span className="px-4 py-2 text-sm font-semibold text-zinc-900 min-w-[2.5rem] text-center tabular-nums">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(99, quantity + 1))}
            className="px-3 py-2 hover:bg-stone-50 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4 text-zinc-600" />
          </button>
        </div>
      </div>

      {/* Color selector */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-600">{t('product.color')}</span>
          <span className="text-sm font-semibold text-zinc-900">{t(colorVariantKeys[selectedColor].nameKey)}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {colorVariantKeys.map((variant, idx) => (
            <button
              key={variant.nameKey}
              onClick={() => onColorChange(idx)}
              className={`h-11 w-11 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                idx === selectedColor
                  ? 'border-zinc-900 ring-1 ring-zinc-900/20'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
              title={t(variant.nameKey)}
              aria-label={`Select color ${t(variant.nameKey)}`}
            >
              <img
                src={variant.image}
                alt={t(variant.nameKey)}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3 pt-1">
        <button
          onClick={handleAddToCart}
          className="w-full bg-[#c69a5c] hover:opacity-90 text-white font-semibold rounded-lg py-3.5 text-base transition-opacity active:scale-[0.98]"
        >
          {t('product.addToCart')}
        </button>
        <button
          onClick={handleBuyNow}
          className="w-full bg-zinc-900 hover:opacity-90 text-white font-semibold rounded-lg py-3.5 text-base transition-opacity active:scale-[0.98]"
        >
          {t('product.buyNow')}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function Home() {
  const [selectedColor, setSelectedColor] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const currentVariantImage = colorVariantKeys[selectedColor].image

  // Show admin panel when URL hash is #admin
  useEffect(() => {
    const checkHash = () => setShowAdmin(window.location.hash === '#admin')
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  if (showAdmin) return <AdminPanel />

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Sticky Header */}
      <Header onCartOpen={() => setCartOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-lg px-4 py-5 space-y-8">
        {/* Image Gallery */}
        <div id="gallery">
          <ImageGallery key={currentVariantImage} currentVariantImage={currentVariantImage} />
        </div>

        {/* Product Details */}
        <div id="product">
          <ProductDetailsSection selectedColor={selectedColor} onColorChange={setSelectedColor} onCartOpen={() => setCartOpen(true)} />
        </div>

        {/* Accessories */}
        <div id="accessories">
          <Accessories />
        </div>

        {/* Order Tracking */}
        <div id="tracking">
          <OrderTracking />
        </div>

        {/* Product Description */}
        <div id="description">
          <ProductDescription />
        </div>

        {/* Customer Reviews */}
        <div id="reviews">
          <CustomerReviews />
        </div>

        {/* Installation Steps */}
        <div id="installation">
          <InstallationSteps />
        </div>

        {/* Video Section */}
        <div id="videos">
          <VideoSection />
        </div>

        {/* Why Buy From Us */}
        <div id="why-buy">
          <WhyBuyFromUs />
        </div>

        {/* About Section */}
        <div id="about">
          <AboutSection />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  )
}
