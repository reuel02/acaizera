/**
 * ================================================
 * COMPONENTE: CardCatalogo
 * ================================================
 * 
 * Exibe um card individual de produto no catálogo
 * 
 * FUNCIONALIDADE:
 *  - Mostra imagem, nome, descrição e preço
 *  - Botão "Adicionar +" para abrir modal de personalização
 *  - Layout responsivo (imagem + info + ações)
 * 
 * PROPS:
 *  - produto: { id, nome, preco, descricao, imagem, tipo, ... }
 *  - onAdicionar: () => void - Callback para adicionar ao carrinho
 * 
 * ESTADOS:
 *  Nenhum (componente puro)
 * ================================================
 */

export default function CardCatalogo({ produto, onAdicionar }) {
  // Validação: se produto não foi passado, não renderiza nada
  if (!produto) return null;

  return (
    // Container principal: linha flexível com todos os elementos
    <div className="flex flex-row items-stretch bg-bg-secondary min-w-full text-text-heading rounded-xl border border-border overflow-hidden hover:border-border-hover transition-colors">
      
      {/* ===== SEÇÃO: IMAGEM DO PRODUTO ===== */}
      <img
        src={produto.imagem}
        alt="Imagem do produto"
        className="w-32 sm:w-40 object-cover"
      />

      {/* ===== SEÇÃO: INFORMAÇÕES (Nome + Descrição) ===== */}
      <div className="flex flex-col gap-2 flex-1 py-3 px-4">
        {/* Nome do produto */}
        <h2 className="text-base font-bold">{produto.nome}</h2>
        
        {/* Descrição curta */}
        <p className="text-xs font-thin text-text-secondary">{produto.descricao}</p>
      </div>

      {/* ===== SEÇÃO: PREÇO E BOTÃO ===== */}
      <div className="flex flex-col justify-center items-center gap-23 py-3 pr-4 pl-2">
        {/* Preço formatado com 2 casas decimais */}
        <p className="text-accent font-bold">R$ {produto.preco.toFixed(2)}</p>
        
        {/* Botão para adicionar ao carrinho (abre modal de personalização) */}
        <button
          onClick={onAdicionar}
          className="bg-accent p-2 text-xs font-bold rounded-xl text-white hover:bg-accent-hover cursor-pointer transition-colors shadow-md shadow-accent-shadow"
        >
          Adicionar +
        </button>
      </div>
    </div>
  );
}
