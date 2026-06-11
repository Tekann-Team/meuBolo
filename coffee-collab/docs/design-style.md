# Design e Estilo Visual - CAFÉ GRÃO

Este documento descreve as diretrizes de design, estilo visual e experiência do usuário do sistema.

---

## 🎨 Conceito Visual

### Paleta de Cores - Tema Café

O sistema utiliza um estilo **moderno, aconchegante (cozy) e tecnológico** com referências visuais ao café.

**Cores Principais**:
- **Fundo degradê**: Tons quentes que lembram café (marrom, bege, creme, dourado)
- **Acento principal**: Tons de marrom escuro e café torrado
- **Acentos secundários**: Dourado, caramelo, bege claro
- **Texto**: Contraste adequado (preto/marrom escuro sobre fundos claros, branco/bege claro sobre fundos escuros)

**Sensação Desejada**:
- ☕ **Cozy** (aconchegante) - como entrar em uma cafeteria quentinha
- 🔥 **Quente** - cores que transmitem calor
- 💻 **Tecnológico** - moderno e limpo, sem perder a humanidade
- ✨ **Elegante** - não flat, com profundidade e personalidade

---

## 🖼️ Diretrizes de Design

### Estilo Geral

- **NÃO flat design**: Usar sombras, gradientes, profundidade
- **Bordas arredondadas**: Elementos suaves e acolhedores
- **Sombras sutis**: Dar profundidade aos elementos
- **Gradientes**: Especialmente em fundos e botões
- **Espaçamento generoso**: Não apertar elementos

### Componentes

#### Cards
- Fundo com gradiente sutil ou sólido com sombra
- Bordas arredondadas (8-12px)
- Padding generoso
- Sombras suaves para profundidade
- Hover effects sutis

#### Botões
- Gradientes em tons de café
- Bordas arredondadas
- Sombras sutis
- Efeitos hover com leve elevação
- Tipografia clara e legível

#### Inputs/Formulários
- Bordas arredondadas
- Fundo claro com borda sutil
- Focus states claros (borda destacada)
- Labels bem posicionados

#### Modal/Dialog
- Fundo escuro semi-transparente (backdrop blur se possível)
- Card centralizado com sombra pronunciada
- Animação suave de entrada
- Bordas arredondadas

---

## 📱 Layout

### Menu Lateral

- **Estado Collapsed**: Apenas ícones visíveis
- **Estado Expanded**: Ícones + textos dos botões
- **Transição suave**: Animação ao expandir/colapsar
- **Background**: Degradê ou sólido em tons de café
- **Ícones**: Visíveis e claros em ambos os estados
- **Hover**: Destacar botão ao passar mouse

### Headers

- **Gradiente de fundo**: Tons quentes de café
- **Tipografia destacada**: Nome do sistema bem visível
- **Informações do usuário**: Foto, nome, totais (contribuições, bolos)
- **Botões de ação**: Destacados mas não intrusivos

### Avisos (Alerts)

- **Cards destacados**: Fundo diferenciado, bordas visíveis
- **Ícones**: Claros e informativos
- **Ações**: Botões bem visíveis para resolver o aviso

---

## 🎭 Elementos Específicos

### Barra de Progresso (Corrida de Barras)

- **Visual dinâmico**: Animação ao carregar
- **Avatares**: Fotos dos colaboradores
- **Ranking**: Posições claras (1º, 2º, 3º...)
- **Gradiente**: Barras com gradiente de progresso
- **Interatividade**: Hover mostra detalhes

### Gráficos ECharts

- **Tema personalizado**: Cores do tema café
- **Tooltips informativos**: Dados claros ao hover
- **Interatividade**: Zoom, pan quando aplicável
- **Responsivo**: Adaptar ao tamanho da tela

### Linha do Tempo (Timeline)

- **Barras coloridas**: Cada cor representa um usuário
- **Ícones de usuário**: Sobre as barras ou na legenda
- **Meses no eixo X**: Claros e legíveis
- **Bolos no eixo Y**: Escala adequada

---

## 📝 Tipografia

- **Fonte principal**: Moderna e legível (sans-serif)
- **Títulos**: Peso bold ou semi-bold
- **Hierarquia clara**: Tamanhos diferentes para diferentes níveis
- **Contraste adequado**: Texto sempre legível

---

## ✨ Animações e Transições

- **Suaves**: Não exageradas
- **Rápidas**: Máximo 300ms para transições simples
- **Funcionais**: Melhorar UX, não distrair
- **Loading states**: Indicadores claros de carregamento

---

## 🎯 Estados Visuais

### Loading
- Skeleton screens ou spinners
- Mensagens claras ("Carregando...")

### Empty States
- Ilustrações ou ícones
- Mensagens encorajadoras
- Chamadas para ação quando aplicável

### Error States
- Mensagens claras
- Ícones de erro visíveis
- Ações para resolver

---

## 📐 Responsividade

- **Mobile-first**: Pensar em mobile primeiro
- **Breakpoints**: Adaptar layout para diferentes tamanhos
- **Touch-friendly**: Elementos clicáveis com tamanho adequado em mobile
- **Menu lateral**: Pode virar drawer em mobile

---

## 🎨 Exemplos de Aplicação

### Fundo de Página
```css
/* Gradiente em tons de café */
background: linear-gradient(
  135deg,
  #8B4513 0%,      /* Marrom escuro */
  #A0522D 25%,     /* Marrom */
  #D2691E 50%,     /* Chocolate */
  #DEB887 75%,     /* Bege */
  #F5DEB3 100%     /* Trigo */
);
```

### Cards
- Fundo: Branco ou bege claro com sombra
- Bordas: 8-12px arredondadas
- Sombra: `box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1)`

### Botões Primários
- Gradiente em tons de café
- Hover: Sombra mais pronunciada
- Texto: Branco ou bege claro

---

**Última atualização**: Dezembro 2024







