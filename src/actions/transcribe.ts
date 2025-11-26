"use server"

import { prisma } from "@/lib/prisma"
import { transcribeAudio, optimizeSegments } from "@/lib/whisper"
import { extractAudio, cleanupTempFile, getVideoMetadata } from "@/lib/ffmpeg"
import { revalidatePath } from "next/cache"

interface TranscribeResult {
  success: boolean
  subtitles?: {
    id: string
    text: string
    startTime: number
    endTime: number
  }[]
  error?: string
}

/**
 * 動画から字幕を自動生成する
 */
export async function generateSubtitles(videoId: string): Promise<TranscribeResult> {
  let audioPath: string | null = null

  try {
    // 動画を取得
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { project: true },
    })

    if (!video) {
      return { success: false, error: "動画が見つかりません" }
    }

    if (video.type !== "SOURCE") {
      return { success: false, error: "元動画のみ文字起こしできます" }
    }

    // 既存の字幕を削除
    await prisma.subtitle.deleteMany({
      where: { videoId },
    })

    // 音声を抽出
    console.log("音声抽出中...")
    audioPath = await extractAudio(video.filePath)

    // Whisper APIで文字起こし
    console.log("文字起こし中...")
    const result = await transcribeAudio(audioPath)

    // セグメントを最適化
    const optimizedSegments = optimizeSegments(result.segments)

    // 字幕をDBに保存
    const subtitles = await Promise.all(
      optimizedSegments.map((segment, index) =>
        prisma.subtitle.create({
          data: {
            videoId,
            text: segment.text,
            startTime: segment.start,
            endTime: segment.end,
            order: index,
          },
        })
      )
    )

    // 動画のdurationを更新
    if (result.duration > 0) {
      await prisma.video.update({
        where: { id: videoId },
        data: { duration: result.duration },
      })
    }

    revalidatePath(`/projects/${video.projectId}`)
    revalidatePath(`/projects/${video.projectId}/edit`)

    return {
      success: true,
      subtitles: subtitles.map((s) => ({
        id: s.id,
        text: s.text,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    }
  } catch (error) {
    console.error("文字起こしエラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "文字起こしに失敗しました",
    }
  } finally {
    // 一時ファイルを削除
    if (audioPath) {
      await cleanupTempFile(audioPath)
    }
  }
}

/**
 * 字幕を更新する
 */
export async function updateSubtitle(
  subtitleId: string,
  data: { text?: string; startTime?: number; endTime?: number }
): Promise<{ success: boolean; error?: string }> {
  try {
    const subtitle = await prisma.subtitle.update({
      where: { id: subtitleId },
      data,
      include: { video: { include: { project: true } } },
    })

    revalidatePath(`/projects/${subtitle.video.project.id}`)

    return { success: true }
  } catch (error) {
    console.error("字幕更新エラー:", error)
    return { success: false, error: "字幕の更新に失敗しました" }
  }
}

/**
 * 字幕を削除する
 */
export async function deleteSubtitle(
  subtitleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const subtitle = await prisma.subtitle.delete({
      where: { id: subtitleId },
      include: { video: { include: { project: true } } },
    })

    revalidatePath(`/projects/${subtitle.video.project.id}`)

    return { success: true }
  } catch (error) {
    console.error("字幕削除エラー:", error)
    return { success: false, error: "字幕の削除に失敗しました" }
  }
}

/**
 * 字幕を追加する
 */
export async function addSubtitle(
  videoId: string,
  data: { text: string; startTime: number; endTime: number }
): Promise<{ success: boolean; subtitleId?: string; error?: string }> {
  try {
    // 現在の最大orderを取得
    const maxOrder = await prisma.subtitle.aggregate({
      where: { videoId },
      _max: { order: true },
    })

    const subtitle = await prisma.subtitle.create({
      data: {
        videoId,
        text: data.text,
        startTime: data.startTime,
        endTime: data.endTime,
        order: (maxOrder._max.order || 0) + 1,
      },
      include: { video: { include: { project: true } } },
    })

    revalidatePath(`/projects/${subtitle.video.project.id}`)

    return { success: true, subtitleId: subtitle.id }
  } catch (error) {
    console.error("字幕追加エラー:", error)
    return { success: false, error: "字幕の追加に失敗しました" }
  }
}

/**
 * 動画のメタデータを取得して更新する
 */
export async function updateVideoMetadata(
  videoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    })

    if (!video) {
      return { success: false, error: "動画が見つかりません" }
    }

    const metadata = await getVideoMetadata(video.filePath)

    await prisma.video.update({
      where: { id: videoId },
      data: { duration: metadata.duration },
    })

    return { success: true }
  } catch (error) {
    console.error("メタデータ更新エラー:", error)
    return { success: false, error: "メタデータの更新に失敗しました" }
  }
}

