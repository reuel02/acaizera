export default function CardCatalogo({ produto, onAdicionar }) {
  if (!produto) return null;

  return (
    <div className="flex flex-row items-stretch bg-bg-secondary min-w-full text-text-heading rounded-xl border border-border overflow-hidden hover:border-border-hover transition-colors">
      <img
        src={produto.imagem}
        alt="Imagem do produto"
        className="w-32 sm:w-40 object-cover"
      />

      <div className="flex flex-col gap-2 flex-1 py-3 px-4">
        <h2 className="text-base font-bold">{produto.nome}</h2>
        <p className="text-xs font-thin text-text-secondary">{produto.descricao}</p>
      </div>

      <div className="flex flex-col justify-center items-center gap-23 py-3 pr-4 pl-2">
        <p className="text-accent font-bold">R$ {produto.preco.toFixed(2)}</p>
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
