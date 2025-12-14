import { NextRequest, NextResponse } from 'next/server'

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
  "What is something you wish you could change?",
  "What is your favorite way to relax?",
  "What inspires you these days?",
  "What is a skill you'd like to develop?",
  "What does success look like for you?",
  "What is something you're proud of?",
  "What would you do if you weren't afraid?",
  "What is your favorite memory from this year?",
  "What is something that surprised you recently?",
]

export async function GET() {
  try {
    // Return a random prompt
    const randomPrompt = reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)]

    return NextResponse.json({ prompt: randomPrompt })
  } catch (error) {
    console.error('Error generating prompt:', error)
    return NextResponse.json({ error: 'Failed to generate prompt' }, { status: 500 })
  }
}
