import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    })
    return NextResponse.json(projects)
  } catch (error) {
    console.error('GET projects error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: { name },
    })
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('POST project error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
