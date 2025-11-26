import { AbsoluteFill, Sequence, OffthreadVideo, Audio, useCurrentFrame, useVideoConfig } from "remotion"
import { Subtitle } from "../components/Subtitle"
import { FRAME_SPECS } from "@/types"

export interface SubtitleData {
  id: string
  text: string
  startTime: number
  endTime: number
}

export interface ShortVideoProps {
  sourceVideoSrc: string
  openingVideoSrc?: string
  subtitles: SubtitleData[]
  startTime: number // 切り出し開始時間（秒）
  cropX: number
  cropY: number
  bgmSrc?: string
  bgmVolume?: number
}

export const ShortVideo: React.FC<ShortVideoProps> = ({
  sourceVideoSrc,
  openingVideoSrc,
  subtitles,
  startTime,
  cropX,
  cropY,
  bgmSrc,
  bgmVolume = 0.3,
}) => {
  const { fps } = useVideoConfig()

  // オープニングの長さ
  const openingDuration = openingVideoSrc ? FRAME_SPECS.opening : 0
  
  // メインコンテンツの開始フレーム
  const mainStartFrame = openingDuration

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* オープニング動画 */}
      {openingVideoSrc && (
        <Sequence from={0} durationInFrames={FRAME_SPECS.opening}>
          <AbsoluteFill>
            <OffthreadVideo
              src={openingVideoSrc}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </AbsoluteFill>
        </Sequence>
      )}

      {/* メイン動画（クロップして表示） */}
      <Sequence from={mainStartFrame} durationInFrames={FRAME_SPECS.main}>
        <CroppedVideo
          src={sourceVideoSrc}
          startTime={startTime}
          cropX={cropX}
          cropY={cropY}
        />
      </Sequence>

      {/* テロップ */}
      <Sequence from={mainStartFrame}>
        {subtitles.map((subtitle) => {
          const subtitleStartFrame = Math.floor(subtitle.startTime * fps)
          const subtitleDuration = Math.floor((subtitle.endTime - subtitle.startTime) * fps)
          
          return (
            <Sequence
              key={subtitle.id}
              from={subtitleStartFrame}
              durationInFrames={subtitleDuration}
            >
              <Subtitle text={subtitle.text} />
            </Sequence>
          )
        })}
      </Sequence>

      {/* BGM */}
      {bgmSrc && (
        <Audio src={bgmSrc} volume={bgmVolume} />
      )}
    </AbsoluteFill>
  )
}

// クロップされた動画コンポーネント
const CroppedVideo: React.FC<{
  src: string
  startTime: number
  cropX: number
  cropY: number
}> = ({ src, startTime, cropX, cropY }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  
  // 元動画のサイズ（16:9 = 1920x1080）
  const sourceWidth = 1920
  const sourceHeight = 1080
  
  // 出力サイズ（9:16 = 1080x1920）
  const outputWidth = 1080
  const outputHeight = 1920
  
  // クロップするサイズ（縦はそのまま、横を切り出す）
  // 9:16の比率を維持するために必要な幅
  const cropWidth = sourceHeight * (outputWidth / outputHeight) // 607.5px
  
  // スケール（元動画を拡大して出力サイズに合わせる）
  const scale = outputHeight / sourceHeight // 1.78
  
  // 動画の再生位置
  const currentTime = startTime + frame / fps

  return (
    <AbsoluteFill>
      <div
        style={{
          width: outputWidth,
          height: outputHeight,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <OffthreadVideo
          src={src}
          startFrom={Math.floor(startTime * fps)}
          style={{
            position: "absolute",
            width: sourceWidth * scale,
            height: sourceHeight * scale,
            left: -cropX * scale,
            top: -cropY * scale,
            objectFit: "cover",
          }}
        />
      </div>
    </AbsoluteFill>
  )
}

