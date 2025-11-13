# Funcionalidade: Bolos Caseiros (Eu fiz meuBolo!)

Este documento descreve a funcionalidade de cadastro de contribuições de bolos caseiros, onde usuários podem registrar bolos feitos em casa sem valor monetário.

---

## 🎯 Objetivo

Permitir que usuários cadastrem contribuições de bolos caseiros feitos em casa, onde:
- **1 bolo caseiro = 1 bolo** (equivalente a um bolo comprado)
- O valor monetário é **R$ 0,00**
- A quantidade de bolos é inserida **manualmente** pelo usuário
- Esses bolos contam normalmente para todos os indicadores e saldos

---

## 📊 Estrutura de Dados

### Collection: `contributions` (Atualização)

**Novo campo adicionado:**
```javascript
{
  // ... campos existentes
  isHomemadeCake: boolean,  // Indica se é um bolo caseiro (default: false)
}
```

**Regras de Negócio:**
- Se `isHomemadeCake: true`:
  - `value` deve ser `0` (R$ 0,00)
  - `quantityCakes` é inserido **manualmente** pelo usuário (não calculado)
  - Não usa `cakeValue` para cálculo
- Se `isHomemadeCake: false` (padrão):
  - Comportamento atual mantido: `quantityCakes = value / cakeValue`

---

## 🎨 Interface do Usuário

### Modal: Nova Contribuição / Editar Contribuição

**Novo elemento adicionado:**

```
┌─────────────────────────────────────┐
│  ☑ Eu fiz meuBolo!                 │
│                                     │
│  [Quando marcado:]                  │
│  Valor (R$): [0.00] (desabilitado) │
│  Quantidade de bolos: [____] *      │
│                                     │
│  [Quando desmarcado:]                │
│  Valor (R$): [____] *                │
│  Quantidade: [calculada automaticamente]
└─────────────────────────────────────┘
```

**Comportamento:**
1. **Checkbox "Eu fiz meuBolo!"**:
   - Quando marcado:
     - Campo "Valor (R$)" fica desabilitado e com valor `0.00`
     - Campo "Quantidade de bolos" fica habilitado para entrada manual
     - Usuário pode inserir qualquer quantidade (decimal permitido)
   - Quando desmarcado:
     - Comportamento normal: valor é obrigatório, quantidade é calculada automaticamente

2. **Validações:**
   - Se `isHomemadeCake: true`:
     - `value` deve ser `0` (ou não preenchido, será definido como 0)
     - `quantityCakes` é obrigatório e deve ser > 0
   - Se `isHomemadeCake: false`:
     - `value` é obrigatório e deve ser > 0
     - `quantityCakes` é calculado automaticamente

---

## 🔄 Lógica de Processamento

### Criação de Contribuição (`createContribution`)

**Fluxo:**
```javascript
if (isHomemadeCake) {
  // Bolo caseiro
  contribution.value = 0
  contribution.quantityCakes = quantityCakesManual // Do input do usuário
  contribution.isHomemadeCake = true
} else {
  // Bolo comprado (comportamento normal)
  contribution.value = value
  contribution.quantityCakes = value / cakeValue
  contribution.isHomemadeCake = false
}
```

### Atualização de Contribuição (`updateContribution`)

**Fluxo:**
- Se `isHomemadeCake` mudar de `false` para `true`:
  - `value` é definido como `0`
  - `quantityCakes` vem do input manual
- Se `isHomemadeCake` mudar de `true` para `false`:
  - `value` é obrigatório
  - `quantityCakes` é recalculado como `value / cakeValue`
- Se `isHomemadeCake` permanecer `true`:
  - `value` permanece `0`
  - `quantityCakes` pode ser atualizado manualmente

---

## 📊 Impacto nos Algoritmos

### 1. Reprocessamento de Saldos (`reprocessAllUserBalances`)

**Status**: ✅ **Funciona corretamente**

O algoritmo já usa `quantityCakes` diretamente, então funciona automaticamente com bolos caseiros:

```javascript
// Já funciona - usa quantityCakes diretamente
contributionsCakes += contrib.quantityCakes || contrib.quantityKg || 0
```

**Não requer alterações** - o algoritmo já soma `quantityCakes` independente de como foi calculado.

### 2. Sistema de Compensações

**Status**: ✅ **Funciona corretamente**

As compensações usam o saldo (em bolos), que já inclui bolos caseiros:

```javascript
// Já funciona - usa balance que já inclui bolos caseiros
const balances = activeUsers.map(user => user.balance || 0)
```

**Não requer alterações** - compensações funcionam com base no saldo total (incluindo bolos caseiros).

### 3. Indicadores e Gráficos

**Status**: ✅ **Funciona corretamente**

Todos os indicadores que somam `quantityCakes` já funcionam:

- Total de bolos: `SUM(quantityCakes)` - inclui bolos caseiros
- Saldo dos colaboradores: usa `balance` que já inclui bolos caseiros
- Média de consumo mensal: `SUM(quantityCakes) / meses` - inclui bolos caseiros

**Não requer alterações** - todos os cálculos já usam `quantityCakes` diretamente.

### 4. Cálculo de Preço Médio do Produto

**Status**: ⚠️ **Requer atenção**

O cálculo de `averagePricePerKg` do produto precisa ignorar contribuições com `value = 0`:

```javascript
// Antes (problemático):
averagePricePerKg = SUM(contributions.value) / SUM(contributions.quantityCakes)

// Depois (correto):
averagePricePerKg = SUM(contributions WHERE value > 0).value / 
                    SUM(contributions WHERE value > 0).quantityCakes
```

**Requer alteração** em `productService.js` - função `updateProductAveragePrice`.

---

## 🔒 Validações

### Frontend (Modal)

