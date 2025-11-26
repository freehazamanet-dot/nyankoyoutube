"use server"

import { prisma } from "@/lib/prisma"
import { transcribeAudio } from "@/lib/whisper"
import { extractAudio, cleanupTempFile } from "@/lib/ffmpeg"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ハイライト候補の型
export interface HighlightCandidate {
  id: string
  startTime: number // 秒
  endTime: number // 秒
  score: number // 1-5
  reason: string // なぜこの部分がおすすめか
  transcript: string // この部分の文字起こし
}

interface DetectHighlightsResult {
  success: boolean
  highlights?: HighlightCandidate[]
  error?: string
}

/**
 * AIで動画のハイライト部分を検出する
 */
export async function detectHighlights(
  videoId: string
): Promise<DetectHighlightsResult> {
  let audioPath: string | null = null

  try {
    // 動画を取得
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { 
        project: true,
        subtitles: { orderBy: { startTime: "asc" } },
      },
    })

    if (!video) {
      return { success: false, error: "動画が見つかりません" }
    }

    // 既存の字幕があればそれを使用、なければ文字起こしを実行
    let transcriptSegments: { text: string; start: number; end: number }[]

    if (video.subtitles.length > 0) {
      // 既存の字幕を使用
      transcriptSegments = video.subtitles.map((s) => ({
        text: s.text,
        start: s.startTime,
        end: s.endTime,
      }))
    } else {
      // 文字起こしを実行
      console.log("音声抽出中...")
      audioPath = await extractAudio(video.filePath)

      console.log("文字起こし中...")
      const transcription = await transcribeAudio(audioPath)
      transcriptSegments = transcription.segments
    }

    // 文字起こしを時間付きのテキストに変換
    const transcriptWithTimestamps = transcriptSegments
      .map((seg) => `[${formatTime(seg.start)} - ${formatTime(seg.end)}] ${seg.text}`)
      .join("\n")

    // GPT-4でハイライト分析
    console.log("AIでハイライト分析中...")
    const highlights = await analyzeWithGPT(transcriptWithTimestamps, video.duration || 3600)

    return { success: true, highlights }
  } catch (error) {
    console.error("ハイライト検出エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "ハイライト検出に失敗しました",
    }
  } finally {
    if (audioPath) {
      await cleanupTempFile(audioPath)
    }
  }
}

/**
 * GPT-4でハイライトを分析
 */
async function analyzeWithGPT(
  transcript: string,
  videoDuration: number
): Promise<HighlightCandidate[]> {
  const prompt = `あなたはYouTubeショート動画の専門家です。
以下は動画の文字起こし（タイムスタンプ付き）です。

この中から、YouTubeショート動画として「バズりそうな」55秒の区間を最大5つ提案してください。

## 選定基準
- 面白い発言やリアクション
- インパクトのある瞬間
- 視聴者の興味を引く内容
- 感情が動く場面（笑い、驚き、感動など）
- 話題性のある内容
- 短時間で完結する話題

## 動画の文字起こし
${transcript}

## 出力形式（JSON）
以下の形式で出力してください：
\`\`\`json
[
  {
    "startTime": 開始秒数（数値）,
    "endTime": 終了秒数（数値、startTimeから55秒以内）,
    "score": おすすめ度（1-5の数値、5が最高）,
    "reason": "この部分をおすすめする理由（日本語、50文字以内）",
    "transcript": "この区間の代表的な発言（日本語、30文字以内）"
  }
]
\`\`\`

注意：
- startTimeとendTimeは必ず数値で出力
- 区間の長さは55秒以内
- 動画の長さは${Math.floor(videoDuration)}秒です
- 最大5つまで
- JSONのみを出力（説明文は不要）`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
  })

  const content = response.choices[0].message.content || "[]"
  
  // JSONを抽出
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error("AIの応答からJSONを抽出できませんでした")
  }

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    startTime: number
    endTime: number
    score: number
    reason: string
    transcript: string
  }>

  // IDを付与して返す
  return parsed.map((item, index) => ({
    id: `highlight-${index + 1}`,
    startTime: item.startTime,
    endTime: Math.min(item.endTime, item.startTime + 55), // 最大55秒に制限
    score: Math.min(5, Math.max(1, item.score)), // 1-5に制限
    reason: item.reason,
    transcript: item.transcript,
  }))
}

/**
 * 秒数を MM:SS 形式にフォーマット
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

