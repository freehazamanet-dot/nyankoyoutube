"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { Timeline } from "@/components/editor/timeline"
import { SubtitleEditor } from "@/components/editor/subtitle-editor"
import { AudioMixer } from "@/components/editor/audio-mixer"
import { HighlightDetector } from "@/components/editor/highlight-detector"
import { updateVideoSettings } from "@/actions/project"

// プロジェクトデータ型
interface Subtitle {
  id: string
  text: string
  startTime: number
  endTime: number
}

interface AudioTrack {
  id: string
  type: "BGM" | "SE"
  filePath: string
  volume: number
  startTime: number
}

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
    subtitles: Subtitle[]
    audioTracks: AudioTrack[]
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
          setEndTime(data.sourceVideo.endTime || Math.min(55, data.sourceVideo.duration || 55))
          // cropXをパーセントに逆変換
          if (data.sourceVideo.cropX !== null) {
            const sourceWidth = 1920
            const sourceHeight = 1080
            const cropWidth = sourceHeight * (9 / 16)
            const maxCropX = sourceWidth - cropWidth
            setCropX(Math.round((data.sourceVideo.cropX / maxCropX) * 100))
          } else {
            setCropX(50)
          }
        }
      } catch {
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
      const sourceWidth = 1920
      const sourceHeight = 1080
      const cropWidth = sourceHeight * (9 / 16)
      const maxCropX = sourceWidth - cropWidth

      const actualCropX = Math.round((cropX / 100) * maxCropX)
      const actualCropY = 0

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

  const videoDuration = project.sourceVideo?.duration || 600

  return (
    <div className="container py-8">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">動画の切り出し・クロップ・テロップを設定</p>
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
          {/* AIハイライト検出 */}
          {project.sourceVideo && (
            <HighlightDetector
              videoId={project.sourceVideo.id}
              onHighlightSelect={(start, end) => {
                setStartTime(start)
                setEndTime(end)
              }}
            />
          )}

          {/* タイムライン */}
          <Card>
            <CardHeader>
              <CardTitle>⏱️ 切り出し範囲</CardTitle>
              <CardDescription>
                AIが提案した範囲、または手動で選択（動画長: {Math.floor(videoDuration / 60)}分{Math.floor(videoDuration % 60)}秒）
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
                縦型動画に切り取る位置を調整
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
                  <div className="relative w-full h-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20">
                    <div
                      className="absolute top-0 bottom-0 border-2 border-primary bg-primary/10"
                      style={{
                        width: `${(9 / 16) / (16 / 9) * 100}%`,
                        left: `${(cropX / 100) * (100 - (9 / 16) / (16 / 9) * 100)}%`,
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-primary font-medium">
                        9:16
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* テロップ編集 */}
          {project.sourceVideo && (
            <SubtitleEditor
              videoId={project.sourceVideo.id}
              subtitles={project.sourceVideo.subtitles || []}
            />
          )}

          {/* BGM・効果音 */}
          {project.sourceVideo && (
            <AudioMixer
              videoId={project.sourceVideo.id}
              audioTracks={project.sourceVideo.audioTracks || []}
            />
          )}
        </div>

        {/* サイドパネル */}
        <div className="space-y-6">
          {/* プレビュー */}
          <Card>
            <CardHeader>
              <CardTitle>📱 プレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="bg-black rounded-lg flex items-center justify-center relative overflow-hidden"
                style={{ aspectRatio: "9/16" }}
              >
                {/* シミュレートされたテロップ表示 */}
                <div className="absolute bottom-8 left-0 right-0 text-center px-4">
                  <div
                    className="inline-block text-white text-sm font-bold px-3 py-1"
                    style={{
                      textShadow: "2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000",
                    }}
                  >
                    {project.sourceVideo?.subtitles?.[0]?.text || "テロップがここに表示されます"}
                  </div>
                </div>
                <div className="text-center text-muted-foreground">
                  <span className="text-4xl">📱</span>
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
                  <dd className="font-mono">{Math.floor(startTime / 60)}:{Math.floor(startTime % 60).toString().padStart(2, "0")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">終了位置</dt>
                  <dd className="font-mono">{Math.floor(endTime / 60)}:{Math.floor(endTime % 60).toString().padStart(2, "0")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">選択範囲</dt>
                  <dd className="font-mono">{(endTime - startTime).toFixed(1)}秒</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">クロップ位置</dt>
                  <dd className="font-mono">{cropX}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">テロップ数</dt>
                  <dd className="font-mono">{project.sourceVideo?.subtitles?.length || 0}件</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">BGM/SE</dt>
                  <dd className="font-mono">{project.sourceVideo?.audioTracks?.length || 0}件</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* 出力仕様 */}
          <Card>
            <CardHeader>
              <CardTitle>📐 出力仕様</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">解像度</dt>
                  <dd className="font-mono">1080×1920</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">アスペクト比</dt>
                  <dd className="font-mono">9:16</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">動画長</dt>
                  <dd className="font-mono">60秒</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">FPS</dt>
                  <dd className="font-mono">30</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
