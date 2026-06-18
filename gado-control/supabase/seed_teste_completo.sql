-- =============================================================================
-- GadoControl — SEED COMPLETO PARA VALIDAÇÃO DE TODAS AS FUNÇÕES
-- =============================================================================
-- Pré-requisitos (rode antes, nesta ordem):
--   1. schema.sql
--   2. migration_prenhez.sql (se existir)
--   3. migration_cios_protocolo.sql (se existir)
--   4. migration_saude_prenhezes.sql (se existir)
--   5. migration_brucelose.sql (se existir)
--
-- Usa CURRENT_DATE → datas relativas ao dia em que você executar.
-- IDs fixos (UUID) para facilitar debug e reexecução idempotente.
--
-- COMO USAR:
--   1. Descomente o bloco TRUNCATE abaixo para limpar dados antigos
--   2. Execute este script inteiro no SQL Editor do Supabase
--   3. Abra o app e valide o checklist no final deste arquivo
-- =============================================================================

-- ▼ Descomente para LIMPAR tudo antes de popular:
-- TRUNCATE bezerros, inseminacoes, cios, vacas CASCADE;

-- =============================================================================
-- VACAS (20 cenários)
-- =============================================================================
INSERT INTO vacas (
  id, numero, nome, raca, status, data_parto,
  data_ultima_inseminacao, data_inseminacao_prenhez,
  data_inicio_protocolo_iatf, dias_protocolo_iatf,
  total_prenhezes, doente, doenca
) VALUES
  -- 01) Novilha vazia — sem parto, sem ciclo
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
    'T01', 'Novilha', 'Jersey', 'vazia',
    NULL, NULL, NULL, NULL, NULL,
    0, FALSE, NULL
  ),

  -- 02) Parto HOJE — último parto = hoje, lactação iniciando
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
    'T02', 'Manhã', 'Holandesa', 'lactacao',
    CURRENT_DATE, NULL, NULL, NULL, NULL,
    1, FALSE, NULL
  ),

  -- 03) Lactação recente (< 40d) — ainda não pode inseminar
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',
    'T03', 'Estrela', 'Holandesa', 'lactacao',
    CURRENT_DATE - 15, NULL, NULL, NULL, NULL,
    0, FALSE, NULL
  ),

  -- 04) Lactação +40d SEM cio — Registrar Cio / Protocolo IATF (DOENTE)
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04',
    'T04', 'Mimosa', 'Holandesa', 'lactacao',
    CURRENT_DATE - 85, NULL, NULL, NULL, NULL,
    3, TRUE, 'Mastite leve'
  ),

  -- 05) Cio registrado ontem — botão Inseminar
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05',
    'T05', 'Flor', 'Jersey', 'lactacao',
    CURRENT_DATE - 50, NULL, NULL, NULL, NULL,
    1, FALSE, NULL
  ),

  -- 06) Inseminada há 10d — ainda NÃO entra em "Verificar prenhez" (< 21d)
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06',
    'T06', 'Belinha', 'Gir', 'lactacao',
    CURRENT_DATE - 70,
    CURRENT_DATE - 10, NULL, NULL, NULL,
    2, FALSE, NULL
  ),

  -- 07) Inseminada há 21d — verificar prenhez HOJE (pendente)
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07',
    'T07', 'Luna', 'Gir', 'lactacao',
    CURRENT_DATE - 80,
    CURRENT_DATE - 21, NULL, NULL, NULL,
    2, FALSE, NULL
  ),

  -- 08) Inseminada há 28d — verificar prenhez ATRASADA (pendente)
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08',
    'T08', 'Marrom', 'Girolanda', 'lactacao',
    CURRENT_DATE - 90,
    CURRENT_DATE - 28, NULL, NULL, NULL,
    4, FALSE, NULL
  ),

  -- 09) Prenha + lactação — secagem / previsão de parto no card
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa09',
    'T09', 'Pérola', 'Holandesa', 'prenha',
    CURRENT_DATE - 120,
    CURRENT_DATE - 90,
    CURRENT_DATE - 90, NULL, NULL,
    5, FALSE, NULL
  ),

  -- 10) Prenha — próximo da secagem (gestação ~200d)
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10',
    'T10', 'Rosa', 'Jersey', 'prenha',
    CURRENT_DATE - 350,
    CURRENT_DATE - 200,
    CURRENT_DATE - 200, NULL, NULL,
    6, FALSE, NULL
  ),

  -- 11) Prenha — parto IMINENTE (amanhã) — botão Registrar Parto
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11',
    'T11', 'Jade', 'Girolanda', 'prenha',
    CURRENT_DATE - 400,
    CURRENT_DATE - 282,
    CURRENT_DATE - 282, NULL, NULL,
    7, FALSE, NULL
  ),

  -- 12) Prenha — previsão de parto HOJE
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12',
    'T12', 'Ursa', 'Holandesa', 'prenha',
    CURRENT_DATE - 500,
    CURRENT_DATE - 283,
    CURRENT_DATE - 283, NULL, NULL,
    8, FALSE, NULL
  ),

  -- 13) Período SECA
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13',
    'T13', 'Branca', 'Holandesa', 'seca',
    CURRENT_DATE - 250,
    NULL, NULL, NULL, NULL,
    3, FALSE, NULL
  ),

  -- 14) PRÉ-PARTO (30d antes do fim da seca / previsão parto)
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa14',
    'T14', 'Canela', 'Jersey', 'pre_parto',
    CURRENT_DATE - 285,
    NULL, NULL, NULL, NULL,
    2, FALSE, NULL
  ),

  -- 15) Vazia pós-ciclo — seca já terminou, aguardando novo ciclo
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15',
    'T15', 'Sombra', 'Gir', 'vazia',
    CURRENT_DATE - 400,
    NULL, NULL, NULL, NULL,
    9, FALSE, NULL
  ),

  -- 16) Protocolo IATF ativo — 11 dias (dia 5 de 11)
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16',
    'T16', 'Dama', 'Holandesa', 'em_protocolo_iatf',
    CURRENT_DATE - 55,
    NULL, NULL,
    CURRENT_DATE - 5, 11,
    1, FALSE, NULL
  ),

  -- 17) Protocolo IATF ativo — 10 dias (dia 8 de 10)
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa17',
    'T17', 'Íris', 'Jersey', 'em_protocolo_iatf',
    CURRENT_DATE - 60,
    NULL, NULL,
    CURRENT_DATE - 8, 10,
    0, FALSE, NULL
  ),

  -- 18) Protocolo VENCIDO — app corrige status ao carregar → inseminar
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa18',
    'T18', 'Nova', 'Jersey', 'em_protocolo_iatf',
    CURRENT_DATE - 65,
    NULL, NULL,
    CURRENT_DATE - 15, 10,
    0, FALSE, NULL
  ),

  -- 19) Segunda vaca DOENTE — card do painel "Vacas Doentes"
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa19',
    'T19', 'Fumaça', 'Girolanda', 'lactacao',
    CURRENT_DATE - 30,
    NULL, NULL, NULL, NULL,
    1, TRUE, 'Pneumonia'
  ),

  -- 20) Lactação exatamente no 40º dia pós-parto — limite para inseminar
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa20',
    'T20', 'Limite', 'Holandesa', 'lactacao',
    CURRENT_DATE - 40,
    NULL, NULL, NULL, NULL,
    2, FALSE, NULL
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

