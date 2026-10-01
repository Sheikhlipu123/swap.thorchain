import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await db.execute(sql`SELECT public_id, recipient_name, amount, asset, chain, destination_address, description, status, expires_at, created_at, updated_at FROM payment_requests WHERE public_id = ${id} LIMIT 1`)
  const payment = result.rows[0]
  if (!payment) return NextResponse.json({ error: 'Payment request not found' }, { status: 404 })
  if (payment.expires_at && new Date(String(payment.expires_at)) < new Date() && payment.status === 'pending') {
    await db.execute(sql`UPDATE payment_requests SET status = 'expired', updated_at = NOW() WHERE public_id = ${id}`)
    payment.status = 'expired'
  }
  return NextResponse.json({ payment })
}
