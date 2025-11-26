"use client"

import { useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface TimelineProps {
  duration: number // 動画の長さ（秒）
  startTime: number
  endTime: number
  onStartTimeChange: (time: number) => void
  onEndTimeChange: (time: number) => void
  maxDuration?: number // 最大選択可能な長さ（秒）
  className?: string
}

export function Timeline({
  duration,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  maxDuration = 55, // デフォルト55秒
  className,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState<"start" | "end" | "range" | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartValue, setDragStartValue] = useState({ start: 0, end: 0 })

  // 位置から時間を計算
  const positionToTime = useCallback(
    (x: number) => {
      if (!containerRef.current) return 0
      const rect = containerRef.current.getBoundingClientRect()
      const percent = Math.max(0, Math.min(1, x / rect.width))
      return percent * duration
    },
    [duration]
  )

  // 時間からパーセントを計算
  const timeToPercent = useCallback(
    (time: number) => {
      return (time / duration) * 100
    },
    [duration]
  )

  // ドラッグ開始
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: "start" | "end" | "range") => {
      e.preventDefault()
      setIsDragging(type)
      setDragStartX(e.clientX)
      setDragStartValue({ start: startTime, end: endTime })
    },
    [startTime, endTime]
  )

  // ドラッグ中
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const deltaX = e.clientX - dragStartX
      const deltaTime = (deltaX / rect.width) * duration

      if (isDragging === "start") {
        let newStart = Math.max(0, dragStartValue.start + deltaTime)
        newStart = Math.min(newStart, endTime - 1) // 最低1秒
        onStartTimeChange(Math.round(newStart * 10) / 10)
      } else if (isDragging === "end") {
        let newEnd = Math.min(duration, dragStartValue.end + deltaTime)
        newEnd = Math.max(newEnd, startTime + 1) // 最低1秒
        // 最大長さの制限
        if (newEnd - startTime > maxDuration) {
          newEnd = startTime + maxDuration
        }
        onEndTimeChange(Math.round(newEnd * 10) / 10)
      } else if (isDragging === "range") {
        const rangeDuration = dragStartValue.end - dragStartValue.start
        let newStart = dragStartValue.start + deltaTime
        let newEnd = dragStartValue.end + deltaTime

        if (newStart < 0) {
          newStart = 0
          newEnd = rangeDuration
        }
        if (newEnd > duration) {
          newEnd = duration
          newStart = duration - rangeDuration
        }

        onStartTimeChange(Math.round(newStart * 10) / 10)
        onEndTimeChange(Math.round(newEnd * 10) / 10)
      }
    },
    [isDragging, dragStartX, dragStartValue, duration, startTime, endTime, maxDuration, onStartTimeChange, onEndTimeChange]
  )

  // ドラッグ終了
  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  // 時間をフォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const startPercent = timeToPercent(startTime)
  const endPercent = timeToPercent(endTime)
  const selectedDuration = endTime - startTime

  return (
    <div className={cn("space-y-4", className)}>
      {/* 情報表示 */}
      <div className="flex justify-between text-sm">
        <span>
          開始: <span className="font-mono font-medium">{formatTime(startTime)}</span>
        </span>
        <span>
          選択範囲: <span className="font-mono font-medium">{formatTime(selectedDuration)}</span>
          <span className="text-muted-foreground"> / {maxDuration}秒</span>
        </span>
        <span>
          終了: <span className="font-mono font-medium">{formatTime(endTime)}</span>
        </span>
      </div>

      {/* タイムライン */}
      <div
        ref={containerRef}
        className="relative h-16 bg-muted rounded-lg overflow-hidden cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 選択範囲 */}
        <div
          className="absolute top-0 bottom-0 bg-primary/30"
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
          }}
          onMouseDown={(e) => handleMouseDown(e, "range")}
        />

        {/* 開始ハンドル */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-1 bg-primary cursor-ew-resize",
            "hover:w-2 transition-all",
            isDragging === "start" && "w-2"
          )}
          style={{ left: `${startPercent}%` }}
          onMouseDown={(e) => handleMouseDown(e, "start")}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-5 h-8 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground text-xs">◀</span>
          </div>
        </div>

        {/* 終了ハンドル */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-1 bg-primary cursor-ew-resize",
            "hover:w-2 transition-all",
            isDragging === "end" && "w-2"
          )}
          style={{ left: `${endPercent}%` }}
          onMouseDown={(e) => handleMouseDown(e, "end")}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-5 h-8 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground text-xs">▶</span>
          </div>
        </div>

        {/* 時間目盛り */}
        <div className="absolute bottom-0 left-0 right-0 h-4 flex">
          {Array.from({ length: Math.ceil(duration / 60) + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: `${(i * 60 / duration) * 100}%` }}
            >
              <div className="w-px h-2 bg-muted-foreground/50" />
              <span className="text-[10px] text-muted-foreground">{i}m</span>
            </div>
          ))}
        </div>
      </div>

      {/* 警告 */}
      {selectedDuration > maxDuration && (
        <p className="text-sm text-destructive">
          ⚠️ 選択範囲が{maxDuration}秒を超えています
        </p>
      )}
    </div>
  )
}

