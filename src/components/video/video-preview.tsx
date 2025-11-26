"use client"

import { Player } from "@remotion/player"
import { ShortVideo, type ShortVideoProps } from "@/remotion/compositions/ShortVideo"
import { VIDEO_SPECS, FRAME_SPECS } from "@/types"
import { ComponentType } from "react"

interface VideoPreviewProps {
  sourceVideoSrc: string
  openingVideoSrc?: string
  subtitles?: {
    id: string
    text: string
    startTime: number
    endTime: number
  }[]
  startTime?: number
  cropX?: number
  cropY?: number
  className?: string
}

export function VideoPreview({
  sourceVideoSrc,
  openingVideoSrc,
  subtitles = [],
  startTime = 0,
  cropX = 0,
  cropY = 0,
  className,
}: VideoPreviewProps) {
  const inputProps: ShortVideoProps = {
    sourceVideoSrc,
    openingVideoSrc,
    subtitles,
    startTime,
    cropX,
    cropY,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const VideoComponent = ShortVideo as ComponentType<any>

  return (
    <div className={className}>
      <Player
        component={VideoComponent}
        inputProps={inputProps}
        durationInFrames={FRAME_SPECS.total}
        fps={VIDEO_SPECS.fps}
        compositionWidth={VIDEO_SPECS.width}
        compositionHeight={VIDEO_SPECS.height}
        style={{
          width: "100%",
          aspectRatio: "9/16",
        }}
        controls
        autoPlay={false}
        loop
      />
    </div>
  )
}

