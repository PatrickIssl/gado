-- Migração: tabela cios + protocolo IATF com prazo (execute se o banco já existia)

CREATE TABLE IF NOT EXISTS cios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaca_id UUID NOT NULL REFERENCES vacas(id) ON DELETE CASCADE,
  data_cio DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vacas ADD COLUMN IF NOT EXISTS data_inicio_protocolo_iatf DATE;
ALTER TABLE vacas ADD COLUMN IF NOT EXISTS dias_protocolo_iatf INTEGER CHECK (dias_protocolo_iatf IN (10, 11));

-- Migrar cios antigos (se existia data_ultimo_cio)
INSERT INTO cios (vaca_id, data_cio, observacoes)
SELECT id, data_ultimo_cio, 'Migrado de data_ultimo_cio'
FROM vacas
WHERE data_ultimo_cio IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM cios c WHERE c.vaca_id = vacas.id AND c.data_cio = vacas.data_ultimo_cio
  );

ALTER TABLE vacas DROP COLUMN IF EXISTS data_ultimo_cio;

ALTER TABLE cios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Permitir leitura cios" ON cios FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Permitir inserção cios" ON cios FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Permitir atualização cios" ON cios FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Permitir exclusão cios" ON cios FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_cios_vaca ON cios(vaca_id);
CREATE INDEX IF NOT EXISTS idx_cios_data ON cios(data_cio DESC);
