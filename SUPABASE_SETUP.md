# Configuração Completa do Supabase

## Passo 1: Verificar se as tabelas existem

Copie e execute este comando no **SQL Editor** do Supabase:

```sql
-- Verificar tabelas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Se as tabelas `products` e `compatibility` existirem, prossiga para o Passo 2.  
Se NÃO existirem, execute o **Passo 3**.

---

## Passo 2: Remover políticas RLS existentes (se houver)

Se encontrou as tabelas no Passo 1, execute isto para remover polices que possam estar bloqueando:

```sql
-- Desabilitar RLS temporariamente para teste
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility DISABLE ROW LEVEL SECURITY;

-- Ou, deletar as policies específicas:
DROP POLICY IF EXISTS "Allow public read access" ON products;
DROP POLICY IF EXISTS "Allow public insert" ON products;
DROP POLICY IF EXISTS "Allow public update" ON products;
DROP POLICY IF EXISTS "Allow public delete" ON products;

DROP POLICY IF EXISTS "Allow public read access" ON compatibility;
DROP POLICY IF EXISTS "Allow public insert" ON compatibility;
DROP POLICY IF EXISTS "Allow public update" ON compatibility;
DROP POLICY IF EXISTS "Allow public delete" ON compatibility;
```

Depois, **habilite RLS com políticas permissivas**:

```sql
-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility ENABLE ROW LEVEL SECURITY;

-- Criar policies permissivas
CREATE POLICY "Allow public read" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON products FOR DELETE USING (true);

CREATE POLICY "Allow public read" ON compatibility FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON compatibility FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON compatibility FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON compatibility FOR DELETE USING (true);
```

---

## Passo 3: CRIAR TABELAS DO ZERO (se não existem)

Copie e execute tudo isto no **SQL Editor**:

```sql
-- ===== DELETAR TABELAS ANTIGAS (SE EXISTIREM) =====
DROP TABLE IF EXISTS compatibility CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- ===== CRIAR TABELA: products =====
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  marca TEXT DEFAULT '',
  priceResale NUMERIC(10, 2) DEFAULT 0,
  priceResaleWithIPI NUMERIC(10, 2) DEFAULT 0,
  catalog_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_description ON products(description);

-- ===== CRIAR TABELA: compatibility =====
CREATE TABLE compatibility (
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

-- Criar índices
CREATE INDEX idx_compatibility_equipamento ON compatibility(equipamento);
CREATE INDEX idx_compatibility_acessorio ON compatibility(acessorio);
CREATE INDEX idx_compatibility_fabricante ON compatibility(fabricante);

-- ===== HABILITAR RLS COM POLICIES PERMISSIVAS =====
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility ENABLE ROW LEVEL SECURITY;

-- Policies para products
CREATE POLICY "Allow public read" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON products FOR DELETE USING (true);

-- Policies para compatibility
CREATE POLICY "Allow public read" ON compatibility FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON compatibility FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON compatibility FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON compatibility FOR DELETE USING (true);

-- ===== VERIFICAÇÃO FINAL =====
-- Este SELECT deve retornar as duas tabelas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```

---

## Passo 4: Testar inserção de dados

Após executar o Passo 3, insira um produto de teste:

```sql
INSERT INTO products (code, description, marca, priceResale, priceResaleWithIPI)
VALUES ('TEST-001', 'Produto Teste', 'Marca Teste', 100.00, 120.00);
```

Se conseguir inserir sem erro, as tabelas estão prontas! ✅

---

## Passo 5: Recarregar a aplicação

Após executar os passos acima:

1. Volte para a aplicação (no preview)
2. Pressione `F5` para recarregar
3. Se der erro, abra o **Console do Navegador** (F12 → Aba "Console")
4. Procure por mensagens de erro com mais detalhes

---

## Troubleshooting

### "Error fetching from Supabase: [object Object]"

Se ainda receber este erro após executar tudo, **veja o console (F12)** e procure por:
- `Error fetching from Supabase:` com detalhes de status, código e mensagem
- `[useSupabaseCompatibility] Supabase error details:` com mais info

### "Não tenho acesso ao SQL Editor"

Se sua conta não tem acesso ao SQL Editor do Supabase:

1. Vá para `https://app.supabase.com`
2. Faça login
3. Selecione seu projeto (xlulghxjzkjlxkvpcbrr)
4. Vá para **SQL Editor** na barra lateral esquerda
5. Cole os comandos acima

### "Permission denied" ou "policy"

Se receber erro de política:
- Execute o **Passo 2** novamente
- Certifique-se de que RLS está **ENABLED** e as policies estão **criadas**

---

## Debug: Ver o erro real no console

Abra o console do navegador (F12) e procure por:

```
[useSupabaseCompatibility] Supabase error details:
```

Isso vai mostrar:
- `status`: código HTTP (401, 403, 404, etc)
- `message`: mensagem de erro
- `code`: código Supabase
- `details`: detalhes adicionais
- `hint`: dica de solução

Anote o `status` e `message` e comparar com:

- **401/403**: Problema de autenticação/permissão → Execute Passo 2
- **404**: Tabela não existe → Execute Passo 3
- **Outro**: Compartilhe o erro completo

---

## Resumo dos Passos

| Passo | O quê? | Quando? |
|-------|--------|--------|
| 1 | Verificar tabelas | Sempre fazer primeiro |
| 2 | Remover/criar policies | Se tabelas existem |
| 3 | Criar tabelas do zero | Se tabelas NÃO existem |
| 4 | Testar inserção | Após Passo 3 |
| 5 | Recarregar app | Sempre fazer por último |
