-- Mapeamento: anúncio que está rodando (cópia) -> ID exibido no app e no link (original).
-- Assim o link na cópia usa utm_content=original_id e o ATI cruza certo com a Shopee.

CREATE TABLE IF NOT EXISTS meta_ad_display_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivering_ad_id text NOT NULL,
  display_ad_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, delivering_ad_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_ad_display_user ON meta_ad_display_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_ad_display_delivering ON meta_ad_display_mapping(user_id, delivering_ad_id);

ALTER TABLE meta_ad_display_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meta_ad_display_select_own" ON meta_ad_display_mapping;
CREATE POLICY "meta_ad_display_select_own"
  ON meta_ad_display_mapping FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "meta_ad_display_insert_own" ON meta_ad_display_mapping;
CREATE POLICY "meta_ad_display_insert_own"
  ON meta_ad_display_mapping FOR INSERT
  WITH CHECK (auth.uid() = user_id);
