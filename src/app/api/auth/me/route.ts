import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
  const user = getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({ user })
}
