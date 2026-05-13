# Supabase Storage Setup

Este guia configura o Supabase Storage para armazenar catalogo, descritivos e imagens de produtos.

## 1. Criar Buckets no Supabase

1. Acesse seu projeto no Supabase: https://supabase.com
2. Vá para **Storage** no painel esquerdo
3. Clique em **New bucket** e crie os seguintes buckets:

### Bucket 1: `catalogo`
- **Name**: catalogo
- **Public**: Ativar (marque "Public bucket")
- Clique em **Create bucket**

### Bucket 2: `descritivos`
- **Name**: descritivos
- **Public**: Ativar (marque "Public bucket")
- Clique em **Create bucket**

### Bucket 3: `imagens`
- **Name**: imagens
- **Public**: Ativar (marque "Public bucket")
- Clique em **Create bucket**

## 2. Configurar Políticas RLS (Row Level Security)

Se o Storage tiver RLS habilitado, você precisa configurar as políticas:

1. Vá para **Storage** > **Policies**
2. Para cada bucket, crie essas políticas:

```sql
-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT
  USING (true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

## 3. Estrutura de Pastas

Os arquivos serão organizados assim no Storage:

```
catalogo/
  ├── ODM-DE0062B.doc
  ├── ODM-DE0062C.doc
  └── ...

descritivos/
  ├── 11996-000001_1.txt
  ├── A04.txt
  └── ...

imagens/
  ├── MED-LINKET/
  │   └── A - FOTOS PRODUTOS MEDLINKET 2023/
  │       └── SENSOR DE OXIMETRIA/
  │           ├── S0026OX-S.JPG
  │           └── ...
  └── ...
```

## 4. URLs de Acesso

Após fazer o upload, os arquivos estarão acessíveis via:

```
https://hmjbpsohkzkguixwafov.supabase.co/storage/v1/object/public/catalogo/ODM-DE0062B.doc
https://hmjbpsohkzkguixwafov.supabase.co/storage/v1/object/public/descritivos/A04.txt
https://hmjbpsohkzkguixwafov.supabase.co/storage/v1/object/public/imagens/MED-LINKET/...
```

## 5. Próximos Passos

1. Execute o script de upload para transferir os arquivos:
```bash
pnpm run upload:storage
```

2. Verifique se os arquivos foram enviados no Supabase Storage

3. O aplicativo automaticamente usará os arquivos do Storage em produção
