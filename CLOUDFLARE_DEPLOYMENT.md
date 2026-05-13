# Deployment no Cloudflare

Se você está deployando esta aplicação no Cloudflare e recebendo erro 500 no proxy de imagens do Google Drive, o problema é que as **variáveis de ambiente não estão configuradas** no ambiente do Cloudflare.

## Problema: Erro 500 no /api/proxy-google-image

Quando você vê este erro **apenas no Cloudflare** (não localmente):

```
Failed to load resource: the server responded with a status of 500 ()
[ImageViewer] ❌ Erro ao carregar imagem
URL: /api/proxy-google-image?url=...
```

É porque a variável `VITE_GOOGLE_DRIVE_API_KEY` não está definida no ambiente do Cloudflare.

## Solução: Configurar variáveis de ambiente no Cloudflare

### Opção 1: Via Wrangler (recomendado)

1. Se você usa Wrangler, crie/edite o arquivo `wrangler.toml`:

```toml
[env.production]
vars = { VITE_GOOGLE_DRIVE_API_KEY = "sua_chave_aqui", VITE_GOOGLE_DRIVE_FOLDER_ID = "seu_folder_id_aqui" }
```

2. Deploy com as variáveis:
```bash
wrangler deploy --env production
```

### Opção 2: Via Cloudflare Dashboard

1. Vá até seu projeto no Cloudflare Dashboard
2. Acesse **Settings** → **Environment Variables** (ou **Functions**)
3. Adicione as seguintes variáveis:
   - **VITE_GOOGLE_DRIVE_API_KEY**: Sua chave de API do Google Drive
   - **VITE_GOOGLE_DRIVE_FOLDER_ID**: O ID da pasta do Google Drive

### Opção 3: Via Netlify (se usando Netlify)

Se você está usando Netlify, configure no painel:

1. Vá até **Site Settings** → **Build & Deploy** → **Environment**
2. Clique em **Edit variables**
3. Adicione:
   - **VITE_GOOGLE_DRIVE_API_KEY**
   - **VITE_GOOGLE_DRIVE_FOLDER_ID**

## Onde obter as chaves

### VITE_GOOGLE_DRIVE_API_KEY
- Vá para [Google Cloud Console](https://console.cloud.google.com)
- Crie um projeto e ative a Google Drive API
- Crie uma chave de API
- Copie a chave

### VITE_GOOGLE_DRIVE_FOLDER_ID
- Abra a pasta compartilhada do Google Drive
- Pegue o ID da URL: `https://drive.google.com/drive/folders/ESTE_E_O_ID`

## Verificar se as variáveis estão configuradas

Acesse seu app e vá para `/api/ping`. Você verá algo como:

```json
{
  "success": true,
  "status": "alive",
  "env_keys": [...]
}
```

Se `VITE_GOOGLE_DRIVE_API_KEY` não aparecer na lista de chaves, ela não está configurada no seu ambiente de deployment.

## Troubleshooting

Se ainda assim receber erro 500:

1. **Verifique as aspas**: Variáveis não devem ter aspas extras
2. **Verifique a chave**: Certifique-se de que a chave é válida
3. **Verifique permissões**: A pasta do Google Drive deve ser acessível com essa chave
4. **Reinicie o deploy**: Às vezes requer um novo deploy após configurar variáveis
