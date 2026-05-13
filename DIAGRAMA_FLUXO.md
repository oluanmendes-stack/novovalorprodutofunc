# 📊 Diagrama de Fluxo - Como Funciona

## Fluxo de Importação de Produtos

```
┌─────────────────────────────────────────────────────────────┐
│          SEU ARQUIVO CSV (6 COLUNAS)                        │
│  Fabricante;Descrição;Preço Dist s/IPI;Preço Dist c/IPI...│
│  5L500;BATERIA;2.288,58;2.511,72;2.542,87;2.790,80        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  📱 APLICAÇÃO - Página Configurações                        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ "Gerenciar Produtos"                                  │ │
│  │ ┌─────────────────────────────────────────────────┐  │ │
│  │ │  Total de produtos: 0                           │  │ │
│  │ ┌─────────────────────────────────────────────────┐  │ │
│  │ │  [📤 Importar CSV]  [📥 Exportar]  [🗑️ Apagar] │  │ │
│  │ └─────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
            Clique em "Importar CSV"
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  ✅ VALIDAÇÃO DO ARQUIVO                                   │
│  ✓ Tem 6 colunas?                                          │
│  ✓ Preços são números válidos?                             │
│  ✓ Código e descrição não vazios?                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  🚀 ENVIAR PARA SERVIDOR                                   │
│  POST /api/products/import                                 │
│  {                                                          │
│    "products": [                                           │
│      {                                                      │
│        "code": "5L500",                                    │
│        "description": "BATERIA DE LITIO",                 │
│        "distributorPrice": 2288.58,                        │
│        "distributorPriceWithIPI": 2511.72,                │
│        "finalPrice": 2542.87,                             │
│        "finalPriceWithIPI": 2790.80                       │
│      }                                                      │
│    ]                                                        │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  💾 BANCO DE DADOS (Supabase)                              │
│                                                             │
│  products TABLE                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ id    │ code  │ description    │ price_final_... │  │
│  ├────────────────────────────────────────────────────┤   │
│  │ uuid1 │ 5L500 │ BATERIA LITIO  │ 2542.87...      │  │
│  │ uuid2 │ 3L960 │ BATERIA NIMH   │ 2643.83...      │  │
│  │ ...   │ ...   │ ...            │ ...             │  │
│  └────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  ✅ SUCESSO!                                                │
│  "123 produto(s) importado(s) com sucesso!"                │
│                                                             │
│  📱 Aplicação atualizada:                                  │
│  Total de produtos: 123                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Dados

### CSV → Aplicação → Banco de Dados

```
CSV Input
├─ Column 1: Fabricante → code
├─ Column 2: Descrição → description
├─ Column 3: Preço Distribuidor s/ IPI → price_distributor
├─ Column 4: Preço Distribuidor c/ IPI → price_distributor_with_ipi
├─ Column 5: Preço Unit. Final s/ IPI → price_final
└─ Column 6: Preço Final c/ IPI → price_final_with_ipi

     ↓

aplicação/components/ImportExportProducts.tsx
├─ Valida formato CSV
├─ Parseia as 6 colunas
└─ Envia para servidor

     ↓

server/routes/supabase-products.ts
├─ importProducts()
├─ Valida produtos
├─ Transforma dados
└─ Insere no Supabase

     ↓

Supabase Database
└─ products table
   ├─ id (UUID)
   ├─ code (VARCHAR)
   ├─ description (TEXT)
   ├─ marca (VARCHAR)
   ├─ price_distributor (DECIMAL)
   ├─ price_distributor_with_ipi (DECIMAL)
   ├─ price_final (DECIMAL)
   ├─ price_final_with_ipi (DECIMAL)
   ├─ created_at (TIMESTAMP)
   └─ updated_at (TIMESTAMP)
