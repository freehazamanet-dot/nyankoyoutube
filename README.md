# 🐱 NyankoTube

長尺動画（60分程度）からYouTubeショート向けの60秒縦型動画を自動生成するWebアプリケーション

## ✨ 主な機能

- 📹 **動画切り出し** - 長尺動画から任意の部分を選択
- 🖱️ **スマートクロップ** - カーソル位置を自動追跡して縦型動画に変換
- 🎬 **オープニング挿入** - 5秒のオープニング動画を自動挿入
- 📝 **テロップ自動生成** - 音声から字幕を自動生成
- 🎵 **BGM/SE追加** - 背景音楽・効果音の追加

## 🛠️ 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript 5.x |
| ORM | Prisma |
| データベース | PostgreSQL |
| スタイリング | Tailwind CSS + shadcn/ui |
| 動画生成 | Remotion + FFmpeg |
| 音声認識 | Whisper API (OpenAI) |
| インフラ | Google Cloud Platform |

## 📐 出力仕様

- **形式**: MP4
- **解像度**: 1080 x 1920 (9:16 縦型)
- **長さ**: 60秒
- **フレームレート**: 30fps

## 🚀 セットアップ

### 必要条件

- Node.js 20.x LTS
- pnpm
- PostgreSQL
- FFmpeg

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/nyankoyoutube.git
cd nyankoyoutube

# 依存関係をインストール
pnpm install

# 環境変数を設定
cp .env.example .env.local

# データベースをセットアップ
pnpm prisma migrate dev

# 開発サーバーを起動
pnpm dev
```

### 環境変数

```env
# Database
DATABASE_URL=postgresql://...

# Google Cloud
GCP_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name

# OpenAI
OPENAI_API_KEY=sk-...
```

## 📁 ディレクトリ構成

```
src/
├── app/          # Next.js App Router
├── components/   # React コンポーネント
├── remotion/     # Remotion 動画テンプレート
├── lib/          # ユーティリティ
├── actions/      # Server Actions
└── types/        # 型定義
```

## 📄 ドキュメント

- [要件定義書](./docs/requirements.md)

## 📝 ライセンス

MIT License

## 👤 作者

Your Name

