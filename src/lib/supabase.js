import { createClient } from '@supabase/supabase-js'

// No Vite, puxamos as variáveis usando import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Inicializa e exporta a conexão para ser usada no resto do projeto
export const supabase = createClient(supabaseUrl, supabaseKey)