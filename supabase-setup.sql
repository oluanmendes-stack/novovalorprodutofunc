-- ============================================================================
-- SUPABASE SETUP SCRIPT - Deletar e Recriar Tabela de Produtos
-- ============================================================================
-- 
-- Este script cria a tabela "products" com todas as colunas necessárias
-- para importar o arquivo CSV com 6 colunas de preço
--
-- Colunas esperadas no CSV:
-- Fabricante;Descrição;Preço Distribuidor s/ IPI;Preço Distribuidor c/ IPI;Preço Unit. Final s/ IPI;Preço Final c/ IPI
--
-- ============================================================================

-- 1. DELETAR TABELA EXISTENTE (SE HOUVER)
-- ⚠️ ATENÇÃO: Isto irá DELETAR todos os dados! Faça backup antes!
DROP TABLE IF EXISTS products CASCADE;

-- ============================================================================

-- 2. CRIAR TABELA DE PRODUTOS COM TODAS AS COLUNAS
CREATE TABLE products (
  -- ID e chaves primárias
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(255) NOT NULL UNIQUE,
  
  -- Informações do produto
  description TEXT NOT NULL,
  marca VARCHAR(255),
  
  -- PREÇOS DISTRIBUIDOR
  price_distributor DECIMAL(10, 2),
  price_distributor_with_ipi DECIMAL(10, 2),
  
  -- PREÇOS FINAL/REVENDA (Principais)
  price_final DECIMAL(10, 2),
  price_final_with_ipi DECIMAL(10, 2),
  
  -- Compatibilidade com código legado
  priceResale DECIMAL(10, 2),
  priceResaleWithIPI DECIMAL(10, 2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints de validação
  CONSTRAINT price_distributor_non_negative CHECK (price_distributor >= 0),
  CONSTRAINT price_distributor_with_ipi_non_negative CHECK (price_distributor_with_ipi >= 0),
  CONSTRAINT price_final_non_negative CHECK (price_final >= 0),
  CONSTRAINT price_final_with_ipi_non_negative CHECK (price_final_with_ipi >= 0)
);

-- ============================================================================

-- 3. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_marca ON products(marca);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_description_fulltext ON products 
  USING GIN(to_tsvector('portuguese', description));

-- ============================================================================

-- 4. FUNÇÃO PARA ATUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGER PARA ATUALIZAR TIMESTAMP
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================

-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT (todos podem ler)
CREATE POLICY "Allow select for all users" ON products
  FOR SELECT
  USING (true);

-- Policy para INSERT
CREATE POLICY "Allow insert for all users" ON products
  FOR INSERT
  WITH CHECK (true);

-- Policy para UPDATE
CREATE POLICY "Allow update for all users" ON products
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy para DELETE
CREATE POLICY "Allow delete for all users" ON products
  FOR DELETE
  USING (true);

-- ============================================================================

-- TESTES (execute estes comandos para verificar)
-- SELECT * FROM products LIMIT 5;
-- SELECT count(*) as total_products FROM products;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
