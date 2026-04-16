# 🍇 Açaízera — Cardápio Digital Inteligente

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![MercadoPago](https://img.shields.io/badge/Mercado_Pago-Integration-009EE3?logo=mercadopago&logoColor=white)

---

## 📍 O Cenário: Açaízera em Santos

A **Açaízera** é uma loja real e bastante movimentada localizada na cidade de **Santos, litoral de São Paulo**. Com o aumento da demanda no delivery, a loja enfrentava um problema clássico e desgastante no atendimento via WhatsApp:

1. **Gargalo no Atendimento:** Nos horários de pico, os atendentes perdiam muito tempo enviando o cardápio em PDF ou texto e respondendo dúvidas repetitivas sobre quais complementos estavam disponíveis.
2. **Erros de Montagem:** Os clientes frequentemente pediam mais acompanhamentos do que o tamanho do copo suportava (ex: pedindo 4 frutas e 3 caldas num copo de 300ml). Isso gerava um longo e ineficiente "vai e vem" de mensagens para corrigir o pedido.
3. **Logística Travada:** Endereços incompletos, falta de bairro ou informações e pontos de referência ausentes atrasavam os motoboys nas entregas pela cidade de Santos, gerando insatisfação e perda de qualidade no produto (açaí derretido).

## 💡 A Solução: Automação e Experiência do Usuário

O projeto **Açaízera** foi desenvolvido para resolver esses exatos problemas. Trata-se de um **Catálogo Virtual Interativo** (100% focado no mobile) que atua como um funil de vendas antes do cliente chegar ao WhatsApp. 

Em vez de conversar com o atendente para *montar* o pedido, o cliente usa o aplicativo web para:
* **Visualizar os produtos de forma clara e atrativa**, divididos entre Açaí no Copo e Açaí na Garrafa.
* **Respeitar os limites de personalização de forma automatizada.** A interface bloqueia a seleção de ingredientes extras com base no tamanho do copo escolhido (ex: copo de 300ml permite apenas 1 fruta, 2 acompanhamentos e 1 calda).
* **Preencher um formulário rígido de endereço**, garantindo que Rua, Número, Bairro e Ponto de Referência cheguem completos para o entregador.
* **Efetuar o pagamento via Pix integrado** (Mercado Pago), cortando a necessidade de conferência manual de comprovantes.

Ao final do fluxo, o aplicativo compila tudo e gera uma **mensagem estruturada, padronizada e livre de erros** diretamente para o WhatsApp da loja.

> **Impacto Real:** A loja reduziu o tempo médio de atendimento de 8 minutos para menos de 1 minuto por pedido, zerou os erros de envio e melhorou drasticamente a rota de entrega na Baixada Santista.

---

## ✨ Funcionalidades Principais

- 🟣 **Cardápio Visual e Dinâmico:** Produtos exibidos com fotos de qualidade, descrição completa e preços atualizados.
- 🍓 **Motor de Personalização Inteligente:** Regras de negócio estritas. Escolha de Frutas, Acompanhamentos, Caldas e Extras (Turbine seu Açaí!) com validações dinâmicas.
- 🛒 **Carrinho de Compras Interativo:** Revisão simples de todos os itens customizados, alteração de quantidades e totais calculados na hora.
- 📍 **Validação de Entrega:** Formulário detalhado com campos obrigatórios, evitando qualquer ambiguidade logística para entrega em Santos e região.
- 💳 **Módulo de Pagamento Integrado:** Modal de pagamento avançado com integração ao Mercado Pago via QR Code e copy-paste (Pix Copia e Cola) ou via envio tradicional de comprovante.
- 📲 **Checkout via WhatsApp:** Montagem automática da string do pedido. Apenas 1 clique para enviar tudo pronto.
- 🕐 **Status Operacional:** Verificação de horário de funcionamento local (Aberto/Fechado).

---

## 🚀 Tecnologias Utilizadas

Este projeto foi desenhado sob uma arquitetura moderna para garantir carregamentos ultrarrápidos e excelente performance no mobile:

| Tecnologia | Função no Projeto |
|---|---|
| **React 19** | Componentização modular e reatividade do carrinho/modal de montagem |
| **Vite 8** | Ambiente de desenvolvimento veloz e build otimizado |
| **Tailwind CSS 4** | Estilizações em utility-classes garantindo um design system ágil e fluido |
| **Context API / Hooks** | Gerenciamento do estado global do carrinho de compras e UI |
| **Supabase / API Service** | Infraestrutura e comunicação de banco de dados e APIs externas |
| **Mercado Pago API** | Geração e processamento dos pagamentos via PIX |

---

## 🎨 Design System e Estética Premium

A interface utiliza uma paleta Dark Premium, pensada para destacar as cores vivas e vibrantes do açaí, melhorando a percepção de valor:

- O fundo principal foca num esquema `#0c0a14` (Roxo/Azul muito profundo), criando uma identidade visual noturna e elegante que não cansa a visão.
- Detalhes (botões, tags, chamadas para ação) usam um tom roxo açaí saturado (`#a855f7` e `#6b21a8`) para garantir o contraste.
- Tipografia limpa e moderna (Open Sans / Inter) garante excelente legibilidade em telas pequenas.

---

## 📁 Arquitetura do Repositório

```text
acaizera/
├── public/                 # Assets (Logos, imagens otimizadas, catálogos em JSON)
├── src/
│   ├── components/         # Módulos reutilizáveis (CardCatalogo, Header, Carrinho, ModalPersonalizar, Pagamento)
│   ├── pages/              # Views principais (Home)
│   ├── services/           # (Opcional/Existente) Integrações como a api do Mercado Pago
│   ├── index.css           # Variáveis CSS globais e injetores do Tailwind
│   ├── App.jsx             # Roteador principal e Providers de estado
│   └── main.jsx            # Entry point da aplicação React
├── vite.config.js          # Configuração do Vite e plugins
└── package.json            # Dependências 
```

---

## 🛠️ Como rodar o ambiente de Desenvolvimento

Se você deseja clonar e testar esta aplicação localmente:

```bash
# 1. Clone o repositório
git clone https://github.com/reuel02/acaizera.git
cd acaizera

# 2. Instale as dependências
npm install

# 3. Rode o servidor de teste local
npm run dev
```

O projeto iniciará em `http://localhost:5173`.

---

## 📦 Build para Produção

Para otimizar o projeto e preparar para deploy (Vercel/Netlify), basta rodar:

```bash
npm run build
```

Uma pasta `dist/` será gerada contendo os assets minificados, prontos para servidão ultrarrápida.

---

<p align="center">
  Desenvolvido sob medida para alavancar a <strong>Açaízera em Santos/SP</strong>. Caso de sucesso em digitalização de delivery.
</p>

<p align="center">
  💻 Desenvolvido por <strong>Reuel Ferreira</strong>.
</p>

---

### ⚠️ Direitos Autorais e Licença
> **ESTRITAMENTE PROIBIDO:** É expressamente proibida a cópia, clonagem, distribuição ou o uso comercial deste código-fonte parcial ou integralmente sem a autorização prévia e expressa do desenvolvedor. Projeto de uso exclusivo.
