-- Migração: histórico de prenhezes + saúde (execute se o banco já existia)

ALTER TABLE vacas ADD COLUMN IF NOT EXISTS total_prenhezes INTEGER NOT NULL DEFAULT 0 CHECK (total_prenhezes >= 0);
ALTER TABLE vacas ADD COLUMN IF NOT EXISTS doente BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE vacas ADD COLUMN IF NOT EXISTS doenca TEXT;
