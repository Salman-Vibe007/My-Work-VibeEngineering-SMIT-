const fallbackCallbackUrl = '/dashboard'
const callbackOrigin = 'https://prelegal.invalid'

export function getSafeCallbackUrl(candidate: string | null): string {
  if (!candidate) return fallbackCallbackUrl

  try {
    const url = new URL(candidate, callbackOrigin)
    if (url.origin !== callbackOrigin || !url.pathname.startsWith('/')) {
      return fallbackCallbackUrl
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallbackCallbackUrl
  }
}
