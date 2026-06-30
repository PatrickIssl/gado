-- GadoControl — Data de aborto (contagem de 40d para IA a partir do aborto)
-- Execute no SQL Editor do Supabase

ALTER TABLE vacas
  ADD COLUMN IF NOT EXISTS data_aborto DATE;

COMMENT ON COLUMN vacas.data_aborto IS 'Aborto durante lactação; reinicia contagem de 40 dias para inseminar';
