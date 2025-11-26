import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="container py-12">
      {/* ヒーローセクション */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="text-5xl md:text-7xl">🐱</span>
          <br />
          <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            NyankoTube
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          長尺動画から
          <span className="text-foreground font-semibold">YouTubeショート</span>
          向けの60秒縦型動画を簡単に作成
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/projects/new">
              🎬 動画を作成する
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/projects">
              プロジェクト一覧
            </Link>
          </Button>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">✨ 主な機能</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon="🖱️"
            title="スマートクロップ"
            description="カーソル位置を自動追跡して、常に重要な部分が表示されるように縦型動画に変換"
          />
          <FeatureCard
            icon="🎬"
            title="オープニング挿入"
            description="5秒のオープニング動画を自動挿入して、ブランディングを強化"
          />
          <FeatureCard
            icon="📝"
            title="テロップ自動生成"
            description="音声認識で自動的に字幕を生成。視聴者のエンゲージメントを向上"
          />
          <FeatureCard
            icon="🎵"
            title="BGM・SE追加"
            description="背景音楽や効果音を追加して、動画をより魅力的に"
          />
          <FeatureCard
            icon="⚡"
            title="高速処理"
            description="クラウドベースの処理で、長尺動画も数分で変換完了"
          />
          <FeatureCard
            icon="📱"
            title="9:16縦型出力"
            description="YouTubeショート、TikTok、Instagramリールに最適化された縦型動画を出力"
          />
        </div>
      </section>

      {/* 出力仕様 */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">📐 出力仕様</h2>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <SpecItem label="解像度" value="1080 x 1920 (9:16)" />
              <SpecItem label="動画長" value="60秒" />
              <SpecItem label="フレームレート" value="30fps" />
              <SpecItem label="形式" value="MP4" />
              <SpecItem label="構成" value="オープニング5秒 + 本編55秒" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 border-none">
          <CardHeader>
            <CardTitle className="text-2xl">今すぐ始めましょう！</CardTitle>
            <CardDescription>
              数分で魅力的なYouTubeショート動画を作成できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" asChild>
              <Link href="/projects/new">
                🚀 無料で始める
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
