# SQL para Executar no Supabase

## 📋 COPIE E COLE TODO O CÓDIGO ABAIXO NO SUPABASE

Faça isto:
1. Acesse [supabase.com](https://supabase.com)
2. Vá para seu projeto
3. Clique em **"SQL Editor"** → **"New Query"**
4. **COPIE TODO o código abaixo**
5. **COLE** no SQL Editor do Supabase
6. Clique em **"RUN"** (botão azul no canto superior direito)

---

```sql
-- DELETAR TABELA EXISTENTE (CUIDADO: DELETA TODOS OS DADOS!)
DROP TABLE IF EXISTS products CASCADE;

-- CRIAR TABELA COM 6 COLUNAS DE PREÇO
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  marca VARCHAR(255),
  
  -- Preços Distribuidor
  price_distributor DECIMAL(10, 2),
  price_distributor_with_ipi DECIMAL(10, 2),
  
  -- Preços Final (Revenda)
  price_final DECIMAL(10, 2),
  price_final_with_ipi DECIMAL(10, 2),
  
  -- Compatibilidade
  priceResale DECIMAL(10, 2),
  priceResaleWithIPI DECIMAL(10, 2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT price_distributor_non_negative CHECK (price_distributor >= 0),
  CONSTRAINT price_distributor_with_ipi_non_negative CHECK (price_distributor_with_ipi >= 0),
  CONSTRAINT price_final_non_negative CHECK (price_final >= 0),
  CONSTRAINT price_final_with_ipi_non_negative CHECK (price_final_with_ipi >= 0)
);

-- CRIAR ÍNDICES
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_marca ON products(marca);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- FUNÇÃO PARA ATUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER PARA ATUALIZAR TIMESTAMP
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- HABILITAR RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Allow select for all users" ON products
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for all users" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for all users" ON products
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete for all users" ON products
  FOR DELETE USING (true);
```

---

## ✅ Verificar se Funcionou

Depois de executar o SQL acima, execute:

```sql
SELECT COUNT(*) as total_produtos FROM products;
```

Você deve ver: `0` (tabela vazia, mas criada com sucesso)

---

## 📌 Próximo Passo

Após executar este SQL:

1. Volte para a **aplicação**
2. Vá para **⚙️ Configurações**
3. Clique em **"Importar CSV"** em "Gerenciar Produtos"
4. Selecione seu arquivo com 6 colunas
5. Pronto! 🎉

---

## ❓ Se deu erro "products already exists"

Execute apenas isto:
```sql
DROP TABLE IF EXISTS products CASCADE;
```

Depois execute o resto do script novamente.

---

**Sucesso! Seu banco está pronto para importar produtos com 6 colunas de preço! 🚀**
