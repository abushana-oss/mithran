'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/providers/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
const COMPANY_EMAIL_DOMAIN = '@mithran.com' // Change this to your company domain

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const validateCompanyEmail = (email: string) => {
    return email.toLowerCase().endsWith(COMPANY_EMAIL_DOMAIN)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateCompanyEmail(email)) {
      toast.error(`Please use your company email (${COMPANY_EMAIL_DOMAIN})`)
      return
    }

    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        toast.error(`Login failed: ${error.message}`)
      } else {
        router.push('/')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    toast.info('Google Sign In - Coming soon')
    // Implement Google OAuth here
  }

  return (
    <div className="min-h-screen flex relative">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-card to-secondary p-12 flex-col relative overflow-hidden"
           style={{
             clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)'
           }}>

        <div className="relative z-10 text-center flex-1 flex flex-col justify-center items-center -ml-8 pt-8">
          <h1 className="text-4xl font-bold text-foreground mb-8 tracking-tight">MITHRAN</h1>
          <h2 className="text-3xl font-semibold text-foreground mb-4">Welcome back!</h2>
          <p className="text-muted-foreground text-base max-w-xs">
            One-stop solution provider to all manufacturing segments
          </p>
        </div>

        {/* Illustration at bottom */}
        <div className="flex justify-center items-end relative z-10 pb-8">
          <div className="relative w-full max-w-sm">
            <svg viewBox="0 0 400 400" className="w-full h-auto">
              {/* Chair/Seat */}
              <ellipse cx="200" cy="320" rx="110" ry="130" fill="hsl(38 92% 60%)" opacity="0.9"/>
              <ellipse cx="200" cy="305" rx="95" ry="115" fill="hsl(38 92% 65%)" opacity="0.8"/>
              <ellipse cx="200" cy="290" rx="80" ry="100" fill="hsl(38 92% 70%)" opacity="0.7"/>

              {/* Person body */}
              <ellipse cx="200" cy="220" rx="45" ry="55" fill="hsl(220 20% 35%)"/>

              {/* Person head */}
              <circle cx="200" cy="155" r="35" fill="hsl(20 60% 70%)"/>

              {/* Hair */}
              <path d="M 165 155 Q 165 130 200 125 Q 235 130 235 155 Q 235 165 225 165 Q 220 155 200 155 Q 180 155 175 165 Q 165 165 165 155" fill="hsl(0 5% 20%)"/>

              {/* Laptop */}
              <rect x="165" y="250" width="70" height="45" rx="3" fill="hsl(220 15% 25%)"/>
              <rect x="170" y="255" width="60" height="35" fill="hsl(187 100% 42%)"/>

              {/* Desk on right */}
              <rect x="310" y="240" width="55" height="6" rx="2" fill="hsl(25 35% 35%)"/>
              <rect x="345" y="205" width="6" height="35" fill="hsl(25 35% 35%)"/>

              {/* Books on desk */}
              <rect x="318" y="225" width="16" height="15" fill="hsl(0 72% 51%)"/>
              <rect x="326" y="217" width="16" height="23" fill="hsl(187 100% 42%)"/>
              <rect x="334" y="228" width="16" height="12" fill="hsl(160 70% 45%)"/>

              {/* Window/Frame on left */}
              <rect x="70" y="100" width="75" height="55" rx="3" fill="hsl(210 15% 80%)" opacity="0.4"/>
              <line x1="107.5" y1="100" x2="107.5" y2="155" stroke="hsl(220 10% 60%)" strokeWidth="2"/>
              <line x1="70" y1="127.5" x2="145" y2="127.5" stroke="hsl(220 10% 60%)" strokeWidth="2"/>

              {/* Plant at bottom left */}
              <ellipse cx="90" cy="360" rx="18" ry="12" fill="hsl(25 40% 30%)"/>
              <path d="M 90 360 Q 82 343 87 328" stroke="hsl(160 70% 45%)" strokeWidth="3" fill="none"/>
              <path d="M 90 360 Q 98 343 93 328" stroke="hsl(160 70% 45%)" strokeWidth="3" fill="none"/>
              <circle cx="87" cy="328" r="7" fill="hsl(160 70% 45%)"/>
              <circle cx="93" cy="328" r="7" fill="hsl(160 70% 45%)"/>

              {/* Shoe */}
              <ellipse cx="210" cy="355" rx="25" ry="12" fill="hsl(350 60% 50%)" opacity="0.9"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-background relative">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Sign in your account</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Type Your Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-14 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 focus-visible:border-primary rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Type Your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="h-14 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 focus-visible:border-primary rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-card hover:bg-card/80 text-foreground font-semibold rounded-2xl transition-all duration-200 border border-border/50"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full h-14 border-border bg-secondary/30 hover:bg-secondary/50 hover:text-foreground hover:border-primary/50 rounded-2xl font-semibold transition-all duration-200"
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
          </form>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/demo" className="text-primary hover:underline font-medium">
                Request a demo
              </Link>
            </p>
          </div>

          {/* Progress indicator dots at bottom */}
          <div className="flex justify-center gap-2 pt-4">
            <Link href="/demo">
              <div className="w-8 h-1 bg-muted-foreground/30 rounded-full cursor-pointer hover:bg-muted-foreground/50 transition-colors" />
            </Link>
            <div className="w-8 h-1 bg-muted-foreground/30 rounded-full cursor-pointer hover:bg-muted-foreground/50 transition-colors" />
            <Link href="/auth">
              <div className="w-8 h-1 bg-muted-foreground rounded-full cursor-pointer hover:bg-primary transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
