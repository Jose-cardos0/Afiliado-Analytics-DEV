/** Extrai o ID do vídeo (formato típico 11 caracteres) a partir de URL ou ID colado. */
export function getYoutubeVideoId(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0] ?? "";
      return /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;

      const parts = u.pathname.split("/").filter(Boolean);
      const embedI = parts.indexOf("embed");
      if (embedI >= 0 && parts[embedI + 1] && /^[\w-]{11}$/.test(parts[embedI + 1])) {
        return parts[embedI + 1];
      }
      const shortsI = parts.indexOf("shorts");
      if (shortsI >= 0 && parts[shortsI + 1] && /^[\w-]{11}$/.test(parts[shortsI + 1])) {
        return parts[shortsI + 1];
      }
    }
  } catch {
    /* não é URL absoluta */
  }

  if (/^[\w-]{11}$/.test(s)) return s;
  return null;
}

export function getYoutubeEmbedSrc(raw: string): string | null {
  const id = getYoutubeVideoId(raw);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/** Vazio = válido; preenchido precisa ser YouTube reconhecível. */
export function isValidOptionalYoutubeUrl(raw: string): boolean {
  const t = raw.trim();
  if (!t) return true;
  return getYoutubeVideoId(t) !== null;
}
