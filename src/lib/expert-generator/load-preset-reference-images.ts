import fs from "fs";
import path from "path";

const MAX_FILES = 6;
const MAX_BYTES_PER_FILE = 5 * 1024 * 1024;

export type PresetRefImage = { mimeType: string; base64: string };

/**
 * Lê imagens em `src/lib/expert-generator/expert/<packId>/` para envio ao Gemini Image.
 */
export function loadPresetReferenceImages(packId: string): PresetRefImage[] {
  const dir = path.join(
    process.cwd(),
    "src/lib/expert-generator/expert",
    packId
  );
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return [];
  }

  const names = fs
    .readdirSync(dir)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();

  const out: PresetRefImage[] = [];

  for (const name of names) {
    if (out.length >= MAX_FILES) break;
    const fp = path.join(dir, name);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(fp);
    } catch {
      continue;
    }
    if (!stat.isFile() || stat.size > MAX_BYTES_PER_FILE) continue;

    let buf: Buffer;
    try {
      buf = fs.readFileSync(fp);
    } catch {
      continue;
    }

    const lower = name.toLowerCase();
    const mimeType = lower.endsWith(".png")
      ? "image/png"
      : lower.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";

    out.push({ mimeType, base64: buf.toString("base64") });
  }

  return out;
}
