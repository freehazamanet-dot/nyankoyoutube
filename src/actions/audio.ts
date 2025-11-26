"use server"

import { prisma } from "@/lib/prisma"
import { uploadFile, deleteFile } from "@/lib/storage"
import { revalidatePath } from "next/cache"

interface AddAudioTrackResult {
  success: boolean
  audioTrackId?: string
  error?: string
}

/**
 * オーディオトラック（BGM/SE）を追加する
 */
export async function addAudioTrack(
  formData: FormData
): Promise<AddAudioTrackResult> {
  try {
    const videoId = formData.get("videoId") as string
    const type = formData.get("type") as "BGM" | "SE"
    const audioFile = formData.get("audioFile") as File | null
    const presetPath = formData.get("presetPath") as string | null
    const volume = parseFloat(formData.get("volume") as string) || 1.0
    const startTime = parseFloat(formData.get("startTime") as string) || 0

    // 動画を取得してプロジェクトIDを確認
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { project: true },
    })

    if (!video) {
      return { success: false, error: "動画が見つかりません" }
    }

    let filePath: string

    if (audioFile && audioFile.size > 0) {
      // カスタムファイルをアップロード
      const buffer = Buffer.from(await audioFile.arrayBuffer())
      filePath = await uploadFile(
        buffer,
        audioFile.name,
        `projects/${video.projectId}/audio`
      )
    } else if (presetPath) {
      // プリセットを使用
      filePath = presetPath
    } else {
      return { success: false, error: "音声ファイルを選択してください" }
    }

    // オーディオトラックを作成
    const audioTrack = await prisma.audioTrack.create({
      data: {
        videoId,
        type,
        filePath,
        volume,
        startTime,
      },
    })

    revalidatePath(`/projects/${video.projectId}`)
    revalidatePath(`/projects/${video.projectId}/edit`)

    return { success: true, audioTrackId: audioTrack.id }
  } catch (error) {
    console.error("オーディオトラック追加エラー:", error)
    return { success: false, error: "オーディオトラックの追加に失敗しました" }
  }
}

/**
 * オーディオトラックの音量を更新する
 */
export async function updateAudioTrackVolume(
  audioTrackId: string,
  volume: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const audioTrack = await prisma.audioTrack.update({
      where: { id: audioTrackId },
      data: { volume: Math.max(0, Math.min(1, volume)) },
      include: { video: { include: { project: true } } },
    })

    revalidatePath(`/projects/${audioTrack.video.project.id}`)

    return { success: true }
  } catch (error) {
    console.error("音量更新エラー:", error)
    return { success: false, error: "音量の更新に失敗しました" }
  }
}

/**
 * オーディオトラックの開始時間を更新する
 */
export async function updateAudioTrackStartTime(
  audioTrackId: string,
  startTime: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const audioTrack = await prisma.audioTrack.update({
      where: { id: audioTrackId },
      data: { startTime: Math.max(0, startTime) },
      include: { video: { include: { project: true } } },
    })

    revalidatePath(`/projects/${audioTrack.video.project.id}`)

    return { success: true }
  } catch (error) {
    console.error("開始時間更新エラー:", error)
    return { success: false, error: "開始時間の更新に失敗しました" }
  }
}

/**
 * オーディオトラックを削除する
 */
export async function deleteAudioTrack(
  audioTrackId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const audioTrack = await prisma.audioTrack.delete({
      where: { id: audioTrackId },
      include: { video: { include: { project: true } } },
    })

    // プリセット以外のファイルは削除
    if (!audioTrack.filePath.startsWith("/audio/presets/")) {
      try {
        await deleteFile(audioTrack.filePath)
      } catch {
        // ファイル削除エラーは無視
      }
    }

    revalidatePath(`/projects/${audioTrack.video.project.id}`)

    return { success: true }
  } catch (error) {
    console.error("オーディオトラック削除エラー:", error)
    return { success: false, error: "オーディオトラックの削除に失敗しました" }
  }
}

// プリセットBGM/SEの定義
export const PRESET_BGM = [
  { id: "bgm-upbeat", name: "アップビート", path: "/audio/presets/bgm-upbeat.mp3", duration: 60 },
  { id: "bgm-chill", name: "チル", path: "/audio/presets/bgm-chill.mp3", duration: 60 },
  { id: "bgm-epic", name: "エピック", path: "/audio/presets/bgm-epic.mp3", duration: 60 },
  { id: "bgm-happy", name: "ハッピー", path: "/audio/presets/bgm-happy.mp3", duration: 60 },
  { id: "bgm-dramatic", name: "ドラマティック", path: "/audio/presets/bgm-dramatic.mp3", duration: 60 },
] as const

export const PRESET_SE = [
  { id: "se-click", name: "クリック", path: "/audio/presets/se-click.mp3", duration: 0.5 },
  { id: "se-success", name: "成功", path: "/audio/presets/se-success.mp3", duration: 1 },
  { id: "se-whoosh", name: "シューッ", path: "/audio/presets/se-whoosh.mp3", duration: 0.5 },
  { id: "se-pop", name: "ポップ", path: "/audio/presets/se-pop.mp3", duration: 0.3 },
  { id: "se-notification", name: "通知", path: "/audio/presets/se-notification.mp3", duration: 1 },
] as const

