# Correções de Bugs - CAFÉ GRÃO

Este documento descreve as correções de bugs implementadas no sistema.

---

## 🐛 Bugs Corrigidos

### 1. Erro 429 ao Clicar em Links de Evidência do Google Drive

**Problema**: Ao clicar em links de evidência (compras ou chegadas), ocorria erro 429 (Too Many Requests) mesmo após o app do Google estar em produção.

**Causa**: 
- Quando o Google App está em produção (fora de modo de teste), os limites de rate limiting são mais restritivos
- URLs diretas do Google Drive (`lh3.googleusercontent.com/d/FILE_ID`) podem ser bloqueadas por rate limiting quando acessadas diretamente
- O formato de URL usado não estava otimizado para visualização

**Solução Implementada**:
1. **Melhorada a função `ensureImageUrl()`** em `googleDriveService.js`:
   - Adicionado parâmetro `forViewing` para diferenciar entre exibição em `<img>` e visualização em nova aba
   - Para visualização em nova aba (quando usuário clica), usa o formato `https://drive.google.com/file/d/FILE_ID/view` que é mais confiável
   - Para exibição em `<img>`, usa o formato com parâmetro de viewport `=w1920-h1080` para evitar rate limiting

2. **Atualizados os componentes** que abrem evidências em nova aba:
   - `Contributions.jsx`: Usa `ensureImageUrl(evidence, true)` ao abrir em nova aba
   - Isso garante que o link aberto seja no formato de visualização do Google Drive, menos propenso a erros 429

**Arquivos Modificados**:
- `coffee-collab/src/services/googleDriveService.js`
- `coffee-collab/src/pages/Contributions.jsx`

**Resultado**: Links de evidência agora abrem corretamente sem erro 429, usando o formato de visualização do Google Drive que é mais confiável.

---

### 2. Balance Não Atualiza Após Adicionar Contribuição

**Problema**: Ao adicionar uma nova contribuição, o saldo atual (balance) do usuário não era atualizado imediatamente na interface.

**Causa**: 
- O reprocessamento de saldos (`reprocessAllUserBalances()`) estava sendo chamado, mas:
  - Erros eram suprimidos silenciosamente (apenas logados)
  - Não havia garantia de que o reprocessamento terminasse antes da UI recarregar
  - A UI recarregava antes do Firestore propagar as mudanças de balance

**Solução Implementada**:
1. **Melhorado o tratamento de erros** em `contributionService.js`:
   - Adicionado log detalhado do resultado do reprocessamento
   - Erros são logados com mais detalhes para facilitar debugging
   - O reprocessamento agora aguarda completar antes de retornar

2. **Melhorado o fluxo de atualização da UI**:
   - Em `Home.jsx`, o callback `onSuccess` agora aguarda 500ms antes de recarregar dados
   - Isso garante que o Firestore tenha tempo de propagar as mudanças de balance
   - O modal `NewContributionModal.jsx` agora aguarda o `onSuccess` completar antes de fechar

3. **Melhorada a sincronização**:
   - O reprocessamento de saldos é aguardado antes de retornar da função `createContribution`
   - Isso garante que o balance seja atualizado antes da UI recarregar

**Arquivos Modificados**:
- `coffee-collab/src/services/contributionService.js`
- `coffee-collab/src/pages/Home.jsx`
- `coffee-collab/src/components/NewContributionModal.jsx`

**Resultado**: O balance agora é atualizado corretamente e visível imediatamente após adicionar uma contribuição.

---

## 🔍 Como Verificar as Correções

### Erro 429 - Links de Evidência
1. Acesse a página `/contributions`
2. Clique em "Evidências" em uma contribuição que tenha evidência de compra ou chegada
3. Clique na imagem da evidência para abrir em nova aba
4. ✅ **Esperado**: A imagem deve abrir no Google Drive sem erro 429

### Balance Não Atualiza
1. Acesse a página `/home`
2. Anote seu saldo atual (exibido no header)
3. Clique em "+ Novo" → "Nova Contribuição"
4. Preencha os dados e salve a contribuição
5. ✅ **Esperado**: O saldo deve ser atualizado imediatamente após salvar, refletindo a nova contribuição

---

## 📝 Notas Técnicas

### Formato de URLs do Google Drive

