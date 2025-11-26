import { Composition } from "remotion"
import { ShortVideo, type ShortVideoProps } from "./compositions/ShortVideo"
import { VIDEO_SPECS, FRAME_SPECS } from "@/types"
import { ComponentType } from "react"

export const RemotionRoot: React.FC = () => {
  const defaultProps: ShortVideoProps = {
    sourceVideoSrc: "",
    openingVideoSrc: undefined,
    subtitles: [],
    startTime: 0,
    cropX: 0,
    cropY: 0,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const VideoComponent = ShortVideo as ComponentType<any>

  return (
    <>
      <Composition
        id="ShortVideo"
        component={VideoComponent}
        durationInFrames={FRAME_SPECS.total}
        fps={VIDEO_SPECS.fps}
        width={VIDEO_SPECS.width}
        height={VIDEO_SPECS.height}
        defaultProps={defaultProps}
      />
    </>
  )
}

