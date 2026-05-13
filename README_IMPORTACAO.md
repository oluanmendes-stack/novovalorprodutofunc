# 📖 Guia Completo - Importação de Produtos com 6 Colunas de Preço

## 🎯 Objetivo

A aplicação agora **importa, armazena e gerencia produtos** com **6 colunas de preço** em vez de apenas 4.

---

## 📚 Arquivos de Referência

| Arquivo | Descrição |
|---------|-----------|
| **COMECE_AQUI.md** | ⭐ **LEIA PRIMEIRO** - Guia rápido e direto |
| **EXECUTE_ESTE_SQL.md** | 💾 SQL pronto para copiar e colar no Supabase |
| **exemplo_importacao.csv** | 📋 Arquivo CSV de exemplo |
| **DIAGRAMA_FLUXO.md** | 📊 Visual do fluxo de dados |
| **INSTRUCOES_IMPORTACAO.md** | 📝 Instruções detalhadas passo a passo |
| **SETUP_SUPABASE.md** | 🔧 Documentação técnica completa |
| **RESUMO_MUDANCAS.md** | 📌 O que foi alterado no código |

---

## 🚀 Início Rápido (3 passos)

### 1️⃣ Preparar Banco de Dados

```bash
# Abra o arquivo: EXECUTE_ESTE_SQL.md
# Copie TODO o SQL
# Cole no SQL Editor do Supabase
# Clique em RUN
```

### 2️⃣ Importar Arquivo CSV

```bash
# Aplicação → ⚙️ Configurações
# Procure por "Gerenciar Produtos"
# Clique em "Importar CSV"
# Selecione seu arquivo
```

### 3️⃣ Verificar

```bash
# Você deve ver: "Total de produtos: X"
# Pronto! 🎉
```

---

## 📋 Formato CSV Obrigatório

### Estrutura

```
Fabricante;Descrição;Preço Distribuidor s/ IPI;Preço Distribuidor c/ IPI;Preço Unit. Final s/ IPI;Preço Final c/ IPI
```

### Exemplo Real

```csv
Fabricante;Descrição;Preço Distribuidor s/ IPI;Preço Distribuidor c/ IPI;Preço Unit. Final s/ IPI;Preço Final c/ IPI
5L500;BATERIA DE LITIO NAO RECARREGAVEL;2.288,58;2.511,72;2.542,87;2.790,80
3L960;BATERIA DE NIMH INTERNA RECARREGAVEL;2.379,44;2.611,44;2.643,83;2.901,60
AM1000;BATERIA LIMNO2 12 VOLT;4.202,00;4.611,70;4.668,89;5.124,11
```

### Regras Críticas

- ✅ **Exatamente 6 colunas** (não mais, não menos)
- ✅ **Separador de colunas**: ponto-e-vírgula `;`
- ✅ **Separador de decimais**: vírgula `,`
- ✅ **Sem aspas** ao redor de valores
- ✅ **Primeira linha**: cabeçalho (será ignorado)
- ✅ **Mínimo 2 linhas**: 1 cabeçalho + 1 produto
- ✅ **Códigos únicos**: não há códigos duplicados

---

## 📊 As 6 Colunas Explicadas

