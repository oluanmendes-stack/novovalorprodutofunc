# Setup Supabase - Criação de Tabelas de Produtos

## Estrutura do Arquivo CSV
O arquivo de importação deve ter o seguinte formato:
```
Fabricante;Descrição;Preço Distribuidor s/ IPI;Preço Distribuidor c/ IPI;Preço Unit. Final s/ IPI;Preço Final c/ IPI
5L500;BATERIA DE LITIO NAO RECARREGAVEL;2.288,58;2.511,72;2.542,87;2.790,80
```

## SQL para Deletar e Recriar as Tabelas

Execute os comandos SQL abaixo no **SQL Editor** do Supabase (Settings → SQL Editor → New Query):

### 1️⃣ Deletar a tabela existente (se houver)
```sql
-- Drop the table if it exists (this will delete all data!)
DROP TABLE IF EXISTS products CASCADE;
```

### 2️⃣ Criar a tabela com todas as colunas necessárias
```sql
-- Create products table with all price columns
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  marca VARCHAR(255),
  
  -- Distributor prices
  price_distributor DECIMAL(10, 2),
  price_distributor_with_ipi DECIMAL(10, 2),
  
  -- Final prices (resale)
  price_final DECIMAL(10, 2),
  price_final_with_ipi DECIMAL(10, 2),
  
  -- Legacy column names (for backward compatibility)
  priceResale DECIMAL(10, 2),
  priceResaleWithIPI DECIMAL(10, 2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for better query performance
  CONSTRAINT price_distributor_positive CHECK (price_distributor >= 0),
  CONSTRAINT price_distributor_with_ipi_positive CHECK (price_distributor_with_ipi >= 0),
  CONSTRAINT price_final_positive CHECK (price_final >= 0),
  CONSTRAINT price_final_with_ipi_positive CHECK (price_final_with_ipi >= 0)
);

-- Create indexes for faster queries
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_description ON products USING GIN(to_tsvector('portuguese', description));
CREATE INDEX idx_products_marca ON products(marca);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 3️⃣ Habilitar RLS (Row Level Security) - Opcional mas recomendado
```sql
-- Enable RLS on the products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow SELECT for all users (anonymous)
CREATE POLICY "Allow select for all users" ON products
  FOR SELECT
  USING (true);

-- Create a policy to allow INSERT/UPDATE/DELETE only for authenticated users
CREATE POLICY "Allow insert/update/delete for authenticated users" ON products
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON products
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users" ON products
  FOR DELETE
  USING (true);
```

## Passos para Executar

1. **Acesse o Supabase Dashboard**
   - Vá para seu projeto no [supabase.com](https://supabase.com)

2. **Acesse o SQL Editor**
   - Clique em "SQL Editor" no menu lateral esquerdo
   - Clique em "New Query"

3. **Execute o SQL de DELETE (se houver dados antigos)**
   ```sql
   DROP TABLE IF EXISTS products CASCADE;
   ```

4. **Execute o SQL de CREATE**
   - Copie o SQL de criação acima
   - Cole no SQL Editor
   - Clique em "Run"

5. **Importe os dados**
   - Volte para a aplicação
   - Vá para **Configurações** → **Gerenciar Produtos**
   - Clique em **"Importar CSV"**
   - Selecione seu arquivo CSV com as 6 colunas no formato correto

## Verificar se a Tabela foi Criada

No SQL Editor, execute:
```sql
SELECT * FROM products LIMIT 10;
```

Você deve ver uma tabela vazia com as colunas certas.

## Verificar Após Importar

Após importar o CSV, execute:
```sql
SELECT 
  code, 
  description, 
  price_distributor, 
  price_distributor_with_ipi,
  price_final,
  price_final_with_ipi,
  created_at
FROM products 
ORDER BY code 
LIMIT 10;
```

## Colunas da Tabela

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único do produto |
| `code` | VARCHAR(255) | Código do produto (único) |
| `description` | TEXT | Descrição do produto |
| `marca` | VARCHAR(255) | Marca/Fabricante |
| `price_distributor` | DECIMAL(10,2) | Preço Distribuidor sem IPI |
| `price_distributor_with_ipi` | DECIMAL(10,2) | Preço Distribuidor com IPI |
| `price_final` | DECIMAL(10,2) | Preço Final/Revenda sem IPI |
| `price_final_with_ipi` | DECIMAL(10,2) | Preço Final/Revenda com IPI |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

## Notas Importantes

- As colunas `priceResale` e `priceResaleWithIPI` são mantidas para **compatibilidade backward** com código antigo
- A aplicação mapeia automaticamente entre os nomes em snake_case e camelCase
- Use `price_final` e `price_final_with_ipi` para produtos (essas são as colunas principais)
- Use `price_distributor` e `price_distributor_with_ipi` para preços de distribuidor

## Troubleshooting

### Erro: "products" table already exists
Execute o comando DROP TABLE primeiro:
```sql
DROP TABLE IF EXISTS products CASCADE;
```

### Erro: Constraint violation quando importar
Certifique-se de que:
- Os valores de preço são números válidos
- O código do produto é único (não há duplicatas)
- Os valores de preço não são negativos

### Dados antigos não aparecem
Verifique se usou o DROP TABLE. Os dados foram deletados permanentemente.
