"use client";

import { getYoutubeEmbedSrc } from "@/lib/youtube-embed";

export default function CaptureYoutubeEmbed({
  url,
  className = "",
}: {
  url: string;
  className?: string;
}) {
  const src = getYoutubeEmbedSrc(url);
  if (!src) return null;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-black/[0.08] bg-black shadow-md aspect-video ${className}`}
    >
      <iframe
        className="absolute inset-0 h-full w-full"
        src={src}
        title="Vídeo do YouTube"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
