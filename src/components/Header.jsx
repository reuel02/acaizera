import { FaShoppingCart } from "react-icons/fa";

export default function Header({ quantidadeCarrinho = 0, onOpenCart }) {
    return (
        <header className="sticky top-0 z-50 flex flex-row items-center justify-between border-b border-border bg-bg-secondary/90 p-4 backdrop-blur-md text-text-heading">
            <img src="/acaizera-logo.png" alt="Açaízera Logo" className="size-20 scale-100 ml-7" />

            {/* Container 'relative' permite posicionar o contador por cima do carrinho */}
            <div className="relative mr-7 flex items-center justify-center p-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={onOpenCart}>
                <FaShoppingCart className="size-8" />

                {/* Se existir algum item, mostra a bolinha com o valor total */}
                {quantidadeCarrinho > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-brand-tag text-white text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-bg-secondary">
                        {quantidadeCarrinho}
                    </span>
                )}
            </div>
        </header>
    )
}