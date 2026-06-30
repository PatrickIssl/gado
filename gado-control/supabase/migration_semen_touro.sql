-- GadoControl — Boi/touro e tipo de sêmen na inseminação
-- Execute no SQL Editor do Supabase

ALTER TABLE inseminacoes
  ADD COLUMN IF NOT EXISTS touro TEXT,
  ADD COLUMN IF NOT EXISTS tipo_semen TEXT
    CHECK (tipo_semen IS NULL OR tipo_semen IN ('sexado', 'convencional'));

COMMENT ON COLUMN inseminacoes.touro IS 'Nome ou código do touro/boi usado na IA';
COMMENT ON COLUMN inseminacoes.tipo_semen IS 'sexado ou convencional';
