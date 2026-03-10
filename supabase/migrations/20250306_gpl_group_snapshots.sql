-- Snapshots diários de grupos WhatsApp por instância (GPL): persistir e comparar ontem/hoje
CREATE TABLE IF NOT EXISTS gpl_group_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES evolution_instances(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  groups jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, instance_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_gpl_group_snapshots_user_instance ON gpl_group_snapshots(user_id, instance_id);
CREATE INDEX IF NOT EXISTS idx_gpl_group_snapshots_date ON gpl_group_snapshots(snapshot_date);

ALTER TABLE gpl_group_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gpl_group_snapshots_select_own" ON gpl_group_snapshots;
CREATE POLICY "gpl_group_snapshots_select_own"
  ON gpl_group_snapshots FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "gpl_group_snapshots_insert_own" ON gpl_group_snapshots;
CREATE POLICY "gpl_group_snapshots_insert_own"
  ON gpl_group_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "gpl_group_snapshots_update_own" ON gpl_group_snapshots;
CREATE POLICY "gpl_group_snapshots_update_own"
  ON gpl_group_snapshots FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "gpl_group_snapshots_delete_own" ON gpl_group_snapshots;
CREATE POLICY "gpl_group_snapshots_delete_own"
  ON gpl_group_snapshots FOR DELETE
  USING (auth.uid() = user_id);
