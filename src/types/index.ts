// プロジェクト関連の型定義
export type ProjectStatus = "DRAFT" | "PROCESSING" | "COMPLETED" | "FAILED"
export type VideoType = "SOURCE" | "OPENING" | "OUTPUT"
export type AudioType = "BGM" | "SE"

export interface Project {
  id: string
  name: string
  status: ProjectStatus
  outputPath: string | null
  createdAt: Date
  updatedAt: Date
  videos?: Video[]
}

export interface Video {
  id: string
  projectId: string
  type: VideoType
  filePath: string
  duration: number | null
  startTime: number | null
  endTime: number | null
  cropX: number | null
  cropY: number | null
  createdAt: Date
  updatedAt: Date
  subtitles?: Subtitle[]
  audioTracks?: AudioTrack[]
  cursorTracks?: CursorTrack[]
}

export interface Subtitle {
  id: string
  videoId: string
  text: string
  startTime: number
  endTime: number
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface AudioTrack {
  id: string
  videoId: string
  type: AudioType
  filePath: string
  volume: number
  startTime: number
  createdAt: Date
  updatedAt: Date
}

export interface CursorTrack {
  id: string
  videoId: string
  frameNumber: number
  cursorX: number
  cursorY: number
  cropX: number
  cropY: number
  confidence: number
  createdAt: Date
}

// 動画出力仕様
export const VIDEO_SPECS = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationSeconds: 60,
  openingDurationSeconds: 5,
  mainDurationSeconds: 55,
} as const

// フレーム数
export const FRAME_SPECS = {
  total: VIDEO_SPECS.durationSeconds * VIDEO_SPECS.fps, // 1800
  opening: VIDEO_SPECS.openingDurationSeconds * VIDEO_SPECS.fps, // 150
  main: VIDEO_SPECS.mainDurationSeconds * VIDEO_SPECS.fps, // 1650
} as const

