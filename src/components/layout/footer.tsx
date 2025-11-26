export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <p>
          🐱 NyankoTube - YouTubeショート動画自動生成ツール
        </p>
        <p>
          © {new Date().getFullYear()} NyankoTube. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

