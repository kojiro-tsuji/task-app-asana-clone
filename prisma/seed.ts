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

  console.log('Seeding Projects with linked members...')

  // Create Projects with linked members (many-to-many)
  const project1 = await prisma.project.create({
    data: {
      name: '次期製品開発プロジェクト',
      members: {
        connect: [
          { id: createdUsers[0].id }, // 山田 太郎
          { id: createdUsers[1].id }, // 佐藤 美咲
          { id: createdUsers[4].id }, // 田中 裕子
          { id: createdUsers[5].id }, // 伊藤 直樹
          { id: createdUsers[6].id }, // 渡辺 真一
        ]
      }
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'マーケティングキャンペーン',
      members: {
        connect: [
          { id: createdUsers[0].id }, // 山田 太郎
          { id: createdUsers[2].id }, // 鈴木 一郎
          { id: createdUsers[3].id }, // 高橋 健二
          { id: createdUsers[7].id }, // 山本 恵
          { id: createdUsers[8].id }, // 中村 俊介
        ]
      }
    },
  })

  const project3 = await prisma.project.create({
    data: {
      name: '社内業務効率化ツール導入',
      members: {
        connect: [
          { id: createdUsers[0].id }, // 山田 太郎
          { id: createdUsers[1].id }, // 佐藤 美咲
          { id: createdUsers[9].id }, // 小林 陽子
        ]
      }
    },
  })

  console.log('Seeding Tasks...')

  // Project 1 Tasks (Next Product Development)
  await prisma.task.create({
    data: {
      title: '製品ロードマップの策定',
      description: '次期の製品リリースターゲットとマイルストーンを定義する。',
      status: 'DONE',
      projectId: project1.id,
      assigneeId: createdUsers[0].id, // 山田 太郎
      dueDate: new Date('2026-06-30'),
    }
  })

  await prisma.task.create({
    data: {
      title: '要件定義書の作成とレビュー',
      description: 'コア機能の基本要件を整理し、関係者への説明と承認を受ける。',
      status: 'IN_PROGRESS',
      projectId: project1.id,
      assigneeId: createdUsers[0].id, // 山田 太郎
      dueDate: new Date('2026-07-15'),
    }
  })

  await prisma.task.create({
    data: {
      title: 'FigmaでのUI/UXデザイン設計',
      description: 'メイン画面のワイヤーフレームおよびプロトタイプを作成する。',
      status: 'IN_PROGRESS',
      projectId: project1.id,
      assigneeId: createdUsers[1].id, // 佐藤 美咲
      dueDate: new Date('2026-07-20'),
    }
  })

  await prisma.task.create({
    data: {
      title: 'データベース設計およびマイグレーション検証',
      description: 'Prismaスキーマの設計を行い、開発サーバーへの適用テストを実施。',
      status: 'TODO',
      projectId: project1.id,
      assigneeId: createdUsers[4].id, // 田中 裕子
      dueDate: new Date('2026-07-25'),
    }
  })

  await prisma.task.create({
    data: {
      title: 'Next.jsによるベースプロジェクト構築',
      description: 'プロジェクト環境設定、Tailwind CSS v4の設定、ディレクトリ初期化。',
      status: 'DONE',
      projectId: project1.id,
      assigneeId: createdUsers[5].id, // 伊藤 直樹
      dueDate: new Date('2026-07-05'),
    }
  })

  // Project 2 Tasks (Marketing Campaign)
  await prisma.task.create({
    data: {
      title: 'ロゴデザインの確定',
      description: 'ブランドロゴのカラーバリエーションを確定し、アセットを書き出す。',
      status: 'DONE',
      projectId: project2.id,
      assigneeId: createdUsers[2].id, // 鈴木 一郎
      dueDate: new Date('2026-07-01'),
    }
  })

  await prisma.task.create({
    data: {
      title: 'キャンペーン紹介LPの原稿執筆',
      description: 'キャッチコピーおよびLP各セクションのテキストを完成させる。',
      status: 'IN_PROGRESS',
      projectId: project2.id,
      assigneeId: createdUsers[3].id, // 高橋 健二
      dueDate: new Date('2026-07-10'),
    }
  })

  await prisma.task.create({
    data: {
      title: 'SNS用クリエイティブ画像作成',
      description: '広告および広報用の画像パーツを3パターン作成し、レビューにかける。',
      status: 'TODO',
      projectId: project2.id,
      assigneeId: createdUsers[7].id, // 山本 恵
      dueDate: new Date('2026-07-18'),
    }
  })

  await prisma.task.create({
    data: {
      title: 'プレスリリース原稿の作成',
      description: '新サービス開始の発表用ドキュメントをドラフトする。',
      status: 'TODO',
      projectId: project2.id,
      assigneeId: createdUsers[8].id, // 中村 俊介
      dueDate: new Date('2026-07-28'),
    }
  })

  // Project 3 Tasks (Internal Tools)
  await prisma.task.create({
    data: {
      title: '候補ツールの比較検討と選定',
      description: 'Slack/Teams/Asana等のプランおよび連携機能の比較資料を作成。',
      status: 'DONE',
      projectId: project3.id,
      assigneeId: createdUsers[9].id, // 小林 陽子
      dueDate: new Date('2026-06-25'),
    }
  })

  await prisma.task.create({
    data: {
      title: '初期アカウントの作成とメンバー招待',
      description: '対象メンバーのアカウントを一括作成し、初回登録メールを送信する。',
      status: 'DONE',
      projectId: project3.id,
      assigneeId: createdUsers[0].id, // 山田 太郎
      dueDate: new Date('2026-07-02'),
    }
  })

  await prisma.task.create({
    data: {
      title: '社内向けスタートアップガイドの作成',
      description: 'ツールの初期設定手順と主要な利用ルールをまとめたドキュメントを作成。',
      status: 'TODO',
      projectId: project3.id,
      assigneeId: createdUsers[1].id, // 佐藤 美咲
      dueDate: new Date('2026-07-15'),
    }
  })

  console.log('Seed data created successfully with 3 projects, 10 members, and realistic tasks!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
