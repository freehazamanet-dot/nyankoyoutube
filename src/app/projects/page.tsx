import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// ステータスの表示設定
const statusConfig = {
  DRAFT: { label: "下書き", variant: "secondary" as const },
  PROCESSING: { label: "処理中", variant: "default" as const },
  COMPLETED: { label: "完了", variant: "default" as const },
  FAILED: { label: "失敗", variant: "destructive" as const },
}

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      videos: true,
    },
  })

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">プロジェクト一覧</h1>
          <p className="text-muted-foreground mt-1">
            作成したプロジェクトを管理できます
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">+ 新規作成</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📹</div>
            <h2 className="text-xl font-semibold mb-2">
              プロジェクトがありません
            </h2>
            <p className="text-muted-foreground mb-6">
              最初のプロジェクトを作成して、YouTubeショート動画を生成しましょう
            </p>
            <Button asChild>
              <Link href="/projects/new">🎬 動画を作成する</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const status = statusConfig[project.status]
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <CardDescription>
                      作成日: {project.createdAt.toLocaleDateString("ja-JP")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p>動画数: {project.videos.length}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

