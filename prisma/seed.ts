import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  // Clear all data
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  console.log('Seeding 10 demo members...')
  
  // Define 10 demo members
  const demoUsers = [
    { email: 'yamada@example.com', name: '山田 太郎' },
    { email: 'sato@example.com', name: '佐藤 美咲' },
    { email: 'suzuki@example.com', name: '鈴木 一郎' },
    { email: 'takahashi@example.com', name: '高橋 健二' },
    { email: 'tanaka@example.com', name: '田中 裕子' },
    { email: 'ito@example.com', name: '伊藤 直樹' },
    { email: 'watanabe@example.com', name: '渡辺 真一' },
    { email: 'yamamoto@example.com', name: '山本 恵' },
    { email: 'nakamura@example.com', name: '中村 俊介' },
    { email: 'kobayashi@example.com', name: '小林 陽子' },
  ]

  const createdUsers: any[] = []
  
  for (const u of demoUsers) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        password: hashPassword('password123', u.email),
      },
    })
    createdUsers.push(user)
  }

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

  // Create Tasks with assignments spread across users
  await prisma.task.create({
    data: {
      title: '要件定義書の作成',
      description: '基本要件を整理し、関係者へレビューする。',
      status: 'TODO',
      projectId: project1.id,
      assigneeId: createdUsers[0].id, // 山田 太郎
      dueDate: new Date('2026-07-15'),
    }
  })

  await prisma.task.create({
    data: {
      title: 'ワイヤーフレーム設計',
      description: 'Figmaを使ってUIのワイヤーフレームを設計する。',
      status: 'IN_PROGRESS',
      projectId: project1.id,
      assigneeId: createdUsers[1].id, // 佐藤 美咲
      dueDate: new Date('2026-07-20'),
    }
  })

  await prisma.task.create({
    data: {
      title: 'ロゴデザインの確定',
      description: 'ブランドロゴのカラーバリエーションを確定する。',
      status: 'DONE',
      projectId: project2.id,
      assigneeId: createdUsers[2].id, // 鈴木 一郎
      dueDate: new Date('2026-07-01'),
    }
  })

  await prisma.task.create({
    data: {
      title: 'LPの原稿執筆',
      description: '紹介用ランディングページのテキストを執筆する。',
      status: 'TODO',
      projectId: project2.id,
      assigneeId: createdUsers[3].id, // 高橋 健二
      dueDate: new Date('2026-07-10'),
    }
  })

  await prisma.task.create({
    data: {
      title: '開発環境の構築と検証',
      description: 'ローカルおよびVercel本番でのDB接続テストを実施する。',
      status: 'IN_PROGRESS',
      projectId: project1.id,
      assigneeId: createdUsers[4].id, // 田中 裕子
      dueDate: new Date('2026-07-05'),
    }
  })

  console.log('Seed data created successfully with 10 demo members!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
