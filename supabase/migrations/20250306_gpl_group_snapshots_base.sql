-- Base permanente por instância: primeira vez que puxa grupos (nunca sobrescreve)
CREATE TABLE IF NOT EXISTS gpl_group_snapshots_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES evolution_instances(id) ON DELETE CASCADE,
  groups jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, instance_id)
);

CREATE INDEX IF NOT EXISTS idx_gpl_group_snapshots_base_user_instance ON gpl_group_snapshots_base(user_id, instance_id);

ALTER TABLE gpl_group_snapshots_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gpl_group_snapshots_base_select_own" ON gpl_group_snapshots_base;
CREATE POLICY "gpl_group_snapshots_base_select_own"
  ON gpl_group_snapshots_base FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "gpl_group_snapshots_base_insert_own" ON gpl_group_snapshots_base;
CREATE POLICY "gpl_group_snapshots_base_insert_own"
  ON gpl_group_snapshots_base FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sem UPDATE: base não é atualizada depois de criada
DROP POLICY IF EXISTS "gpl_group_snapshots_base_delete_own" ON gpl_group_snapshots_base;
CREATE POLICY "gpl_group_snapshots_base_delete_own"
  ON gpl_group_snapshots_base FOR DELETE
  USING (auth.uid() = user_id);
