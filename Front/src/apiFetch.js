export default async function apiFetch(url, options = {}) {
  const method = (options.method ?? 'GET').toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return fetch(url, options)
  }

  if (typeof url !== "string" || !/^\/api\/(?!\/)/.test(url) || url.includes("\\")) {
    throw new Error('Unsafe requests require a local API URL')
  }

  const response = await fetch('/api/csrf', { credentials: 'include', cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Could not load CSRF token')
  }

  const { headerName, token } = await response.json()
  const headers = new Headers(options.headers)
  headers.set(headerName, token)

  return fetch(url, { ...options, headers, credentials: 'include' })
}
