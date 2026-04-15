# 🚀 Guia: Webhook Serverless no Vercel

## O que foi implementado

Um **webhook serverless** que recebe notificações do Mercado Pago automaticamente quando um pagamento é confirmado.

### Fluxo
```
Cliente paga no app
        ↓
Mercado Pago processa o pagamento
        ↓
MP envia notificação POST para Vercel
        ↓
Função serverless recebe e processa
        ↓
Pedido é atualizado automaticamente no Supabase
        ↓
Status muda para "pago" sem o cliente precisar clicar em nada
```

---

## ✅ Passo 1: Deploy no Vercel

### Instalação da CLI Vercel
```bash
npm install -g vercel
```

### Deploy
```bash
vercel
```

Siga as instruções:
- Faça login ou crie conta em [vercel.com](https://vercel.com)
- Escolha seu projeto
- Confirme os settings

**Resultado esperado:**
```
✓ Production: https://seu-projeto.vercel.app
```

---

## ✅ Passo 2: Configurar Variáveis de Ambiente no Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings → Environment Variables**
4. Adicione as 3 variáveis:

```
VITE_SUPABASE_URL = sua_url_supabase
VITE_SUPABASE_ANON_KEY = sua_chave_anon
VITE_MERCADO_PAGO_ACCESS_TOKEN = seu_access_token_mp
```

> **Atenção:** Use valores **entre aspas** se contiverem caracteres especiais

---

## ✅ Passo 3: Configurar Webhook no Mercado Pago

### Acessar Painel MP
1. Vá em [seller.mercadopago.com.br](https://seller.mercadopago.com.br)
2. Menu → **Configurações**
3. Clique em **Notificações**
4. Escolha **Webhooks**

### Criar Novo Webhook
- **URL:** `https://seu-projeto.vercel.app/api/webhooks/mercadopago`
- **Tópicos:** Marque `payment` (pagamentos)
- Clique em **Salvar**

**Exemplo:**
```
URL: https://acaizera.vercel.app/api/webhooks/mercadopago
Tópicos: ☑️ payment
```

---

## ✅ Passo 4: Atualizar Banco de Dados

O webhook precisa salvar o `payment_id` para rastrear qual pagamento corresponde a qual pedido.

### Adicione coluna no Supabase
1. Vá em [supabase.com/dashboard](https://supabase.com/dashboard)
2. Seu projeto → **SQL Editor**
3. Execute este comando:

```sql
ALTER TABLE pedidos ADD COLUMN payment_id TEXT;
ALTER TABLE pedidos ADD COLUMN payment_status TEXT;
ALTER TABLE pedidos ADD COLUMN payment_date TIMESTAMP;
```

---

## ✅ Passo 5: Atualizar Código do App

### Salvar payment_id ao criar pagamento

**Arquivo:** `src/pages/Home.jsx`

```javascript
const confirmarPagamento = async () => {
  if (!dadosPedidoSalvo) return;

  try {
    // Se estiver usando Mercado Pago, salve o payment_id
    const paymentId = dadosPedidoSalvo.payment_id; // Vem do Mercado Pago

    // Salva o pedido no Supabase com payment_id
    const { error } = await supabase
      .from('pedidos')
      .insert([{
        cliente_nome: dadosPedidoSalvo.cliente_nome,
        cliente_endereco: dadosPedidoSalvo.cliente_endereco,
        cliente_email: dadosPedidoSalvo.cliente_email,
        total: dadosPedidoSalvo.total,
        itens: dadosPedidoSalvo.itens,
        payment_id: paymentId, // 👈 Adicione isto
        status: 'aguardando_pagamento',
        criado_em: dadosPedidoSalvo.criado_em
      }]);

    if (error) throw error;
    concluirEIrParaWhatsApp();
  } catch (error) {
    alert("Erro ao confirmar pagamento. Tente novamente.");
    console.error(error);
  }
};
```

---

## 🧪 Testar Webhook Localmente

### Opção 1: ngrok (Recomendado)

```bash
npm install -g ngrok
ngrok http 3000
```

Você receberá: `https://abc123.ngrok.io`

Use essa URL no webhook do Mercado Pago para testes.

### Opção 2: Simular Webhook

```bash
curl -X POST https://seu-projeto.vercel.app/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "action": "payment.updated",
    "data": {
      "id": "123456789",
      "status": "approved"
    }
  }'
```

---

## 📊 Monitorar Webhooks

### Logs no Vercel
1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Seu projeto → **Functions**
3. Clique em `api/webhooks/mercadopago.js`
4. Veja os logs em tempo real

### Console.log aparecem aqui
```
📬 Webhook recebido do Mercado Pago: { type: 'payment', action: 'payment.updated' }
💳 Processando pagamento ID: 123456789
✅ Pedido 1 atualizado para pago
```

---

## 🔄 Novo Fluxo de Pagamento

### Antes (Manual)
```
1. Cliente finaliza carrinho
2. Sistema prepara pedido
3. Cliente vê QR Code PIX
4. Cliente paga
5. Cliente clica "Já Paguei → Verificar"
6. Sistema verifica e salva pedido
```

### Depois (Automático com Webhook)
```
1. Cliente finaliza carrinho
2. Sistema prepara pedido com payment_id
3. Cliente vê QR Code PIX
4. Cliente paga
5. MP avisa ao webhook automaticamente
6. Pedido é salvo e atualizado sem cliente fazer nada
```

---

## ⚠️ Importante

- Se cliente não clicar em "Verificar", o pedido será atualizado pelo webhook automaticamente
- Pode manter o botão "Verificar" como fallback
- O webhook roda de **graça** no Vercel (até 100GB/mês de execução)
- Máximo de **30 segundos** por requisição (suficiente)

---

## 📝 Próximos Passos

1. ✅ Deploy no Vercel
2. ✅ Configurar variáveis de ambiente
3. ✅ Criar webhook no Mercado Pago
4. ✅ Adicionar colunas no Supabase
5. ✅ Testar com pagamento real ou simulado
6. (Opcional) Integrar com WhatsApp automático

---

## 🆘 Troubleshooting

### Webhook não recebe notificações
- Verifique URL no Mercado Pago (sem typos)
- Teste com curl para confirmar endpoint
- Verifique logs no Vercel

### Variáveis de ambiente não carregam
- Redeploy após adicionar: `vercel --prod`
- Aguarde 2 minutos para ativar

### Erro de permissão no Supabase
- Verifique se `VITE_SUPABASE_ANON_KEY` tem permissão UPDATE
- Vá em **Supabase → RLS Policies** e adicione política public

