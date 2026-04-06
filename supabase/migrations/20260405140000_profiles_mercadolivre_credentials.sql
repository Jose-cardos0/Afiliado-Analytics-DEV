-- Credenciais do aplicativo Mercado Livre (Developers): Client ID + Secret.
-- O fluxo OAuth completo (authorization_code) pode ser adicionado depois; por ora guardamos as chaves como na integração Shopee.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mercadolivre_client_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mercadolivre_client_secret text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mercadolivre_client_secret_last4 text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mercadolivre_client_secret_updated_at timestamptz;
