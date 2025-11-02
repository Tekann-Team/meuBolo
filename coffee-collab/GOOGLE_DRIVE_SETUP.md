# Configuração do Google Drive para Upload Automático

Este guia explica como configurar o upload automático de imagens para o Google Drive usando OAuth2.

---

## 📋 Pré-requisitos

1. Conta Google (Gmail)
2. Acesso ao Google Cloud Console
3. Uma pasta no Google Drive onde as imagens serão armazenadas

---

## 🔧 Passo 1: Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Clique em **"Selecionar projeto"** (no topo) → **"Novo projeto"**
3. Dê um nome ao projeto (ex: "Coffee Collab Drive")
4. Clique em **"Criar"**
5. Aguarde alguns segundos até o projeto ser criado

---

## 🔧 Passo 2: Habilitar Google Drive API

1. No menu lateral, vá em **"APIs e Serviços"** → **"Biblioteca"**
2. Na barra de busca, digite: **"Google Drive API"**
3. Clique na opção **"Google Drive API"**
4. Clique no botão **"ATIVAR"**
5. Aguarde alguns segundos até a ativação

---

## 🔧 Passo 3: Criar Credenciais OAuth2

### 3.1. Configurar Tela de Consentimento

1. No menu lateral, vá em **"APIs e Serviços"** → **"Tela de consentimento OAuth"**
2. Selecione **"Externo"** e clique em **"CRIAR"**
3. Preencha os campos obrigatórios:
   - **Nome do app**: "Coffee Collab" (ou o nome que preferir)
   - **Email de suporte do usuário**: Seu email
   - **Logotipo do app**: (opcional)
   - **Domínios autorizados**: Deixe vazio por enquanto
4. Clique em **"SALVAR E CONTINUAR"**
5. Em **"Escopos"**, clique em **"ADICIONAR OU REMOVER ESCOPOS"**
   - Marque: **"drive.file"** (Acesso aos arquivos criados pelo app)
   - Clique em **"ATUALIZAR"** e depois **"SALVAR E CONTINUAR"**
6. Em **"Usuários de teste"**, clique em **"ADICIONAR USUÁRIOS"**
   - Adicione seu email (e emails dos outros usuários que usarão o sistema)
   - Clique em **"SALVAR E CONTINUAR"**
7. Clique em **"VOLTAR AO PAINEL"**

### 3.2. Criar Credenciais OAuth2

1. No menu lateral, vá em **"APIs e Serviços"** → **"Credenciais"**
2. Clique em **"+ CRIAR CREDENCIAIS"** → **"ID do cliente OAuth"**
3. Selecione **"Aplicativo da Web"**
4. Preencha:
   - **Nome**: "Coffee Collab Web Client"
   - **Origens JavaScript autorizadas**: 
     - `http://localhost:5173` (para desenvolvimento local - IMPORTANTE!)
     - `http://localhost` (também adicione sem porta para evitar erros)
     - `https://seu-usuario.github.io` (para produção no GitHub Pages - substitua pelo seu domínio real)
     - ⚠️ **CRÍTICO**: Adicione a URL EXATA onde a aplicação está hospedada em produção
   
   - **URIs de redirecionamento autorizados** (opcional para Google Identity Services, mas recomendado):
     - `http://localhost:5173` (para desenvolvimento local)
     - `https://seu-usuario.github.io` (para produção no GitHub Pages)
     - ⚠️ **Nota**: Para Google Identity Services (GIS), as URIs de redirecionamento não são estritamente necessárias, mas adicionar não faz mal
5. Clique em **"CRIAR"**
6. **IMPORTANTE**: Copie e salve:
   - **ID do Cliente** (ex: `123456789-abcdefg.apps.googleusercontent.com`)
   
   ⚠️ **GUARDE ESSAS INFORMAÇÕES EM SEGURANÇA!**
   
   **Nota**: A chave secreta não é necessária para Google Identity Services (GIS) no frontend.

---

## 🔧 Passo 4: Criar Pasta no Google Drive e Obter ID

1. Acesse: https://drive.google.com/
2. Clique em **"+ Novo"** → **"Pasta"**
3. Dê um nome (ex: "Coffee Collab Images")
4. **Clique com botão direito na pasta** → **"Compartilhar"** → **"Alterar"**
5. Selecione **"Qualquer pessoa com o link"** → **"Visualizador"**
6. **Copie o link da pasta** (ex: `https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j`)
7. **Extraia o ID da pasta** do link:
   - O ID é a parte após `/folders/`
   - Exemplo: Se o link é `https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j`
   - O ID é: `1a2b3c4d5e6f7g8h9i0j`

