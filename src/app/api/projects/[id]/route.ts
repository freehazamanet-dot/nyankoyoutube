import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ id: string }>
}

// プロジェクト詳細を取得
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        videos: {
          include: {
            subtitles: {
              orderBy: { order: "asc" },
            },
            audioTracks: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "プロジェクトが見つかりません" },
        { status: 404 }
      )
    }

    // レスポンス形式に変換
    const sourceVideo = project.videos.find((v) => v.type === "SOURCE")
    const openingVideo = project.videos.find((v) => v.type === "OPENING")

    return NextResponse.json({
      id: project.id,
      name: project.name,
      status: project.status,
      outputPath: project.outputPath,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      sourceVideo: sourceVideo
        ? {
            id: sourceVideo.id,
            filePath: sourceVideo.filePath,
            duration: sourceVideo.duration,
            startTime: sourceVideo.startTime,
            endTime: sourceVideo.endTime,
            cropX: sourceVideo.cropX,
            cropY: sourceVideo.cropY,
            subtitles: sourceVideo.subtitles,
            audioTracks: sourceVideo.audioTracks,
          }
        : undefined,
      openingVideo: openingVideo
        ? {
            id: openingVideo.id,
            filePath: openingVideo.filePath,
          }
        : undefined,
    })
  } catch (error) {
    console.error("プロジェクト取得エラー:", error)
    return NextResponse.json(
      { error: "プロジェクトの取得に失敗しました" },
      { status: 500 }
    )
  }
}

// プロジェクトを削除
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("プロジェクト削除エラー:", error)
    return NextResponse.json(
      { error: "プロジェクトの削除に失敗しました" },
      { status: 500 }
    )
  }
}

