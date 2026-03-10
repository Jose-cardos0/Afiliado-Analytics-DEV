-- Totais acumulados por grupo: leads ganhos (novos) e perdidos (saídas) desde a base
CREATE TABLE IF NOT EXISTS gpl_group_cumulative (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES evolution_instances(id) ON DELETE CASCADE,
  group_id text NOT NULL,
  group_name text NOT NULL DEFAULT '',
  total_novos int NOT NULL DEFAULT 0,
  total_saidas int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, instance_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_gpl_group_cumulative_user_instance ON gpl_group_cumulative(user_id, instance_id);

ALTER TABLE gpl_group_cumulative ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gpl_group_cumulative_select_own" ON gpl_group_cumulative;
CREATE POLICY "gpl_group_cumulative_select_own"
  ON gpl_group_cumulative FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "gpl_group_cumulative_insert_own" ON gpl_group_cumulative;
CREATE POLICY "gpl_group_cumulative_insert_own"
  ON gpl_group_cumulative FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "gpl_group_cumulative_update_own" ON gpl_group_cumulative;
CREATE POLICY "gpl_group_cumulative_update_own"
  ON gpl_group_cumulative FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "gpl_group_cumulative_delete_own" ON gpl_group_cumulative;
CREATE POLICY "gpl_group_cumulative_delete_own"
  ON gpl_group_cumulative FOR DELETE
  USING (auth.uid() = user_id);
