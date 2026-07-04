# Asana Clone - プロ仕様タスク管理プラットフォーム

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-16.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-v6.19-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vercel-Deploys-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

社内異動面談用ポートフォリオとして開発された、Asanaの操作感を忠実に再現したリッチなフルスタック・タスク管理ツールです。  
Next.js (App Router) + Supabase (PostgreSQL / Prisma) のモダンなWeb3層構造を採用し、高品質なUI/UXと堅牢なデータベース連携を最速で実現しました。

---

## 🚀 主な機能とUI/UX

Asanaの快適な操作性を追求し、細部までこだわり抜いて実装しています。

* **2レイアウトビュー（リスト & ボード）**
  * **リストビュー**: ステータスごとのアコーディオン開閉、期限のカラーアラート、インラインでのタスク即時追加（入力してEnter）など、Asana特有の高速インプットを再現。
  * **ボードビュー（カンバン）**: HTML5 Drag & Drop API を用い、カードをドラッグして「未着手」「進行中」「完了」の列へスムーズに移動。
* **楽観的UI更新（Optimistic Updates） & ドラッグ中フィードバック**
  * ドラッグ中は対象カードが半透明（不透明度40%）化し、青い破線に変化することで、掴んでいる手元が視覚的にクリアに見えるよう配慮。
  * ドロップした瞬間、裏で非同期APIが走りつつも、画面は一瞬で状態を切り替えるためノンストレス。
* **スライドオーバー（タスク詳細）パネル**
  * タスクを選択すると、右側から滑らかにスライドイン。
  * タイトル、説明、ステータス、期限、担当者、プロジェクトをリアルタイム編集でき、入力欄からフォーカスが外れると自動的に保存（PATCH）されます。
* **プロジェクト & メンバー即時追加**
  * サイドバーから、プロジェクトやメンバーをポップアップで瞬時に追加でき、即座にタスクの関連付けに反映。

---

## 🏗️ システムアーキテクチャ

本アプリケーションは、Next.jsのAPI Routes（Route Handlers）を活用し、余計な外部サーバーを使わない「Next.js + Supabase」の効率的なサーバーレス・Web3層構造で完結しています。

```mermaid
graph LR
    %% スタイル定義
    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    classDef server fill:#f3e8ff,stroke:#7c3aed,stroke-width:2px;
    classDef db fill:#ecfdf5,stroke:#059669,stroke-width:2px;

    subgraph Client ["🌐 フロントエンド (ブラウザ)"]
        UI["🎨 React 19 / Tailwind CSS"]:::client
        Dnd["📦 HTML5 Drag & Drop (楽観的UI更新)"]:::client
    end

    subgraph Backend ["⚙️ バックエンド (API / Web Server)"]
        NextAPI["⚡ Next.js App Router API Routes"]:::server
        Prisma["💎 Prisma ORM (シングルトンパターン)"]:::server
    end

    subgraph Database ["💾 クラウドデータベース"]
        SupaDB["⚡ Supabase Cloud (PostgreSQL)"]:::db
    end

    UI -->|"① ユーザー操作 (ドラッグ等)"| Dnd
    Dnd -->|"② 非同期リクエスト (JSON)"| NextAPI
    NextAPI -->|"③ データベース操作"| Prisma
    Prisma -->|"④ 接続プーラー経由 (6543)"| SupaDB
```

### 📊 データベース定義 (ER図)

Prismaによるデータベーススキーマ定義は以下の通り設計しています。

```mermaid
erDiagram
    User {
        String id PK
        String email UK
        String name
        DateTime createdAt
    }
    Project {
        String id PK
        String name
        DateTime createdAt
    }
    Task {
        String id PK
        String title
        String description
        String status
        DateTime dueDate
        String projectId FK
        String assigneeId FK
        DateTime createdAt
        DateTime updatedAt
    }

    User ||--o{ Task : "assigns"
    Project ||--o{ Task : "contains"
```

---

## 🛠️ 技術スタック

* **コア技術**: TypeScript, React 19, Next.js 16.2 (App Router)
* **スタイリング**: Tailwind CSS v4, Lucide React (アイコン)
* **データベース・ORM**: Supabase (PostgreSQL), Prisma 6.19
* **ホスティング**: Vercel

---

## 💡 技術的なこだわり・工夫点

1. **Prismaの接続管理（Transaction vs Session Mode）＆ IPv4/IPv6の互換性対策**
   * Supabaseのコネクションプーラー（Transaction mode: ポート `6543`）を `DATABASE_URL` に設定し、Vercelなどのサーバーレス環境で同時接続が枯渇するのを防止。
   * Vercel（IPv4のみサポート）からSupabase（デフォルトで直接接続がIPv6のみ）に接続する際のエラーを回避するため、マイグレーション実行用の `DIRECT_URL` には直接接続アドレスではなく、IPv4/IPv6デュアルスタックに対応したプーラーのSession mode（ポート `5432`）を採用。これにより安全かつ安定したスキーマ更新を実現。
2. **Prismaクライアントのシングルトンパターン**
   * 開発中にNext.jsのホットリロードによって無駄なPrisma Clientのインスタンスが大量生成され、データベース接続数が枯渇するのを防ぐ設計（`src/lib/prisma.ts`）を適用。
3. **Windows環境におけるTurbopackの互換性対策**
   * 一部のWindows環境でNext.jsのTurbopackネイティブモジュールの読み込みに制限が生じる問題に遭遇した際、即座にWebpackに安全にフォールバックさせる設定を `package.json` に施すことで、ローカル開発および本番ビルドの安定性を担保。

---

## 📖 ローカル起動手順

### 1. 依存関係のインストール
```bash
git clone git@github.com:kojiro-tsuji/task-app-asana-clone.git
cd task-app-asana-clone
npm install
```

### 2. 環境変数の設定 (`.env`)
プロジェクトのルートに `.env` ファイルを作成し、Supabaseの接続文字列を設定します。
```env
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@[YOUR-POOLER-HOST].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
# Vercel等のIPv4環境向けに、DIRECT_URLも直接接続（IPv6専用）ではなくプール接続のSession mode（ポート 5432）を使用します
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@[YOUR-POOLER-HOST].pooler.supabase.com:5432/postgres"
```

### 3. データベースマイグレーション & シードデータの挿入
```bash
# テーブルの自動作成
npx prisma migrate dev --name init

# 初期データ（山田、佐藤、初期プロジェクトや初期タスク）の投入
npx prisma db seed
```

### 4. 開発サーバーの起動
```bash
npm run dev
```
起動後、ブラウザで [http://localhost:3000](http://localhost:3000) を開くことでローカルで動作を確認できます。
