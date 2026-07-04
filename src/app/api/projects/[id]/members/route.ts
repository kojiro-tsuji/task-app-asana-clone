import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 })
    }

    // すでに登録されているかチェック
    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'プロジェクトが見つかりません。' }, { status: 404 })
    }

    const isAlreadyMember = project.members.some((m) => m.id === user.id)
    if (isAlreadyMember) {
      return NextResponse.json({ error: 'このユーザーは既にプロジェクトのメンバーです。' }, { status: 400 })
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        members: {
          connect: { id: user.id },
        },
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Add member error:', error)
    return NextResponse.json({ error: 'メンバーの追加に失敗しました。' }, { status: 500 })
  }
}
