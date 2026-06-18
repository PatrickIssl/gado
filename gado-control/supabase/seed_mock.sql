-- =============================================================================
-- GadoControl — Dados mockados para testes
-- Execute no SQL Editor do Supabase (após schema.sql, migration_prenhez.sql, migration_cios_protocolo.sql e migration_saude_prenhezes.sql)
--
-- Usa CURRENT_DATE: as datas se ajustam ao dia em que você rodar o script.
-- =============================================================================

-- Descomente as 3 linhas abaixo se quiser LIMPAR tudo antes de inserir:
-- TRUNCATE cios CASCADE;
-- TRUNCATE inseminacoes CASCADE;
-- TRUNCATE vacas CASCADE;

-- -----------------------------------------------------------------------------
-- VACAS (10 cenários)
-- -----------------------------------------------------------------------------

INSERT INTO vacas (
  id, numero, nome, raca, status, data_parto,
  data_ultima_inseminacao, data_inseminacao_prenhez,
  data_inicio_protocolo_iatf, dias_protocolo_iatf,
  total_prenhezes, doente, doenca
)
VALUES
  -- 1) Lactação recente — ainda não chegou nos 40 dias para inseminar (+ bezerro deste parto)
  (
    '11111111-1111-1111-1111-111111111101',
    '0001', 'Estrela', 'Holandesa', 'lactacao',
    CURRENT_DATE - 15,
    NULL, NULL, NULL, NULL,
    0, FALSE, NULL
  ),

  -- 2) Passou 40d do parto, SEM cio — Registrar Cio / Protocolo IATF (doente)
  (
    '11111111-1111-1111-1111-111111111102',
    '0002', 'Mimosa', 'Holandesa', 'lactacao',
    CURRENT_DATE - 85,
    NULL, NULL, NULL, NULL,
    2, TRUE, 'Mastite leve'
  ),

  -- 3) Cio registrado — botão Inseminar
  (
    '11111111-1111-1111-1111-111111111103',
    '0003', 'Flor', 'Jersey', 'lactacao',
    CURRENT_DATE - 45,
    NULL, NULL, NULL, NULL,
    1, FALSE, NULL
  ),

  -- 4) Inseminada, aguardando verificar prenhez (21d)
  (
    '11111111-1111-1111-1111-111111111104',
    '0004', 'Luna', 'Gir', 'lactacao',
    CURRENT_DATE - 75,
    CURRENT_DATE - 22,
    NULL, NULL, NULL,
    3, FALSE, NULL
  ),

  -- 5) Prenha + lactação
  (
    '11111111-1111-1111-1111-111111111105',
    '0005', 'Pérola', 'Holandesa', 'prenha',
    CURRENT_DATE - 100,
    CURRENT_DATE - 80,
    CURRENT_DATE - 80, NULL, NULL,
    4, FALSE, NULL
  ),

  -- 6) Prenha — parto iminente
  (
    '11111111-1111-1111-1111-111111111106',
    '0006', 'Jade', 'Girolanda', 'prenha',
    CURRENT_DATE - 400,
    CURRENT_DATE - 282,
    CURRENT_DATE - 282, NULL, NULL,
    5, FALSE, NULL
  ),

  -- 7) Período SECA
  (
    '11111111-1111-1111-1111-111111111107',
    '0007', 'Branca', 'Holandesa', 'seca',
    CURRENT_DATE - 250,
    NULL, NULL, NULL, NULL,
    3, FALSE, NULL
  ),

  -- 8) PRÉ-PARTO
  (
    '11111111-1111-1111-1111-111111111108',
    '0008', 'Canela', 'Jersey', 'pre_parto',
    CURRENT_DATE - 285,
    NULL, NULL, NULL, NULL,
    2, FALSE, NULL
  ),

  -- 9) Protocolo IATF ativo (dia 5 de 11) — deve inseminar ao vencer
  (
    '11111111-1111-1111-1111-111111111109',
    '0009', 'Dama', 'Holandesa', 'em_protocolo_iatf',
    CURRENT_DATE - 52,
    NULL, NULL,
    CURRENT_DATE - 5, 11,
    1, FALSE, NULL
  ),

  -- 10) Protocolo vencido — ao carregar, sai de protocolo e exige inseminação
  (
    '11111111-1111-1111-1111-111111111110',
    '0010', 'Nova', 'Jersey', 'em_protocolo_iatf',
    CURRENT_DATE - 60,
    NULL, NULL,
    CURRENT_DATE - 12, 10,
    0, FALSE, NULL
  )
ON CONFLICT (id) DO UPDATE SET
  numero = EXCLUDED.numero,
  nome = EXCLUDED.nome,
  raca = EXCLUDED.raca,
  status = EXCLUDED.status,
  data_parto = EXCLUDED.data_parto,
  data_ultima_inseminacao = EXCLUDED.data_ultima_inseminacao,
  data_inseminacao_prenhez = EXCLUDED.data_inseminacao_prenhez,
  data_inicio_protocolo_iatf = EXCLUDED.data_inicio_protocolo_iatf,
  dias_protocolo_iatf = EXCLUDED.dias_protocolo_iatf,
  total_prenhezes = EXCLUDED.total_prenhezes,
  doente = EXCLUDED.doente,
  doenca = EXCLUDED.doenca;