-- =============================================================================
-- CIOS
-- =============================================================================
INSERT INTO cios (id, vaca_id, data_cio, observacoes) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05', CURRENT_DATE - 1,  'Cio ontem — inseminar'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07', CURRENT_DATE - 35, 'Cio anterior à IA'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa09', CURRENT_DATE - 95, 'Cio antes da prenhez'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04', CURRENT_DATE - 100,'Cio antigo — repetiu depois')
ON CONFLICT (id) DO UPDATE SET
  vaca_id = EXCLUDED.vaca_id,
  data_cio = EXCLUDED.data_cio,
  observacoes = EXCLUDED.observacoes;

-- =============================================================================
-- INSEMINAÇÕES
-- =============================================================================
INSERT INTO inseminacoes (
  id, vaca_id, data_inseminacao, repetiu_cio, confirmada_prenhez, observacoes
) VALUES
  -- Belinha: ainda dentro dos 21d (NÃO pendente)
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06',
   CURRENT_DATE - 10, FALSE, FALSE, 'Aguardar 21 dias'),

  -- Luna: verificar HOJE
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07',
   CURRENT_DATE - 21, FALSE, FALSE, 'Verificar prenhez hoje'),

  -- Marrom: verificar ATRASADA
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08',
   CURRENT_DATE - 28, FALSE, FALSE, 'Verificação atrasada'),

  -- Pérola: prenhez confirmada
  ('cccccccc-cccc-cccc-cccc-cccccccccc04', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa09',
   CURRENT_DATE - 90, FALSE, TRUE, 'Prenhez confirmada'),

  -- Rosa: prenhez confirmada
  ('cccccccc-cccc-cccc-cccc-cccccccccc05', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10',
   CURRENT_DATE - 200, FALSE, TRUE, 'Prenhez confirmada'),

  -- Jade: parto iminente
  ('cccccccc-cccc-cccc-cccc-cccccccccc06', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11',
   CURRENT_DATE - 282, FALSE, TRUE, 'Parto amanhã'),

  -- Ursa: parto previsto hoje
  ('cccccccc-cccc-cccc-cccc-cccccccccc07', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12',
   CURRENT_DATE - 283, FALSE, TRUE, 'Parto previsto hoje'),

  -- Mimosa: repetiu cio (histórico)
  ('cccccccc-cccc-cccc-cccc-cccccccccc08', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04',
   CURRENT_DATE - 95, TRUE, FALSE, 'Repetiu cio — nova tentativa')
