# Google Drive Integration Setup

Este guia explica como configurar o Google Drive como fonte de fotos para os produtos.

## Pré-requisitos

1. Uma conta Google com acesso a um Google Drive
2. Acesso ao Google Cloud Console
3. As fotos organizadas no Google Drive em uma estrutura de pastas

## Estrutura de Pastas Necessária

O Google Drive deve ter a seguinte estrutura:

```
📁 PASTA_PRINCIPAL
├── 📁 OEM-Y1976A
│   ├── foto1.jpg
│   ├── foto2.png
│   └── foto3.jpg
├── 📁 A04
│   ├── imagem1.jpg
│   └── imagem2.jpg
└── 📁 CA20-006
    └── produto.png
```

Cada código de produto deve ser uma **subpasta** dentro da pasta principal, e as fotos dentro dessas subpastas serão encontradas automaticamente.

## Passo 1: Preparar o Google Drive

1. **Criar a pasta principal**: No seu Google Drive, crie uma pasta para armazenar todas as fotos dos produtos
2. **Organizar os produtos**: Dentro desta pasta, crie uma subpasta para cada código de produto (ex: `OEM-Y1976A`, `A04`, etc.)
3. **Carregar as fotos**: Coloque as fotos de cada produto dentro de sua respectiva subpasta
4. **Compartilhar**: Anote o ID da pasta principal (você usará isto depois)

### Como encontrar o ID da pasta:

1. Abra a pasta no Google Drive
2. Na barra de endereço do navegador, o URL será parecido com:
   ```
   https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P
   ```
3. O ID é: `1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P`

## Passo 2: Configurar o Google Cloud Console

1. **Acessar o Google Cloud Console**: https://console.cloud.google.com/

2. **Criar um novo projeto**:
   - Clique em "Selecionar projeto" no topo
   - Clique em "NOVO PROJETO"
   - Digite um nome (ex: "Valor Produto")
   - Clique em "CRIAR"

3. **Habilitar a Google Drive API**:
   - No menu lateral, clique em "APIs e serviços"
   - Clique em "Biblioteca"
   - Procure por "Google Drive API"
   - Clique nela
   - Clique em "ATIVAR"

4. **Criar uma chave de API**:
   - Clique em "APIs e serviços"
   - Clique em "Credenciais"
   - Clique em "Criar credenciais"
   - Selecione "Chave de API"
   - Uma chave será gerada (algo como: `AIzaSy...`)
   - Copie esta chave

## Passo 3: Configurar a Aplicação

### Opção A: Variáveis de Ambiente Locais

Abra o arquivo `.env` na raiz do projeto e adicione:

```env
VITE_GOOGLE_DRIVE_API_KEY=AIzaSy... (sua chave da API)
VITE_GOOGLE_DRIVE_FOLDER_ID=1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P (seu ID da pasta)
```

### Opção B: Deployment (Netlify/Vercel)

1. Vá para o painel de sua plataforma (Netlify ou Vercel)
2. Acesse as configurações do projeto
3. Vá para "Variáveis de Ambiente" ou "Environment Variables"
4. Adicione as duas variáveis:
   - `VITE_GOOGLE_DRIVE_API_KEY`
   - `VITE_GOOGLE_DRIVE_FOLDER_ID`

## Passo 4: Testar a Integração

1. Reinicie o servidor de desenvolvimento (`npm run dev`)
2. Vá para as Configurações da aplicação
3. Na seção "Origem das Fotos", você deve ver o Google Drive como opção
4. Selecione "Google Drive"
5. Vá para a tela de produtos e teste a visualização de fotos

## Segurança

⚠️ **Importante**: A chave de API criada acima terá restrições para apenas leitura do Google Drive.

**Para restrições adicionais de segurança** (recomendado para produção):

1. Volte ao Google Cloud Console
2. Vá para "Credenciais"
3. Edite a chave de API
4. Clique em "Restrições de aplicação"
5. Selecione "Referrer HTTP"
6. Adicione os domínios permitidos (ex: `seu-site.com`)
7. Clique em "Restrições de API"
8. Selecione "Google Drive API"

## Solução de Problemas

### As fotos não aparecem
- Verifique se a pasta principal é acessível
- Verifique se os nomes das subpastas correspondem exatamente aos códigos dos produtos (case-sensitive)
- Verifique se a chave de API está correta
- Verifique se a Google Drive API está habilitada no Google Cloud Console

### Erro de autenticação
- Verifique se a chave de API foi copiada corretamente (sem espaços)
- Tente gerar uma nova chave

### Carregamento lento
- As primeiras cargas podem ser lentas enquanto o cache é construído
- Use o botão "Limpar Cache de Imagens" nas Configurações se necessário

## Reverter para Supabase

Se precisar voltar a usar o Supabase Storage:

1. Vá para as Configurações
2. Na seção "Origem das Fotos", selecione "Supabase Storage"
3. As fotos voltarão a ser carregadas do Supabase

## Suporte

Para mais informações sobre a Google Drive API, consulte:
- https://developers.google.com/drive/api/guides/about-sdk
