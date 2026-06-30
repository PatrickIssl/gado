-- GadoControl — Numeração do brinco nos bezerros
-- Execute no SQL Editor do Supabase

ALTER TABLE bezerros
  ADD COLUMN IF NOT EXISTS numero_brinco TEXT;

COMMENT ON COLUMN bezerros.numero_brinco IS 'Número do brinco/identificação do bezerro';