---

## 🔧 Passo 5: Configurar Variáveis de Ambiente

### 5.1. Desenvolvimento Local

1. No projeto, crie um arquivo `.env` na pasta `coffee-collab/` (se não existir)
2. Adicione as seguintes variáveis:

```env
# Google OAuth (para Google Drive)
VITE_GOOGLE_CLIENT_ID=seu-id-do-cliente-aqui
VITE_GOOGLE_DRIVE_FOLDER_ID=seu-id-da-pasta-aqui

# Firebase Configuration (obrigatório)
# Veja instruções detalhadas em FIREBASE_SETUP.md
VITE_FIREBASE_API_KEY=sua-api-key-aqui
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
VITE_FIREBASE_APP_ID=seu-app-id
VITE_FIREBASE_MEASUREMENT_ID=seu-measurement-id
```

**Exemplo com valores do projeto atual:**
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyB654645aC7y9LYoqBx1C3nHpNrk
VITE_FIREBASE_AUTH_DOMAIN=seila.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seila
VITE_FIREBASE_STORAGE_BUCKET=seila.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=6433654783
VITE_FIREBASE_APP_ID=1:62356046043:web:b409b6af5c4a7e7969fe
VITE_FIREBASE_MEASUREMENT_ID=G-HG1KHBHWHG

# Google OAuth (para Google Drive)
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
VITE_GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j
```

⚠️ **NÃO** commite o arquivo `.env` no Git! Ele já deve estar no `.gitignore`.

💡 **Dica**: Você pode copiar o arquivo `.env.example` como base e preencher com seus valores.

### 5.2. Produção no GitHub Pages

Como o `.env` não é publicado no GitHub Pages, você precisa configurar **GitHub Secrets**:

1. Acesse o repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **"New repository secret"**
4. Crie os seguintes secrets:

   **Google OAuth (para Google Drive):**
   - **Nome**: `VITE_GOOGLE_CLIENT_ID`
     - **Valor**: Cole o ID do cliente OAuth que você obteve no Passo 3
   - **Nome**: `VITE_GOOGLE_DRIVE_FOLDER_ID`
     - **Valor**: Cole o ID da pasta do Google Drive que você obteve no Passo 4

   **Firebase (obrigatório):**
   - **Nome**: `VITE_FIREBASE_API_KEY`
     - **Valor**: Sua Firebase API Key (veja `FIREBASE_SETUP.md` para obter)
   - **Nome**: `VITE_FIREBASE_AUTH_DOMAIN`
     - **Valor**: Seu domínio de autenticação do Firebase
   - **Nome**: `VITE_FIREBASE_PROJECT_ID`
     - **Valor**: ID do seu projeto Firebase
   - **Nome**: `VITE_FIREBASE_STORAGE_BUCKET`
     - **Valor**: Bucket de armazenamento do Firebase
   - **Nome**: `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - **Valor**: Sender ID do Firebase
   - **Nome**: `VITE_FIREBASE_APP_ID`
     - **Valor**: App ID do Firebase
   - **Nome**: `VITE_FIREBASE_MEASUREMENT_ID`
     - **Valor**: Measurement ID do Firebase (Analytics)

⚠️ **Importante**: Os nomes dos secrets devem ser **EXATAMENTE** como acima (com `VITE_` no início).

#### Como Funciona?

- Durante o **build** no GitHub Actions, essas secrets são injetadas como variáveis de ambiente
- O Vite compila o código e **embute essas variáveis** no JavaScript final
- No navegador, essas variáveis são acessíveis via `import.meta.env.VITE_*`
- Isso é **seguro** porque o Client ID do Google OAuth é **feito para ser público** no frontend

