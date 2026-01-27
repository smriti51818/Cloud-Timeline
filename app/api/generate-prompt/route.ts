import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { handleApiError, AuthenticationError } from '@/lib/error-handler'

const reflectionPrompts = [
  "What made you smile today?",
  "What challenged you this week?",
  "What are you grateful for right now?",
  "How have you grown in the past month?",
  "What memory would you like to revisit?",
  "What would you tell your younger self?",
  "What is something you're looking forward to?",
  "What did you learn from a recent mistake?",
  "Who has been your biggest supporter lately?",
  "What is a goal you're working towards?",
  "What does happiness mean to you right now?",
]

export async function GET() {
  try {
    // 1. Authenticate user
    const session = await getSession()
    if (!session?.user) {
      throw new AuthenticationError()
    }

    // 2. Return a random prompt
    const randomPrompt = reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)]

    return NextResponse.json({ prompt: randomPrompt })
  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
