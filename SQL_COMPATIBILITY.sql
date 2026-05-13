-- Create compatibility catalog table
CREATE TABLE IF NOT EXISTS compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento TEXT NOT NULL,
  parametro TEXT,
  fabricante TEXT NOT NULL,
  modelo TEXT NOT NULL,
  acessorio TEXT NOT NULL,
  foto_produto TEXT[] DEFAULT '{}',
  foto_conexao TEXT[] DEFAULT '{}',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for search performance
CREATE INDEX IF NOT EXISTS idx_compatibility_equipamento ON compatibility(equipamento);
CREATE INDEX IF NOT EXISTS idx_compatibility_fabricante ON compatibility(fabricante);
CREATE INDEX IF NOT EXISTS idx_compatibility_modelo ON compatibility(modelo);
CREATE INDEX IF NOT EXISTS idx_compatibility_acessorio ON compatibility(acessorio);

-- Disable RLS (Row Level Security) to allow unauthenticated access
-- This is needed since the client-side app uses public key without authentication
ALTER TABLE compatibility DISABLE ROW LEVEL SECURITY;