ON CONFLICT (id) DO UPDATE SET
  vaca_id = EXCLUDED.vaca_id,
  data_inseminacao = EXCLUDED.data_inseminacao,
  repetiu_cio = EXCLUDED.repetiu_cio,
  confirmada_prenhez = EXCLUDED.confirmada_prenhez,
  observacoes = EXCLUDED.observacoes;

-- =============================================================================
-- BEZERROS (todas as fases do programa de leite)
-- =============================================================================
INSERT INTO bezerros (
  id, vaca_id, nome, sexo, data_nascimento, desmamado,
  brucelose_aplicada, data_brucelose
) VALUES
  -- Nasceu HOJE (mãe Manhã — parto hoje) — bezerra, brucelose em 90d
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
   'Alvorada', 'femea', CURRENT_DATE, FALSE, FALSE, NULL),

  -- 1º mês — macho (sem brucelose)
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',
   'Trovão', 'macho', CURRENT_DATE - 15, FALSE, FALSE, NULL),

  -- 2º mês — bezerra aguardando 90d
  ('dddddddd-dddd-dddd-dddd-dddddddddd03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05',
   'Malhada', 'femea', CURRENT_DATE - 45, FALSE, FALSE, NULL),

  -- 3º mês — macho
  ('dddddddd-dddd-dddd-dddd-dddddddddd04', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07',
   'Pintado', 'macho', CURRENT_DATE - 75, FALSE, FALSE, NULL),

  -- Quase 90d — macho
  ('dddddddd-dddd-dddd-dddd-dddddddddd05', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04',
   'Fubá', 'macho', CURRENT_DATE - 88, FALSE, FALSE, NULL),

  -- 100d — bezerra BRUCELOSE PENDENTE
  ('dddddddd-dddd-dddd-dddd-dddddddddd06', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11',
   'Estrelinha', 'femea', CURRENT_DATE - 100, TRUE, FALSE, NULL),

  -- 95d — macho (sem brucelose)
  ('dddddddd-dddd-dddd-dddd-dddddddddd07', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa09',
   'Pingo', 'macho', CURRENT_DATE - 95, FALSE, FALSE, NULL),

  -- 120d — bezerra BRUCELOSE PENDENTE (atrasada)
  ('dddddddd-dddd-dddd-dddd-dddddddddd08', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13',
   'Neblina', 'femea', CURRENT_DATE - 120, TRUE, FALSE, NULL),

  -- 110d — bezerra com brucelose JÁ APLICADA
  ('dddddddd-dddd-dddd-dddd-dddddddddd09', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa14',
   'Florzinha', 'femea', CURRENT_DATE - 110, TRUE, TRUE, CURRENT_DATE - 5)
ON CONFLICT (id) DO UPDATE SET
  vaca_id = EXCLUDED.vaca_id,
  nome = EXCLUDED.nome,
  sexo = EXCLUDED.sexo,
  data_nascimento = EXCLUDED.data_nascimento,
  desmamado = EXCLUDED.desmamado,
  brucelose_aplicada = EXCLUDED.brucelose_aplicada,
  data_brucelose = EXCLUDED.data_brucelose;

-- =============================================================================
-- CONSULTAS DE VERIFICAÇÃO (rode após o seed)
-- =============================================================================

-- Resumo geral
SELECT
  (SELECT COUNT(*) FROM vacas) AS total_vacas,
  (SELECT COUNT(*) FROM vacas WHERE status = 'prenha') AS prenhas,
  (SELECT COUNT(*) FROM vacas WHERE status = 'lactacao') AS lactacao_status,
  (SELECT COUNT(*) FROM vacas WHERE status = 'seca') AS secas,
  (SELECT COUNT(*) FROM vacas WHERE status = 'pre_parto') AS pre_parto,
  (SELECT COUNT(*) FROM vacas WHERE status = 'em_protocolo_iatf') AS protocolo_iatf,
  (SELECT COUNT(*) FROM vacas WHERE doente = TRUE) AS doentes,
  (SELECT COUNT(*) FROM bezerros WHERE desmamado = FALSE
     AND data_nascimento > CURRENT_DATE - 90) AS bezerros_bezerreiro,
  (SELECT COUNT(*) FROM inseminacoes i
     WHERE i.confirmada_prenhez = FALSE
       AND i.repetiu_cio = FALSE
       AND i.data_inseminacao + 21 <= CURRENT_DATE) AS insem_verificar_prenhez,
  (SELECT COUNT(*) FROM bezerros b
     WHERE b.sexo = 'femea'
       AND COALESCE(b.brucelose_aplicada, FALSE) = FALSE
       AND b.data_nascimento + 90 <= CURRENT_DATE) AS brucelose_pendente;

