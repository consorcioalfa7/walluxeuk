import { NextResponse } from 'next/server'
import { countryToLocale } from '@/lib/i18n/translations'

export async function GET(request: Request) {
  try {
    const cfCountry = request.headers.get('cf-ipcountry')
    if (cfCountry && countryToLocale[cfCountry]) {
      return NextResponse.json({ locale: countryToLocale[cfCountry], country: cfCountry })
    }

    const fwdedFor = request.headers.get('x-forwarded-for')
    const ip = fwdedFor?.split(',')[0]?.trim() || 'unknown'

    if (ip && ip !== 'unknown') {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`)
      if (res.ok) {
        const data = await res.json()
        const locale = countryToLocale[data.countryCode] || 'en'
        return NextResponse.json({ locale, country: data.countryCode })
      }
    }

    return NextResponse.json({ locale: 'en', country: 'US' })
  } catch {
    return NextResponse.json({ locale: 'en', country: 'US' })
  }
}
