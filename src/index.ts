import timezoneEntries from './timezones.json'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Content-Type': 'application/json'
}

export default {
  fetch(request: Request): Response {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')

    let results = timezoneEntries

    if (query) {
      results = timezoneEntries.filter((entry) => {
        const searchable = [entry.id, entry.country_code, entry.country_name, entry.city, ...entry.abbreviations]
          .join(' ')
          .toLowerCase()

        return query
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .every((term) => searchable.includes(term))
      })
    }

    return new Response(JSON.stringify(results), { headers })
  }
}
