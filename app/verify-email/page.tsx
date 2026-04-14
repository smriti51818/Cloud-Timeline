'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'

/**
 * Verify Email Page - Component that handles the verification logic
 */
function VerifyEmailContent() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        const email = searchParams.get('email')
        const token = searchParams.get('token')

        if (!email || !token) {
            setStatus('error')
            setMessage('Missing email or verification token.')
            return
        }

        async function verify() {
            try {
                const res = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    body: JSON.stringify({ email, token }),
                    headers: { 'Content-Type': 'application/json' }
                })

                const data = await res.json()

                if (res.ok) {
                    setStatus('success')
                    setMessage(data.message)
                } else {
                    setStatus('error')
                    setMessage(data.error || 'Verification failed.')
                }
            } catch (err) {
                setStatus('error')
                setMessage('An error occurred during verification.')
            }
        }

        verify()
    }, [searchParams])

    return (
        <Card className="w-full max-w-md shadow-xl border-white/40 bg-white/70 backdrop-blur-md">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center">
                        <Sparkles className="w-6 h-6" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
                <CardDescription>
                    {status === 'loading' && 'Verifying your account...'}
                    {status === 'success' && 'Account verified!'}
                    {status === 'error' && 'Verification failed'}
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-6">
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground italic">
                            Communicating with our secure vault...
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-green-800 font-medium">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-red-800 font-medium">{message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            The link may have expired or already been used.
                        </p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="justify-center border-t py-6 bg-gray-50/50 rounded-b-xl">
                {status !== 'loading' && (
                    <Button asChild className="w-full max-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600">
                        <Link href="/login">Return to Login</Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}

/**
 * Main Page Wrapper with Suspense for useSearchParams
 */
export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
            <Suspense fallback={
                <Card className="w-full max-w-md p-12 flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </Card>
            }>
                <VerifyEmailContent />
            </Suspense>
        </div>
    )
}
