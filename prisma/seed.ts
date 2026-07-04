import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  // Clear all data
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      email: 'yamada@example.com',
      name: '山田 太郎',
      password: hashPassword('password123', 'yamada@example.com'),
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'sato@example.com',
      name: '佐藤 美咲',
      password: hashPassword('password123', 'sato@example.com'),
    },
  })

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: '次期製品開発プロジェクト',
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'マーケティングキャンペーン',
    },
  })

  // Create Tasks
  await prisma.task.create({
    data: {
      title: '要件定義書の作成',
      description: '基本要件を整理し、関係者へレビューする。',
      status: 'TODO',
      projectId: project1.id,
      assigneeId: user1.id,
      dueDate: new Date('2026-07-15'),
    }
  })

  await prisma.task.create({
    data: {
      title: 'ワイヤーフレーム設計',
      description: 'Figmaを使ってUIのワイヤーフレームを設計する。',
      status: 'IN_PROGRESS',
      projectId: project1.id,
      assigneeId: user2.id,
      dueDate: new Date('2026-07-20'),
    }
  })

  await prisma.task.create({
    data: {
      title: 'ロゴデザインの確定',
      description: 'ブランドロゴのカラーバリエーションを確定する。',
      status: 'DONE',
      projectId: project2.id,
      assigneeId: user1.id,
      dueDate: new Date('2026-07-01'),
    }
  })

  await prisma.task.create({
    data: {
      title: 'LPの原稿執筆',
      description: '紹介用ランディングページのテキストを執筆する。',
      status: 'TODO',
      projectId: project2.id,
      assigneeId: user2.id,
      dueDate: new Date('2026-07-10'),
    }
  })

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
