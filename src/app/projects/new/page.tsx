"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { VideoUploader } from "@/components/video/video-uploader"
import { createProject } from "@/actions/project"

export default function NewProjectPage() {
  const router = useRouter()
  const [projectName, setProjectName] = useState("")
  const [sourceVideo, setSourceVideo] = useState<File | null>(null)
  const [openingVideo, setOpeningVideo] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!projectName.trim()) {
      toast.error("プロジェクト名を入力してください")
      return
    }
    
    if (!sourceVideo) {
      toast.error("元動画をアップロードしてください")
      return
    }

    setIsSubmitting(true)
    setUploadProgress(10)

    try {
      const formData = new FormData()
      formData.append("name", projectName)
      formData.append("sourceVideo", sourceVideo)
      if (openingVideo) {
        formData.append("openingVideo", openingVideo)
      }

      setUploadProgress(30)

      const result = await createProject(formData)

      setUploadProgress(100)

      if (result.success && result.projectId) {
        toast.success("プロジェクトを作成しました")
        router.push(`/projects/${result.projectId}`)
      } else {
        toast.error(result.error || "プロジェクトの作成に失敗しました")
      }
    } catch {
      toast.error("プロジェクトの作成に失敗しました")
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">新規プロジェクト作成</h1>
        <p className="text-muted-foreground mt-1">
          YouTubeショート動画を作成するための設定を行います
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* プロジェクト名 */}
        <Card>
          <CardHeader>
            <CardTitle>プロジェクト名</CardTitle>
            <CardDescription>
              このプロジェクトの名前を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="例: ゲーム実況 #1"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* 元動画 */}
        <Card>
          <CardHeader>
            <CardTitle>元動画 *</CardTitle>
            <CardDescription>
              切り出す元となる動画をアップロードしてください（MP4, MOV / 最大500MB）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoUploader
              accept="video/mp4,video/quicktime"
              onFileSelect={setSourceVideo}
              selectedFile={sourceVideo}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* オープニング動画 */}
        <Card>
          <CardHeader>
            <CardTitle>オープニング動画（任意）</CardTitle>
            <CardDescription>
              動画の冒頭に挿入する5秒のオープニング動画
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoUploader
              accept="video/mp4,video/quicktime"
              onFileSelect={setOpeningVideo}
              selectedFile={openingVideo}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* アップロード進捗 */}
        {isSubmitting && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>アップロード中...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 送信ボタン */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "アップロード中..." : "プロジェクトを作成"}
          </Button>
        </div>
      </form>
    </div>
  )
}
