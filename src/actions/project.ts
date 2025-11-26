"use server"

import { prisma } from "@/lib/prisma"
import { uploadFile, deleteFile } from "@/lib/storage"
import { revalidatePath } from "next/cache"

interface CreateProjectInput {
  name: string
  sourceVideo: File
  openingVideo?: File | null
}

interface CreateProjectResult {
  success: boolean
  projectId?: string
  error?: string
}

/**
 * プロジェクトを作成する
 */
export async function createProject(
  formData: FormData
): Promise<CreateProjectResult> {
  try {
    const name = formData.get("name") as string
    const sourceVideoFile = formData.get("sourceVideo") as File
    const openingVideoFile = formData.get("openingVideo") as File | null

    // バリデーション
    if (!name || !name.trim()) {
      return { success: false, error: "プロジェクト名を入力してください" }
    }

    if (!sourceVideoFile || sourceVideoFile.size === 0) {
      return { success: false, error: "元動画をアップロードしてください" }
    }

    // プロジェクトを作成
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        status: "DRAFT",
      },
    })

    // 元動画をアップロード
    const sourceVideoBuffer = Buffer.from(await sourceVideoFile.arrayBuffer())
    const sourceVideoPath = await uploadFile(
      sourceVideoBuffer,
      sourceVideoFile.name,
      `projects/${project.id}/source`
    )

    // 元動画をDBに登録
    await prisma.video.create({
      data: {
        projectId: project.id,
        type: "SOURCE",
        filePath: sourceVideoPath,
      },
    })

    // オープニング動画がある場合
    if (openingVideoFile && openingVideoFile.size > 0) {
      const openingVideoBuffer = Buffer.from(await openingVideoFile.arrayBuffer())
      const openingVideoPath = await uploadFile(
        openingVideoBuffer,
        openingVideoFile.name,
        `projects/${project.id}/opening`
      )

      await prisma.video.create({
        data: {
          projectId: project.id,
          type: "OPENING",
          filePath: openingVideoPath,
        },
      })
    }

    revalidatePath("/projects")

    return { success: true, projectId: project.id }
  } catch (error) {
    console.error("プロジェクト作成エラー:", error)
    return { success: false, error: "プロジェクトの作成に失敗しました" }
  }
}

/**
 * プロジェクトを削除する
 */
export async function deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 関連する動画を取得
    const videos = await prisma.video.findMany({
      where: { projectId },
    })

    // 動画ファイルを削除
    for (const video of videos) {
      try {
        await deleteFile(video.filePath)
      } catch {
        // ファイル削除エラーは無視して続行
      }
    }

    // プロジェクトを削除（カスケードで関連データも削除）
    await prisma.project.delete({
      where: { id: projectId },
    })

    revalidatePath("/projects")

    return { success: true }
  } catch (error) {
    console.error("プロジェクト削除エラー:", error)
    return { success: false, error: "プロジェクトの削除に失敗しました" }
  }
}

/**
 * プロジェクトの動画設定を更新する
 */
export async function updateVideoSettings(
  videoId: string,
  settings: {
    startTime?: number
    endTime?: number
    cropX?: number
    cropY?: number
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.video.update({
      where: { id: videoId },
      data: settings,
    })

    return { success: true }
  } catch (error) {
    console.error("動画設定更新エラー:", error)
    return { success: false, error: "動画設定の更新に失敗しました" }
  }
}

/**
 * プロジェクトのステータスを更新する
 */
export async function updateProjectStatus(
  projectId: string,
  status: "DRAFT" | "PROCESSING" | "COMPLETED" | "FAILED"
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { status },
    })

    revalidatePath(`/projects/${projectId}`)

    return { success: true }
  } catch (error) {
    console.error("ステータス更新エラー:", error)
    return { success: false, error: "ステータスの更新に失敗しました" }
  }
}

