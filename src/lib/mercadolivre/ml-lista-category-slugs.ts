/**
 * Slugs de listagem (lista.mercadolivre.com.br/{slug}) — curados para evitar SSRF.
 * Labels em PT-BR para a UI.
 */
export type MlListaCategoryOption = { slug: string; label: string };

export const ML_LISTA_CATEGORY_OPTIONS: MlListaCategoryOption[] = [
  { slug: "eletronicos-audio-video", label: "Eletrônicos, áudio e vídeo" },
  { slug: "celulares-telefones", label: "Celulares e telefones" },
  { slug: "informatica", label: "Informática" },
  { slug: "games", label: "Games" },
  { slug: "eletrodomesticos", label: "Eletrodomésticos" },
  { slug: "casa-moveis-decoracao", label: "Casa, móveis e decoração" },
  { slug: "ferramentas", label: "Ferramentas" },
  { slug: "construcao", label: "Construção" },
  { slug: "automoveis-pecas", label: "Acessórios para veículos" },
  { slug: "esportes-fitness", label: "Esportes e fitness" },
  { slug: "beleza-cuidado-pessoal", label: "Beleza e cuidado pessoal" },
  { slug: "calcados-roupas-bolsas", label: "Calçados, roupas e bolsas" },
  { slug: "brinquedos-hobbies", label: "Brinquedos e hobbies" },
  { slug: "bebes", label: "Bebês" },
  { slug: "animais", label: "Animais" },
  { slug: "agro", label: "Agro" },
  { slug: "industria-comercio", label: "Indústria e comércio" },
  { slug: "saude", label: "Saúde" },
  { slug: "livros-revistas-musica", label: "Livros, revistas e música" },
  { slug: "instrumentos-musicais", label: "Instrumentos musicais" },
  { slug: "arte-papelaria-armarinho", label: "Arte, papelaria e armarinho" },
  { slug: "colecionaveis-hobbies", label: "Colecionáveis e hobbies" },
  { slug: "cameras-acessorios", label: "Câmeras e acessórios" },
];

const ALLOWED = new Set(ML_LISTA_CATEGORY_OPTIONS.map((o) => o.slug));

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isMlListaCategorySlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s || s.length > 96 || !SLUG_RE.test(s)) return false;
  return ALLOWED.has(s);
}