| # | Coluna | Formato | Exemplo | Descrição |
|---|--------|---------|---------|-----------|
| 1 | Fabricante | VARCHAR(255) | `5L500` | Código único do produto |
| 2 | Descrição | TEXT | `BATERIA DE LITIO` | Nome/descrição do produto |
| 3 | Preço Distribuidor s/ IPI | DECIMAL(10,2) | `2.288,58` | Preço sem imposto para distribuidor |
| 4 | Preço Distribuidor c/ IPI | DECIMAL(10,2) | `2.511,72` | Preço com imposto para distribuidor |
| 5 | Preço Unit. Final s/ IPI | DECIMAL(10,2) | `2.542,87` | Preço unitário final sem imposto |
| 6 | Preço Final c/ IPI | DECIMAL(10,2) | `2.790,80` | Preço final com imposto (revenda) |

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `products`

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,                      -- ID único
  code VARCHAR(255) NOT NULL UNIQUE,        -- Código (coluna 1)
  description TEXT NOT NULL,                -- Descrição (coluna 2)
  marca VARCHAR(255),                       -- Fabricante
  price_distributor DECIMAL(10, 2),        -- Preço distribuidor (coluna 3)
  price_distributor_with_ipi DECIMAL(10, 2), -- Preço distribuidor com IPI (coluna 4)
  price_final DECIMAL(10, 2),               -- Preço final (coluna 5)
  price_final_with_ipi DECIMAL(10, 2),     -- Preço final com IPI (coluna 6)
  priceResale DECIMAL(10, 2),               -- Compatibilidade
  priceResaleWithIPI DECIMAL(10, 2),        -- Compatibilidade
  created_at TIMESTAMP WITH TIME ZONE,      -- Data de criação
  updated_at TIMESTAMP WITH TIME ZONE       -- Data de atualização
);
```

---

## ⚙️ Como Funciona Internamente

### Fluxo de Importação

```
1. Usuário seleciona arquivo CSV
                    ↓
2. Aplicação valida (6 colunas, tipos, etc)
                    ↓
3. Aplicação parseia CSV (separa por ;)
                    ↓
4. Converte strings em números (substitui , por .)
                    ↓
5. Envia para servidor (POST /api/products/import)
                    ↓
6. Servidor valida novamente
                    ↓
7. Remove duplicatas por código
                    ↓
8. Transforma dados para nomes de coluna do banco
                    ↓
9. Insere no Supabase
                    ↓
10. Retorna sucesso com contagem
                    ↓
