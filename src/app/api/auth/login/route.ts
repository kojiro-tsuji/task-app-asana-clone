import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const hashedPassword = hashPassword(password, user.email)
    if (user.password !== hashedPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Sign session token
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name
    })

    // Set cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

    // Secure cookie setup
    response.headers.append(
      'Set-Cookie',
      `asana_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; ${
        process.env.NODE_ENV === 'production' ? 'Secure;' : ''
      }`
    )

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
