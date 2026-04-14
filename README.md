# 🍔⚡ ZapCart — Cardápio Digital com Pedido via WhatsApp

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

---

## 🧠 O Problema

Milhares de pequenos restaurantes, hamburguerias e lanchonetes ainda recebem pedidos de forma manual: o cliente manda uma mensagem no WhatsApp, o atendente pergunta o que ele quer, anota num papel, confirma o endereço... e tudo isso **gera erros, demora e perda de vendas**.

Plataformas como iFood e Rappi resolvem isso, mas cobram **taxas de até 27% por pedido** — um valor que muitos pequenos negócios simplesmente não conseguem absorver.

## 💡 A Solução

O **ZapCart** é um cardápio digital próprio que elimina o intermediário. O cliente acessa o catálogo pelo celular, monta seu pedido com poucos toques e, ao finalizar, a mensagem com o resumo completo do pedido é enviada **direto para o WhatsApp do restaurante** — sem taxas, sem comissões, sem cadastro.

> **Resumindo:** O dono do restaurante ganha um cardápio online profissional e recebe os pedidos organizados no WhatsApp que ele já usa todo dia.

---

## ✨ O que o ZapCart faz

- 📋 **Catálogo visual** — Produtos organizados por categoria com fotos, descrição e preço.
- 🔍 **Filtros por categoria** — O cliente encontra rápido o que quer: hambúrgueres, porções ou bebidas.
- 🛒 **Carrinho inteligente** — Painel lateral com controle de quantidade (+/-), remoção de itens e subtotal calculado automaticamente.
- 📱 **Checkout via WhatsApp** — Um clique gera a mensagem formatada com todos os itens e o valor total, pronta para enviar.
- 🕐 **Status de funcionamento** — Banner que mostra se a loja está aberta ou fechada em tempo real.
- 🌙 **Dark Theme Premium** — Interface moderna, responsiva e com identidade visual de hamburgueria.

---

## 🎯 Para quem é

| Perfil | Como usa |
|---|---|
| **Hamburguerias e lanchonetes** | Cardápio digital próprio sem pagar comissão para apps de delivery |
| **Food trucks** | Menu acessível por QR Code no balcão |
| **Restaurantes pequenos** | Receber pedidos organizados no WhatsApp em vez de mensagens soltas |
| **Desenvolvedores** | Base pronta e customizável para projetos de delivery |

---

## 🚀 Como rodar

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/zapcart.git
cd zapcart

# Instale as dependências
npm install

# Rode o servidor de desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:5173`.

---

## ⚙️ Configuração rápida

### Número do WhatsApp
Edite o número em `src/components/Carrinho.jsx`:
```javascript
const telefone = "5511999999999"; // Substitua pelo número real (DDI+DDD+Número)
```

### Horário de Funcionamento
Edite os valores em `src/pages/Home.jsx`:
```javascript
const horaAbertura = 18;   // 18h
const horaFechamento = 23; // 23h
```

### Produtos do Cardápio
Edite o arquivo `public/dados.json` seguindo a estrutura:
```json
{
  "id": "h-1",
  "tipo": "hamburguer",
  "nome": "Smash Bacon",
  "descricao": "Dois smashs de 80g com cheddar e bacon.",
  "preco": 32.90,
  "imagem": "/smash_bacon.png"
}
```

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| **React 19** | Interface reativa com hooks |
| **Vite 8** | Dev server ultrarrápido e build otimizado |
| **Tailwind CSS 4** | Estilização utilitária com tema customizado |
| **React Icons** | Ícones (carrinho, WhatsApp, lixeira) |
| **API wa.me** | Integração nativa com WhatsApp Web |

---

## 📁 Estrutura do Projeto

```
zapcart/
├── public/
│   ├── dados.json             # Cardápio (produtos)
│   ├── zapcart-logo.svg       # Logo horizontal
│   ├── zapcart-icon.svg       # Ícone quadrado
│   └── *.png                  # Fotos dos produtos
├── src/
│   ├── components/
│   │   ├── Header.jsx         # Cabeçalho com logo e carrinho
│   │   ├── CardCatalogo.jsx   # Card de produto
│   │   └── Carrinho.jsx       # Painel lateral do carrinho
│   ├── pages/
│   │   └── Home.jsx           # Página principal
│   ├── App.jsx                # Componente raiz
│   └── index.css              # Tema e variáveis de cor
└── package.json
```

---

## 🎨 Identidade Visual

A paleta de cores foi extraída diretamente da logo, inspirada nos ingredientes de um hambúrguer artesanal:

| Variável | Cor | Ingrediente |
|---|---|---|
| `--color-brand-bun` | `#f59e0b` 🟠 | Pão brioche |
| `--color-brand-cheese` | `#fbbf24` 🟡 | Queijo cheddar |
| `--color-brand-fresh` | `#22c55e` 🟢 | Alface fresca |
| `--color-brand-zap` | `#ef4444` 🔴 | Relâmpago (velocidade) |
| `--color-brand-patty` | `#3f1d0b` 🟤 | Carne grelhada |

---

## 📄 Licença

Este projeto é de uso livre para fins educacionais e comerciais.
