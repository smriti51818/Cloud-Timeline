'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'

/**
 * Reset Password Content - Handles the actual password update.
 */
function ResetPasswordContent() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const searchParams = useSearchParams()
    const router = useRouter()

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const newPassword = formData.get('password')
        const confirmPassword = formData.get('confirmPassword')
        const email = searchParams.get('email')
        const token = searchParams.get('token')

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.')
            setIsLoading(false)
            return
        }

        if (!email || !token) {
            setError('Invalid or expired reset link.')
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch('/api/auth/password-reset', {
                method: 'POST',
                body: JSON.stringify({ email, token, newPassword }),
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await res.json()

            if (res.ok) {
                setSuccess(true)
            } else {
                setError(data.error || 'Failed to reset password.')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="w-full max-w-md bg-white/70 backdrop-blur-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Password Reset</CardTitle>
                    <CardDescription>
                        Your password has been successfully updated. You can now log in with your new password.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center border-t py-6">
                    <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                        <Link href="/login">Login Now</Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md bg-white/70 backdrop-blur-md shadow-xl border-white/40">
            <CardHeader className="space-y-1">
                <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">New Password</CardTitle>
                <CardDescription>
                    Please enter your new password below.
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
                        <label className="text-sm font-medium leading-none" htmlFor="password">
                            New Password
                        </label>
                        <Input id="password" name="password" type="password" required disabled={isLoading} />
                        <p className="text-[10px] text-muted-foreground">Minimum 12 characters for strong protection.</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">
                            Confirm New Password
                        </label>
                        <Input id="confirmPassword" name="confirmPassword" type="password" required disabled={isLoading} />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t py-6 bg-gray-50/50 rounded-b-xl">
                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Update Password
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}

/**
 * Reset Password Page with Suspense
 */
export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
            <Suspense fallback={
                <Card className="w-full max-w-md p-12 flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </Card>
            }>
                <ResetPasswordContent />
            </Suspense>
        </div>
    )
}
