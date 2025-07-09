'use client'

import { ShootingStars } from '@/components/shooting-stars'
import { StarsBackground } from '@/components/stars-background'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInUser } from '@/lib/actions'
import { Loader2, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null) // Clear previous errors

    if (!email || !password) {
      setError('Please fill in both email and password.')
      return
    }

    startTransition(async () => {
      try {
        const errorMessage = await signInUser(email, password)

        if (errorMessage) {
          setError('Invalid email or password. Please try again.')
        } else {
          router.push('/dashboard')
        }
      } catch (e) {
        setError('An unexpected network error occurred.')
        console.error(e)
      }
    })
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-black p-4 text-zinc-50">
      <Card className="z-10 w-full max-w-sm border-zinc-800 bg-black/50 backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-200">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Enter your credentials to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-zinc-400 hover:text-zinc-50 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-950/50">
                <Terminal className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-zinc-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold text-zinc-50 underline-offset-4 hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>

      {/* Background Effects */}
      <ShootingStars />
      <StarsBackground />
    </main>
  )
}