```

---

## Ciclo Completo de Uso

```
┌──────────────────────────────────────────────────────────────┐
│ 1. PREPARAR SQL                                              │
│    ↓                                                          │
│    Abrir arquivo: supabase-setup.sql                         │
│    Copiar conteúdo                                           │
│    Colar no SQL Editor do Supabase                           │
│    Executar                                                   │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. PREPARAR CSV                                              │
│    ↓                                                          │
│    Arquivo deve ter 6 colunas                                │
│    Separador: ponto-e-vírgula (;)                            │
│    Decimais: vírgula (,)                                     │
│    Exemplo: 5L500;BATERIA;2.288,58;2.511,72;...             │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. IMPORTAR NA APLICAÇÃO                                     │
│    ↓                                                          │
│    Abrir aplicação                                           │
│    ⚙️ Configurações                                          │
│    Gerenciar Produtos                                        │
│    Importar CSV                                              │
│    Selecionar arquivo                                        │
│    Aguardar importação                                       │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. VERIFICAR                                                 │
│    ↓                                                          │
│    Na aplicação: vê "Total de produtos: X"                   │
│    No Supabase: executa SELECT COUNT(*) FROM products;       │
│    Testa busca de produtos                                   │
│    Exporta CSV para confirmar                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Mapeamento de Preços

```
CSV                    Aplicação              Banco de Dados
════════════════════════════════════════════════════════════

Coluna 3:              distributorPrice  →    price_distributor
Preço Dist s/ IPI      (sem IPI)              (sem IPI)
2.288,58               2288.58                DECIMAL(10,2)

Coluna 4:              distributorPrice  →    price_distributor_with_ipi
Preço Dist c/ IPI      WithIPI                (com IPI)
2.511,72               2511.72                DECIMAL(10,2)

Coluna 5:              finalPrice        →    price_final
Preço Unit. Final      (sem IPI)              (sem IPI)
2.542,87               2542.87                DECIMAL(10,2)

Coluna 6:              finalPrice        →    price_final_with_ipi
Preço Final c/ IPI     WithIPI                (com IPI)
2.790,80               2790.80                DECIMAL(10,2)
```

---

## Validações Automáticas

```
┌─ Arquivo CSV
│  ├─ ✅ Tem cabeçalho?
│  ├─ ✅ Tem mínimo 2 linhas (1 cabeçalho + 1 produto)?
│  └─ ✅ Tem exatamente 6 colunas?
│
├─ Cada Produto
│  ├─ ✅ Código não vazio?
│  ├─ ✅ Descrição não vazia?
│  ├─ ✅ Preços são números válidos?
│  ├─ ✅ Preços são maiores ou iguais a 0?
│  └─ ✅ Código é único (não há duplicata)?
│
└─ Banco de Dados
   ├─ ✅ price_distributor ≥ 0
   ├─ ✅ price_distributor_with_ipi ≥ 0
   ├─ ✅ price_final ≥ 0
   └─ ✅ price_final_with_ipi ≥ 0
```

---

## Estados da Aplicação

```
ANTES DA IMPORTAÇÃO
───────────────────
Gerenciar Produtos
├─ Total de produtos: 0
├─ [📤 Importar CSV] ← Clique aqui
├─ [📥 Exportar] (desabilitado)
└─ [🗑️ Apagar] (desabilitado)


DURANTE A IMPORTAÇÃO
────────────────────
[Processando...] (carregando)


DEPOIS DA IMPORTAÇÃO
────────────────────
Gerenciar Produtos
├─ Total de produtos: 123  ✅
├─ [📤 Importar CSV]
├─ [📥 Exportar] (habilitado) ✅
└─ [🗑️ Apagar] (habilitado) ✅

"123 produto(s) importado(s) com sucesso!"
```

---

## Próximas Operações Disponíveis

```
Após importação bem-sucedida:

✅ EXPORTAR CSV
   ├─ Baixa os produtos em formato CSV
   └─ Mantém as 6 colunas

✅ BUSCAR PRODUTO
   ├─ Por código
   ├─ Por descrição
   └─ Em tempo real

✅ DELETAR TUDO
   ├─ Remove todos os produtos
   └─ Com confirmação de segurança

✅ SINCRONIZAR
   ├─ Atualiza dados do banco
   └─ Recarrega lista
```

---

**Fluxo completo pronto! Siga os passos em `COMECE_AQUI.md` 🚀**
