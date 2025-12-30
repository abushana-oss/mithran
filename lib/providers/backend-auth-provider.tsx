'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi, type AuthUser, apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Check if a user's email exists in the authorized_users table
 */
async function checkUserAuthorization(email: string): Promise<boolean> {
  if (!supabase) {
    return false
  }

  try {
    // Try to use the RPC function first (more secure/robust)
    const { data: isAuthorized, error: rpcError } = await supabase.rpc('is_user_authorized')
    
    if (!rpcError && typeof isAuthorized === 'boolean') {
      return isAuthorized
    }

    // Fallback to direct query if RPC fails or returns null
    // (This is kept for backward compatibility or if RPC is missing)
    console.warn('RPC check failed, falling back to direct query:', rpcError)
    
    const { data, error } = await supabase
      .from('authorized_users')
      .select('is_active')
      .eq('email', email)
      .limit(1)

    if (error) {
      console.error('Authorization check failed:', error)
      return false
    }

    // User is authorized if a record is found and it's active
    return data?.length > 0 && data[0].is_active === true
  } catch (e) {
    console.error('Unexpected error during authorization check:', e)
    return false
  }
}

export function BackendAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user on mount
  const loadUser = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        // Check if user is authorized
        const isAuthorized = await checkUserAuthorization(session.user.email || '')

        if (!isAuthorized) {
          // User is not authorized - sign them out silently
          await supabase.auth.signOut()
          setUser(null)
          setLoading(false)
          return
        }

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          createdAt: session.user.created_at,
        } as AuthUser)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const signIn = async (email: string, password: string) => {
    try {
      if (!supabase) {
        toast.error('Authentication is not configured.')
        return { error: new Error('Supabase not configured') }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('Email not confirmed')) {
          toast.error('Please confirm your email address first. Check your inbox for the confirmation link.', { duration: 8000 })
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.')
        } else {
          toast.error(error.message || 'Login failed. Please try again.')
        }
        return { error: error as Error }
      }

      if (data.user) {
        // Check if user is authorized by querying the authorized_users table
        const isAuthorized = await checkUserAuthorization(data.user.email || '')

        if (!isAuthorized) {
          // User is not authorized - sign them out
          await supabase.auth.signOut()
          toast.error('Access denied. Please use your company email or request a demo.', { duration: 6000 })
          return { error: new Error('User not authorized') }
        }

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          fullName: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
          createdAt: data.user.created_at,
        } as AuthUser)
        toast.success('Welcome back!')
      }

      return { error: null }
    } catch (error: any) {
      toast.error(error?.message || 'Login failed. Please try again.')
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      if (!supabase) {
        toast.error('Authentication is not configured.')
        return { error: new Error('Supabase not configured') }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('User already registered')) {
          toast.error('An account with this email already exists. Please login instead.')
        } else if (error.message.includes('Password')) {
          toast.error(error.message)
        } else {
          toast.error(error.message || 'Registration failed. Please try again.')
        }
        return { error: error as Error }
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        toast.success('Account created! Please check your email to confirm your account before logging in.', { duration: 8000 })
        return { error: null }
      }

      // Immediate login (email confirmation disabled)
      if (data.user && data.session) {
        // Check if user is authorized
        const isAuthorized = await checkUserAuthorization(data.user.email || '')

        if (!isAuthorized) {
          // User is not authorized - sign them out
          await supabase.auth.signOut()
          toast.error('Access denied. Your account has been created but is not authorized yet. Please request a demo or contact your administrator.', { duration: 8000 })
          return { error: new Error('User not authorized') }
        }

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          fullName: data.user.user_metadata?.full_name || '',
          createdAt: data.user.created_at,
        } as AuthUser)
        toast.success('Account created successfully! You are now logged in.')
      }

      return { error: null }
    } catch (error: any) {
      toast.error(error?.message || 'Registration failed. Please try again.')
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut()
      }
    } finally {
      setUser(null)
      apiClient.setAccessToken(null)
      apiClient.setRefreshToken(null)
    }
  }

  const signInWithGoogle = async () => {
    try {
      if (!supabase) {
        toast.error('Google Sign-In is not configured. Please add your Supabase credentials.')
        return { error: new Error('Supabase not configured') }
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error('Failed to sign in with Google')
        return { error: error as Error }
      }

      return { error: null }
    } catch (error: any) {
      toast.error('Failed to sign in with Google')
      return { error: error as Error }
    }
  }

  const refreshUser = async () => {
    if (!supabase) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          createdAt: session.user.created_at,
        } as AuthUser)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a BackendAuthProvider')
  }
  return context
}
