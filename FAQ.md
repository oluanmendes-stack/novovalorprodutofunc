# ❓ Perguntas Frequentes (FAQ)

## 📋 Sobre o Formato CSV

### P: Quantas colunas o CSV deve ter?
**R:** Exatamente **6 colunas**, separadas por ponto-e-vírgula (`;`)

### P: Qual é o separador correto?
**R:** 
- **Entre colunas**: ponto-e-vírgula `;`
- **Decimais**: vírgula `,`
- **Não use**: vírgulas entre colunas ou pontos para decimais

### P: Posso usar Excel para editar o CSV?
**R:** Sim, mas:
- Salve em formato `.csv` (Arquivo → Salvar Como → CSV)
- Verifique as configurações de regional (decimal = vírgula)
- **Melhor opção**: use editor de texto (Notepad, VS Code)

### P: O que fazer se o arquivo tem encoding diferente?
**R:** 
- Use UTF-8 encoding
- No Notepad: Salvar As → Codificação: UTF-8

### P: Posso ter linhas vazias no CSV?
**R:** Não, remova todas as linhas em branco (o parser vai ignorar)

---

## 🗄️ Sobre o Banco de Dados

### P: Preciso criar a tabela manualmente?
**R:** Não! Use o arquivo `EXECUTE_ESTE_SQL.md` - copie e cole no Supabase

### P: O que acontece se eu rodar o DROP TABLE?
**R:** Todos os dados são deletados **permanentemente**. Não há "desfazer"

### P: Posso adicionar dados sem deletar os antigos?
**R:** Sim! Remova a linha `DROP TABLE IF EXISTS products CASCADE;` do SQL

### P: Qual é o tipo de dado para preços?
**R:** `DECIMAL(10, 2)` = até 8 dígitos inteiros + 2 decimais (máximo: 99.999.999,99)

### P: Posso usar preços com mais de 2 casas decimais?
**R:** O banco aceita, mas será arredondado para 2 casas decimais

### P: Como faço backup dos dados?
**R:** No Supabase: Projetos → Seu Projeto → Backups → Solicitar Backup Manual

---

## 💾 Sobre Importação

### P: O que validar antes de importar?
**R:** 
✓ 6 colunas  
✓ Sem aspas  
✓ Sem espaços extras  
✓ Decimal com vírgula  
✓ Sem linhas vazias  
✓ Sem códigos duplicados  

### P: Quantos produtos posso importar?
**R:** Teoricamente ilimitado, mas:
- Teste com 100-1000 primeiros
- Performance depende da internet
- Supabase tem limites de taxa (rate limits)

### P: Posso importar o mesmo arquivo duas vezes?
**R:** Não! O sistema detecta duplicatas por código e substitui

### P: Quanto tempo leva para importar?
**R:** Depende da internet:
- 100 produtos: ~1 segundo
- 1.000 produtos: ~5-10 segundos
- 10.000 produtos: ~1 minuto

### P: O que fazer se a importação falhar no meio?
**R:** 
1. Verifique o erro mensagem
2. Corrija o CSV
3. Reimporte (o sistema remove duplicatas automaticamente)

### P: Como reiniciar do zero?
**R:** 
1. Execute o SQL em `EXECUTE_ESTE_SQL.md` novamente
2. Isso deleta e recria a tabela vazia
3. Importe novamente

---

## 🔍 Sobre Busca e Consultas

### P: Como buscar produtos?
**R:** Vá para qualquer página e procure pelo código ou descrição na barra de busca

### P: Posso filtrar por faixa de preço?
**R:** Ainda não, mas está na lista de futuras funcionalidades

### P: A busca é case-sensitive?
**R:** Não, funciona com maiúsculas e minúsculas

### P: Posso exportar os dados?
**R:** Sim! Vá para Configurações → Gerenciar Produtos → Exportar CSV

---

## 🚨 Problemas Comuns

### P: Erro: "Arquivo CSV inválido"
**R:** Causas possíveis:
- Menos de 2 linhas (coloque cabeçalho + 1 produto mínimo)
- Separador errado (use `;` não `,`)
- Arquivo não é .csv

**Solução**: Use o arquivo `exemplo_importacao.csv` como referência

### P: Erro: "Nenhum produto válido encontrado"
**R:** Causas possíveis:
- Não tem exatamente 6 colunas
- Preços não são números válidos
- Código ou descrição vazios

