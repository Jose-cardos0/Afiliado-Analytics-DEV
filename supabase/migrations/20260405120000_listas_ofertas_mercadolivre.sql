-- Listas de ofertas Mercado Livre (separadas da Shopee): links de afiliado já convertidos + metadados.

CREATE TABLE IF NOT EXISTS listas_ofertas_ml (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listas_ofertas_ml_user ON listas_ofertas_ml(user_id);
ALTER TABLE listas_ofertas_ml ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listas_ofertas_ml_select_own" ON listas_ofertas_ml;
CREATE POLICY "listas_ofertas_ml_select_own" ON listas_ofertas_ml FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "listas_ofertas_ml_insert_own" ON listas_ofertas_ml;
CREATE POLICY "listas_ofertas_ml_insert_own" ON listas_ofertas_ml FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "listas_ofertas_ml_update_own" ON listas_ofertas_ml;
CREATE POLICY "listas_ofertas_ml_update_own" ON listas_ofertas_ml FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "listas_ofertas_ml_delete_own" ON listas_ofertas_ml;
CREATE POLICY "listas_ofertas_ml_delete_own" ON listas_ofertas_ml FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS minha_lista_ofertas_ml (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lista_id uuid NOT NULL REFERENCES listas_ofertas_ml(id) ON DELETE CASCADE,
  image_url text NOT NULL DEFAULT '',
  product_name text NOT NULL DEFAULT '',
  price_original numeric(10,2),
  price_promo numeric(10,2),
  discount_rate numeric(5,2),
  converter_link text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_minha_lista_ofertas_ml_lista ON minha_lista_ofertas_ml(lista_id);
CREATE INDEX IF NOT EXISTS idx_minha_lista_ofertas_ml_user ON minha_lista_ofertas_ml(user_id);
CREATE INDEX IF NOT EXISTS idx_minha_lista_ofertas_ml_created ON minha_lista_ofertas_ml(lista_id, created_at DESC);

ALTER TABLE minha_lista_ofertas_ml ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "minha_lista_ofertas_ml_select_own" ON minha_lista_ofertas_ml;
CREATE POLICY "minha_lista_ofertas_ml_select_own" ON minha_lista_ofertas_ml FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "minha_lista_ofertas_ml_insert_own" ON minha_lista_ofertas_ml;
CREATE POLICY "minha_lista_ofertas_ml_insert_own" ON minha_lista_ofertas_ml FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "minha_lista_ofertas_ml_update_own" ON minha_lista_ofertas_ml;
CREATE POLICY "minha_lista_ofertas_ml_update_own" ON minha_lista_ofertas_ml FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "minha_lista_ofertas_ml_delete_own" ON minha_lista_ofertas_ml;
CREATE POLICY "minha_lista_ofertas_ml_delete_own" ON minha_lista_ofertas_ml FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE grupos_venda_continuo
  ADD COLUMN IF NOT EXISTS lista_ofertas_ml_id uuid REFERENCES listas_ofertas_ml(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_grupos_venda_continuo_lista_ofertas_ml
  ON grupos_venda_continuo(lista_ofertas_ml_id) WHERE lista_ofertas_ml_id IS NOT NULL;
