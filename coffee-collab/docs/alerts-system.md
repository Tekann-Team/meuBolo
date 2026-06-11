# Sistema de Avisos - CAFÉ GRÃO

Este documento descreve todos os avisos (alerts) disponíveis no sistema e como eles funcionam.

---

## 📍 Onde Aparecem

Os avisos aparecem na página **Home** (`/home`), logo abaixo do header, antes dos cards do dashboard.

---

## 🎯 Avisos Disponíveis

### 1. ☕ "Já chegou o café?!"

**Quando aparece**: Quando o usuário tem uma ou mais contribuições criadas por ele mesmo que **não possuem** evidência de chegada (`arrivalEvidence`) **OU** data de chegada (`arrivalDate`).

**Visual**: Card com gradiente bege/marrom e borda laranja

**Ação disponível**: Botão "Editar Contribuição" que abre o modal de edição da primeira contribuição pendente

**Como desaparece**: Quando o usuário adiciona evidência de chegada e/ou data de chegada para todas as suas contribuições pendentes

**Exemplo**:
- Você criou uma contribuição em 15/12/2024
- Você ainda não adicionou a foto de chegada do café
- O aviso aparece até você editar a contribuição e adicionar a evidência

---

### 2. ⭐ "Não esqueça de dar o seu voto!"

**Quando aparece**: Quando existe pelo menos um produto no sistema que o usuário ainda **não votou**.

**Visual**: Card com gradiente bege claro e borda dourada

**Ação disponível**: Botão "Ir para Votações" que redireciona para a página `/votes`

**Como desaparece**: Quando o usuário vota em todos os produtos disponíveis

**Exemplo**:
- Existem 3 produtos no sistema: "Café Expresso", "Café Gourmet", "Café Premium"
- Você votou apenas em "Café Expresso" e "Café Gourmet"
- O aviso aparece até você votar em "Café Premium"

---

### 3. 📊 "Menor saldo detectado!"

**Quando aparece**: Quando o **saldo atual** do usuário é igual ao **menor saldo** entre todos os usuários ativos do sistema. Se todos os usuários têm saldo 0, o aviso aparece para todos.

**Visual**: Card com gradiente amarelo claro e borda dourada escura

**Ação disponível**: Apenas informativo (sem botão de ação)

**Como desaparece**: Quando outro usuário fica com saldo menor ou igual ao seu

**Exemplo**:
- Usuário A: saldo = 2.5 bolos
- Usuário B: saldo = 1.0 bolos
- Usuário C: saldo = 1.0 bolos
- Usuários B e C verão o aviso (têm o menor saldo)

**⚠️ IMPORTANTE**: Este aviso verifica o **SALDO** do usuário, não o total de contribuições. O saldo é calculado a partir da última compensação + contribuições após ela.

**Nota especial**: Se o saldo do usuário for 0, o aviso inclui a mensagem adicional: "Que tal começar a contribuir?"

---

## 🔄 Quando os Avisos São Atualizados

Os avisos são recalculados:

1. **Ao carregar a página Home** - quando o usuário acessa `/home`
2. **Após salvar uma contribuição** - se você recarregar a página ou voltar para Home
3. **Após editar uma contribuição** - se você recarregar a página ou voltar para Home
4. **Após votar em um produto** - se você voltar para Home

**Nota**: Os avisos não são atualizados em tempo real automaticamente. Para ver avisos atualizados após fazer alterações, você pode:
- Recarregar a página Home
- Navegar para outra página e voltar para Home
- Fechar e reabrir o navegador

---

## 🎨 Visualização

### Ordem de Exibição

Os avisos aparecem na seguinte ordem (de cima para baixo):

1. ☕ "Já chegou o café?!" (prioridade mais alta)
2. ⭐ "Não esqueça de dar o seu voto!"
3. 📊 "Menor saldo detectado!" (prioridade mais baixa)

### Múltiplos Avisos

Múltiplos avisos podem aparecer simultaneamente. Por exemplo:
- Você pode ver o aviso de "café não chegou" E o aviso de "menor saldo" ao mesmo tempo
- Cada aviso aparece em seu próprio card

---

## 🐛 Solução de Problemas

### "Não estou vendo nenhum aviso, mas deveria"

1. **Verifique se você está logado** - avisos só aparecem para usuários autenticados
2. **Verifique se você está na página Home** - avisos só aparecem em `/home`
3. **Recarregue a página** - pode ser necessário recarregar para atualizar os avisos
4. **Verifique as condições**:
   - Aviso de chegada: Você tem contribuições criadas por você sem evidência de chegada?
   - Aviso de voto: Existem produtos no sistema que você não votou?
   - Aviso de saldo: Seu saldo é igual ao menor saldo do sistema?

### "O aviso não desaparece após resolver o problema"

1. **Recarregue a página** - os avisos são recalculados ao carregar
2. **Verifique se realmente resolveu** - por exemplo, se você adicionou evidência de chegada, verifique se foi salva corretamente
3. **Limpe o cache do navegador** - se o problema persistir

---

## 📝 Notas Técnicas

- Os avisos são calculados no lado do cliente (não são armazenados no banco de dados)
- O cálculo dos avisos ocorre na função `checkAlerts()` em `Home.jsx`
- Avisos são recalculados quando `loadData()` é chamado
- O aviso de menor saldo usa `user.balance` (saldo atual), não o total de contribuições

---

**Última atualização**: Dezembro 2024