**Solução**: Verifique cada linha tem exatamente 6 valores separados por `;`

### P: Erro: "Unique constraint violation"
**R:** Há dois produtos com o mesmo código

**Solução**: 
- Abra o CSV em editor de texto
- Procure o código duplicado
- Remova uma linha ou adicione sufixo (5L500-A, 5L500-B)

### P: CSV importado mas produtos não aparecem
**R:** A aplicação pode estar cacheada

**Solução**:
- Recarregue: F5 ou Ctrl+Shift+R
- Feche e abra novamente
- Limpe o cache do navegador (Ctrl+Shift+Del)

### P: Preços aparecem como 0
**R:** Conversão de decimal falhou

**Solução**:
- Verifique se usa vírgula: `2.288,58` ✅ não `2288.58` ❌
- Reimporte o arquivo

### P: A tabela existe mas está vazia
**R:** Normal! Você ainda não importou nenhum arquivo

**Solução**: Clique em "Importar CSV" e selecione seu arquivo

### P: Recebi erro de conexão Supabase
**R:** Supabase está fora do ar ou suas credenciais estão erradas

**Solução**:
- Verifique status do Supabase (status.supabase.com)
- Verifique VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY em .env

---

## 🔐 Sobre Segurança

### P: Meus dados estão seguros?
**R:** Sim! A tabela tem Row Level Security (RLS) habilitada

### P: Alguém consegue deletar todos os meus dados?
**R:** Sim, qualquer um com acesso. Em produção:
- Ajuste as políticas RLS
- Use autenticação
- Implemente permissões por usuário

### P: Posso fazer backup automático?
**R:** Supabase faz backups automáticos (diários no plano gratuito)

### P: Como restaurar dados do backup?
**R:** Entre em contato com suporte do Supabase

---

## 🚀 Sobre Implementação

### P: Como funcionam os preços (distribuidor vs final)?
**R:** 
- **Distribuidor**: preço para revender via distribuidor (sem margem)
- **Final**: preço final de revenda ao cliente (com margem)

Ambos têm versões com/sem IPI

### P: Qual preço usar na busca de produtos?
**R:** Depende do seu caso de uso:
- **Para cálculo de margem**: use price_final - price_distributor
- **Para apresentar ao cliente**: use price_final_with_ipi

### P: Posso adicionar mais colunas de preço?
**R:** Sim! Altere o SQL e o código, mas será mais complexo

### P: Por que 6 colunas e não mais ou menos?
**R:** Porque o CSV fornecido tem exatamente essas 6

---

## 📈 Sobre Performance

### P: Vai ficar lento com 100.000 produtos?
**R:** Depende:
- Buscas: muito rápido (com índices)
- Importação: pode levar alguns minutos
- Exportação: depende do tamanho

**Dica**: Use índices! O SQL já inclui.

### P: Como otimizar a busca?
**R:** Já está otimizado com índices em:
- code (busca exata)
- description (busca full-text em português)
- marca (filtro)

---

## 🆘 Suporte

### P: Onde faço perguntas que não estão aqui?
**R:** 
- Veja `README_IMPORTACAO.md` (mais detalhado)
- Veja `DIAGRAMA_FLUXO.md` (visuais)
- Veja `INSTRUCOES_IMPORTACAO.md` (passo a passo)

### P: Encontrei um bug, como reporto?
**R:** Documente:
- O que estava tentando fazer
- Exata mensagem de erro
- Seu arquivo CSV (se possível)
- Os passos para reproduzir

### P: Como sugiro uma nova funcionalidade?
**R:** Liste em `RESUMO_MUDANCAS.md` seção "Próximas Funcionalidades"

---

## ✅ Checklist de Sucesso

Você conseguiu se:
- [ ] SQL foi executado no Supabase sem erros
- [ ] Tabela `products` existe (verifique em SQL Editor)
- [ ] Arquivo CSV importou com sucesso
- [ ] Aplicação mostra "Total de produtos: X" (X > 0)
- [ ] Consegue buscar um produto
- [ ] Consegue exportar CSV com os dados

Se tudo está marcado ✅ **PARABÉNS! Tudo funciona!** 🎉

---

**Última atualização**: 2024  
**Versão**: 1.0
