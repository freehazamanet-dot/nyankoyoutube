import { interpolate, useCurrentFrame } from "remotion"

interface SubtitleProps {
  text: string
}

export const Subtitle: React.FC<SubtitleProps> = ({ text }) => {
  const frame = useCurrentFrame()
  
  // フェードイン/アウト効果
  const opacity = interpolate(frame, [0, 5, 25, 30], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <div
      style={{
        position: "absolute",
        bottom: 150, // セーフエリアを考慮
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 40px",
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif",
          fontSize: 48,
          fontWeight: 700,
          color: "#FFFFFF",
          textAlign: "center",
          textShadow: `
            2px 2px 0 #000,
            -2px 2px 0 #000,
            2px -2px 0 #000,
            -2px -2px 0 #000,
            0 4px 8px rgba(0, 0, 0, 0.5)
          `,
          lineHeight: 1.4,
          maxWidth: "100%",
          wordBreak: "keep-all",
          overflowWrap: "break-word",
        }}
      >
        {text}
      </div>
    </div>
  )
}

