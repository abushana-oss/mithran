'use client'

import { useEffect } from 'react'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/lib/providers/theme-provider'
import { QueryProvider } from '@/lib/providers/query-provider'
import { SupabaseAuthProvider } from '@/lib/providers/supabase-auth-provider'
import { initializeApiClient } from '@/lib/api/init'
import { useCorrelationContext } from '@/lib/hooks/useCorrelationContext'

import dynamic from 'next/dynamic'

// Dynamically import React Query DevTools (development only)
const ReactQueryDevtools = dynamic(
  () =>
    import('@tanstack/react-query-devtools').then((mod) => ({
      default: mod.ReactQueryDevtools,
    })),
  { ssr: false }
)

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize correlation context for request tracing (without auth dependency)
  useCorrelationContext();

  useEffect(() => {
    // Initialize API client with interceptors
    initializeApiClient()
  }, [])

  return (
    <ThemeProvider>
      <SupabaseAuthProvider>
        <QueryProvider>
          <TooltipProvider>
            {children}
            <Sonner />
          </TooltipProvider>
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryProvider>
      </SupabaseAuthProvider>
    </ThemeProvider>
  )
}
