-- Brucelose: bezerras (fêmeas) devem vacinar após 90 dias de vida
ALTER TABLE bezerros ADD COLUMN IF NOT EXISTS brucelose_aplicada BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bezerros ADD COLUMN IF NOT EXISTS data_brucelose DATE;
