-- =============================================================================
-- GadoControl — Autenticação + multi-tenancy por Fazenda
-- Execute APÓS schema.sql e demais migrações de colunas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabelas de instituição e perfil
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
-- fazenda_id em todas as tabelas de dados
-- -----------------------------------------------------------------------------

ALTER TABLE vacas ADD COLUMN IF NOT EXISTS fazenda_id UUID REFERENCES fazendas(id);
ALTER TABLE cios ADD COLUMN IF NOT EXISTS fazenda_id UUID REFERENCES fazendas(id);
ALTER TABLE inseminacoes ADD COLUMN IF NOT EXISTS fazenda_id UUID REFERENCES fazendas(id);
ALTER TABLE bezerros ADD COLUMN IF NOT EXISTS fazenda_id UUID REFERENCES fazendas(id);

CREATE INDEX IF NOT EXISTS idx_vacas_fazenda ON vacas(fazenda_id);
CREATE INDEX IF NOT EXISTS idx_cios_fazenda ON cios(fazenda_id);
CREATE INDEX IF NOT EXISTS idx_inseminacoes_fazenda ON inseminacoes(fazenda_id);
CREATE INDEX IF NOT EXISTS idx_bezerros_fazenda ON bezerros(fazenda_id);

-- -----------------------------------------------------------------------------
-- Funções auxiliares (RLS)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.usuario_fazenda_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fazenda_id FROM perfis WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.usuario_tem_fazenda()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM perfis WHERE user_id = auth.uid());
$$;

-- Cria fazenda + vínculo do usuário logado (cadastro)
CREATE OR REPLACE FUNCTION public.registrar_fazenda(
  p_nome_fazenda TEXT,
  p_nome_usuario TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fazenda_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF EXISTS (SELECT 1 FROM perfis WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Usuário já possui fazenda vinculada';
  END IF;

  INSERT INTO fazendas (nome) VALUES (TRIM(p_nome_fazenda)) RETURNING id INTO v_fazenda_id;

  INSERT INTO perfis (user_id, fazenda_id, nome)
  VALUES (auth.uid(), v_fazenda_id, TRIM(p_nome_usuario));

  RETURN v_fazenda_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_fazenda(TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- RLS — remover políticas públicas antigas
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Permitir leitura vacas" ON vacas;
DROP POLICY IF EXISTS "Permitir inserção vacas" ON vacas;
DROP POLICY IF EXISTS "Permitir atualização vacas" ON vacas;
DROP POLICY IF EXISTS "Permitir exclusão vacas" ON vacas;

DROP POLICY IF EXISTS "Permitir leitura cios" ON cios;
DROP POLICY IF EXISTS "Permitir inserção cios" ON cios;
DROP POLICY IF EXISTS "Permitir atualização cios" ON cios;
DROP POLICY IF EXISTS "Permitir exclusão cios" ON cios;

DROP POLICY IF EXISTS "Permitir leitura inseminacoes" ON inseminacoes;
DROP POLICY IF EXISTS "Permitir inserção inseminacoes" ON inseminacoes;
DROP POLICY IF EXISTS "Permitir atualização inseminacoes" ON inseminacoes;
DROP POLICY IF EXISTS "Permitir exclusão inseminacoes" ON inseminacoes;

DROP POLICY IF EXISTS "Permitir leitura bezerros" ON bezerros;
DROP POLICY IF EXISTS "Permitir inserção bezerros" ON bezerros;
DROP POLICY IF EXISTS "Permitir atualização bezerros" ON bezerros;
DROP POLICY IF EXISTS "Permitir exclusão bezerros" ON bezerros;

-- -----------------------------------------------------------------------------
-- RLS — fazendas e perfis
-- -----------------------------------------------------------------------------

ALTER TABLE fazendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fazendas_select" ON fazendas
  FOR SELECT TO authenticated
  USING (id = public.usuario_fazenda_id());

CREATE POLICY "perfis_select" ON perfis
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- RLS — dados por fazenda
-- -----------------------------------------------------------------------------

CREATE POLICY "vacas_select" ON vacas
  FOR SELECT TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "vacas_insert" ON vacas
  FOR INSERT TO authenticated
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "vacas_update" ON vacas
  FOR UPDATE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id())
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "vacas_delete" ON vacas
  FOR DELETE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "cios_select" ON cios
  FOR SELECT TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "cios_insert" ON cios
  FOR INSERT TO authenticated
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "cios_update" ON cios
  FOR UPDATE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id())
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "cios_delete" ON cios
  FOR DELETE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "inseminacoes_select" ON inseminacoes
  FOR SELECT TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "inseminacoes_insert" ON inseminacoes
  FOR INSERT TO authenticated
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "inseminacoes_update" ON inseminacoes
  FOR UPDATE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id())
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "inseminacoes_delete" ON inseminacoes
  FOR DELETE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "bezerros_select" ON bezerros
  FOR SELECT TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "bezerros_insert" ON bezerros
  FOR INSERT TO authenticated
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "bezerros_update" ON bezerros
  FOR UPDATE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id())
  WITH CHECK (fazenda_id = public.usuario_fazenda_id());

CREATE POLICY "bezerros_delete" ON bezerros
  FOR DELETE TO authenticated
  USING (fazenda_id = public.usuario_fazenda_id());
