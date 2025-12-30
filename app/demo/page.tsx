'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function DemoPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Implement demo request submission here
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Demo request submitted! We will contact you soon.')
      // Reset form
      setFullName('')
      setEmail('')
      setCompany('')
      setPhone('')
    } catch (error) {
      toast.error('Failed to submit demo request')
    } finally {
      setLoading(false)
    }
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
          <h2 className="text-3xl font-semibold text-foreground mb-4">Request a Demo</h2>
          <p className="text-muted-foreground text-base max-w-xs">
            See how Mithran can transform your manufacturing operations
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

      {/* Right Side - Demo Request Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-background relative">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Request for Demo</h2>
            <p className="text-sm text-muted-foreground">Fill in your details and we'll get back to you</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold text-foreground">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Type Your Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="h-14 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 focus-visible:border-primary rounded-xl"
              />
            </div>

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
              <Label htmlFor="company" className="text-sm font-semibold text-foreground">
                Company Name
              </Label>
              <Input
                id="company"
                type="text"
                placeholder="Type Your Company Name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                disabled={loading}
                className="h-14 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 focus-visible:border-primary rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-foreground">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Type Your Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
                className="h-14 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 focus-visible:border-primary rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 rounded-2xl transition-all duration-200 glow-effect"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Request Demo'
              )}
            </Button>
          </form>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Progress indicator dots at bottom */}
          <div className="flex justify-center gap-2 pt-4">
            <Link href="/demo">
              <div className="w-8 h-1 bg-muted-foreground rounded-full cursor-pointer hover:bg-primary transition-colors" />
            </Link>
            <div className="w-8 h-1 bg-muted-foreground/30 rounded-full cursor-pointer hover:bg-muted-foreground/50 transition-colors" />
            <Link href="/auth">
              <div className="w-8 h-1 bg-muted-foreground/30 rounded-full cursor-pointer hover:bg-muted-foreground/50 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
