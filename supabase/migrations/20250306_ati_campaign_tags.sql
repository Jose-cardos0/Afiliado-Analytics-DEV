-- Tag "Tráfego para Grupos" por campanha (ATI) para espelhar na Calculadora GPL
CREATE TABLE IF NOT EXISTS ati_campaign_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id text NOT NULL,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_ati_campaign_tags_user_tag ON ati_campaign_tags(user_id, tag);

ALTER TABLE ati_campaign_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ati_campaign_tags_select_own" ON ati_campaign_tags;
CREATE POLICY "ati_campaign_tags_select_own"
  ON ati_campaign_tags FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ati_campaign_tags_insert_own" ON ati_campaign_tags;
CREATE POLICY "ati_campaign_tags_insert_own"
  ON ati_campaign_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ati_campaign_tags_delete_own" ON ati_campaign_tags;
CREATE POLICY "ati_campaign_tags_delete_own"
  ON ati_campaign_tags FOR DELETE
  USING (auth.uid() = user_id);
