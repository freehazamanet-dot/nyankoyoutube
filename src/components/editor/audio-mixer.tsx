"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  addAudioTrack,
  updateAudioTrackVolume,
  deleteAudioTrack,
  PRESET_BGM,
  PRESET_SE,
} from "@/actions/audio"

interface AudioTrack {
  id: string
  type: "BGM" | "SE"
  filePath: string
  volume: number
  startTime: number
}

interface AudioMixerProps {
  videoId: string
  audioTracks: AudioTrack[]
  onTracksChange?: (tracks: AudioTrack[]) => void
}

export function AudioMixer({
  videoId,
  audioTracks: initialTracks,
  onTracksChange,
}: AudioMixerProps) {
  const [tracks, setTracks] = useState<AudioTrack[]>(initialTracks)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addType, setAddType] = useState<"BGM" | "SE">("BGM")
  const [isAdding, setIsAdding] = useState(false)

  // BGMトラック
  const bgmTracks = tracks.filter((t) => t.type === "BGM")
  // SEトラック
  const seTracks = tracks.filter((t) => t.type === "SE")

  // 音量変更
  const handleVolumeChange = useCallback(
    async (trackId: string, volume: number) => {
      // 即座にUIを更新
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, volume } : t))
      )

      // サーバーに保存（デバウンス的に）
      const result = await updateAudioTrackVolume(trackId, volume)
      if (!result.success) {
        toast.error("音量の保存に失敗しました")
      }
    },
    []
  )

  // トラック削除
  const handleDelete = useCallback(async (trackId: string) => {
    const result = await deleteAudioTrack(trackId)
    if (result.success) {
      setTracks((prev) => prev.filter((t) => t.id !== trackId))
      toast.success("削除しました")
    } else {
      toast.error(result.error || "削除に失敗しました")
    }
  }, [])

  // プリセット追加
  const handleAddPreset = useCallback(
    async (preset: { name: string; path: string }) => {
      setIsAdding(true)
      try {
        const formData = new FormData()
        formData.append("videoId", videoId)
        formData.append("type", addType)
        formData.append("presetPath", preset.path)
        formData.append("volume", "0.5")
        formData.append("startTime", "0")

        const result = await addAudioTrack(formData)
        if (result.success && result.audioTrackId) {
          const newTrack: AudioTrack = {
            id: result.audioTrackId,
            type: addType,
            filePath: preset.path,
            volume: 0.5,
            startTime: 0,
          }
          setTracks((prev) => [...prev, newTrack])
          onTracksChange?.([...tracks, newTrack])
          toast.success(`${preset.name}を追加しました`)
          setIsAddDialogOpen(false)
        } else {
          toast.error(result.error || "追加に失敗しました")
        }
      } finally {
        setIsAdding(false)
      }
    },
    [videoId, addType, tracks, onTracksChange]
  )

  // カスタムファイル追加
  const handleAddCustom = useCallback(
    async (file: File) => {
      setIsAdding(true)
      try {
        const formData = new FormData()
        formData.append("videoId", videoId)
        formData.append("type", addType)
        formData.append("audioFile", file)
        formData.append("volume", "0.5")
        formData.append("startTime", "0")

        const result = await addAudioTrack(formData)
        if (result.success && result.audioTrackId) {
          const newTrack: AudioTrack = {
            id: result.audioTrackId,
            type: addType,
            filePath: file.name,
            volume: 0.5,
            startTime: 0,
          }
          setTracks((prev) => [...prev, newTrack])
          onTracksChange?.([...tracks, newTrack])
          toast.success(`${file.name}を追加しました`)
          setIsAddDialogOpen(false)
        } else {
          toast.error(result.error || "追加に失敗しました")
        }
      } finally {
        setIsAdding(false)
      }
    },
    [videoId, addType, tracks, onTracksChange]
  )

  // ファイル名を取得
  const getFileName = (filePath: string) => {
    // プリセットの場合は名前を表示
    const bgmPreset = PRESET_BGM.find((p) => p.path === filePath)
    if (bgmPreset) return `🎵 ${bgmPreset.name}`

    const sePreset = PRESET_SE.find((p) => p.path === filePath)
    if (sePreset) return `🔊 ${sePreset.name}`

    // カスタムファイルの場合はファイル名を表示
    return filePath.split("/").pop() || filePath
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>🎵 BGM・効果音</CardTitle>
            <CardDescription>
              BGMや効果音を追加して動画を盛り上げましょう
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                + 追加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>オーディオを追加</DialogTitle>
                <DialogDescription>
                  BGMまたは効果音を選択してください
                </DialogDescription>
              </DialogHeader>

              {/* タイプ選択 */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={addType === "BGM" ? "default" : "outline"}
                  onClick={() => setAddType("BGM")}
                  className="flex-1"
                >
                  🎵 BGM
                </Button>
                <Button
                  variant={addType === "SE" ? "default" : "outline"}
                  onClick={() => setAddType("SE")}
                  className="flex-1"
                >
                  🔊 効果音
                </Button>
              </div>

              {/* プリセット一覧 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">プリセット</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(addType === "BGM" ? PRESET_BGM : PRESET_SE).map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddPreset(preset)}
                      disabled={isAdding}
                      className="justify-start"
                    >
                      {addType === "BGM" ? "🎵" : "🔊"} {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* カスタムファイル */}
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium">カスタムファイル</h4>
                <label className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="text-center text-sm text-muted-foreground">
                    <span>📁 ファイルを選択</span>
                    <br />
                    <span className="text-xs">MP3, WAV</span>
                  </div>
                  <input
                    type="file"
                    accept="audio/mpeg,audio/wav"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleAddCustom(file)
                    }}
                    disabled={isAdding}
                  />
                </label>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tracks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">オーディオトラックがありません</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
            >
              + BGM・効果音を追加
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* BGMセクション */}
            {bgmTracks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">🎵 BGM</h4>
                <div className="space-y-2">
                  {bgmTracks.map((track) => (
                    <AudioTrackItem
                      key={track.id}
                      track={track}
                      onVolumeChange={handleVolumeChange}
                      onDelete={handleDelete}
                      getFileName={getFileName}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SEセクション */}
            {seTracks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">🔊 効果音</h4>
                <div className="space-y-2">
                  {seTracks.map((track) => (
                    <AudioTrackItem
                      key={track.id}
                      track={track}
                      onVolumeChange={handleVolumeChange}
                      onDelete={handleDelete}
                      getFileName={getFileName}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// オーディオトラックアイテム
function AudioTrackItem({
  track,
  onVolumeChange,
  onDelete,
  getFileName,
}: {
  track: AudioTrack
  onVolumeChange: (id: string, volume: number) => void
  onDelete: (id: string) => void
  getFileName: (path: string) => string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {getFileName(track.filePath)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground w-8">
            {Math.round(track.volume * 100)}%
          </span>
          <Slider
            value={[track.volume * 100]}
            onValueChange={(values) => onVolumeChange(track.id, values[0] / 100)}
            min={0}
            max={100}
            step={5}
            className="flex-1"
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(track.id)}
        className="text-destructive hover:text-destructive"
      >
        🗑️
      </Button>
    </div>
  )
}

