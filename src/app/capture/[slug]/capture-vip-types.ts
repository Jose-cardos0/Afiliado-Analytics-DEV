/** Props partilhadas pelos templates VIP (rosa + terroso). */
export type CaptureVipLandingProps = {
  title: string;
  description: string;
  buttonText: string;
  /** Público: /slug/go — preview: pode ser # ou URL externa */
  ctaHref: string;
  logoUrl: string | null;
  buttonColor: string;
  /** Vídeo opcional acima do primeiro CTA */
  youtubeUrl?: string | null;
  /** Desliga animação de vagas (preview no dashboard) */
  previewMode?: boolean;
};
