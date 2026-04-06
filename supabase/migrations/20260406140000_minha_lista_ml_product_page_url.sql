-- URL da página do produto ML (para "Atualizar" reconsultar quando só o meli.la falhar)
ALTER TABLE minha_lista_ofertas_ml
  ADD COLUMN IF NOT EXISTS product_page_url text NOT NULL DEFAULT '';
