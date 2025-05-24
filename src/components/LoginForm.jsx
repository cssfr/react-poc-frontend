import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Button } from './ui'
import { Input } from './ui'
import { Label } from './ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui'
import { Alert, AlertDescription } from './ui'
import { useTheme } from '../contexts/ThemeContext'
import { Moon, Sun, Laptop, TrendingUp, BarChart3, AlertCircle } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const { theme, setTheme } = useTheme()

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setError('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const ThemeToggle = () => {
    const themes = [
      { value: 'light', icon: Sun, label: 'Light' },
      { value: 'dark', icon: Moon, label: 'Dark' },
      { value: 'system', icon: Laptop, label: 'System' },
    ]

    return (
      <div className="flex items-center gap-1 rounded-lg border p-1">
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
              theme === value
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
            title={label}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-bg p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <TrendingUp className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold">BacktestPro</h1>
          </div>
          <p className="text-white/90 mt-4 text-lg">
            Professional backtesting platform for algorithmic trading strategies
          </p>
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="glass rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="h-6 w-6 text-white" />
              <h3 className="text-white font-semibold">Advanced Analytics</h3>
            </div>
            <p className="text-white/80 text-sm">
              Comprehensive performance metrics, risk analysis, and detailed trade history for your strategies.
            </p>
          </div>
          
          <div className="glass rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="h-6 w-6 text-white" />
              <h3 className="text-white font-semibold">Strategy Management</h3>
            </div>
            <p className="text-white/80 text-sm">
              Create, test, and optimize your trading strategies with our powerful backtesting engine.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Theme toggle */}
          <div className="flex justify-end">
            <ThemeToggle />
          </div>

          {/* Mobile branding */}
          <div className="text-center lg:hidden">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold">BacktestPro</h1>
            </div>
            <p className="text-muted-foreground">
              Professional backtesting platform
            </p>
          </div>

          <Card className="animate-slide-up">
            <CardHeader className="text-center">
              <CardTitle>{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
              <CardDescription>
                {isSignUp 
                  ? 'Sign up to start backtesting your strategies'
                  : 'Sign in to your BacktestPro account'
                }
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {error && (
                  <Alert variant={error.includes('Check your email') ? 'default' : 'destructive'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </div>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setError(null)
                    }}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    disabled={loading}
                  >
                    {isSignUp 
                      ? 'Already have an account? Sign in' 
                      : "Don't have an account? Sign up"
                    }
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}