**Para exibição em `<img>`**:
- Formato: `https://lh3.googleusercontent.com/d/FILE_ID=w1920-h1080`
- O parâmetro `=w1920-h1080` especifica o tamanho do viewport e ajuda a evitar rate limiting

**Para visualização em nova aba**:
- Formato: `https://drive.google.com/file/d/FILE_ID/view`
- Este formato é mais confiável e menos propenso a erros 429
- É o formato recomendado quando o usuário clica para ver a imagem

### Sincronização de Balance

O fluxo de atualização de balance agora segue esta sequência:

1. Contribuição é criada no Firestore (atomicamente)
2. Reprocessamento de saldos é executado e aguardado
3. Saldos são atualizados no Firestore
4. UI aguarda 500ms para propagação
5. UI recarrega dados (incluindo balance atualizado)

Isso garante que o balance seja sempre visível após adicionar uma contribuição.

---

## 🔄 Compatibilidade

- ✅ Compatível com código existente
- ✅ Não requer mudanças em outros componentes
- ✅ Mantém mesma interface de funções
- ✅ Não requer migração de dados

---

---

## 3. Página de Compensações Não Abre Após Compensação Automática

**Problema**: Quando uma compensação automática era executada após criar uma contribuição, a página de compensações não abria automaticamente, dificultando a visualização da compensação recém-criada.

**Causa**: 
- A função `createContribution` executava a compensação automática mas não retornava informação sobre isso
- Não havia mecanismo para navegar automaticamente para a página de compensações após a compensação ser criada

**Solução Implementada**:
1. **Modificada a função `createContribution`** para retornar objeto com `contributionId` e `compensationCreated`:
   - Agora retorna `{ contributionId, compensationCreated }` ao invés de apenas o ID
   - Mantém compatibilidade com código existente (suporta ambos os formatos)

2. **Adicionada navegação automática**:
   - O modal `NewContributionModal` agora passa a flag `compensationCreated` para o callback `onSuccess`
   - A página `Home.jsx` verifica se uma compensação foi criada e navega automaticamente para `/compensations`
   - Mensagem de sucesso informa quando uma compensação automática foi executada

3. **Corrigido formato de data** na criação de compensação:
   - Agora converte corretamente `Date` para `Timestamp` do Firestore

**Arquivos Modificados**:
- `coffee-collab/src/services/contributionService.js`
- `coffee-collab/src/services/compensationService.js`
- `coffee-collab/src/components/NewContributionModal.jsx`
- `coffee-collab/src/pages/Home.jsx`

**Resultado**: Quando uma compensação automática é executada, o usuário é automaticamente redirecionado para a página de compensações para visualizar a compensação recém-criada.

---

## 4. Links do Google Drive Ainda Não Abrem Corretamente

**Problema**: Mesmo após a primeira correção, alguns links do Google Drive ainda não abriam corretamente, especialmente quando o app estava em produção.

**Causa**: 
- O formato de URL usado para visualização ainda podia causar erros 429
- Quando a imagem não carregava, o fallback não usava o formato correto de visualização
- Links diretos (`lh3.googleusercontent.com`) podem precisar de tratamento especial em produção

**Solução Implementada**:
1. **Melhorada a extração de File ID**:
   - Suporta múltiplos formatos de URL (`/d/FILE_ID`, `/d/FILE_ID=w1920`, etc.)
   - Melhor tratamento de edge cases

2. **Melhorado o tratamento de erros**:
   - Quando a imagem falha ao carregar (erro 429 ou outros), mostra um link clicável
   - O link usa o formato `/view` do Google Drive que é mais confiável
   - Mensagem clara indicando que o usuário deve clicar no link

3. **Melhorado o formato de visualização**:
   - Ao clicar na imagem, sempre usa o formato `drive.google.com/file/d/FILE_ID/view`
   - Este formato funciona mesmo quando há problemas de rate limiting

**Arquivos Modificados**:
- `coffee-collab/src/services/googleDriveService.js`
- `coffee-collab/src/pages/Contributions.jsx`

**Resultado**: Links de evidência agora abrem corretamente, e quando há erro 429, um link clicável é mostrado que abre o arquivo no visualizador do Google Drive.

---

**Data das Correções**: Janeiro 2025  
**Versão**: 1.1.0

