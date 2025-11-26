"use client"

import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"

interface VideoUploaderProps {
  accept?: string
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  maxSize?: number // bytes
  className?: string
  disabled?: boolean
}

export function VideoUploader({
  accept = "video/mp4,video/quicktime",
  onFileSelect,
  selectedFile,
  maxSize = 1024 * 1024 * 500, // 500MB
  className,
  disabled = false,
}: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      setError(null)

      // ファイルタイプチェック
      const acceptedTypes = accept.split(",").map((t) => t.trim())
      if (!acceptedTypes.some((type) => file.type === type)) {
        setError("対応していないファイル形式です")
        return
      }

      // ファイルサイズチェック
      if (file.size > maxSize) {
        setError(`ファイルサイズは${Math.round(maxSize / 1024 / 1024)}MB以下にしてください`)
        return
      }

      onFileSelect(file)
    },
    [accept, maxSize, onFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleRemove = useCallback(() => {
    onFileSelect(null)
    setError(null)
  }, [onFileSelect])

  return (
    <div className={cn("space-y-2", className)}>
      {selectedFile ? (
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎬</span>
              <div>
                <p className="font-medium truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <label
          onDragOver={disabled ? undefined : handleDragOver}
          onDragLeave={disabled ? undefined : handleDragLeave}
          onDrop={disabled ? undefined : handleDrop}
          className={cn(
            "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg transition-colors",
            disabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer",
            !disabled && isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25",
            !disabled && !isDragging && "hover:border-muted-foreground/50 hover:bg-muted/50"
          )}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <span className="text-4xl mb-2">📹</span>
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">クリックしてアップロード</span>
              <br />
              またはドラッグ＆ドロップ
            </p>
            <p className="text-xs text-muted-foreground">
              MP4, MOV（最大500MB）
            </p>
          </div>
          <input
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
        </label>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

