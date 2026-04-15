import { createClient } from "@supabase/supabase-js";

/**
 * ================================================
 * CONFIGURAÇÃO: Supabase Client
 * ================================================
 *
 * Inicializa e exporta cliente Supabase para toda a aplicação
 * Supabase = PostgreSQL + Auth + Realtime + Storage na nuvem
 *
 * AMBIENTE:
 *  - Vite carrega variáveis via import.meta.env
 *  - Requer arquivo .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
 *  - NEVER coloque chaves em .env ou commit no git
 *  - Ver .env.example para template
 *
 * SEGURANÇA:
 *  - VITE_SUPABASE_ANON_KEY: chave pública, pode estar no cliente
 *  - RLS (Row Level Security) policies devem estar ativas no Supabase
 *  - Sem RLS, qualquer usuário pode acessar todos os dados
 *  - TODO: Implementar auth0 ou custom auth para usuários
 *
 * TABELAS ESPERADAS:
 *  - produtos: id, nome, tipo, preco, imagem, descricao, limites
 *  - pedidos: id, cliente_nome, cliente_endereco, total, itens (JSONB), status
 *  - Futuro: usuarios, admin_painel, historico_pagamentos
 *
 * FUNCIONALIDADES ATIVAS:
 *  - Read: Buscar produtos, pedidos com status
 *  - Write: Inserir novos pedidos na tabela
 *  - Realtime: Atualização em tempo real de pedidos (futuro)
 *  - Auth: Sistema de login (futuro)
 *
 * EXEMPLO DE USO:
 *  const { data, error } = await supabase
 *    .from('produtos')
 *    .select('*')
 *    .order('id', { ascending: true })
 *  if (error) console.error(error)
 *  else console.log(data) // Array de produtos
 *
 * DOCS: https://supabase.com/docs
 * ================================================
 */

// ===== CARREGA VARIÁVEIS DE AMBIENTE =====
// Em Vite, variáveis começadas com VITE_ são expostas ao cliente automaticamente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * VALIDAÇÃO: Se chaves não estão definidas, mostra erro
 * (Útil para identificar .env.local faltando ou mal configurado)
 */
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Erro: Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidas no .env.local",
  );
}

/**
 * CLIENTE SUPABASE
 * Exportado como 'supabase' para uso em toda a aplicação
 *
 * Este objeto fornece métodos para:
 *  - supabase.from('tabela').select() → Ler dados
 *  - supabase.from('tabela').insert() → Criar dados
 *  - supabase.from('tabela').update() → Atualizar dados
 *  - supabase.from('tabela').delete() → Deletar dados
 *  - supabase.auth.signIn() → Autenticar usuário
 *
 * RLS Policies garantem que cada usuário só vê seus próprios dados
 * (quando configurado corretamente no painel Supabase)
 */
export const supabase = createClient(supabaseUrl, supabaseKey);
