#!/bin/bash

# Script de Deploy no Vercel
# Uso: ./deploy.sh

echo "🚀 Iniciando deploy no Vercel..."
echo ""

# Verifica se vercel-cli está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não está instalado"
    echo "Execute: npm install -g vercel"
    exit 1
fi

# Deploy para produção
echo "📦 Deployando aplicação..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy realizado com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Acesse vercel.com/dashboard"
    echo "2. Vá em Settings > Environment Variables"
    echo "3. Adicione as variáveis:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo "   - VITE_MERCADO_PAGO_ACCESS_TOKEN"
    echo ""
    echo "4. Redeploy com: vercel --prod"
    echo ""
    echo "5. Configure webhook no Mercado Pago:"
    echo "   URL: https://seu-projeto.vercel.app/api/webhooks/mercadopago"
    echo ""
else
    echo "❌ Erro no deploy"
    exit 1
fi
