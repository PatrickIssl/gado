-- GadoControl - Schema Supabase (com autenticação e multi-tenancy por fazenda)
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard)
-- Depois rode: migration_prenhez, migration_cios_protocolo, migration_saude_prenhezes,
--              migration_brucelose, migration_auth_fazenda (se partindo de install antigo)

-- -----------------------------------------------------------------------------
-- Instituição (Fazenda) e perfil do usuário
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fazendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  fazenda_id UUID NOT NULL REFERENCES fazendas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfis_user ON perfis(user_id);
CREATE INDEX IF NOT EXISTS idx_perfis_fazenda ON perfis(fazenda_id);

-- -----------------------------------------------------------------------------
-- Dados do rebanho (isolados por fazenda_id)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vacas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fazenda_id UUID NOT NULL REFERENCES fazendas(id) ON DELETE CASCADE,
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
  fazenda_id UUID NOT NULL REFERENCES fazendas(id) ON DELETE CASCADE,
  vaca_id UUID NOT NULL REFERENCES vacas(id) ON DELETE CASCADE,
  data_cio DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inseminacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fazenda_id UUID NOT NULL REFERENCES fazendas(id) ON DELETE CASCADE,
  vaca_id UUID NOT NULL REFERENCES vacas(id) ON DELETE CASCADE,
  data_inseminacao DATE NOT NULL,
  repetiu_cio BOOLEAN DEFAULT FALSE,
  confirmada_prenhez BOOLEAN DEFAULT FALSE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bezerros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fazenda_id UUID NOT NULL REFERENCES fazendas(id) ON DELETE CASCADE,
  vaca_id UUID NOT NULL REFERENCES vacas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  sexo TEXT NOT NULL CHECK (sexo IN ('macho', 'femea')),
  data_nascimento DATE NOT NULL,
  desmamado BOOLEAN DEFAULT FALSE,
  brucelose_aplicada BOOLEAN NOT NULL DEFAULT FALSE,
  data_brucelose DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vacas_fazenda ON vacas(fazenda_id);
CREATE INDEX IF NOT EXISTS idx_vacas_status ON vacas(status);
CREATE INDEX IF NOT EXISTS idx_cios_fazenda ON cios(fazenda_id);
CREATE INDEX IF NOT EXISTS idx_cios_vaca ON cios(vaca_id);
CREATE INDEX IF NOT EXISTS idx_inseminacoes_fazenda ON inseminacoes(fazenda_id);
CREATE INDEX IF NOT EXISTS idx_inseminacoes_vaca ON inseminacoes(vaca_id);
CREATE INDEX IF NOT EXISTS idx_bezerros_fazenda ON bezerros(fazenda_id);
CREATE INDEX IF NOT EXISTS idx_bezerros_vaca ON bezerros(vaca_id);

-- -----------------------------------------------------------------------------
-- Funções e RPC de cadastro
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.usuario_fazenda_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT fazenda_id FROM perfis WHERE user_id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.registrar_fazenda(p_nome_fazenda TEXT, p_nome_usuario TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_fazenda_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;
  IF EXISTS (SELECT 1 FROM perfis WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Usuário já possui fazenda vinculada';
  END IF;
  INSERT INTO fazendas (nome) VALUES (TRIM(p_nome_fazenda)) RETURNING id INTO v_fazenda_id;
  INSERT INTO perfis (user_id, fazenda_id, nome) VALUES (auth.uid(), v_fazenda_id, TRIM(p_nome_usuario));
  RETURN v_fazenda_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_fazenda(TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

ALTER TABLE fazendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inseminacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bezerros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fazendas_select" ON fazendas FOR SELECT TO authenticated
  USING (id = public.usuario_fazenda_id());

CREATE POLICY "perfis_select" ON perfis FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "vacas_select" ON vacas FOR SELECT TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());
CREATE POLICY "vacas_insert" ON vacas FOR INSERT TO authenticated
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());
CREATE POLICY "vacas_update" ON vacas FOR UPDATE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id())
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());
CREATE POLICY "vacas_delete" ON vacas FOR DELETE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "cios_select" ON cios FOR SELECT TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());
CREATE POLICY "cios_insert" ON cios FOR INSERT TO authenticated
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());
CREATE POLICY "cios_update" ON cios FOR UPDATE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id())
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());
CREATE POLICY "cios_delete" ON cios FOR DELETE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "inseminacoes_select" ON inseminacoes FOR SELECT TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());
CREATE POLICY "inseminacoes_insert" ON inseminacoes FOR INSERT TO authenticated
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());
CREATE POLICY "inseminacoes_update" ON inseminacoes FOR UPDATE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id())
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());
CREATE POLICY "inseminacoes_delete" ON inseminacoes FOR DELETE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "bezerros_select" ON bezerros FOR SELECT TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());
CREATE POLICY "bezerros_insert" ON bezerros FOR INSERT TO authenticated
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());
CREATE POLICY "bezerros_update" ON bezerros FOR UPDATE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id())
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());
CREATE POLICY "bezerros_delete" ON bezerros FOR DELETE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());
