"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { updateSubtitle, deleteSubtitle, addSubtitle, generateSubtitles } from "@/actions/transcribe"

interface Subtitle {
  id: string
  text: string
  startTime: number
  endTime: number
}

interface SubtitleEditorProps {
  videoId: string
  subtitles: Subtitle[]
  onSubtitlesChange?: (subtitles: Subtitle[]) => void
}

export function SubtitleEditor({
  videoId,
  subtitles: initialSubtitles,
  onSubtitlesChange,
}: SubtitleEditorProps) {
  const [subtitles, setSubtitles] = useState<Subtitle[]>(initialSubtitles)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  // 自動生成
  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await generateSubtitles(videoId)
      if (result.success && result.subtitles) {
        setSubtitles(result.subtitles)
        onSubtitlesChange?.(result.subtitles)
        toast.success("テロップを生成しました")
      } else {
        toast.error(result.error || "生成に失敗しました")
      }
    } catch {
      toast.error("生成に失敗しました")
    } finally {
      setIsGenerating(false)
    }
  }

  // 編集開始
  const handleEdit = (subtitle: Subtitle) => {
    setEditingId(subtitle.id)
    setEditText(subtitle.text)
  }

  // 編集保存
  const handleSave = async (subtitleId: string) => {
    const result = await updateSubtitle(subtitleId, { text: editText })
    if (result.success) {
      setSubtitles((prev) =>
        prev.map((s) => (s.id === subtitleId ? { ...s, text: editText } : s))
      )
      setEditingId(null)
      toast.success("保存しました")
    } else {
      toast.error(result.error || "保存に失敗しました")
    }
  }

  // 削除
  const handleDelete = async (subtitleId: string) => {
    const result = await deleteSubtitle(subtitleId)
    if (result.success) {
      setSubtitles((prev) => prev.filter((s) => s.id !== subtitleId))
      toast.success("削除しました")
    } else {
      toast.error(result.error || "削除に失敗しました")
    }
  }

  // 新規追加
  const handleAdd = async () => {
    const lastSubtitle = subtitles[subtitles.length - 1]
    const startTime = lastSubtitle ? lastSubtitle.endTime : 0
    const endTime = startTime + 2

    const result = await addSubtitle(videoId, {
      text: "新しいテロップ",
      startTime,
      endTime,
    })

    if (result.success && result.subtitleId) {
      const newSubtitle: Subtitle = {
        id: result.subtitleId,
        text: "新しいテロップ",
        startTime,
        endTime,
      }
      setSubtitles((prev) => [...prev, newSubtitle])
      handleEdit(newSubtitle)
      toast.success("追加しました")
    } else {
      toast.error(result.error || "追加に失敗しました")
    }
  }

  // 時間フォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>📝 テロップ編集</CardTitle>
            <CardDescription>
              自動生成または手動でテロップを編集
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "⏳ 生成中..." : "🎤 自動生成"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleAdd}>
              + 追加
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {subtitles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">テロップがありません</p>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              🎤 音声から自動生成
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {subtitles.map((subtitle) => (
              <div
                key={subtitle.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                {/* タイムコード */}
                <div className="text-xs text-muted-foreground w-24 flex-shrink-0 font-mono">
                  {formatTime(subtitle.startTime)}
                  <br />
                  {formatTime(subtitle.endTime)}
                </div>

                {/* テキスト */}
                {editingId === subtitle.id ? (
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave(subtitle.id)
                      if (e.key === "Escape") setEditingId(null)
                    }}
                  />
                ) : (
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleEdit(subtitle)}
                  >
                    {subtitle.text}
                  </div>
                )}

                {/* アクション */}
                <div className="flex gap-1">
                  {editingId === subtitle.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSave(subtitle.id)}
                      >
                        ✓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        ✕
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(subtitle)}
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(subtitle.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        🗑️
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

