import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// ステータスの表示設定
const statusConfig = {
  DRAFT: { label: "下書き", variant: "secondary" as const, color: "text-muted-foreground" },
  PROCESSING: { label: "処理中", variant: "default" as const, color: "text-blue-500" },
  COMPLETED: { label: "完了", variant: "default" as const, color: "text-green-500" },
  FAILED: { label: "失敗", variant: "destructive" as const, color: "text-destructive" },
}

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      videos: {
        include: {
          subtitles: true,
          audioTracks: true,
        },
      },
    },
  })

  if (!project) {
    notFound()
  }

  const status = statusConfig[project.status]
  const sourceVideo = project.videos.find((v) => v.type === "SOURCE")
  const openingVideo = project.videos.find((v) => v.type === "OPENING")

  return (
    <div className="container py-8">
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-muted-foreground">
            作成日: {project.createdAt.toLocaleDateString("ja-JP")} ・
            更新日: {project.updatedAt.toLocaleDateString("ja-JP")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/projects">← 一覧に戻る</Link>
          </Button>
          {project.status === "DRAFT" && (
            <Button asChild>
              <Link href={`/projects/${project.id}/edit`}>編集する</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2 space-y-6">
          {/* 動画情報 */}
          <Card>
            <CardHeader>
              <CardTitle>動画情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sourceVideo ? (
                <div>
                  <h4 className="font-medium mb-2">📹 元動画</h4>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground truncate">
                      {sourceVideo.filePath}
                    </p>
                    {sourceVideo.duration && (
                      <p className="text-sm mt-1">
                        長さ: {Math.floor(sourceVideo.duration / 60)}分
                        {Math.floor(sourceVideo.duration % 60)}秒
                      </p>
                    )}
                    {sourceVideo.startTime !== null && sourceVideo.endTime !== null && (
                      <p className="text-sm mt-1">
                        切り出し: {sourceVideo.startTime}秒 〜 {sourceVideo.endTime}秒
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">元動画が設定されていません</p>
              )}

              <Separator />

              {openingVideo ? (
                <div>
                  <h4 className="font-medium mb-2">🎬 オープニング</h4>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground truncate">
                      {openingVideo.filePath}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium mb-2">🎬 オープニング</h4>
                  <p className="text-sm text-muted-foreground">
                    オープニング動画は設定されていません
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 字幕 */}
          <Card>
            <CardHeader>
              <CardTitle>📝 テロップ</CardTitle>
              <CardDescription>
                自動生成された字幕テキスト
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sourceVideo?.subtitles && sourceVideo.subtitles.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sourceVideo.subtitles.map((subtitle) => (
                    <div
                      key={subtitle.id}
                      className="flex gap-4 p-2 rounded bg-muted/50"
                    >
                      <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
                        {subtitle.startTime.toFixed(1)}s - {subtitle.endTime.toFixed(1)}s
                      </span>
                      <span className="text-sm">{subtitle.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  テロップはまだ生成されていません
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* プレビュー */}
          <Card>
            <CardHeader>
              <CardTitle>プレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="bg-muted rounded-lg flex items-center justify-center"
                style={{ aspectRatio: "9/16" }}
              >
                <div className="text-center text-muted-foreground">
                  <span className="text-4xl">📱</span>
                  <p className="mt-2 text-sm">プレビュー準備中</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* アクション */}
          <Card>
            <CardHeader>
              <CardTitle>アクション</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.status === "DRAFT" && (
                <>
                  <Button className="w-full" asChild>
                    <Link href={`/projects/${project.id}/edit`}>
                      ✏️ 編集する
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full">
                    🎬 動画を生成
                  </Button>
                </>
              )}
              {project.status === "COMPLETED" && project.outputPath && (
                <Button className="w-full">
                  ⬇️ ダウンロード
                </Button>
              )}
              {project.status === "PROCESSING" && (
                <div className="text-center py-4">
                  <div className="animate-spin text-2xl mb-2">⏳</div>
                  <p className="text-sm text-muted-foreground">処理中...</p>
                </div>
              )}
              <Button variant="destructive" className="w-full">
                🗑️ 削除
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

