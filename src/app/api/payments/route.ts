import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { z } from 'zod'

const createSchema = z.object({
  recipientName: z.string().trim().max(80).optional(),
  amount: z.string().trim().regex(/^\d+(\.\d+)?$/, 'Enter a valid amount'),
  asset: z.string().trim().min(2).max(80),
  chain: z.string().trim().min(2).max(20),
  destinationAddress: z.string().trim().min(10).max(200),
  description: z.string().trim().max(240).optional(),
  expiresAt: z.string().datetime().optional()
})

function publicId() {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 8)
}

export async function POST(request: Request) {
  const parsed = createSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  const input = parsed.data
  const id = publicId()
  try {
    await db.execute(sql`INSERT INTO payment_requests (public_id, recipient_name, amount, asset, chain, destination_address, description, status, expires_at) VALUES (${id}, ${input.recipientName ?? null}, ${input.amount}, ${input.asset}, ${input.chain}, ${input.destinationAddress}, ${input.description ?? null}, 'pending', ${input.expiresAt ? new Date(input.expiresAt) : null})`)
    return NextResponse.json({ id, url: `/pay/${id}` }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Could not create payment request' }, { status: 500 })
  }
}
