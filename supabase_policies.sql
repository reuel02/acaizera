-- =========================================================================
-- SQL PARA LIBERAR PERMISSÕES (GRANTS) E POLÍTICAS (RLS)
-- =========================================================================
-- Copie todo este texto e cole no "SQL Editor" do Supabase e clique "Run".
-- Isso resolve os erros de "401 Unauthorized" e "Row Level Security".

-- 1. Conceder permissões (GRANTs) para as roles da API acessarem o schema
GRANT USAGE ON SCHEMA acaizera TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA acaizera TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA acaizera TO anon, authenticated;

-- (Opcional, garante que futuras tabelas criadas no schema tenham a permissão)
ALTER DEFAULT PRIVILEGES IN SCHEMA acaizera GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA acaizera GRANT ALL ON SEQUENCES TO anon, authenticated;

-- 2. Permissões RLS para a tabela PRODUTOS
ALTER TABLE acaizera.produtos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para produtos" ON acaizera.produtos;
CREATE POLICY "Permitir tudo para produtos" 
  ON acaizera.produtos 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 3. Permissões RLS para a tabela STORE_SETTINGS
ALTER TABLE acaizera.store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para store_settings" ON acaizera.store_settings;
CREATE POLICY "Permitir tudo para store_settings" 
  ON acaizera.store_settings 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 4. Permissões RLS para a tabela CLIENTES
ALTER TABLE acaizera.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para clientes" ON acaizera.clientes;
CREATE POLICY "Permitir tudo para clientes" 
  ON acaizera.clientes 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 5. Cria o Bucket de imagens e deixa público (Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. Permissões do Storage para bucket product-images
DROP POLICY IF EXISTS "Permitir leitura publica bucket" ON storage.objects;
CREATE POLICY "Permitir leitura publica bucket"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'product-images' );

DROP POLICY IF EXISTS "Permitir insert publico bucket" ON storage.objects;
CREATE POLICY "Permitir insert publico bucket"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'product-images' );

DROP POLICY IF EXISTS "Permitir update publico bucket" ON storage.objects;
CREATE POLICY "Permitir update publico bucket"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'product-images' );

DROP POLICY IF EXISTS "Permitir delete publico bucket" ON storage.objects;
CREATE POLICY "Permitir delete publico bucket"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'product-images' );
