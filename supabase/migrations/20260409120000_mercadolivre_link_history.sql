-- Histórico de links meli.la (Gerador / lista ML) por usuário — espelha ideia do shopee_link_history
CREATE TABLE IF NOT EXISTS mercadolivre_link_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  short_link text NOT NULL,
  origin_url text NOT NULL DEFAULT '',
  product_name text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  item_id text NOT NULL DEFAULT '',
  price_promo numeric(12,2),
  price_original numeric(12,2),
  discount_rate numeric(6,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ml_link_history_user_created ON mercadolivre_link_history(user_id, created_at DESC);

ALTER TABLE mercadolivre_link_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ml_link_history_select_own" ON mercadolivre_link_history;
CREATE POLICY "ml_link_history_select_own"
  ON mercadolivre_link_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ml_link_history_insert_own" ON mercadolivre_link_history;
CREATE POLICY "ml_link_history_insert_own"
  ON mercadolivre_link_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ml_link_history_delete_own" ON mercadolivre_link_history;
CREATE POLICY "ml_link_history_delete_own"
  ON mercadolivre_link_history FOR DELETE
  USING (auth.uid() = user_id);
