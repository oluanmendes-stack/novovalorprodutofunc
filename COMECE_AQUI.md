# 🚀 COMECE AQUI - Guia Rápido

## O que foi feito? ✅

A aplicação foi **modificada para aceitar arquivos CSV com 6 colunas de preço** (ao invés de 4).

---

## 📋 Seu Arquivo CSV Esperado

```
Fabricante;Descrição;Preço Distribuidor s/ IPI;Preço Distribuidor c/ IPI;Preço Unit. Final s/ IPI;Preço Final c/ IPI
5L500;BATERIA DE LITIO NAO RECARREGAVEL;2.288,58;2.511,72;2.542,87;2.790,80
3L960;BATERIA DE NIMH INTERNA RECARREGAVEL;2.379,44;2.611,44;2.643,83;2.901,60
```

✅ **Use vírgula (,) para decimais**  
✅ **Use ponto-e-vírgula (;) para separar colunas**  
✅ **Exatamente 6 colunas**

---

## 🔧 3 Passos para Começar

### 📍 PASSO 1: Preparar o Banco (Supabase)

1. Acesse seu projeto em [supabase.com](https://supabase.com)
2. Clique em **SQL Editor** → **New Query**
3. **Copie TODO o conteúdo** do arquivo: **`supabase-setup.sql`**
4. **Cole** no SQL Editor
5. Clique em **RUN**

**O que acontece:**
- ❌ Deleta a tabela `products` antiga
- ✅ Cria nova tabela com as 6 colunas

---

### 📍 PASSO 2: Importar na Aplicação

1. Abra a aplicação
2. Vá para **⚙️ Configurações**
3. Procure por **"Gerenciar Produtos"**
4. Clique em **"Importar CSV"**
5. Selecione seu arquivo CSV
6. Aguarde a importação ✅

---

### 📍 PASSO 3: Verificar

Na aplicação, você verá:
```
Total de produtos: 123
```

Pronto! 🎉

---

## 📊 As 6 Colunas

| # | Coluna | Exemplo |
|---|--------|---------|
| 1 | Fabricante | `5L500` |
| 2 | Descrição | `BATERIA DE LITIO` |
| 3 | Preço Distribuidor s/ IPI | `2.288,58` |
| 4 | Preço Distribuidor c/ IPI | `2.511,72` |
| 5 | Preço Unit. Final s/ IPI | `2.542,87` |
| 6 | Preço Final c/ IPI | `2.790,80` |

---

## ⚠️ IMPORTANTE

### Se vai substituir os dados antigos:
- O comando `DROP TABLE` **deleta TUDO**
- Não há "desfazer"
- Faça backup se necessário

### Se vai ADICIONAR dados (sem deletar):
- Remova a linha `DROP TABLE IF EXISTS products CASCADE;` do SQL
- Execute o resto do script normalmente

---

## 🎯 Arquivos Importantes

| Arquivo | Para Quê |
|---------|----------|
| `supabase-setup.sql` | **COPIE E COLE NO SUPABASE** |
| `INSTRUCOES_IMPORTACAO.md` | Instruções detalhadas passo a passo |
| `RESUMO_MUDANCAS.md` | O que foi alterado no código |

---

## 🔍 Como Verificar se Funcionou

### No SQL Editor do Supabase:
```sql
SELECT COUNT(*) as total FROM products;
```

Você deve ver: `123` (ou outro número maior que 0)

### Na Aplicação:
Vá para **Configurações** → **Gerenciar Produtos**

Você deve ver: `Total de produtos: 123`

---

## ❌ Problemas Comuns

### "Arquivo inválido. Mínimo de 1 produto necessário"
- ✅ Certifique-se que tem **cabeçalho + 1 produto**
- ✅ Use ponto-e-vírgula (`;`) para separar

### "Nenhum produto válido encontrado"
- ✅ Verifique se tem **exatamente 6 colunas**
- ✅ Verifique se os preços têm números válidos
- ✅ Use vírgula (`,`) para decimais

### Arquivo importado mas sem dados na aplicação
- ✅ Recarregue a página (F5)
- ✅ Verifique no Supabase se dados foram salvos

---

## 🚀 Próximo Passo

👉 **Abra o arquivo `supabase-setup.sql`**  
👉 **Copie TODO o conteúdo**  
👉 **Cole no SQL Editor do Supabase**  
👉 **Clique em RUN**  

Depois disso, você pode importar seus produtos na aplicação! ✨

---

**Dúvidas? Veja `INSTRUCOES_IMPORTACAO.md` para guia completo!**
