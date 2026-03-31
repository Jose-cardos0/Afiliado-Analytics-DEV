-- Permite múltiplos destinos para a mesma origem na mesma instância/usuário.
-- Antes: UNIQUE (user_id, instance_id, grupo_origem_jid)
-- Depois: UNIQUE (user_id, instance_id, grupo_origem_jid, grupo_destino_jid)

ALTER TABLE espelhamento_config
  DROP CONSTRAINT IF EXISTS espelhamento_config_user_id_instance_id_grupo_origem_jid_key;

ALTER TABLE espelhamento_config
  ADD CONSTRAINT espelhamento_config_user_instance_origem_destino_key
  UNIQUE (user_id, instance_id, grupo_origem_jid, grupo_destino_jid);