11. Aplicação atualiza a tela com novo total
```

---

## ✅ Validações Aplicadas

### Na Aplicação (Frontend)

```javascript
✓ Mínimo 2 linhas (1 cabeçalho + 1 produto)
✓ Exatamente 6 colunas em cada linha
✓ Preços contêm caracteres numéricos
✓ Conversão de , para . nos decimais
✓ Código não vazio
✓ Descrição não vazia
```

### No Servidor (Backend)

```javascript
✓ Array de produtos válido
✓ Cada produto tem os 6 campos obrigatórios
✓ Preços são números (após conversão)
✓ Remove duplicatas por código
✓ Valida constraints do banco (preços ≥ 0)
✓ Garante unicidade de código
```

---

## 🐛 Troubleshooting

### ❌ Erro: "Arquivo CSV inválido. Mínimo de 1 produto necessário"

**Causa**: Arquivo não tem pelo menos 1 linha de dados

**Solução**:
- Certifique-se de ter **pelo menos 2 linhas** (1 cabeçalho + 1 produto)
- Use separador correto: `;` (ponto-e-vírgula)

---

### ❌ Erro: "Nenhum produto válido encontrado no arquivo"

**Causa**: Linhas existem mas não têm exatamente 6 colunas ou preços inválidos

**Solução**:
- Conte as colunas: deve ter **exatamente 6**
- Use vírgula para decimais: `2.288,58` ✅ (não `2.288.58` ❌)
- Use ponto-e-vírgula entre colunas: `valor1;valor2` ✅

---

### ❌ Erro: "Unique constraint violation" ou "código duplicado"

**Causa**: Há dois produtos com o mesmo código

**Solução**:
- Abra seu CSV em editor de texto
- Procure por linhas com código duplicado
- Mantenha apenas uma (ou adicione sufixo como `5L500-A`, `5L500-B`)

---

### ❌ CSV importado mas sem aparecer na aplicação

**Causa**: Dados foram salvos no banco mas a aplicação não atualizou

**Solução**:
- Recarregue a página: `F5` ou `Ctrl+R`
- Ou clique em "Configurações" novamente
- Verifique no SQL Editor do Supabase:
  ```sql
  SELECT COUNT(*) FROM products;
  ```

---

### ❌ Preços aparecem como 0 na aplicação

**Causa**: Preços não foram importados corretamente

**Solução**:
- Verifique o formato no CSV: deve ser `2.288,58` (vírgula)
- Não use: `2,288.58` ou `2288.58`
- Reimporte o arquivo

---

## 📝 Checklist Antes de Importar

- [ ] Arquivo é `.csv`?
- [ ] Tem exatamente 6 colunas (separadas por `;`)?
- [ ] Primeira linha é o cabeçalho?
- [ ] Tem pelo menos 1 linha de dados?
- [ ] Decimais usam vírgula (`,`)?
- [ ] Colunas são separadas por ponto-e-vírgula (`;`)?
- [ ] Não há aspas ao redor dos valores?
- [ ] Código do produto é único (sem duplicatas)?
- [ ] SQL foi executado no Supabase?
- [ ] Aplicação carregou corretamente?

---

## 🔐 Segurança

### Row Level Security (RLS) Habilitado

A tabela `products` tem políticas de segurança:

```sql
-- SELECT (leitura): permitido para todos
-- INSERT (criação): permitido para todos
-- UPDATE (edição): permitido para todos
-- DELETE (deleção): permitido para todos
```

⚠️ **Em produção**, ajuste estas políticas para apenas usuários autenticados.

---

## 📞 Suporte

### Se não conseguir fazer funcionar:

1. **Verifique o CSV**
   - Abra em editor de texto (não Excel)
   - Procure por caracteres estranhos
   - Verifique formatação de decimais

2. **Verifique o Banco**
   - Acesse SQL Editor do Supabase
   - Execute: `SELECT * FROM products LIMIT 5;`
   - Verifique se está vazio ou com dados

3. **Verifique a Aplicação**
   - Recarregue a página (F5)
   - Abra o console do navegador (F12)
   - Procure por erros em vermelho

4. **Recrie a Tabela**
   - Execute novamente o SQL em `EXECUTE_ESTE_SQL.md`
   - Isso vai deletar e recriar tudo

---

## 📌 Resumo das Mudanças no Código

| Arquivo | O que Mudou |
|---------|------------|
| `ImportExportProducts.tsx` | Valida 6 colunas ao invés de 4 |
| `supabase-products.ts` | Mapeia 6 colunas de preço |
| `useProducts.ts` | Inclui 6 campos de preço nos hooks |
| `supabase.ts` | Interface Product com 6 preços |

---

## 🎓 Exemplos Práticos

### Exemplo 1: Importação Simples

```csv
Fabricante;Descrição;Preço Distribuidor s/ IPI;Preço Distribuidor c/ IPI;Preço Unit. Final s/ IPI;Preço Final c/ IPI
5L500;BATERIA;2.288,58;2.511,72;2.542,87;2.790,80
```

✅ **Funciona**: 1 produto com 6 colunas

### Exemplo 2: Múltiplos Produtos

```csv
Fabricante;Descrição;Preço Distribuidor s/ IPI;Preço Distribuidor c/ IPI;Preço Unit. Final s/ IPI;Preço Final c/ IPI
5L500;BATERIA DE LITIO NAO RECARREGAVEL;2.288,58;2.511,72;2.542,87;2.790,80
3L960;BATERIA DE NIMH INTERNA RECARREGAVEL;2.379,44;2.611,44;2.643,83;2.901,60
AM1000;BATERIA LIMNO2 12 VOLT;4.202,00;4.611,70;4.668,89;5.124,11
```

✅ **Funciona**: 3 produtos

### Exemplo 3: Formato Errado ❌

```csv
Fabricante,Descrição,Preço
5L500,BATERIA,2.788.58
```

❌ **Não funciona**: apenas 3 colunas, separador errado, formato de decimal errado

---

## 🏁 Próximas Funcionalidades

Ideias para melhorias futuras:

- [ ] Validação de faixa de preço
- [ ] Histórico de importações
- [ ] Correção de erros sem reimportar
- [ ] Sincronização automática com fonte externa
- [ ] Relatórios de preços
- [ ] Versionamento de produtos
- [ ] Backup automático

---

## ✨ Conclusão

Parabéns! Seu sistema está configurado para:

✅ Importar 6 colunas de preço  
✅ Armazenar no Supabase  
✅ Buscar produtos  
✅ Exportar em formato correto  
✅ Gerenciar preços de distribuidor e revenda  

**Comece em `COMECE_AQUI.md`! 🚀**

---

Última atualização: 2024
