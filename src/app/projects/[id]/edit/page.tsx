"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { Timeline } from "@/components/editor/timeline"
import { updateVideoSettings } from "@/actions/project"

// 仮のプロジェクトデータ型
interface ProjectData {
  id: string
  name: string
  sourceVideo?: {
    id: string
    filePath: string
    duration: number
    startTime: number | null
    endTime: number | null
    cropX: number | null
    cropY: number | null
  }
  openingVideo?: {
    id: string
    filePath: string
  }
}

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<ProjectData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // 編集状態
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(55)
  const [cropX, setCropX] = useState(50) // パーセント（0-100）
  const [cropY, setCropY] = useState(50)

  // プロジェクトデータを取得
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (!res.ok) throw new Error("プロジェクトが見つかりません")
        const data = await res.json()
        setProject(data)

        // 既存の設定を反映
        if (data.sourceVideo) {
          setStartTime(data.sourceVideo.startTime || 0)
          setEndTime(data.sourceVideo.endTime || 55)
          setCropX(data.sourceVideo.cropX || 50)
          setCropY(data.sourceVideo.cropY || 50)
        }
      } catch (error) {
        toast.error("プロジェクトの取得に失敗しました")
        router.push("/projects")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [projectId, router])

  // 設定を保存
  const handleSave = async () => {
    if (!project?.sourceVideo) return

    setIsSaving(true)
    try {
      // クロップ座標を計算（パーセントから実際の座標へ）
      // 元動画: 1920x1080, クロップサイズ: 約607x1080
      const sourceWidth = 1920
      const sourceHeight = 1080
      const cropWidth = sourceHeight * (9 / 16) // 約607
      const maxCropX = sourceWidth - cropWidth

      const actualCropX = Math.round((cropX / 100) * maxCropX)
      const actualCropY = 0 // Y軸は常に0（縦はフル使用）

      const result = await updateVideoSettings(project.sourceVideo.id, {
        startTime,
        endTime,
        cropX: actualCropX,
        cropY: actualCropY,
      })

      if (result.success) {
        toast.success("設定を保存しました")
      } else {
        toast.error(result.error || "保存に失敗しました")
      }
    } catch {
      toast.error("保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  const videoDuration = project.sourceVideo?.duration || 600 // デフォルト10分

  return (
    <div className="container py-8">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">動画の切り出し範囲とクロップ位置を設定</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}`}>← 戻る</Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "💾 保存"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 編集パネル */}
        <div className="lg:col-span-2 space-y-6">
          {/* タイムライン */}
          <Card>
            <CardHeader>
              <CardTitle>⏱️ 切り出し範囲</CardTitle>
              <CardDescription>
                55秒分の範囲をドラッグして選択してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline
                duration={videoDuration}
                startTime={startTime}
                endTime={endTime}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
                maxDuration={55}
              />
            </CardContent>
          </Card>

          {/* クロップ位置 */}
          <Card>
            <CardHeader>
              <CardTitle>🖱️ クロップ位置（横方向）</CardTitle>
              <CardDescription>
                縦型動画に切り取る位置を調整（左:0% 〜 右:100%）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider
                value={[cropX]}
                onValueChange={(values) => setCropX(values[0])}
                min={0}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>左端</span>
                <span className="font-mono">{cropX}%</span>
                <span>右端</span>
              </div>

              {/* クロップビジュアライザー */}
              <div className="relative mt-4">
                <div
                  className="bg-muted rounded-lg overflow-hidden"
                  style={{ aspectRatio: "16/9" }}
                >
                  {/* 16:9 の元動画エリア */}
                  <div className="relative w-full h-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20">
                    {/* 9:16 のクロップ範囲 */}
                    <div
                      className="absolute top-0 bottom-0 border-2 border-primary bg-primary/10"
                      style={{
                        width: `${(9 / 16) / (16 / 9) * 100}%`, // 約31.6%
                        left: `${(cropX / 100) * (100 - (9 / 16) / (16 / 9) * 100)}%`,
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-primary font-medium">
                        9:16
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  ハイライトされた部分が出力動画に含まれます
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* プレビューパネル */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📱 プレビュー</CardTitle>
              <CardDescription>
                出力動画のプレビュー
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="bg-muted rounded-lg flex items-center justify-center"
                style={{ aspectRatio: "9/16" }}
              >
                <div className="text-center text-muted-foreground p-4">
                  <span className="text-4xl mb-2 block">🎬</span>
                  <p className="text-sm">
                    プレビュー機能は
                    <br />
                    開発中です
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 設定サマリー */}
          <Card>
            <CardHeader>
              <CardTitle>📋 設定サマリー</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">開始位置</dt>
                  <dd className="font-mono">{Math.floor(startTime / 60)}:{(startTime % 60).toFixed(0).padStart(2, "0")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">終了位置</dt>
                  <dd className="font-mono">{Math.floor(endTime / 60)}:{(endTime % 60).toFixed(0).padStart(2, "0")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">選択範囲</dt>
                  <dd className="font-mono">{(endTime - startTime).toFixed(1)}秒</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">クロップ位置</dt>
                  <dd className="font-mono">{cropX}%</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

