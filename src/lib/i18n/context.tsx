'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { translations, type Locale, defaultLocale, localeNames } from './translations'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  localeNames: Record<string, string>
  availableLocales: Locale[]
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  const saved = localStorage.getItem('walluxe-locale') as Locale | null
  if (saved && translations[saved]) return saved
  return defaultLocale
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  useEffect(() => {
    document.documentElement.lang = locale

    if (locale !== defaultLocale) return

    const saved = localStorage.getItem('walluxe-locale') as Locale | null
    if (saved) return

    fetch('/api/detect-locale')
      .then((res) => res.json())
      .then((data) => {
        if (data.locale && translations[data.locale]) {
          setLocaleState(data.locale)
          localStorage.setItem('walluxe-locale', data.locale)
          document.documentElement.lang = data.locale
        }
      })
      .catch(() => {})
  }, [locale])

  const changeLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('walluxe-locale', newLocale)
    document.documentElement.lang = newLocale
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[locale]?.[key] || translations[defaultLocale]?.[key] || key
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`{${paramKey}}`, String(paramValue))
      })
    }
    return text
  }

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale: changeLocale,
        t,
        localeNames,
        availableLocales: Object.keys(translations) as Locale[],
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within I18nProvider')
  return context
}
