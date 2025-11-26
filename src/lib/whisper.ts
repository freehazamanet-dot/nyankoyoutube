import OpenAI from "openai"
import fs from "fs"

// OpenAI クライアント
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 文字起こし結果の型
export interface TranscriptionSegment {
  text: string
  start: number // 秒
  end: number // 秒
}

export interface TranscriptionResult {
  text: string
  segments: TranscriptionSegment[]
  language: string
  duration: number
}

/**
 * 音声ファイルから文字起こしを行う
 * @param audioPath 音声ファイルのパス
 * @returns 文字起こし結果
 */
export async function transcribeAudio(
  audioPath: string
): Promise<TranscriptionResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY が設定されていません")
  }

  // ファイルを読み込み
  const audioFile = fs.createReadStream(audioPath)

  // Whisper APIで文字起こし
  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "ja",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  })

  // セグメントを変換
  const segments: TranscriptionSegment[] = (response.segments || []).map(
    (seg) => ({
      text: seg.text.trim(),
      start: seg.start,
      end: seg.end,
    })
  )

  return {
    text: response.text,
    segments,
    language: response.language || "ja",
    duration: response.duration || 0,
  }
}

/**
 * セグメントを適切な長さに分割する
 * 長すぎるセグメントを分割し、短すぎるセグメントを結合
 */
export function optimizeSegments(
  segments: TranscriptionSegment[],
  maxChars: number = 30, // 1行あたりの最大文字数
  minDuration: number = 0.5, // 最小表示時間（秒）
  maxDuration: number = 4 // 最大表示時間（秒）
): TranscriptionSegment[] {
  const optimized: TranscriptionSegment[] = []

  for (const segment of segments) {
    const duration = segment.end - segment.start

    // 長すぎる場合は分割
    if (segment.text.length > maxChars || duration > maxDuration) {
      const parts = splitText(segment.text, maxChars)
      const partDuration = duration / parts.length

      parts.forEach((part, index) => {
        optimized.push({
          text: part,
          start: segment.start + partDuration * index,
          end: segment.start + partDuration * (index + 1),
        })
      })
    }
    // 短すぎる場合は前のセグメントと結合を検討
    else if (duration < minDuration && optimized.length > 0) {
      const prev = optimized[optimized.length - 1]
      const combinedText = prev.text + segment.text
      
      // 結合しても長すぎなければ結合
      if (combinedText.length <= maxChars * 1.5) {
        prev.text = combinedText
        prev.end = segment.end
      } else {
        optimized.push(segment)
      }
    } else {
      optimized.push(segment)
    }
  }

  return optimized
}

/**
 * テキストを指定文字数で分割
 */
function splitText(text: string, maxChars: number): string[] {
  const parts: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      parts.push(remaining)
      break
    }

    // 句読点で分割を試みる
    let splitIndex = -1
    const punctuation = ["。", "、", "！", "？", ".", ",", "!", "?", " "]
    
    for (const punct of punctuation) {
      const index = remaining.lastIndexOf(punct, maxChars)
      if (index > 0 && index > splitIndex) {
        splitIndex = index + 1
        break
      }
    }

    // 句読点がなければ強制分割
    if (splitIndex === -1) {
      splitIndex = maxChars
    }

    parts.push(remaining.substring(0, splitIndex).trim())
    remaining = remaining.substring(splitIndex).trim()
  }

  return parts
}

