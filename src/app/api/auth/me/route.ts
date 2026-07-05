import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const sessionUser = getCurrentUser(request)
  if (!sessionUser) {
    return NextResponse.json({ user: null })
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, email: true, name: true }
    })

    if (!dbUser) {
      // Clear orphaned session cookie if user does not exist in DB (e.g. after seeding/reset)
      const response = NextResponse.json({ user: null })
      response.headers.append(
        'Set-Cookie',
        'asana_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;'
      )
      return response
    }

    return NextResponse.json({ user: dbUser })
  } catch (error) {
    console.error('Failed to verify user in /api/auth/me:', error)
    return NextResponse.json({ user: null })
  }
}