-- Lista rápida por vaca
SELECT
  numero,
  nome,
  status,
  data_parto,
  data_ultima_inseminacao,
  data_inseminacao_prenhez,
  data_inicio_protocolo_iatf,
  dias_protocolo_iatf,
  total_prenhezes,
  doente,
  doenca
FROM vacas
ORDER BY numero;

-- =============================================================================
-- CHECKLIST DE VALIDAÇÃO NO APP
-- =============================================================================
-- PAINEL (cards clicáveis):
--   [ ] Total de Vacas .............. 20
--   [ ] Prenhas ..................... 4 (Pérola, Rosa, Jade, Ursa)
--   [ ] Em Lactação ................. várias (inclui lactando + prenha)
--   [ ] Bezerros no Bezerreiro ...... 5 (Alvorada, Trovão, Malhada, Pintado, Fubá)
--   [ ] Verificar Prenhez ........... 2 (Luna hoje + Marrom atrasada) — Belinha NÃO
--   [ ] Protocolo IATF .............. 2 ativos (Dama, Íris) — Nova corrige ao abrir
--   [ ] Vacas Doentes ............... 2 (Mimosa, Fumaça)
--
-- VACAS — ações por animal:
--   [ ] T01 Novilha ................. vazia, sem datas
--   [ ] T02 Manhã ................... parto hoje, bezerro Alvorada
--   [ ] T03 Estrela ................. lactação < 40d, inseminar em ~25d
--   [ ] T04 Mimosa .................. +40d sem cio → Cio / IATF, badge doente
--   [ ] T05 Flor .................... cio ontem → Inseminar
--   [ ] T06 Belinha ................. inseminada 10d, NÃO pendente
--   [ ] T07 Luna .................... verificar prenhez HOJE
--   [ ] T08 Marrom .................. verificar prenhez ATRASADA
--   [ ] T09 Pérola .................. prenha + lactação, cards Secagem/Previsão
--   [ ] T10 Rosa .................... prenha, próximo da secagem
--   [ ] T11 Jade .................... parto amanhã → Registrar Parto
--   [ ] T12 Ursa .................... parto previsto HOJE → Registrar Parto
--   [ ] T13 Branca .................. seca
--   [ ] T14 Canela .................. pré-parto
--   [ ] T15 Sombra .................. vazia pós-ciclo
--   [ ] T16 Dama .................... protocolo 11d (dia 5)
--   [ ] T17 Íris .................... protocolo 10d (dia 8)
--   [ ] T18 Nova .................... protocolo vencido → inseminar ao abrir app
--   [ ] T19 Fumaça .................. doente pneumonia
--   [ ] T20 Limite .................. exatamente 40d pós-parto
--
-- CARDS — labels e ordem cronológica:
--   [ ] "Secagem" (fim lactação = início seca em 1 card)
--   [ ] "Previsão do parto" (antigo fim seca)
--   [ ] Marcos em ordem de data
--
-- INSEMINAÇÕES (?filtro=pendentes):
--   [ ] Luna e Marrom listadas
--   [ ] Belinha NÃO listada
--
-- BEZERROS:
--   [ ] ?filtro=bezerreiro → 5 animais
--   [ ] ?filtro=desmamados → Estrelinha + Pingo
--   [ ] Fases: 1º mês, 2º mês, 3º mês/desmame corretas
--   [ ] ?filtro=brucelose_pendente → Estrelinha + Neblina
--   [ ] Registrar Brucelose em bezerra pendente
--
-- FLUXOS PARA TESTAR MANUALMENTE:
--   [ ] Confirmar parto em Ursa/Jade → total_prenhezes +1, novo bezerro
--   [ ] Confirmar prenhez em Luna → status prenha
--   [ ] Registrar cio em Mimosa/Limite
--   [ ] Inseminar Flor
--   [ ] Protocolo IATF em Mimosa
--   [ ] Editar vaca: marcar doente + doença
--   [ ] Wizard cadastro nova vaca (4 passos)
-- =============================================================================
