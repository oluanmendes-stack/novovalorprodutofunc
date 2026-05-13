# Catálogo de Compatibilidade - Setup Supabase

## Descrição

A página "Catálogo de Compatibilidade" agora está totalmente integrada com Supabase. Os dados são sincronizados em tempo real com o banco de dados.

## Como criar a tabela no Supabase

### Opção 1: Usando SQL (Recomendado)

1. Acesse seu projeto no Supabase (https://supabase.com)
2. Vá para **SQL Editor** no painel esquerdo
3. Clique em **New Query**
4. Cole o SQL abaixo:

```sql
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

-- Enable RLS (Row Level Security)
ALTER TABLE compatibility ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for select (allow all authenticated users to read)
CREATE POLICY "Enable read access for authenticated users" ON compatibility
  FOR SELECT
  USING (true);

-- Create RLS policy for insert (allow all authenticated users to insert)
CREATE POLICY "Enable insert for authenticated users" ON compatibility
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policy for update (allow all authenticated users to update)
CREATE POLICY "Enable update for authenticated users" ON compatibility
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create RLS policy for delete (allow all authenticated users to delete)
CREATE POLICY "Enable delete for authenticated users" ON compatibility
  FOR DELETE
  USING (true);
```

5. Clique em **Run** (Ctrl+Enter ou Cmd+Enter)

### Opção 2: Usando o painel visual do Supabase

1. Vá para **Table Editor** no painel esquerdo
2. Clique em **New Table**
3. Preencha os seguintes campos:

| Campo | Tipo | Configurações |
|-------|------|---|
| id | UUID | Primary Key, Default: gen_random_uuid() |
| equipamento | Text | Não nulo |
| parametro | Text | Nulo |
| fabricante | Text | Não nulo |
| modelo | Text | Não nulo |
| acessorio | Text | Não nulo |
| foto_produto | Text[] | Default: '{}' |
| foto_conexao | Text[] | Default: '{}' |
| observacoes | Text | Nulo |
| created_at | TIMESTAMP | Default: now(), Timezone: true |
| updated_at | TIMESTAMP | Default: now(), Timezone: true |

4. Clique em **Save**

5. Depois de criar, vá para **Authentication > Policies** e adicione as políticas de RLS:
   - SELECT: Permitir todos os usuários autenticados
   - INSERT: Permitir todos os usuários autenticados
   - UPDATE: Permitir todos os usuários autenticados
   - DELETE: Permitir todos os usuários autenticados

## Estrutura de Dados

### Tabela: `compatibility`

```typescript
interface CompatibilityRecord {
  id: string;                    // UUID (auto-gerado)
  equipamento: string;           // Ex: "Monitor de Pressão"
  parametro: string;             // Ex: "Pressão Arterial"
  fabricante: string;            // Ex: "OEM-Y1976A"
  modelo: string;                // Ex: "PA100"
  acessorio: string;             // Código do produto/acessório
  foto_produto: string[];        // URLs das fotos do produto
  foto_conexao: string[];        // URLs das fotos de conexão
  observacoes: string;           // Notas adicionais
  created_at: string;            // Timestamp de criação
  updated_at: string;            // Timestamp de atualização
}
```

## Endpoints da API

### GET `/api/compatibility`
Retorna todos os registros de compatibilidade.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "equipamento": "Monitor de Pressão",
      "parametro": "Pressão Arterial",
      "fabricante": "OEM-Y1976A",
      "modelo": "PA100",
      "acessorio": "Manguito Adulto L",
      "foto_produto": [],
      "foto_conexao": [],
      "observacoes": "Compatível com manguitos padrão",
      "created_at": "2024-01-15T10:30:00+00:00",
      "updated_at": "2024-01-15T10:30:00+00:00"
    }
  ],
  "count": 1
}
```

### GET `/api/compatibility/search?q=termo`
Busca registros por equipamento, fabricante, modelo ou acessório.

**Response:** Mesmo formato do GET `/api/compatibility`

### POST `/api/compatibility`
Cria um novo registro.

**Request:**
```json
{
  "equipamento": "Monitor de Pressão",
  "parametro": "Pressão Arterial",
  "fabricante": "OEM-Y1976A",
  "modelo": "PA100",
  "acessorio": "Manguito Adulto L",
  "foto_produto": [],
  "foto_conexao": [],
  "observacoes": "Compatível com manguitos padrão"
}
```

**Response:** O registro criado com `id`, `created_at` e `updated_at`.

### PUT `/api/compatibility/:id`
Atualiza um registro existente.

**Request:** Mesmo formato do POST (campos opcionais).

**Response:** O registro atualizado.

### DELETE `/api/compatibility/:id`
Deleta um registro.

**Response:**
```json
{
  "success": true,
  "message": "Compatibility record deleted successfully"
}
```

## Frontend Integration

A página `/compatibility` agora usa o hook `useSupabaseCompatibility` que oferece as seguintes funções:

```typescript
const {
  records,           // Array de registros carregados
  loading,           // Estado de carregamento
  error,             // Mensagem de erro (se houver)
  fetchRecords,      // Carrega todos os registros
  searchRecords,     // Busca registros por termo
  createRecord,      // Cria um novo registro
  updateRecord,      // Atualiza um registro
  deleteRecord,      // Deleta um registro
} = useSupabaseCompatibility();
```

## Dados Iniciais (Opcional)

Se deseja popular a tabela com alguns dados iniciais, execute o SQL abaixo após criar a tabela:

```sql
INSERT INTO compatibility (equipamento, parametro, fabricante, modelo, acessorio, observacoes) VALUES
  ('Monitor de Pressão', 'Pressão Arterial', 'OEM-Y1976A', 'PA100', 'Manguito Adulto L', 'Compatível com manguitos padrão'),
  ('Monitor de Pressão', 'Pressão Arterial', 'EA007C3I', 'PA200', 'Manguito Adulto M', 'Compatível com todos os modelos');
```

## Verificação

Após criar a tabela:

1. Volte para a aplicação
2. Acesse a página **Compatibilidade** (`/compatibility`)
3. A página carregará automaticamente os dados do Supabase
4. Você poderá adicionar, editar e deletar registros em tempo real
5. Os dados serão sincronizados com o banco de dados

## Troubleshooting

### Erro: "Supabase not configured"
- Verifique se as variáveis de ambiente `SUPABASE_URL` e `SUPABASE_KEY` estão configuradas no arquivo `.env.local`

### Erro: "Table does not exist"
- Execute o SQL de criação da tabela novamente
- Verifique se a tabela foi criada em `Table Editor`

### Dados não aparecem
- Verifique se as políticas de RLS foram criadas corretamente
- Certifique-se de que a tabela tem dados inseridos

### Operações de CRUD não funcionam
- Verifique as políticas de RLS para INSERT, UPDATE e DELETE
- Verifique o console do navegador para mensagens de erro (F12)
- Verifique os logs do servidor para mais detalhes
