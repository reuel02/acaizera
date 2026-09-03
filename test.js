import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    db: { schema: 'acaizera' }
});

async function check() {
  const { data, error } = await supabase.from('pedidos').select('*').order('criado_em', { ascending: false }).limit(5);
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));

  const { data: rpc, error: rpcErr } = await supabase.rpc('get_financial_summary', { periodo_dias: 30 });
  console.log("RPC Error:", rpcErr);
  console.log("RPC Data:", JSON.stringify(rpc, null, 2));
}

check();
