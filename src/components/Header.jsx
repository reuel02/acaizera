import { FaShoppingCart, FaCog } from "react-icons/fa";

/**
 * ================================================
 * COMPONENTE: Header
 * ================================================
 * 
 * Barra de navegação fixa no topo da página
 * 
 * FUNCIONALIDADE:
 *  - Logo/imagem da loja (Acaizera)
 *  - Botão de configurações (⚙️) para acesso admin
 *  - Botão de carrinho com badge de quantidade de itens
 *  - Sticky positioning com backdrop blur para sempre visível ao scroll
 *  - Design responsivo com espaçamento adequado
 * 
 * PROPS:
 *  - quantidadeCarrinho: number (default: 0) - Quantidade de itens no carrinho
 *  - onOpenCart: () => void - Callback ao clicar no botão de carrinho
 *  - onAcessarAdmin: () => void - Callback ao clicar no botão de settings (admin)
 * 
 * ESTADOS:
 *  Nenhum (componente puro)
 * 
 * DESIGN:
 *  - Backdrop blur (vidro) para efeito moderno
 *  - Badge redondo com quantidade no canto superior do carrinho
 *  - Ícones com hover effects para melhor UX
 * ================================================
 */

export default function Header({ quantidadeCarrinho = 0, onOpenCart, onAcessarAdmin }) {
    return (
        // Container principal: sticky no topo, flex row para distribuir logo + botões
        <header className="sticky top-0 z-50 flex flex-row items-center justify-between border-b border-border bg-bg-secondary/90 p-4 backdrop-blur-md text-text-heading">
            
            {/* ===== SEÇÃO: LOGO ===== */}
            <img 
                src="/acaizera-logo.png" 
                alt="Açaízera Logo" 
                className="size-20 scale-100 ml-7"
            />

            {/* ===== SEÇÃO: BOTÕES DE AÇÃO ===== */}
            <div className="flex items-center gap-4">
                
                {/* Botão Settings (⚙️) - Acesso ao painel admin */}
                {/* Renderizado apenas se callback foi passado */}
                {onAcessarAdmin && (
                    <button 
                        onClick={onAcessarAdmin}
                        className="p-2 hover:opacity-80 transition-opacity text-zinc-400 hover:text-purple-400"
                        title="Acessar Painel de Admin"
                    >
                        <FaCog className="size-6" />
                    </button>
                )}

                {/* ===== BOTÃO CARRINHO COM BADGE ===== */}
                {/* Container 'relative' permite posicionar o contador por cima do carrinho */}
                <div 
                    className="relative flex items-center justify-center p-2 cursor-pointer hover:opacity-80 transition-opacity" 
                    onClick={onOpenCart}
                >
                    <FaShoppingCart className="size-8" />

                    {/* Badge: mostra quantidade de itens se quantidadeCarrinho > 0 */}
                    {/* Circle redondo com sombra e borda para destaque visual */}
                    {quantidadeCarrinho > 0 && (
                        <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-brand-tag text-white text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-bg-secondary">
                            {quantidadeCarrinho}
                        </span>
                    )}
                </div>
            </div>
        </header>
    )
}