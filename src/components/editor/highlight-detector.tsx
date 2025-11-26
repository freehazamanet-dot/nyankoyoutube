"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { detectHighlights, type HighlightCandidate } from "@/actions/highlight"

interface HighlightDetectorProps {
  videoId: string
  onHighlightSelect: (startTime: number, endTime: number) => void
}

export function HighlightDetector({
  videoId,
  onHighlightSelect,
}: HighlightDetectorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [highlights, setHighlights] = useState<HighlightCandidate[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ハイライト検出を実行
  const handleDetect = async () => {
    setIsAnalyzing(true)
    setProgress(10)
    setHighlights([])

    try {
      // 進捗をシミュレート
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 2000)

      const result = await detectHighlights(videoId)

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success && result.highlights) {
        setHighlights(result.highlights)
        toast.success(`${result.highlights.length}件のハイライトを検出しました`)
      } else {
        toast.error(result.error || "検出に失敗しました")
      }
    } catch {
      toast.error("ハイライト検出に失敗しました")
    } finally {
      setIsAnalyzing(false)
      setProgress(0)
    }
  }

  // ハイライトを選択
  const handleSelect = (highlight: HighlightCandidate) => {
    setSelectedId(highlight.id)
    onHighlightSelect(highlight.startTime, highlight.endTime)
    toast.success(`${formatTime(highlight.startTime)} - ${formatTime(highlight.endTime)} を選択しました`)
  }

  // 時間フォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // スコアを星に変換
  const renderStars = (score: number) => {
    return "⭐".repeat(score) + "☆".repeat(5 - score)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>🤖 AIハイライト検出</CardTitle>
            <CardDescription>
              AIが「バズりそうな」部分を自動で見つけます
            </CardDescription>
          </div>
          <Button
            onClick={handleDetect}
            disabled={isAnalyzing}
            variant={highlights.length > 0 ? "outline" : "default"}
          >
            {isAnalyzing ? "🔍 分析中..." : highlights.length > 0 ? "🔄 再検出" : "🚀 検出開始"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 分析中の進捗表示 */}
        {isAnalyzing && (
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span>AIがハイライトを分析中...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">
              音声認識とAI分析を行っています。1〜2分お待ちください。
            </p>
          </div>
        )}

        {/* ハイライト候補一覧 */}
        {highlights.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              クリックして切り出し範囲に適用できます
            </p>
            {highlights.map((highlight) => (
              <div
                key={highlight.id}
                onClick={() => handleSelect(highlight)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedId === highlight.id
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/50 hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-sm">
                    {formatTime(highlight.startTime)} - {formatTime(highlight.endTime)}
                    <span className="text-muted-foreground ml-2">
                      ({Math.round(highlight.endTime - highlight.startTime)}秒)
                    </span>
                  </div>
                  <div className="text-sm">{renderStars(highlight.score)}</div>
                </div>
                <p className="text-sm font-medium mb-1">"{highlight.transcript}"</p>
                <p className="text-xs text-muted-foreground">{highlight.reason}</p>
              </div>
            ))}
          </div>
        ) : !isAnalyzing ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-4xl mb-2">🎬</p>
            <p className="mb-4">
              AIが動画を分析して、
              <br />
              バズりそうな部分を自動で見つけます
            </p>
            <Button onClick={handleDetect}>
              🚀 AIハイライト検出を開始
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

