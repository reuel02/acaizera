---
# 🤖 Instrução de Sistema: Integração Full-Stack (Acaizera - Kanban, Custos e Checkout MP)

## 🎯 Objetivo Principal
Você atua como um Engenheiro Full-Stack Sênior. Sua missão é analisar a interface React/TypeScript existente do dashboard (visualizado no arquivo `image_0739df.png`), implementar uma nova coluna no Kanban, adicionar o cadastro de custo por produto e corrigir o bug de loop infinito na validação de pagamento via Mercado Pago.

## 🔍 Contexto e Reconhecimento
Antes de alterar o código, identifique os estados e funções vazias referentes a:
1. **Componente do Kanban (Dashboard):** Localize onde as colunas "Novos Recebidos", "Em Preparo" e "Prontos / Entregues" são renderizadas e como os pedidos (tabela `pedidos`) são filtrados por `status`.
2. **Aba de Lucro por Produto:** Localize o modal ou lista de produtos onde o botão de "Custo por unidade" será inserido.
3. **Fluxo de Checkout/Polling:** Localize a tela ou hook que aguarda a confirmação de pagamento via cartão (Mercado Pago).

## 📐 Diretrizes de Integração (ESTRITAMENTE OBRIGATÓRIAS)

### 1. Conexão de Dados (Supabase)
- **Regra Multi-tenant Global:** Toda requisição `SELECT`, `INSERT`, `UPDATE` ou `DELETE` DEVE conter a validação `.eq('tenant_id', tenantAtual)` para garantir o isolamento dos dados da loja (caso o sistema utilize multi-tenant; do contrário, garanta os filtros adequados de RLS).
- **Task 1 (Kanban de Pagamentos Locais):** 
  - Atualize a query de listagem para garantir que pedidos com `order_type = 'local'` e `payment_status = 'pending'` sejam exibidos na nova coluna "Aguardando Pagamento".
  - Ao aprovar/validar este pedido pelo Kanban, dispare um `UPDATE` na tabela `pedidos`: defina `payment_status = 'paid'` e `status = 'completed'`.
- **Task 2 (Cadastro de Custos):** 
  - Ao salvar o custo de um açaí, faça um `UPDATE` na tabela `produtos`, atualizando a coluna `cost_price` com o valor numérico (ex: `UPDATE produtos SET cost_price = valor WHERE id = produto_id`).

### 2. Regras de Negócio e Validações
- **Estrutura do Kanban:** A ordem das colunas no UI deve ser estritamente: "Novos Recebidos" -> "Em Preparo" -> "Aguardando Pagamento" (nova) -> "Prontos / Entregues".
- **Loop Infinito do Mercado Pago (Task 3):** 
  - O sistema só deve entrar no estado de "aguardando confirmação" (polling/loading) SE o status do pagamento retornado for `pending` ou `in_process`. 
  - Se o `payment_status` retornado já for `approved` (ou `paid`), o fluxo deve ignorar a tela de aguardo e seguir normalmente para a conclusão do pedido.
- **Formatação de Moeda:** Garanta que o input de `cost_price` seja tratado para converter strings formatadas (R$) em tipo numérico (`numeric`) suportado pelo Supabase.

### 3. Integrações Externas
- **Mercado Pago:** Revise a lógica de interceptação do callback ou webhook na interface. Certifique-se de que a validação de pagamento em análise desmonte o componente de `loading` (clear interval/timeout) assim que o status mudar de pendente para aprovado ou recusado.

### 4. Preservação de UI/UX
- Você está ESTRITAMENTE PROIBIDO de remover, refatorar ou alterar as classes do Tailwind CSS que definem o layout da interface original.
- Adicione tratamento de `loading` (desabilitando botões, mudando cursores) durante as chamadas ao Supabase (ex: botão de salvar custo, botão de confirmar pagamento local).
- Implemente feedback visual (toasts de sucesso ou erro) ao atualizar o custo do produto e ao validar o pagamento no Kanban.

## 📤 Formato de Execução Esperado
Atualize os arquivos `.tsx` ou utilitários necessários e entregue o código funcional.
---