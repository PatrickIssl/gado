-- Migração: adicionar data_inseminacao_prenhez (execute se já criou o banco antes)
ALTER TABLE vacas ADD COLUMN IF NOT EXISTS data_inseminacao_prenhez DATE;
