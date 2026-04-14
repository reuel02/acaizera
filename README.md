# 🍇 Açaízera — Cardápio Digital com Pedido via WhatsApp

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Sobre o Projeto

O **Açaízera** é o cardápio digital oficial da loja de açaí **Açaízera**. O projeto foi desenvolvido para oferecer uma experiência simples e direta ao cliente: ele acessa o cardápio pelo celular, personaliza seu açaí escolhendo frutas, acompanhamentos, caldas e extras, e ao finalizar, o pedido completo é enviado **direto para o WhatsApp da loja** — sem cadastro, sem login, sem taxas.

> **Projeto real** desenvolvido para uso em produção pela loja Açaízera.

---

## ✨ Funcionalidades

- 🟣 **Cardápio visual** — Produtos organizados por categoria (Açaí no Copo e Açaí na Garrafa) com fotos, descrição e preço.
- 🍓 **Personalização completa** — Escolha de frutas, acompanhamentos, caldas e extras pagos (Turbine seu Açaí!), com limites dinâmicos por tamanho de copo.
- 🛒 **Carrinho interativo** — Adicione múltiplos itens, ajuste quantidades, visualize personalizações e remova itens.
- 📍 **Endereço estruturado** — Campos separados para rua, número, bairro, complemento e ponto de referência, evitando endereços incompletos.
- 📲 **Pedido via WhatsApp** — O resumo completo do pedido (itens, personalizações, total e endereço) é montado automaticamente e enviado para o WhatsApp da loja.
- 🕐 **Status da loja** — Indicador em tempo real mostrando se a loja está aberta ou fechada baseado no horário.
- 🔍 **Filtros por categoria** — Navegação rápida entre os tipos de produto.
- 📱 **100% responsivo** — Interface pensada para ser acessada pelo celular.

---

## 🚀 Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| **React** | 19 | Componentes e gerenciamento de estado |
| **Vite** | 8 | Build tool e dev server |
| **Tailwind CSS** | 4 | Estilização com design system customizado |
| **React Icons** | 5 | Ícones (carrinho, WhatsApp, etc.) |

---

## 🎨 Design System

A paleta de cores é inspirada no açaí, com tons de **roxo profundo** e **lilás** que remetem à fruta:

| Token | Cor | Uso |
|---|---|---|
| `bg-primary` | `#0c0a14` | Fundo principal |
| `bg-secondary` | `#150f24` | Cards e painéis |
| `accent` | `#a855f7` | Botões, badges e destaques |
| `brand-acai` | `#6b21a8` | Roxo açaí vibrante |
| `brand-banana` | `#fbbf24` | Destaque amarelo (extras) |
| `brand-tag` | `#7c3aed` | Badge do carrinho |

A fonte utilizada é a [Open Sans](https://fonts.google.com/specimen/Open+Sans).

---

## 📁 Estrutura do Projeto

```
acaizera/
├── public/
│   ├── acaizera-logo.png      # Logo da marca
│   ├── acaizera-logo.svg      # Logo vetorial
│   ├── acai_copo_300.png      # Imagem do produto
│   ├── acai_copo_400.png
│   ├── acai_copo_500.png
│   ├── acai_copo_770.png
│   ├── acai_garrafa_*.jpeg    # Imagens das garrafas
│   └── dados.json             # Banco de dados dos produtos
├── src/
│   ├── components/
│   │   ├── Header.jsx         # Cabeçalho com logo e carrinho
│   │   ├── CardCatalogo.jsx   # Card de produto no catálogo
│   │   ├── ModalPersonalizar.jsx  # Modal de personalização do açaí
│   │   └── Carrinho.jsx       # Painel lateral do carrinho
│   ├── pages/
│   │   └── Home.jsx           # Página principal com catálogo
│   ├── App.jsx                # Componente raiz
│   ├── main.jsx               # Entry point
│   └── index.css              # Design system e animações
├── index.html
├── vite.config.js
└── package.json
```

---

## 🛠️ Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/reuel02/acaizera.git
cd acaizera

# Instale as dependências
npm install

# Rode o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

---

## 📦 Build para produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

---

## 🍨 Personalização do Açaí

O modal de personalização adapta as opções de acordo com o tamanho do copo:

| Copo | Frutas | Acompanhamentos | Caldas |
|---|:---:|:---:|:---:|
| 300 mL | 1 | 2 | 1 |
| 400 mL | 1 | 2 | 1 |
| 500 mL | 2 | 3 | 1 |
| 770 mL | 3 | 4 | 2 |

**Extras pagos (Turbine seu Açaí!):** Kit Kat (R$ 4,00), Ouro Branco (R$ 3,00), Nutella (R$ 3,00).

---

## 📄 Licença

Este projeto é de uso exclusivo da **Açaízera**. Todos os direitos reservados.

---

<p align="center">
  Feito com 💜 para a <strong>Açaízera</strong>
</p>
