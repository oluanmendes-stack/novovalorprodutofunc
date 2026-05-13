# 📋 Instruções de Setup e Importação de Produtos

## ✅ O que foi feito

1. ✔️ **Atualizei o componente de importação CSV** para aceitar o formato correto com 6 colunas
2. ✔️ **Atualizei o servidor** para processar todas as colunas de preço
3. ✔️ **Gerei o SQL** para recriar as tabelas no Supabase

---

## 📋 Formato do Arquivo CSV

Seu arquivo deve ter **exatamente 6 colunas** separadas por **ponto-e-vírgula (;)**:

```
Fabricante;Descrição;Preço Distribuidor s/ IPI;Preço Distribuidor c/ IPI;Preço Unit. Final s/ IPI;Preço Final c/ IPI
5L500;BATERIA DE LITIO NAO RECARREGAVEL;2.288,58;2.511,72;2.542,87;2.790,80
3L960;BATERIA DE NIMH INTERNA RECARREGAVEL;2.379,44;2.611,44;2.643,83;2.901,60
AM1000;BATERIA LIMNO2 12 VOLT;4.202,00;4.611,70;4.668,89;5.124,11
```

### Regras Importantes:
- ✅ Use **vírgula (,)** como separador de decimais nos preços
- ✅ Use **ponto-e-vírgula (;)** como separador de colunas
- ✅ **Sem aspas** ao redor dos valores
- ✅ Primeira linha é o cabeçalho (será ignorada)
- ✅ Mínimo 2 linhas (1 cabeçalho + 1 produto)

---

## 🚀 Passo a Passo para Setup

### PASSO 1: Preparar o Banco de Dados no Supabase

1. Acesse seu projeto no [Supabase.com](https://supabase.com)
2. Clique em **"SQL Editor"** no menu esquerdo
3. Clique em **"New Query"**
4. **Copie TODO o conteúdo** do arquivo `supabase-setup.sql`
5. **Cole** no SQL Editor
6. Clique em **"Run"** (botão azul no canto superior direito)

O script irá:
- ❌ Deletar a tabela `products` existente (com TODOS os dados)
- ✅ Criar uma nova tabela com as colunas corretas
- ✅ Criar índices para performance
- ✅ Configurar segurança (RLS)

### PASSO 2: Verificar se a Tabela foi Criada

No SQL Editor, execute:
```sql
SELECT * FROM products LIMIT 5;
```

Você deve ver:
```
No rows returned
```
(Tabela vazia, mas criada com sucesso)

### PASSO 3: Importar o CSV na Aplicação

1. Abra a aplicação
2. Vá para **Configurações** (⚙️ Settings)
3. Na seção **"Gerenciar Produtos"**, clique em **"Importar CSV"**
4. Selecione seu arquivo `tabela_precos_produtos.csv`
5. Aguarde a importação (verá uma mensagem de sucesso)

### PASSO 4: Verificar os Dados Importados

No SQL Editor do Supabase, execute:
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

Você deverá ver seus produtos com todos os preços!

---

## 📊 Mapeamento de Colunas

| Coluna CSV | Coluna Banco | Tipo | Descrição |
|-----------|-------------|------|-----------|
| Fabricante | `code` | VARCHAR | Código único do produto |
| Descrição | `description` | TEXT | Descrição do produto |
| Preço Distribuidor s/ IPI | `price_distributor` | DECIMAL | Preço sem imposto |
| Preço Distribuidor c/ IPI | `price_distributor_with_ipi` | DECIMAL | Preço com imposto |
| Preço Unit. Final s/ IPI | `price_final` | DECIMAL | Preço final sem imposto |
| Preço Final c/ IPI | `price_final_with_ipi` | DECIMAL | Preço final com imposto |

---

## ⚠️ IMPORTANTE

### Se vai deletar dados existentes:
1. **Faça backup** de seus dados atuais antes de rodar o DROP TABLE
2. O comando `DROP TABLE IF EXISTS products CASCADE;` **deleta tudo sem recuperação**
3. Não há "desfazer" - certifique-se antes de executar

### Se quer ADICIONAR dados (sem deletar os antigos):
Remova a linha:
```sql
DROP TABLE IF EXISTS products CASCADE;
```

Mas você ainda precisa executar o resto do script para criar a tabela com a estrutura correta.

---

## 🔍 Troubleshooting

### ❌ Erro: "products" already exists
**Solução**: Execute o DROP TABLE primeiro
```sql
DROP TABLE IF EXISTS products CASCADE;
```

### ❌ Erro: Invalid price format
**Solução**: Use vírgula para decimais no CSV:
- ✅ Correto: `2.288,58`
- ❌ Errado: `2288.58` ou `2,288.58`

### ❌ Erro: Unique constraint violation (código duplicado)
**Solução**: Certifique-se de que não há códigos repetidos no seu CSV

### ❌ CSV importado mas sem dados na aplicação
**Solução**: 
1. Verifique se usou as 6 colunas corretas
2. Execute uma consulta SQL para confirmar que os dados estão na tabela
3. Recarregue a página (F5) na aplicação

### ❌ Preços aparecem como 0
**Solução**: Verifique se os preços têm o formato correto com vírgula decimal

---

## 📝 Exemplo Completo de CSV

```csv
Fabricante;Descrição;Preço Distribuidor s/ IPI;Preço Distribuidor c/ IPI;Preço Unit. Final s/ IPI;Preço Final c/ IPI
5L500;BATERIA DE LITIO NAO RECARREGAVEL;2.288,58;2.511,72;2.542,87;2.790,80
3L960;BATERIA DE NIMH INTERNA RECARREGAVEL;2.379,44;2.611,44;2.643,83;2.901,60
AM1000;BATERIA LIMNO2 12 VOLT;4.202,00;4.611,70;4.668,89;5.124,11
5931-A;BATERIA NICD 12 VOLT 1.9 AH;2.165,87;2.377,04;2.406,52;2.641,15
CA20-006;ADAPTADOR TUBO ADT PDT CAPNOGRAFIA TIPO T;21,46;21,74;26,82;27,17
```

---

## 🎯 Próximos Passos

Após importar com sucesso:

1. ✅ Verifique na página de Configurações o total de produtos importados
2. ✅ Teste a busca de produtos para confirmar que estão acessíveis
3. ✅ Exporte o CSV para confirmar que está salvando corretamente
4. ✅ Aguarde sincronização se estiver conectado a um servidor remoto

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o arquivo CSV tem exatamente 6 colunas
2. Confirme se usou `;` (ponto-e-vírgula) como separador
3. Confirme se usou `,` (vírgula) para decimais
4. Tente rodar o script SQL novamente
5. Recarregue a página da aplicação

---

**Pronto! Seu sistema está configurado para importar produtos com os 6 campos de preço! 🚀**