-- -----------------------------------------------------------------------------
-- CIOS (histórico por vaca)
-- -----------------------------------------------------------------------------

INSERT INTO cios (id, vaca_id, data_cio, observacoes)
VALUES
  (
    '44444444-4444-4444-4444-444444444401',
    '11111111-1111-1111-1111-111111111103',
    CURRENT_DATE - 1,
    'Cio observado — pronta para IA'
  ),
  (
    '44444444-4444-4444-4444-444444444402',
    '11111111-1111-1111-1111-111111111104',
    CURRENT_DATE - 30,
    'Cio antes da última inseminação'
  ),
  (
    '44444444-4444-4444-4444-444444444403',
    '11111111-1111-1111-1111-111111111105',
    CURRENT_DATE - 85,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  vaca_id = EXCLUDED.vaca_id,
  data_cio = EXCLUDED.data_cio,
  observacoes = EXCLUDED.observacoes;

-- -----------------------------------------------------------------------------
-- INSEMINAÇÕES
-- -----------------------------------------------------------------------------

INSERT INTO inseminacoes (id, vaca_id, data_inseminacao, repetiu_cio, confirmada_prenhez, observacoes)
VALUES
  -- Luna: pendente verificação (22 dias atrás)
  (
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111104',
    CURRENT_DATE - 22,
    FALSE, FALSE,
    'Inseminação IA — aguardar 21 dias'
  ),

  -- Pérola: prenhez confirmada
  (
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111105',
    CURRENT_DATE - 80,
    FALSE, TRUE,
    'Prenhez confirmada'
  ),

  -- Jade: prenhez confirmada (gestação quase no fim)
  (
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111106',
    CURRENT_DATE - 282,
    FALSE, TRUE,
    'Prenhez confirmada — parto iminente'
  ),

  -- Exemplo histórico: repetiu cio
  (
    '22222222-2222-2222-2222-222222222205',
    '11111111-1111-1111-1111-111111111102',
    CURRENT_DATE - 90,
    TRUE, FALSE,
    'Repetiu cio — nova tentativa necessária'
  )
ON CONFLICT (id) DO UPDATE SET
  vaca_id = EXCLUDED.vaca_id,
  data_inseminacao = EXCLUDED.data_inseminacao,
  repetiu_cio = EXCLUDED.repetiu_cio,
  confirmada_prenhez = EXCLUDED.confirmada_prenhez,
  observacoes = EXCLUDED.observacoes;

-- -----------------------------------------------------------------------------
-- BEZERROS (4 fases do programa de leite + 1 desmamado)
-- -----------------------------------------------------------------------------

INSERT INTO bezerros (id, vaca_id, nome, sexo, data_nascimento, desmamado)
VALUES
  -- 1º mês: 6L/dia (15 dias de vida) — mãe Estrela
  (
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111101',
    'Trovão', 'macho',
    CURRENT_DATE - 15,
    FALSE
  ),

  -- 2º mês: 4L/dia (45 dias) — mãe Flor
  (
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111103',
    'Malhada', 'femea',
    CURRENT_DATE - 45,
    FALSE
  ),

  -- 3º mês: 3L manhã / desmame (75 dias) — mãe Luna
  (
    '33333333-3333-3333-3333-333333333303',
    '11111111-1111-1111-1111-111111111104',
    'Pintado', 'macho',
    CURRENT_DATE - 75,
    FALSE
  ),

  -- Quase saindo do bezerreiro (85 dias) — mãe Mimosa
  (
    '33333333-3333-3333-3333-333333333304',
    '11111111-1111-1111-1111-111111111102',
    'Fubá', 'macho',
    CURRENT_DATE - 85,
    FALSE
  ),

  -- Desmamado (100 dias)
  (
    '33333333-3333-3333-3333-333333333305',
    '11111111-1111-1111-1111-111111111106',
    'Estrelinha', 'femea',
    CURRENT_DATE - 100,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  vaca_id = EXCLUDED.vaca_id,
  nome = EXCLUDED.nome,
  sexo = EXCLUDED.sexo,
  data_nascimento = EXCLUDED.data_nascimento,
  desmamado = EXCLUDED.desmamado;

-- -----------------------------------------------------------------------------
-- Resumo do que testar (referência)
-- -----------------------------------------------------------------------------
-- | Vaca    | Cenário                                      |
-- |---------|----------------------------------------------|
-- | Estrela | Lactação < 40d + bezerro Trovão              |
-- | Mimosa  | +40d sem cio — Registrar Cio / IATF + Fubá |
-- | Flor    | Cio registrado — botão Inseminar + Malhada |
-- | Luna    | Verificar prenhez (21d) + Pintado          |
-- | Pérola  | Prenha + lactação — secar em / parto prev.   |
-- | Jade    | Prenha — botão Registrar Parto               |
-- | Branca  | Seca                                       |
-- | Canela  | Pré-parto                                  |
-- | Dama    | Protocolo IATF ativo (11d, dia 5)             |
-- | Nova    | Protocolo vencido — inseminar após protocolo  |
-- =============================================================================
