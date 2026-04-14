'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

/**
 * Register Page - Secure multi-step registration flow.
 */
export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const email = formData.get('email')
        const password = formData.get('password')
        const name = formData.get('name')

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, name }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed')
            }

            setSuccess(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
                <Card className="w-full max-w-md border-green-100 bg-green-50/50">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-900">Verify Your Email</CardTitle>
                        <CardDescription className="text-green-800">
                            We've sent a verification link to your email address. 
                            Please check your inbox (and spam folder) to complete your registration.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center pt-2">
                        <Button variant="outline" className="text-green-700 border-green-200 hover:bg-green-100" onClick={() => router.push('/login')}>
                            Back to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12">
            <Card className="w-full max-w-md shadow-xl border-white/40 bg-white/70 backdrop-blur-md">
                <CardHeader className="text-center space-y-1">
                    <div className="flex justify-center mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
                    <CardDescription>
                        Join Cloud Timeline to preserve your memories
                    </CardDescription>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-100 rounded-md">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="name">
                                Full Name
                            </label>
                            <Input id="name" name="name" placeholder="John Doe" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none" htmlFor="email">
                                Email
                            </label>
                            <Input id="email" name="email" type="email" placeholder="name@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none" htmlFor="password">
                                Password
                            </label>
                            <Input id="password" name="password" type="password" required />
                            <p className="text-[11px] text-muted-foreground">
                                Must be at least 12 characters long for security.
                            </p>
                        </div>
                        <div className="pt-2">
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Register'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </form>
                <CardFooter className="flex flex-col space-y-4 border-t py-6 bg-gray-50/50 rounded-b-xl text-center">
                    <div className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Sign in
                        </Link>
                    </div>
                    <div className="text-[10px] text-muted-foreground px-4 leading-relaxed">
                        By clicking register, you agree to our Terms of Service and Privacy Policy. 
                        We protect your data with end-to-end field-level encryption.
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
