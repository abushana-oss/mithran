import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cryptoUtils } from '@/lib/utils/crypto-polyfill'

/**
 * Next.js Middleware for CSP Nonce Generation
 * - Correctly named `proxy` (required by Next.js)
 * - Stable CSP across navigations
 * - Explicitly allows local API + WebSockets in dev
 * - Prevents silent NETWORK_ERROR failures
 */

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(cryptoUtils.generateUUID()).toString('base64')
  const cspHeader = generateCSP(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set('Content-Security-Policy', cspHeader)

  return response
}

function generateCSP(nonce: string): string {
  const apiGateway = process.env.NEXT_PUBLIC_API_GATEWAY_URL
  const cadEngine = process.env.NEXT_PUBLIC_CAD_ENGINE_URL
  const isDev = process.env.NODE_ENV !== 'production'

  const connectSrc: string[] = [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://vercel.live',
    'wss://vercel.live',
    'https://*.pusher.com',
    'wss://*.pusher.com',
    'https://va.vercel-scripts.com',
  ]

  // ✅ Explicit dev allowances (THIS FIXES YOUR BUG)
  if (isDev) {
    connectSrc.push(
      'http://localhost:4000',
      'http://localhost:4000/api',
      'http://localhost:4000/api/v1',
      'http://127.0.0.1:4000',
      'ws://localhost:3000',
      'ws://localhost:3001',
      'webpack://*'
    )
  }

  if (apiGateway) connectSrc.push(apiGateway)
  if (cadEngine) connectSrc.push(cadEngine)

  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com"
    : `'self' 'nonce-${nonce}' https://va.vercel-scripts.com`

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://*.supabase.co",
    "img-src 'self' data: https: blob:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc}`,
    `connect-src ${connectSrc.join(' ')}`,
    "worker-src 'self' blob:",
    "font-src 'self' data:",
    "object-src 'none'",
    "media-src 'self' data: blob:",
  ]

  if (!isDev) {
    directives.push('upgrade-insecure-requests')
  }

  return directives.join('; ')
}

/**
 * Apply middleware to all routes except static assets
 */
export const config = {
  matcher: [
    {
      source:
        '/((?!_next/static|_next/image|favicon.ico|favicon.svg|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp|woff2|woff)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}