1. **Se `isHomemadeCake: true`**:
   - `value` deve ser `0` (ou não preenchido)
   - `quantityCakes` é obrigatório e deve ser > 0
   - Mensagem de erro se `quantityCakes <= 0`

2. **Se `isHomemadeCake: false`**:
   - `value` é obrigatório e deve ser > 0
   - `quantityCakes` é calculado automaticamente (não editável)

### Backend (Service)

1. **Ao criar contribuição**:
   - Se `isHomemadeCake: true`, garantir que `value = 0`
   - Se `isHomemadeCake: true`, garantir que `quantityCakes > 0`
   - Se `isHomemadeCake: false`, garantir que `value > 0`

2. **Ao atualizar contribuição**:
   - Mesmas validações da criação
   - Se mudar de `isHomemadeCake: false` para `true`, definir `value = 0`

---

## 📝 Casos de Uso

### Caso 1: Criar Contribuição de Bolo Caseiro

1. Usuário abre modal "Nova Contribuição"
2. Marca checkbox "Eu fiz meuBolo!"
3. Campo "Valor (R$)" fica desabilitado com valor `0.00`
4. Campo "Quantidade de bolos" fica habilitado
5. Usuário insere quantidade (ex: `2.5` bolos)
6. Salva contribuição
7. **Resultado**: Contribuição criada com `value: 0`, `quantityCakes: 2.5`, `isHomemadeCake: true`
8. Saldo do usuário aumenta em `2.5` bolos

### Caso 2: Editar Contribuição de Bolo Caseiro

1. Usuário abre modal "Editar Contribuição" de uma contribuição caseira
2. Checkbox "Eu fiz meuBolo!" já está marcado
3. Campo "Quantidade de bolos" está habilitado com valor atual
4. Usuário altera quantidade (ex: de `2.5` para `3.0`)
5. Salva contribuição
6. **Resultado**: `quantityCakes` atualizado para `3.0`
7. Saldo do usuário é reprocessado (aumenta em `0.5` bolos)

### Caso 3: Converter Bolo Comprado em Bolo Caseiro

1. Usuário abre modal "Editar Contribuição" de uma contribuição normal
2. Marca checkbox "Eu fiz meuBolo!"
3. Campo "Valor (R$)" fica desabilitado e muda para `0.00`
4. Campo "Quantidade de bolos" fica habilitado com valor calculado anteriormente
5. Usuário pode ajustar quantidade manualmente
6. Salva contribuição
7. **Resultado**: `value: 0`, `quantityCakes: [valor manual]`, `isHomemadeCake: true`
8. Saldo do usuário é reprocessado (pode aumentar ou diminuir dependendo da quantidade)

### Caso 4: Converter Bolo Caseiro em Bolo Comprado

1. Usuário abre modal "Editar Contribuição" de uma contribuição caseira
2. Desmarca checkbox "Eu fiz meuBolo!"
3. Campo "Valor (R$)" fica habilitado
4. Campo "Quantidade de bolos" fica desabilitado (calculado automaticamente)
5. Usuário insere valor (ex: `R$ 50,00`)
6. Salva contribuição
7. **Resultado**: `value: 50`, `quantityCakes: 50 / cakeValue`, `isHomemadeCake: false`
8. Saldo do usuário é reprocessado

---

## 🧪 Testes Necessários

### Teste 1: Criar Bolo Caseiro
- [ ] Criar contribuição com `isHomemadeCake: true`
- [ ] Verificar que `value = 0`
- [ ] Verificar que `quantityCakes` é o valor inserido manualmente
- [ ] Verificar que saldo do usuário aumenta corretamente

### Teste 2: Editar Bolo Caseiro
- [ ] Editar quantidade de bolo caseiro
- [ ] Verificar que saldo é reprocessado corretamente
- [ ] Verificar que compensações funcionam corretamente

### Teste 3: Compensação com Bolos Caseiros
- [ ] Criar contribuições com bolos caseiros
- [ ] Verificar que compensação automática funciona
- [ ] Verificar que saldos após compensação estão corretos

### Teste 4: Indicadores com Bolos Caseiros
- [ ] Verificar que total de bolos inclui bolos caseiros
- [ ] Verificar que gráficos mostram bolos caseiros corretamente
- [ ] Verificar que médias incluem bolos caseiros

### Teste 5: Preço Médio do Produto
- [ ] Criar produto com contribuições normais e caseiras
- [ ] Verificar que `averagePricePerKg` ignora contribuições caseiras (`value = 0`)
- [ ] Verificar que cálculo está correto

---

## 📚 Arquivos Modificados

### Backend (Services)
- `contributionService.js` - Adicionar suporte a `isHomemadeCake`
- `productService.js` - Atualizar `updateProductAveragePrice` para ignorar `value = 0`

### Frontend (Components)
- `NewContributionModal.jsx` - Adicionar checkbox e campo manual de quantidade
- `EditContributionModal.jsx` - Adicionar checkbox e campo manual de quantidade

### Documentação
- `database.md` - Atualizar estrutura de `contributions`
- `pages.md` - Atualizar especificação dos modais
- `homemade-cakes-feature.md` - Este documento

---

## ⚠️ Notas Importantes

1. **Compatibilidade**: Contribuições antigas sem `isHomemadeCake` são tratadas como `false` (comportamento normal)

2. **Migração**: Não é necessária migração de dados - campo novo com default `false`

3. **Validação**: É importante validar que `value = 0` quando `isHomemadeCake: true` para evitar inconsistências

4. **Preço Médio**: O cálculo de preço médio do produto deve ignorar contribuições com `value = 0` para não distorcer a média

5. **Saldos**: Todos os algoritmos de saldo já funcionam corretamente porque usam `quantityCakes` diretamente

---

**Data de Criação**: Janeiro 2025  
**Status**: Em Implementação

