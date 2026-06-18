-- GadoControl - Schema Supabase
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard)

CREATE TABLE IF NOT EXISTS vacas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  nome TEXT NOT NULL,
  raca TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'vazia'
    CHECK (status IN ('vazia', 'prenha', 'lactacao', 'seca', 'pre_parto', 'em_protocolo_iatf')),
  data_parto DATE,
  data_ultima_inseminacao DATE,
  data_inseminacao_prenhez DATE,
  data_inicio_protocolo_iatf DATE,
  dias_protocolo_iatf INTEGER CHECK (dias_protocolo_iatf IN (10, 11)),
  total_prenhezes INTEGER NOT NULL DEFAULT 0 CHECK (total_prenhezes >= 0),
  doente BOOLEAN NOT NULL DEFAULT FALSE,
  doenca TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaca_id UUID NOT NULL REFERENCES vacas(id) ON DELETE CASCADE,
  data_cio DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inseminacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaca_id UUID NOT NULL REFERENCES vacas(id) ON DELETE CASCADE,
  data_inseminacao DATE NOT NULL,
  repetiu_cio BOOLEAN DEFAULT FALSE,
  confirmada_prenhez BOOLEAN DEFAULT FALSE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bezerros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaca_id UUID NOT NULL REFERENCES vacas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  sexo TEXT NOT NULL CHECK (sexo IN ('macho', 'femea')),
  data_nascimento DATE NOT NULL,
  desmamado BOOLEAN DEFAULT FALSE,
  brucelose_aplicada BOOLEAN NOT NULL DEFAULT FALSE,
  data_brucelose DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vacas_status ON vacas(status);
CREATE INDEX IF NOT EXISTS idx_cios_vaca ON cios(vaca_id);
CREATE INDEX IF NOT EXISTS idx_cios_data ON cios(data_cio DESC);
CREATE INDEX IF NOT EXISTS idx_inseminacoes_vaca ON inseminacoes(vaca_id);
CREATE INDEX IF NOT EXISTS idx_bezerros_vaca ON bezerros(vaca_id);

-- RLS: permitir acesso público (anon key) para app sem autenticação
-- ATENÇÃO: para uso pessoal/gratuito. Em produção com dados sensíveis, adicione auth.

ALTER TABLE vacas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inseminacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bezerros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura vacas" ON vacas FOR SELECT USING (true);
CREATE POLICY "Permitir inserção vacas" ON vacas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização vacas" ON vacas FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão vacas" ON vacas FOR DELETE USING (true);

CREATE POLICY "Permitir leitura cios" ON cios FOR SELECT USING (true);
CREATE POLICY "Permitir inserção cios" ON cios FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização cios" ON cios FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão cios" ON cios FOR DELETE USING (true);

CREATE POLICY "Permitir leitura inseminacoes" ON inseminacoes FOR SELECT USING (true);
CREATE POLICY "Permitir inserção inseminacoes" ON inseminacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização inseminacoes" ON inseminacoes FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão inseminacoes" ON inseminacoes FOR DELETE USING (true);

CREATE POLICY "Permitir leitura bezerros" ON bezerros FOR SELECT USING (true);
CREATE POLICY "Permitir inserção bezerros" ON bezerros FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização bezerros" ON bezerros FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão bezerros" ON bezerros FOR DELETE USING (true);
