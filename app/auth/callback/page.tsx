'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!supabase) {
          console.error('Supabase client not configured')
          toast.error('Google Sign-In is not configured.')
          router.push('/auth')
          return
        }

        // The Supabase SSR client handles the code exchange automatically
        // Just check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          toast.error('Authentication failed. Please try again.')
          router.push('/auth')
          return
        }

        if (session?.user) {
          // Check if user is authorized using the RPC function (enforced by RLS)
          try {
            const { data: isAuthorized, error: authError } = await supabase.rpc('is_user_authorized')

            if (authError) {
              console.error('Authorization RPC failed:', authError)
              // Fallback to manual check (though likely to fail if RLS blocks it)
              const { data: authData, error: queryError } = await supabase
                .from('authorized_users')
                .select('is_active')
                .eq('email', session.user.email)
                .limit(1)

              if (queryError) {
                throw new Error('Failed to check authorization: ' + queryError.message)
              }
              
              if (!(authData?.length > 0 && authData[0].is_active === true)) {
                 throw new Error('User not authorized (fallback check)')
              }
            } else if (!isAuthorized) {
              // User is not authorized according to RPC
              await supabase.auth.signOut()
              toast.error('Access denied. Please use your company email or request a demo.', { duration: 6000 })
              router.push('/auth')
              return
            }

            // User is authorized
            toast.success(`Successfully signed in as ${session.user.email}!`)
            router.push('/')
            router.refresh()
          } catch (authCheckError) {
            // Authorization check failed
            await supabase.auth.signOut()
            toast.error('Access denied. Please use your company email or request a demo.', { duration: 6000 })
            router.push('/auth')
          }
        } else {
          toast.error('Authentication failed. No session found.')
          router.push('/auth')
        }
      } catch (error: any) {
        console.error('Unexpected error during auth callback:', error)
        toast.error('An unexpected error occurred. Please try again.')
        router.push('/auth')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Signing you in...</h2>
        <p className="text-muted-foreground">Please wait while we complete your authentication.</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
