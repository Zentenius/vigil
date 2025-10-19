import { mistral } from '@ai-sdk/mistral'
import { streamText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    console.log('🧪 Test Navio request:', { message })
    console.log('🔑 API Key exists:', !!process.env.MISTRAL_API_KEY)
    console.log('🔑 API Key length:', process.env.MISTRAL_API_KEY?.length)

    const result = streamText({
      model: mistral('mistral-small-2503'),
      system: `You are Navio, an expert CXC AI tutor helping Caribbean students prepare for examinations.
Be helpful, encouraging, and provide clear explanations with practical examples.
Keep responses concise but informative.`,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    })

    console.log('✅ Stream created successfully')
    return result.toTextStreamResponse()
  } catch (error) {
    console.error('❌ Test Navio error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
