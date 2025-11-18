import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/utils/apiError'
import { logger } from '@/lib/utils/logger'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'no-reply@assetra.xyz'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, subject, html, stage } = body as {
      to: string
      subject: string
      html: string
      stage?: string
    }

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY missing. Email not sent.', { to, subject, stage })
      return NextResponse.json({ queued: false, simulated: true })
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Email delivery failed: ${text}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

