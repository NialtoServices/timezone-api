import { writeFileSync } from 'node:fs'
import { getAllTimezones, getCountry } from 'countries-and-timezones'

interface TimezoneEntry {
  id: string
  name: string
  city: string | undefined
  country_name: string | undefined
  country_code: string | undefined
  utc_offset: string
  abbreviations: string[]
}

function getLocale<T>(countryCode: string, fallback: T): string | T {
  try {
    const locale = new Intl.Locale(`und-${countryCode}`).maximize()
    return `${locale.language}-${locale.region}`
  } catch {
    return fallback
  }
}

function getAbbreviations(id: string, countryCode: string): string[] {
  const locale = getLocale(countryCode, 'en')
  const format = new Intl.DateTimeFormat(locale, { timeZone: id, timeZoneName: 'short' })

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()

  const abbreviations = new Set<string>()

  for (let month = 0; month < 12; month++) {
    const date = new Date(currentYear, month, 1)
    const part = format.formatToParts(date).find((part) => part.type === 'timeZoneName')
    if (part) abbreviations.add(part.value)
  }

  return [...abbreviations].sort()
}

function getCity(id: string): string | undefined {
  const components = id.split('/')
  if (components[0] === 'Etc') return undefined

  return components[components.length - 1].replace(/_/g, ' ')
}

function buildTimezoneEntries(): TimezoneEntry[] {
  const timezones = getAllTimezones()
  const entries: TimezoneEntry[] = []

  for (const [id, timezone] of Object.entries(timezones)) {
    if (timezone.aliasOf || !id.includes('/')) continue

    const countryCode = timezone.countries[0]
    const country = countryCode ? getCountry(countryCode) : undefined
    const city = getCity(id)
    const abbreviations = getAbbreviations(id, countryCode)

    let name = id
      .split('/')
      .map((component) => component.replace(/_/g, ' '))
      .join(' / ')

    if (country?.name && !name.toLowerCase().includes(country.name.toLowerCase())) {
      name += ` (${country.name})`
    }

    const utcOffsetSign = timezone.utcOffset >= 0 ? '+' : '-'
    const utcOffsetValue = Math.abs(timezone.utcOffset)
    const utcOffsetHours = String(Math.floor(utcOffsetValue / 60)).padStart(2, '0')
    const utcOffsetMinutes = String(utcOffsetValue % 60).padStart(2, '0')
    const utcOffset = `${utcOffsetSign}${utcOffsetHours}:${utcOffsetMinutes}`

    entries.push({
      id,
      name,
      city,
      country_name: country?.name,
      country_code: country?.id,
      utc_offset: utcOffset,
      abbreviations
    })
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name))
}

const entries = buildTimezoneEntries()
writeFileSync('src/timezones.json', JSON.stringify(entries, null, 2) + '\n')
console.log(`Generated ${entries.length} timezone entries`)
