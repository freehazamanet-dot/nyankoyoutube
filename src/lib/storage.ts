import { Storage } from "@google-cloud/storage"
import { v4 as uuidv4 } from "uuid"
import path from "path"
import fs from "fs/promises"

// 開発環境ではローカルストレージを使用
const isDevelopment = process.env.NODE_ENV === "development"
const LOCAL_UPLOAD_DIR = "./uploads"

// Google Cloud Storage クライアント（本番用）
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
})

const bucketName = process.env.GCS_BUCKET_NAME || ""

/**
 * ファイルをアップロードする
 */
export async function uploadFile(
  file: Buffer,
  originalFilename: string,
  folder: string = "videos"
): Promise<string> {
  const ext = path.extname(originalFilename)
  const filename = `${folder}/${uuidv4()}${ext}`

  if (isDevelopment) {
    // ローカルストレージに保存
    const localPath = path.join(LOCAL_UPLOAD_DIR, filename)
    await fs.mkdir(path.dirname(localPath), { recursive: true })
    await fs.writeFile(localPath, file)
    return localPath
  } else {
    // Google Cloud Storage にアップロード
    const bucket = storage.bucket(bucketName)
    const blob = bucket.file(filename)
    await blob.save(file, {
      contentType: getContentType(ext),
    })
    return `gs://${bucketName}/${filename}`
  }
}

/**
 * 署名付きURLを取得する（読み取り用）
 */
export async function getSignedUrl(
  filePath: string,
  expiresInMinutes: number = 60
): Promise<string> {
  if (isDevelopment) {
    // 開発環境ではローカルパスをそのまま返す
    // 実際にはAPIエンドポイント経由でファイルを提供
    return `/api/files/${encodeURIComponent(filePath)}`
  }

  // gs://bucket/path 形式からパスを抽出
  const gcsPath = filePath.replace(`gs://${bucketName}/`, "")
  const bucket = storage.bucket(bucketName)
  const file = bucket.file(gcsPath)

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  })

  return url
}

/**
 * ファイルを削除する
 */
export async function deleteFile(filePath: string): Promise<void> {
  if (isDevelopment) {
    try {
      await fs.unlink(filePath)
    } catch {
      // ファイルが存在しない場合は無視
    }
    return
  }

  const gcsPath = filePath.replace(`gs://${bucketName}/`, "")
  const bucket = storage.bucket(bucketName)
  await bucket.file(gcsPath).delete()
}

/**
 * ファイルの存在確認
 */
export async function fileExists(filePath: string): Promise<boolean> {
  if (isDevelopment) {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  const gcsPath = filePath.replace(`gs://${bucketName}/`, "")
  const bucket = storage.bucket(bucketName)
  const [exists] = await bucket.file(gcsPath).exists()
  return exists
}

/**
 * 拡張子からContent-Typeを取得
 */
function getContentType(ext: string): string {
  const contentTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  }
  return contentTypes[ext.toLowerCase()] || "application/octet-stream"
}