📖 **Leia mais**: Veja a seção [🔍 Como Funcionam as Variáveis de Ambiente no GitHub Pages](#-como-funcionam-as-variáveis-de-ambiente-no-github-pages) abaixo.

---

## 🔧 Passo 6: Configuração no Código

O código já está configurado para usar Google Identity Services (GIS), que é a API moderna do Google. Não é necessário instalar dependências adicionais - as bibliotecas são carregadas via CDN.

**Importante**: O sistema usa Google Identity Services (GIS) em vez da API antiga `gapi.auth2`, que foi depreciada pelo Google.

---

## 🔧 Passo 7: Configurar domínios autorizados (CRÍTICO PARA PRODUÇÃO)

⚠️ **IMPORTANTE**: Este passo é **OBRIGATÓRIO** para que o upload funcione em produção. Sem isso, você receberá o erro `redirect_uri_mismatch`.

Quando fizer o deploy para produção:

1. Volte ao Google Cloud Console → **"APIs e Serviços"** → **"Credenciais"**
2. Clique no seu **ID do cliente OAuth**
3. Em **"Origens JavaScript autorizadas"**, adicione **TODOS** os domínios onde a aplicação será acessada:
   - `http://localhost:5173` (desenvolvimento local - já deve estar)
   - `http://localhost` (desenvolvimento local alternativo - já deve estar)
   - **URL do seu site em produção** (ex: `https://seu-usuario.github.io` ou `https://seu-dominio.com`)
   - **Com a porta, se necessário** (ex: `https://seu-usuario.github.io:443`)
   - **Sem a porta também** (ex: `https://seu-usuario.github.io`)
   
   💡 **Dica**: Adicione ambas as variações (com e sem porta) para evitar problemas.
   
4. **Para Google Identity Services (GIS)**: 
   - ⚠️ **NÃO é necessário** adicionar URIs de redirecionamento (ao contrário da API antiga)
   - As "Origens JavaScript autorizadas" são suficientes
   - Mas se você vir o campo "URIs de redirecionamento autorizados", pode adicionar por segurança:
     - `http://localhost:5173`
     - `https://seu-usuario.github.io`
     
5. **Salve as alterações** (é importante clicar em "Salvar")
6. ⏱️ **Aguarde alguns minutos** para as alterações propagarem (geralmente 1-5 minutos)

### ❌ Erro Comum: redirect_uri_mismatch

Se você estiver vendo o erro `redirect_uri_mismatch` ou `Acesso bloqueado: a solicitação do app é inválida`:

1. **Verifique a URL exata** onde a aplicação está rodando
   - Abra o console do navegador (F12)
   - Digite: `window.location.origin`
   - Copie o valor exato (incluindo porta, se houver)

2. **Adicione essa URL EXATA** nas "Origens JavaScript autorizadas"
   - Não use URLs com paths (ex: não use `https://site.com/path`)
   - Use apenas o domínio e porta: `https://site.com` ou `https://site.com:443`

3. **Verifique se salvou** as alterações no Google Cloud Console

4. **Aguarde alguns minutos** e tente novamente (mudanças podem levar tempo para propagar)

5. **Teste novamente** após fazer as alterações

---

## ✅ Verificação

Após configurar tudo:

1. Reinicie o servidor de desenvolvimento (`npm run dev`)
2. Tente fazer upload de uma imagem
3. Na primeira vez, será solicitada autorização do Google
4. Após autorizar, o upload deve funcionar automaticamente

---

## 🔧 Troubleshooting (Solução de Problemas)

### ❌ Erro: "redirect_uri_mismatch" ou "Acesso bloqueado: a solicitação do app é inválida"

**Causa**: O domínio da aplicação não está autorizado no Google Cloud Console.

**Solução**:
1. Identifique a URL exata onde a aplicação está rodando:
   - Abra o console do navegador (F12)
   - Digite: `console.log(window.location.origin)`
   - Copie o valor exato (ex: `https://seu-usuario.github.io`)

2. No Google Cloud Console:
   - Vá em **APIs e Serviços** → **Credenciais**
   - Clique no seu **ID do cliente OAuth**
   - Em **"Origens JavaScript autorizadas"**, adicione a URL EXATA (sem paths)
   - **Salve** as alterações

3. Aguarde 1-5 minutos para propagação e teste novamente

### ❌ Erro: "Popup window closed" ou "A janela de autenticação foi fechada"

**Causa**: O usuário fechou a janela de autorização antes de completar.

**Solução**:
- Tente novamente e **não feche** a janela de autorização do Google
- Complete o processo de autorização clicando em "Permitir"

### ❌ Erro: "Token de acesso não recebido"

**Causa**: Problema na resposta do Google OAuth.

**Solução**:
1. Verifique se o Google Client ID está correto no `.env` ou GitHub Secrets
2. Verifique se o domínio está autorizado (veja erro acima)
3. Tente fazer logout e login novamente
4. Limpe o cache do navegador e tente novamente

### ❌ Erro: "Google Identity Services failed to load"

**Causa**: Problema de conexão ou bloqueador de anúncios.

**Solução**:
1. Verifique sua conexão com a internet
2. Desative bloqueadores de anúncios/extensões que podem bloquear scripts do Google
3. Verifique se os scripts do Google estão sendo carregados:
   - Abra o console do navegador (F12)
   - Vá em "Network" e procure por `gsi/client` e `api.js`
   - Se não estiverem sendo carregados, verifique o arquivo `index.html`

### ❌ Upload funciona localmente, mas não em produção

**Causa**: Domínio de produção não está autorizado.

**Solução**:
1. Adicione a URL de produção nas "Origens JavaScript autorizadas"
2. Verifique se as variáveis de ambiente estão configuradas no GitHub Secrets
3. Certifique-se de que o build foi feito após adicionar os secrets
4. Aguarde alguns minutos após salvar as alterações no Google Cloud Console

---

## 🔐 Segurança

⚠️ **Importante**:
- O **ID do Cliente** pode ser exposto no frontend (é normal)
- A **Chave Secreta** NÃO deve ser exposta (não é usada no frontend)
- Para produção, limite os domínios autorizados
- Revise periodicamente os acessos no Google Cloud Console

---

## 📝 Notas

- O escopo `drive.file` permite apenas criar/editar arquivos que o app criou
- Para acesso total ao Drive, seria necessário `drive`, mas não recomendamos por segurança
- Os arquivos serão criados na pasta especificada em `VITE_GOOGLE_DRIVE_FOLDER_ID`

---

## 🔧 Formato de URLs de Imagens

Após o upload ou conversão, as imagens são armazenadas no formato:
```
https://lh3.googleusercontent.com/d/FILE_ID
```

**Importante**: 
- Este formato é usado diretamente no `src` das tags `<img>`
- O sistema converte automaticamente links compartilháveis do Google Drive para este formato
- A função `ensureImageUrl()` garante que as URLs estejam no formato correto antes de exibir

**Nota**: Se uma imagem não estiver sendo exibida, verifique:
1. Se o arquivo está compartilhado como "Qualquer pessoa com o link"
2. Se a URL está no formato correto (usando `ensureImageUrl()`)
3. Se há erros no console do navegador

---

## 🔍 Como Funcionam as Variáveis de Ambiente no GitHub Pages

### ❓ O Problema

GitHub Pages é um serviço de **hospedagem estática** - ele só serve arquivos HTML, CSS e JavaScript compilados. Não há servidor rodando que possa ler arquivos `.env` em tempo de execução.

### ✅ A Solução

O **Vite** resolve isso de forma inteligente:

1. **Durante o build**: Variáveis que começam com `VITE_` são **embutidas diretamente no JavaScript** no momento da compilação
2. **No GitHub Actions**: Usamos **GitHub Secrets** para passar essas variáveis durante o build
3. **Resultado**: As variáveis ficam "hardcoded" no JavaScript compilado, mas de forma segura

### 📋 Fluxo Completo

```
┌─────────────────────────────────────────────────────────┐
│ 1. Desenvolvimento Local                                │
│    • Você cria arquivo .env local                       │
│    • Vite lê as variáveis do .env                       │
│    • Durante `npm run dev`, variáveis são usadas       │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Push para GitHub                                     │
│    • Você faz push do código                            │
│    • GitHub Actions detecta o push                      │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. GitHub Actions Build                                 │
│    • Workflow roda `npm run build`                      │
│    • GitHub Secrets são injetadas como env vars         │
│    • Vite compila e EMBUTE as variáveis no JS           │
│    • Resultado: dist/ com JS contendo as variáveis      │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Deploy no GitHub Pages                                │
│    • GitHub Pages serve os arquivos estáticos           │
│    • No navegador, import.meta.env.VITE_* funciona!     │
└─────────────────────────────────────────────────────────┘
```

### 🔐 Por Que É Seguro?

- **Client ID do Google OAuth** é **feito para ser público** - é normal que apareça no JavaScript
- O **Client Secret** NÃO é usado no frontend (não precisamos dele)
- As secrets do GitHub só são acessíveis durante o build, não ficam expostas publicamente
- O JavaScript compilado com as variáveis é público, mas isso é o comportamento esperado para credenciais públicas de frontend

### ⚠️ Importante

- **NUNCA** use secrets que devem ser privadas no frontend (como API keys secretas)
- Use apenas credenciais **públicas** (como OAuth Client IDs) que são feitas para serem expostas
- Se precisar de secrets reais, use um backend próprio (não GitHub Pages)

---

**Última atualização**: Dezembro 2024

