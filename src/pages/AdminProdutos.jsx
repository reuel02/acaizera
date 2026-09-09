import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
  FaImage,
  FaBox,
} from "react-icons/fa";
import Toast from "../components/Toast";

/**
 * ================================================
 * PÁGINA: AdminProdutos (CRUD)
 * ================================================
 *
 * CRUD completo de produtos com:
 *  - Listagem paginada (20 itens/página)
 *  - Modal de criar/editar com upload de imagem (Supabase Storage)
 *  - Construtor de complementos (opcoes + limites JSONB)
 *  - Exclusão com confirmação
 *  - Toast feedback + loading states
 * ================================================
 */

const ITENS_POR_PAGINA = 20;

const TIPOS_PRODUTO = [
  { valor: "açai no copo", label: "Açaí no copo" },
  { valor: "açai na garrafa", label: "Açaí na garrafa" },
];

const CATEGORIAS_COMPLEMENTO = [
  { chave: "frutas", label: "🍓 Frutas", temPreco: false, prefixoId: "f" },
  { chave: "acompanhamentos", label: "🥣 Acompanhamentos", temPreco: false, prefixoId: "a" },
  { chave: "caldas", label: "🍯 Caldas", temPreco: false, prefixoId: "cl" },
  { chave: "turbine", label: "⚡ Turbine", temPreco: true, prefixoId: "t" },
];

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

