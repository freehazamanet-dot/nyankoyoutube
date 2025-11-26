import ffmpeg from "fluent-ffmpeg"
import path from "path"
import fs from "fs/promises"
import { v4 as uuidv4 } from "uuid"

const TEMP_DIR = "./tmp"

/**
 * 一時ディレクトリを確保
 */
async function ensureTempDir(): Promise<string> {
  await fs.mkdir(TEMP_DIR, { recursive: true })
  return TEMP_DIR
}

/**
 * 動画から音声を抽出
 * @param videoPath 動画ファイルのパス
 * @returns 抽出した音声ファイルのパス
 */
export async function extractAudio(videoPath: string): Promise<string> {
  const tempDir = await ensureTempDir()
  const outputPath = path.join(tempDir, `${uuidv4()}.mp3`)

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(outputPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioFrequency(16000) // Whisper推奨のサンプルレート
      .audioChannels(1) // モノラル
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(new Error(`音声抽出エラー: ${err.message}`)))
      .run()
  })
}

/**
 * 動画の一部を切り出す
 * @param inputPath 入力動画のパス
 * @param outputPath 出力動画のパス
 * @param startTime 開始時間（秒）
 * @param duration 長さ（秒）
 */
export async function trimVideo(
  inputPath: string,
  outputPath: string,
  startTime: number,
  duration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`動画切り出しエラー: ${err.message}`)))
      .run()
  })
}

/**
 * 動画のメタデータを取得
 * @param videoPath 動画ファイルのパス
 * @returns メタデータ
 */
export async function getVideoMetadata(videoPath: string): Promise<{
  duration: number
  width: number
  height: number
  fps: number
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`メタデータ取得エラー: ${err.message}`))
        return
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === "video")
      
      if (!videoStream) {
        reject(new Error("動画ストリームが見つかりません"))
        return
      }

      // FPSを計算
      let fps = 30
      if (videoStream.r_frame_rate) {
        const [num, den] = videoStream.r_frame_rate.split("/").map(Number)
        fps = den ? num / den : num
      }

      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream.width || 1920,
        height: videoStream.height || 1080,
        fps,
      })
    })
  })
}

/**
 * 一時ファイルを削除
 * @param filePath ファイルパス
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch {
    // 削除失敗は無視
  }
}

/**
 * 動画をクロップして縦型に変換
 * @param inputPath 入力動画のパス
 * @param outputPath 出力動画のパス
 * @param cropX クロップ開始X座標
 * @param cropWidth クロップ幅
 */
export async function cropVideoToVertical(
  inputPath: string,
  outputPath: string,
  cropX: number,
  cropWidth: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters(`crop=${cropWidth}:ih:${cropX}:0`)
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`クロップエラー: ${err.message}`)))
      .run()
  })
}