export default function AdminProdutos() {
  // ===== ESTADOS =====
  const [produtos, setProdutos] = useState([]);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);

  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoProduto, setEditandoProduto] = useState(null); // null = novo, object = editando

  // Formulário
  const [formNome, setFormNome] = useState("");
  const [formTipo, setFormTipo] = useState("açai no copo");
  const [formPreco, setFormPreco] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formCostPrice, setFormCostPrice] = useState("");
  const [formImagem, setFormImagem] = useState(null); // File object
  const [formImagemPreview, setFormImagemPreview] = useState(""); // URL preview
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Complementos
  const [opcoes, setOpcoes] = useState({
    frutas: [],
    acompanhamentos: [],
    caldas: [],
    turbine: [],
  });
  const [limites, setLimites] = useState({
    frutas: 2,
    acompanhamentos: 2,
    caldas: 1,
  });
  const [secaoAberta, setSecaoAberta] = useState({});

  // Exclusão
  const [excluindoId, setExcluindoId] = useState(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null);

  // Toast
  const [toast, setToast] = useState({ visivel: false, mensagem: "", tipo: "sucesso" });

  const mostrarToast = (mensagem, tipo = "sucesso") => {
    setToast({ visivel: true, mensagem, tipo });
  };

  // ===== BUSCAR PRODUTOS (PAGINADO) =====
  const buscarProdutos = useCallback(async () => {
    try {
      setCarregando(true);
      const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
      const fim = inicio + ITENS_POR_PAGINA - 1;

      // Contagem total
      const { count, error: errCount } = await supabase
        .from("produtos")
        .select("id", { count: "exact", head: true });

      if (errCount) throw errCount;
      setTotalProdutos(count || 0);

      // Dados paginados
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("id", { ascending: true })
        .range(inicio, fim);

      if (error) throw error;
      setProdutos(data || []);
    } catch (erro) {
      console.error("Erro ao buscar produtos:", erro);
      mostrarToast("Erro ao carregar produtos.", "erro");
    } finally {
      setCarregando(false);
    }
  }, [paginaAtual]);

  useEffect(() => {
    buscarProdutos();
  }, [buscarProdutos]);

  const totalPaginas = Math.ceil(totalProdutos / ITENS_POR_PAGINA);

  // ===== ABRIR MODAL =====
  const abrirModalNovo = () => {
    setEditandoProduto(null);
    setFormNome("");
    setFormTipo("açai no copo");
    setFormPreco("");
    setFormDescricao("");
    setFormCostPrice("");
    setFormImagem(null);
    setFormImagemPreview("");
    setOpcoes({ frutas: [], acompanhamentos: [], caldas: [], turbine: [] });
    setLimites({ frutas: 2, acompanhamentos: 2, caldas: 1 });
    setSecaoAberta({});
    setModalAberto(true);
  };

  const abrirModalEditar = (produto) => {
    setEditandoProduto(produto);
    setFormNome(produto.nome || "");
    setFormTipo(produto.tipo || "açai no copo");
    setFormPreco(String(produto.preco || ""));
    setFormDescricao(produto.descricao || "");
    setFormCostPrice(String(produto.cost_price || ""));
    setFormImagem(null);
    setFormImagemPreview(produto.imagem || "");
    setOpcoes(produto.opcoes || { frutas: [], acompanhamentos: [], caldas: [], turbine: [] });
    setLimites(produto.limites || { frutas: 2, acompanhamentos: 2, caldas: 1 });
    setSecaoAberta({});
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditandoProduto(null);
  };

  // ===== UPLOAD DE IMAGEM =====
  const handleImagemSelecionada = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormImagem(file);
    setFormImagemPreview(URL.createObjectURL(file));
  };

  const uploadImagem = async (file) => {
    const extensao = file.name.split(".").pop();
    const nomeArquivo = `${Date.now()}_${Math.random().toString(36).slice(2)}.${extensao}`;

    setUploadProgress(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(nomeArquivo, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(nomeArquivo);

      return urlData?.publicUrl || "";
    } finally {
      setUploadProgress(false);
    }
  };

  // ===== SALVAR PRODUTO =====
  const salvarProduto = async () => {
    // Validações obrigatórias
    if (!formNome.trim()) return mostrarToast("Nome é obrigatório.", "erro");
    if (!formTipo) return mostrarToast("Tipo é obrigatório.", "erro");
    if (!formPreco || parseFloat(formPreco) <= 0) return mostrarToast("Preço deve ser maior que zero.", "erro");
    if (!formDescricao.trim()) return mostrarToast("Descrição é obrigatória.", "erro");
    if (!formImagemPreview && !formImagem) return mostrarToast("Imagem é obrigatória.", "erro");

    setSalvandoProduto(true);
    try {
      let imagemUrl = formImagemPreview;

      // Upload nova imagem se selecionada
      if (formImagem) {
        imagemUrl = await uploadImagem(formImagem);
        if (!imagemUrl) throw new Error("Falha no upload da imagem");
      }

      const payload = {
        nome: formNome.trim(),
        tipo: formTipo,
        preco: parseFloat(formPreco),
        descricao: formDescricao.trim(),
        imagem: imagemUrl,
        cost_price: formCostPrice ? parseFloat(formCostPrice) : null,
        opcoes: opcoes,
        limites: limites,
      };

      if (editandoProduto) {
        // UPDATE
        const { error } = await supabase
          .from("produtos")
          .update(payload)
          .eq("id", editandoProduto.id);

        if (error) throw error;
        mostrarToast("Produto atualizado com sucesso!");
      } else {
        // INSERT
        const { error } = await supabase
          .from("produtos")
          .insert([payload]);

        if (error) throw error;
        mostrarToast("Produto criado com sucesso!");
      }

      fecharModal();
      buscarProdutos();
    } catch (erro) {
      console.error("Erro ao salvar produto:", erro);
      mostrarToast("Erro ao salvar produto: " + erro.message, "erro");
    } finally {
      setSalvandoProduto(false);
    }
  };

  // ===== EXCLUIR PRODUTO =====
  const excluirProduto = async (id) => {
    setExcluindoId(id);
    try {
      const { error } = await supabase
        .from("produtos")
        .delete()
        .eq("id", id);

      if (error) throw error;
      mostrarToast("Produto excluído com sucesso!");
      setConfirmandoExclusao(null);
      buscarProdutos();
    } catch (erro) {
      console.error("Erro ao excluir produto:", erro);
      mostrarToast("Erro ao excluir produto.", "erro");
    } finally {
      setExcluindoId(null);
    }
  };

  // ===== CONSTRUTOR DE COMPLEMENTOS =====
  const adicionarItemComplemento = (categoria) => {
    const cat = CATEGORIAS_COMPLEMENTO.find((c) => c.chave === categoria);
    const lista = opcoes[categoria] || [];
    const novoId = `${cat.prefixoId}${Date.now()}`;
    const novoItem = { id: novoId, nome: "", preco: 0 };

    setOpcoes((prev) => ({
      ...prev,
      [categoria]: [...prev[categoria], novoItem],
    }));
  };

  const atualizarItemComplemento = (categoria, indice, campo, valor) => {
    setOpcoes((prev) => ({
      ...prev,
      [categoria]: prev[categoria].map((item, i) =>
        i === indice ? { ...item, [campo]: campo === "preco" ? parseFloat(valor) || 0 : valor } : item
      ),
    }));
  };

  const removerItemComplemento = (categoria, indice) => {
    setOpcoes((prev) => ({
      ...prev,
      [categoria]: prev[categoria].filter((_, i) => i !== indice),
    }));
  };

  const toggleSecao = (chave) => {
    setSecaoAberta((prev) => ({ ...prev, [chave]: !prev[chave] }));
  };

  // ===== RENDERIZAÇÃO =====
  if (carregando && produtos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-semibold animate-pulse">
          Carregando produtos...
        </p>
      </div>
    );
  }

  return (
    <div>
      <Toast
        mensagem={toast.mensagem}
        tipo={toast.tipo}
        visivel={toast.visivel}
        onFechar={() => setToast((t) => ({ ...t, visivel: false }))}
      />

      {/* Título + Botão Novo */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">Produtos</h1>
          <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-bold">
            {totalProdutos}
          </span>
        </div>

        <button
          onClick={abrirModalNovo}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
        >
          <FaPlus className="size-3.5" />
          Novo Produto
        </button>
      </div>

      {/* Tabela de Produtos */}
      {produtos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
          <FaBox className="size-12 opacity-30" />
          <p className="font-semibold">Nenhum produto cadastrado</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Header da tabela */}
          <div className="hidden md:grid md:grid-cols-7 gap-4 px-6 py-4 bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <span>Imagem</span>
            <span className="col-span-2">Nome</span>
            <span>Tipo</span>
            <span className="text-right">Preço</span>
            <span className="text-right">Custo</span>
            <span className="text-center">Ações</span>
          </div>

          {/* Linhas */}
          {produtos.map((produto) => (
            <div
              key={produto.id}
              className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-4 px-6 py-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors items-center"
            >
              {/* Imagem */}
              <div>
                {produto.imagem ? (
                  <img
                    src={produto.imagem}
                    alt={produto.nome}
                    className="w-12 h-12 rounded-lg object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <FaImage className="text-zinc-600 size-4" />
                  </div>
                )}
              </div>

              {/* Nome */}
              <div className="col-span-1 md:col-span-2">
                <p className="text-white font-semibold text-sm truncate">{produto.nome}</p>
                <p className="text-zinc-500 text-xs truncate">{produto.descricao}</p>
              </div>

              {/* Tipo */}
              <div>
                <span className="text-zinc-400 text-xs px-2 py-0.5 bg-zinc-800 rounded-md border border-zinc-700">
                  {produto.tipo}
                </span>
              </div>

              {/* Preço */}
              <div className="md:text-right">
                <span className="text-green-400 font-bold text-sm">
                  {formatarMoeda(produto.preco)}
                </span>
              </div>

              {/* Custo */}
              <div className="md:text-right">
                <span className="text-zinc-400 text-sm">
                  {produto.cost_price ? formatarMoeda(produto.cost_price) : "—"}
                </span>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => abrirModalEditar(produto)}
                  className="p-2 text-zinc-400 hover:text-purple-400 transition-colors cursor-pointer rounded-lg hover:bg-zinc-800"
                  title="Editar"
                >
                  <FaEdit className="size-4" />
                </button>
                {confirmandoExclusao === produto.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => excluirProduto(produto.id)}
                      disabled={excluindoId === produto.id}
                      className="px-2 py-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {excluindoId === produto.id ? "..." : "Sim"}
                    </button>
                    <button
                      onClick={() => setConfirmandoExclusao(null)}
                      className="px-2 py-1 text-xs font-bold text-zinc-400 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmandoExclusao(produto.id)}
                    className="p-2 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-zinc-800"
                    title="Excluir"
                  >
                    <FaTrash className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
              <p className="text-zinc-500 text-xs">
                Página {paginaAtual} de {totalPaginas} • {totalProdutos} produto(s)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <FaChevronLeft className="size-3.5" />
                </button>
                <button
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <FaChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL: Criar/Editar Produto ===== */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl my-8 max-h-[90vh] flex flex-col">
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
              <h2 className="text-xl font-bold text-white">
                {editandoProduto ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button
                onClick={fecharModal}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <FaTimes className="size-5" />
              </button>
            </div>

            {/* Corpo scrollável */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
              {/* Upload de Imagem */}
              <div>
                <label className="text-zinc-400 text-sm font-semibold mb-2 block">
                  Imagem do Produto *
                </label>
                <div className="flex items-center gap-4">
                  {formImagemPreview ? (
                    <img
                      src={formImagemPreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-xl object-cover border border-zinc-700"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-zinc-800 border-2 border-dashed border-zinc-700 flex items-center justify-center">
                      <FaImage className="text-zinc-600 size-8" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-300 hover:border-purple-500/50 transition-colors cursor-pointer">
                      <FaImage className="size-3.5" />
                      {formImagem ? "Trocar imagem" : "Selecionar imagem"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImagemSelecionada}
                        className="hidden"
                      />
                    </label>
                    {formImagem && (
                      <p className="text-zinc-500 text-xs truncate max-w-[200px]">{formImagem.name}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid de campos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 text-sm font-semibold">Nome *</label>
                  <input
                    type="text"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Açaí 300ml"
                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Tipo */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 text-sm font-semibold">Tipo *</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                  >
                    {TIPOS_PRODUTO.map((t) => (
                      <option key={t.valor} value={t.valor}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Preço */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 text-sm font-semibold">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPreco}
                    onChange={(e) => setFormPreco(e.target.value)}
                    placeholder="Ex: 22.90"
                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Custo (opcional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 text-sm font-semibold">
                    Custo (R$) <span className="text-zinc-600 font-normal">opcional</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    placeholder="Ex: 8.50"
                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-sm font-semibold">Descrição *</label>
                <textarea
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Ex: Potinho de cerâmica"
                  rows={2}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>

              {/* ===== CONSTRUTOR DE COMPLEMENTOS ===== */}
              <div className="border-t border-zinc-800 pt-5">
                <h3 className="text-white font-bold text-sm mb-1">
                  Complementos e Personalizações
                </h3>
                <p className="text-zinc-500 text-xs mb-4">
                  Monte as opções que o cliente poderá escolher ao personalizar este produto.
                </p>

                <div className="flex flex-col gap-3">
                  {CATEGORIAS_COMPLEMENTO.map((cat) => {
                    const itens = opcoes[cat.chave] || [];
                    const aberta = secaoAberta[cat.chave] || false;

                    return (
                      <div
                        key={cat.chave}
                        className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl overflow-hidden"
                      >
                        {/* Header da seção */}
                        <button
                          onClick={() => toggleSecao(cat.chave)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <span className="text-white text-sm font-semibold flex items-center gap-2">
                            {cat.label}
                            <span className="text-zinc-500 text-xs font-normal">
                              ({itens.length} ite{itens.length === 1 ? "m" : "ns"})
                            </span>
                          </span>
                          {aberta ? (
                            <FaChevronUp className="text-zinc-500 size-3" />
                          ) : (
                            <FaChevronDown className="text-zinc-500 size-3" />
                          )}
                        </button>

                        {/* Conteúdo expandido */}
                        {aberta && (
                          <div className="px-4 pb-4 flex flex-col gap-3 border-t border-zinc-700/50">
                            {/* Limite de seleção (não para turbine) */}
                            {cat.chave !== "turbine" && (
                              <div className="flex items-center gap-3 mt-3">
                                <label className="text-zinc-400 text-xs font-semibold">
                                  Limite de seleção:
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={limites[cat.chave] || 0}
                                  onChange={(e) =>
                                    setLimites((prev) => ({
                                      ...prev,
                                      [cat.chave]: parseInt(e.target.value) || 0,
                                    }))
                                  }
                                  className="w-16 bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-purple-500 transition-colors"
                                />
                              </div>
                            )}

                            {/* Lista de itens */}
                            {itens.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="text"
                                  value={item.nome}
                                  onChange={(e) =>
                                    atualizarItemComplemento(cat.chave, idx, "nome", e.target.value)
                                  }
                                  placeholder="Nome do item"
                                  className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                />
                                {cat.temPreco && (
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.preco || ""}
                                    onChange={(e) =>
                                      atualizarItemComplemento(cat.chave, idx, "preco", e.target.value)
                                    }
                                    placeholder="Preço"
                                    className="w-24 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                  />
                                )}
                                <button
                                  onClick={() => removerItemComplemento(cat.chave, idx)}
                                  className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                  <FaTimes className="size-3" />
                                </button>
                              </div>
                            ))}

                            {/* Botão adicionar */}
                            <button
                              onClick={() => adicionarItemComplemento(cat.chave)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer border border-dashed border-purple-500/30"
                            >
                              <FaPlus className="size-2.5" />
                              Adicionar item
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 shrink-0">
              <button
                onClick={fecharModal}
                disabled={salvandoProduto}
                className="px-5 py-2.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={salvarProduto}
                disabled={salvandoProduto || uploadProgress}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                {salvandoProduto || uploadProgress ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FaSave className="size-3.5" />
                )}
                {uploadProgress ? "Enviando imagem..." : salvandoProduto ? "Salvando..." : "Salvar Produto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
