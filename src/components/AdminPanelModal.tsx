import React, { useState } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Edit3, 
  Store, 
  Clock, 
  Image as ImageIcon, 
  Phone, 
  MapPin, 
  DollarSign, 
  Palette, 
  Copy, 
  Check, 
  Sparkles, 
  Eye, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Upload, 
  Power,
  Flame,
  Utensils,
  Share2,
  Calendar,
  ListOrdered,
  Lock,
  LogOut,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  Category, 
  DaySchedule, 
  EstablishmentInfo, 
  Product, 
  ProductExtra, 
  RegisteredOrder, 
  VisualTheme 
} from '../types';
import { formatCurrency } from '../utils';
import { initialCategories, initialEstablishmentInfo, initialProducts } from '../data/initialData';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishment: EstablishmentInfo;
  categories: Category[];
  products: Product[];
  orders: RegisteredOrder[];
  onSaveEstablishment: (info: EstablishmentInfo) => void;
  onSaveCategories: (categories: Category[]) => void;
  onSaveProducts: (products: Product[]) => void;
  onClearOrders?: () => void;
  onResetAllData: () => void;
  onLogout?: () => void;
}

type AdminTab = 'products' | 'categories' | 'establishment' | 'schedule' | 'themes' | 'orders' | 'backup';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  establishment,
  categories,
  products,
  orders,
  onSaveEstablishment,
  onSaveCategories,
  onSaveProducts,
  onClearOrders,
  onResetAllData,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [establishmentForm, setEstablishmentForm] = useState<EstablishmentInfo>({ ...establishment });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Category editing
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);

  // Success message toast inside admin
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyPublicLink = () => {
    try {
      const publicUrl = window.location.origin + window.location.pathname;
      navigator.clipboard.writeText(publicUrl);
      showToast('✓ Link público copiado com sucesso!');
    } catch {
      showToast('✓ Link: ' + window.location.origin);
    }
  };

  // --- Establishment Save ---
  const handleSaveEstablishment = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEstablishment(establishmentForm);
    showToast('✓ Dados do estabelecimento salvos com sucesso!');
  };

  // --- Product Operations ---
  const handleStartCreateProduct = () => {
    const defaultCat = categories.find((c) => c.id !== 'destaques') || categories[0];
    setEditingProduct({
      id: `prod-${Date.now()}`,
      name: '',
      categoryId: defaultCat?.id || 'sanduiches',
      categoryName: defaultCat?.name || 'Sanduíches',
      description: '',
      price: 20.0,
      originalPrice: undefined,
      isHighlight: false,
      isBestSeller: false,
      badge: '',
      image: '',
      imageType: 'illustrative',
      available: true,
      extras: [],
      allowsNotes: true,
      servingSize: 'Serve 1 pessoa',
      preparationTime: '15-20 min',
    });
    setIsProductFormOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.name.trim()) {
      alert('Informe o nome do produto');
      return;
    }

    const catObj = categories.find((c) => c.id === editingProduct.categoryId);
    const updatedProduct = {
      ...editingProduct,
      categoryName: catObj ? catObj.name : editingProduct.categoryName,
    };

    const exists = products.some((p) => p.id === updatedProduct.id);
    let newProducts: Product[];
    if (exists) {
      newProducts = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    } else {
      newProducts = [updatedProduct, ...products];
    }

    onSaveProducts(newProducts);
    setIsProductFormOpen(false);
    setEditingProduct(null);
    showToast('✓ Produto salvo com sucesso!');
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto do cardápio?')) {
      const updated = products.filter((p) => p.id !== productId);
      onSaveProducts(updated);
      showToast('✓ Produto removido!');
    }
  };

  const handleToggleProductAvailability = (productId: string) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, available: !p.available } : p
    );
    onSaveProducts(updated);
    showToast('✓ Disponibilidade atualizada!');
  };

  const handleDuplicateProduct = (prod: Product) => {
    const duplicated: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      name: `${prod.name} (Cópia)`,
    };
    onSaveProducts([duplicated, ...products]);
    showToast('✓ Produto duplicado com sucesso!');
  };

  // Add extra to editing product
  const handleAddExtraToProduct = () => {
    if (!editingProduct) return;
    const newExtra: ProductExtra = {
      id: `extra-${Date.now()}`,
      name: 'Novo Adicional',
      price: 3.0,
    };
    setEditingProduct({
      ...editingProduct,
      extras: [...(editingProduct.extras || []), newExtra],
    });
  };

  const handleUpdateProductExtra = (extraId: string, name: string, price: number) => {
    if (!editingProduct) return;
    const updated = (editingProduct.extras || []).map((e) =>
      e.id === extraId ? { ...e, name, price } : e
    );
    setEditingProduct({ ...editingProduct, extras: updated });
  };

  const handleRemoveProductExtra = (extraId: string) => {
    if (!editingProduct) return;
    const updated = (editingProduct.extras || []).filter((e) => e.id !== extraId);
    setEditingProduct({ ...editingProduct, extras: updated });
  };

  // --- Category Operations ---
  const handleStartCreateCategory = () => {
    setEditingCategory({
      id: `cat-${Date.now()}`,
      name: '',
      icon: '🍔',
      description: '',
      order: categories.length,
    });
    setIsCategoryFormOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    const exists = categories.some((c) => c.id === editingCategory.id);
    let updatedCategories: Category[];
    if (exists) {
      updatedCategories = categories.map((c) =>
        c.id === editingCategory.id ? editingCategory : c
      );
    } else {
      updatedCategories = [...categories, editingCategory];
    }

    onSaveCategories(updatedCategories);
    setIsCategoryFormOpen(false);
    setEditingCategory(null);
    showToast('✓ Categoria salva!');
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (categoryId === 'destaques') {
      alert('A categoria Destaques não pode ser excluída.');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir esta categoria? Os produtos vinculados precisarão de uma nova categoria.')) {
      const updated = categories.filter((c) => c.id !== categoryId);
      onSaveCategories(updated);
      showToast('✓ Categoria removida!');
    }
  };

  // --- Backup Export / Import ---
  const handleExportBackup = () => {
    const backupData = {
      establishment: establishmentForm,
      categories,
      products,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardapio-${establishmentForm.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Backup baixado com sucesso!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.establishment && data.categories && data.products) {
          onSaveEstablishment(data.establishment);
          setEstablishmentForm(data.establishment);
          onSaveCategories(data.categories);
          onSaveProducts(data.products);
          showToast('✓ Cardápio restaurado do arquivo!');
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao ler arquivo de backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Filtered products inside admin
  const adminFilteredProducts = products.filter((p) => {
    const matchesSearch =
      !productSearchQuery.trim() ||
      p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(productSearchQuery.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === 'all' || p.categoryId === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div
      id="admin-panel-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="admin-panel-modal"
        className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl h-[92vh] max-h-[850px] overflow-hidden shadow-2xl flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Admin Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-amber-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-base sm:text-lg text-white">
                  Painel de Gestão do Estabelecimento
                </h2>
                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Comercial
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gerencie produtos, categorias, preços, horários, WhatsApp e dados da loja
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {toastMessage && (
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/40 hidden sm:inline-block font-semibold">
                {toastMessage}
              </span>
            )}

            <button
              id="btn-admin-copy-public-link"
              type="button"
              onClick={handleCopyPublicLink}
              className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-zinc-700/60 cursor-pointer"
              title="Copiar link público para divulgar para clientes"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copiar Link do Cardápio</span>
            </button>

            <button
              id="btn-admin-view-as-client"
              type="button"
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-zinc-700/60 cursor-pointer"
              title="Fechar painel e visualizar cardápio do cliente"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver como Cliente</span>
            </button>

            {onLogout && (
              <button
                id="btn-admin-logout"
                type="button"
                onClick={onLogout}
                className="bg-zinc-800 hover:bg-rose-950/70 text-zinc-400 hover:text-rose-400 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-zinc-700/60 cursor-pointer"
                title="Desconectar do painel administrativo"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}

            <button
              id="btn-close-admin-panel"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar painel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-zinc-950/80 border-b border-zinc-800/80 px-3 sm:px-4 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0 py-2 scrollbar-none">
          <button
            type="button"
            onClick={() => { setActiveTab('products'); setIsProductFormOpen(false); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Produtos ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('categories'); setIsCategoryFormOpen(false); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Categorias ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('establishment')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'establishment'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Dados da Loja</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Horários & Status</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('themes')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Modelos Visuais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Pedidos ({orders?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup & Reset</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ================= PRODUCTS TAB ================= */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {isProductFormOpen && editingProduct ? (
                /* Product Edit/Create Form */
                <form onSubmit={handleSaveProduct} className="space-y-4 bg-zinc-950/70 p-4 sm:p-5 rounded-2xl border border-zinc-800">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-amber-400" />
                      <span>{editingProduct.id.startsWith('prod-') && !products.some(p => p.id === editingProduct.id) ? 'Novo Produto' : 'Editar Produto'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsProductFormOpen(false)}
                      className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Nome do Produto *
                      </label>
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        placeholder="Ex: BIG DOIS IRMÃOS"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Categoria *
                      </label>
                      <select
                        value={editingProduct.categoryId}
                        onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                      >
                        {categories.filter(c => c.id !== 'destaques').map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Price & Promo */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-bold text-amber-400 block mb-1">
                        Preço Atual (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 block mb-1">
                        Preço Original / De (R$)
                      </label>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={editingProduct.originalPrice || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="Ex: 36.00"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Etiqueta / Destaque
                      </label>
                      <input
                        type="text"
                        value={editingProduct.badge || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                        placeholder="Ex: Mais Pedido, Oferta"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Tempo de Preparo
                      </label>
                      <input
                        type="text"
                        value={editingProduct.preparationTime || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, preparationTime: e.target.value })}
                        placeholder="Ex: 15-20 min"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Descrição & Ingredientes
                    </label>
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      placeholder="Descreva detalhadamente o lanche, pão, queijo, carnes, molho e complementos..."
                      rows={3}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl p-3 text-xs sm:text-sm text-white outline-none"
                    />
                  </div>

                  {/* Photo URL & Image Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        URL da Foto do Produto
                      </label>
                      <input
                        type="url"
                        value={editingProduct.image}
                        onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Insira o link da foto real ou deixe em branco para usar ícone neutro.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Tipo de Imagem
                      </label>
                      <select
                        value={editingProduct.imageType || 'illustrative'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, imageType: e.target.value as any })}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="real">Fotografia Real do Estabelecimento</option>
                        <option value="illustrative">Imagem Ilustrativa / Demonstração</option>
                        <option value="placeholder">Sem foto (Placeholder Neutro)</option>
                      </select>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.available}
                        onChange={(e) => setEditingProduct({ ...editingProduct, available: e.target.checked })}
                        className="rounded accent-emerald-500 w-4 h-4"
                      />
                      <span className="font-bold">Item Disponível para Pedidos</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.isHighlight || false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isHighlight: e.target.checked })}
                        className="rounded accent-amber-500 w-4 h-4"
                      />
                      <span>Destacar na Página Inicial</span>
                    </label>
                  </div>

                  {/* Extras Section inside product editor */}
                  <div className="space-y-2 pt-3 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-300">
                        Adicionais & Opcionais para este Produto
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddExtraToProduct}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-amber-400 px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar Adicional</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(editingProduct.extras || []).map((extra) => (
                        <div key={extra.id} className="flex items-center gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                          <input
                            type="text"
                            value={extra.name}
                            onChange={(e) => handleUpdateProductExtra(extra.id, e.target.value, extra.price)}
                            placeholder="Nome do adicional (ex: Bacon Extra)"
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-zinc-500">R$</span>
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              value={extra.price}
                              onChange={(e) => handleUpdateProductExtra(extra.id, extra.name, parseFloat(e.target.value) || 0)}
                              className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-bold outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveProductExtra(extra.id)}
                            className="text-zinc-500 hover:text-rose-400 p-1.5 rounded hover:bg-zinc-800"
                            title="Remover adicional"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setIsProductFormOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar Produto</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Products List View */
                <div className="space-y-3">
                  {/* Top Bar: Search, Category Filter, and Add Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        placeholder="Pesquisar produto..."
                        className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none"
                      >
                        <option value="all">Todas as Categorias</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartCreateProduct}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Adicionar Novo Produto</span>
                    </button>
                  </div>

                  {/* Products Table/List */}
                  <div className="space-y-2">
                    {adminFilteredProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className={`bg-zinc-950/70 border rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                          prod.available ? 'border-zinc-800' : 'border-rose-900/40 bg-rose-950/10 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-lg object-cover bg-zinc-900 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-600 shrink-0">
                              <Utensils className="w-5 h-5 text-amber-500/40" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-white truncate">
                                {prod.name}
                              </h4>
                              {prod.badge && (
                                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  {prod.badge}
                                </span>
                              )}
                              {!prod.available && (
                                <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  Esgotado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                              <span className="text-amber-400 font-extrabold">{formatCurrency(prod.price)}</span>
                              <span>•</span>
                              <span className="truncate">{prod.categoryName}</span>
                              {prod.extras && prod.extras.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{prod.extras.length} adicionais</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleProductAvailability(prod.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              prod.available
                                ? 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80 border border-emerald-800/50'
                                : 'bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 border border-rose-800/50'
                            }`}
                            title="Alternar disponibilidade"
                          >
                            {prod.available ? 'Disponível' : 'Esgotado'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateProduct(prod)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Duplicar produto"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct({ ...prod });
                              setIsProductFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 transition-colors cursor-pointer"
                            title="Editar produto"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Excluir produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {adminFilteredProducts.length === 0 && (
                      <div className="text-center py-8 text-xs text-zinc-500 bg-zinc-950/40 rounded-xl">
                        Nenhum produto encontrado com os filtros selecionados.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= CATEGORIES TAB ================= */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              {isCategoryFormOpen && editingCategory ? (
                <form onSubmit={handleSaveCategory} className="space-y-3 bg-zinc-950/70 p-4 sm:p-5 rounded-2xl border border-zinc-800">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h3 className="font-bold text-white text-sm">
                      {categories.some(c => c.id === editingCategory.id) ? 'Editar Categoria' : 'Nova Categoria'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsCategoryFormOpen(false)}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Ícone / Emoji
                      </label>
                      <input
                        type="text"
                        value={editingCategory.icon}
                        onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                        placeholder="🍔 ou 🌭"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-center text-lg outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Nome da Categoria *
                      </label>
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        placeholder="Ex: Hambúrgueres Artesanais"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Descrição da Categoria (Opcional)
                    </label>
                    <input
                      type="text"
                      value={editingCategory.description || ''}
                      onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                      placeholder="Ex: Preparados com pão fresco e carnes selecionadas"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCategoryFormOpen(false)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-xs font-bold"
                    >
                      Salvar Categoria
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-400">
                      Organize os grupos do seu cardápio como os clientes verão no menu:
                    </p>
                    <button
                      type="button"
                      onClick={handleStartCreateCategory}
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nova Categoria</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {categories.map((cat, index) => {
                      const count = products.filter(p => p.categoryId === cat.id).length;
                      return (
                        <div
                          key={cat.id}
                          className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl shrink-0">{cat.icon}</span>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-white truncate">
                                {cat.name}
                              </h4>
                              <p className="text-xs text-zinc-500 truncate">
                                {cat.description || `${count} produtos nesta categoria`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md">
                              {count} itens
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory({ ...cat });
                                setIsCategoryFormOpen(true);
                              }}
                              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 rounded-lg"
                              title="Editar categoria"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {cat.id !== 'destaques' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 rounded-lg"
                                title="Excluir categoria"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= ESTABLISHMENT TAB ================= */}
          {activeTab === 'establishment' && (
            <form onSubmit={handleSaveEstablishment} className="space-y-5">
              {/* Brand & Slogan */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-400" />
                  <span>Identidade & Marca</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Nome do Estabelecimento *
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.name}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, name: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Slogan / Frase de Impacto *
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.subtitle}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, subtitle: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    URL da Logomarca (Opcional)
                  </label>
                  <input
                    type="url"
                    value={establishmentForm.logoUrl || ''}
                    onChange={(e) => setEstablishmentForm({ ...establishmentForm, logoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Contacts & Social */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp & Redes Sociais</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-emerald-400 block mb-1">
                      WhatsApp de Recebimento *
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.whatsapp}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, whatsapp: e.target.value })}
                      placeholder="5582999999999"
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                      required
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">DDI + DDD + Número (apenas dígitos)</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-pink-400 block mb-1">
                      Instagram da Loja
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.instagram}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, instagram: e.target.value })}
                      placeholder="@lanchonetedoisirmaos"
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Telefone Fixo / Adicional
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.phone}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, phone: e.target.value })}
                      placeholder="(82) 99999-9999"
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Google Maps */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  <span>Localização & Endereço</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.city}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, city: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Estado (UF) *
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.state}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, state: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.neighborhood}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, neighborhood: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Endereço Completo *
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.address}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, address: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-400 block mb-1">
                      Link do Google Maps (Como Chegar)
                    </label>
                    <input
                      type="url"
                      value={establishmentForm.mapsUrl}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, mapsUrl: e.target.value })}
                      placeholder="https://maps.google.com/..."
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery & Rates */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Taxas de Entrega & Pagamento PIX</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Taxa de Entrega (R$)
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={establishmentForm.deliveryFee}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, deliveryFee: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-400 block mb-1">
                      Frete Grátis Acima de (R$)
                    </label>
                    <input
                      type="number"
                      step="5.00"
                      min="0"
                      value={establishmentForm.freeDeliveryAbove || ''}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, freeDeliveryAbove: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="Ex: 80.00"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Pedido Mínimo (R$)
                    </label>
                    <input
                      type="number"
                      step="1.00"
                      min="0"
                      value={establishmentForm.minimumOrder}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, minimumOrder: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Tempo Estimado Delivery
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.deliveryEstimate}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, deliveryEstimate: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-emerald-400 block mb-1">
                      Chave PIX da Loja
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.pixKey}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, pixKey: e.target.value })}
                      placeholder="CPF, CNPJ, E-mail ou Telefone"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Tipo de Chave PIX
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.pixKeyType}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, pixKeyType: e.target.value })}
                      placeholder="Ex: CNPJ / E-mail"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Nome do Favorecido PIX
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.pixBeneficiary}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, pixBeneficiary: e.target.value })}
                      placeholder="Nome do titular ou razão social"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Security & Access Protection */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Segurança & Senha de Acesso Administrativo</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      PIN / Senha de Administrador (para acessar este painel)
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.adminPin || '1234'}
                      onChange={(e) => setEstablishmentForm({ ...establishmentForm, adminPin: e.target.value })}
                      placeholder="Ex: 1234 ou sua senha"
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Essa senha protege o painel de alterações não autorizadas. O padrão é 1234.
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80 text-xs text-zinc-400 space-y-1.5 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Separação de Acesso Cliente vs. Lojista</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Clientes que acessam o link principal visualizam exclusivamente o cardápio, produtos, fotos, carrinho e pedidos. Eles não têm acesso ao painel de gestão.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Dados do Estabelecimento</span>
                </button>
              </div>
            </form>
          )}

          {/* ================= SCHEDULE TAB ================= */}
          {activeTab === 'schedule' && (
            <div className="space-y-5">
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Modo de Operação do Cardápio</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...establishmentForm, statusMode: 'auto' as const };
                      setEstablishmentForm(updated);
                      onSaveEstablishment(updated);
                      showToast('✓ Modo Automático ativado');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      establishmentForm.statusMode === 'auto'
                        ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="block text-xs text-amber-400 font-bold mb-1">⏱️ Automático</span>
                    <span className="text-[11px]">Abre e fecha baseado na grade de horários semanal.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...establishmentForm, statusMode: 'forced_open' as const };
                      setEstablishmentForm(updated);
                      onSaveEstablishment(updated);
                      showToast('✓ Forçar Aberto ativado');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      establishmentForm.statusMode === 'forced_open'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="block text-xs text-emerald-400 font-bold mb-1">🟢 Forçar Aberto</span>
                    <span className="text-[11px]">Mantém o cardápio sempre aberto agora para pedidos.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...establishmentForm, statusMode: 'forced_closed' as const };
                      setEstablishmentForm(updated);
                      onSaveEstablishment(updated);
                      showToast('✓ Forçar Fechado ativado');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      establishmentForm.statusMode === 'forced_closed'
                        ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="block text-xs text-rose-400 font-bold mb-1">🔴 Forçar Fechado</span>
                    <span className="text-[11px]">Pausa temporariamente o recebimento de pedidos.</span>
                  </button>
                </div>
              </div>

              {/* Weekly schedule table */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-sm text-white">
                  Horário de Funcionamento Semanal
                </h3>

                <div className="space-y-2">
                  {establishmentForm.schedule.map((item, idx) => (
                    <div
                      key={item.dayOfWeek}
                      className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3 w-36">
                        <input
                          type="checkbox"
                          checked={item.isOpen}
                          onChange={(e) => {
                            const newSched = [...establishmentForm.schedule];
                            newSched[idx] = { ...item, isOpen: e.target.checked };
                            const updated = { ...establishmentForm, schedule: newSched };
                            setEstablishmentForm(updated);
                            onSaveEstablishment(updated);
                          }}
                          className="accent-amber-500 rounded w-4 h-4 cursor-pointer"
                        />
                        <span className={`text-xs font-bold ${item.isOpen ? 'text-white' : 'text-zinc-500 line-through'}`}>
                          {item.dayLabel}
                        </span>
                      </div>

                      {item.isOpen ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-zinc-400">Das:</span>
                          <input
                            type="time"
                            value={item.openTime}
                            onChange={(e) => {
                              const newSched = [...establishmentForm.schedule];
                              newSched[idx] = { ...item, openTime: e.target.value };
                              const updated = { ...establishmentForm, schedule: newSched };
                              setEstablishmentForm(updated);
                              onSaveEstablishment(updated);
                            }}
                            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                          />
                          <span className="text-zinc-400">às:</span>
                          <input
                            type="time"
                            value={item.closeTime}
                            onChange={(e) => {
                              const newSched = [...establishmentForm.schedule];
                              newSched[idx] = { ...item, closeTime: e.target.value };
                              const updated = { ...establishmentForm, schedule: newSched };
                              setEstablishmentForm(updated);
                              onSaveEstablishment(updated);
                            }}
                            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500 italic">Fechado o dia todo</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= THEMES TAB ================= */}
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Selecione o modelo visual do cardápio para combinar com a identidade visual do restaurante:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Theme 1: Dark Amber */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...establishmentForm, visualTheme: 'dark-amber' as VisualTheme };
                    setEstablishmentForm(updated);
                    onSaveEstablishment(updated);
                    showToast('✓ Tema Dark Âmbar aplicado!');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    establishmentForm.visualTheme === 'dark-amber'
                      ? 'bg-amber-500/20 border-amber-500 shadow-xl ring-2 ring-amber-500/30'
                      : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-black text-sm text-amber-400">
                      🍔 Dark Âmbar (Burger House)
                    </span>
                    {establishmentForm.visualTheme === 'dark-amber' && (
                      <span className="text-[10px] bg-amber-500 text-zinc-950 font-black px-2 py-0.5 rounded-full">
                        Ativo
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-700" />
                    <span className="w-6 h-6 rounded-full bg-amber-500" />
                    <span className="w-6 h-6 rounded-full bg-orange-600" />
                  </div>
                  <p className="text-xs text-zinc-400">
                    Estilo hamburgueria artesanal sofisticada, com contrastes escuros e toques dourados quentes.
                  </p>
                </button>

                {/* Theme 2: Vibrant Orange */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...establishmentForm, visualTheme: 'vibrant-orange' as VisualTheme };
                    setEstablishmentForm(updated);
                    onSaveEstablishment(updated);
                    showToast('✓ Tema Vibrante Laranja aplicado!');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    establishmentForm.visualTheme === 'vibrant-orange'
                      ? 'bg-orange-500/20 border-orange-500 shadow-xl ring-2 ring-orange-500/30'
                      : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-black text-sm text-orange-400">
                      🔥 Vibrante & Flame (Laranja & Vermelho)
                    </span>
                    {establishmentForm.visualTheme === 'vibrant-orange' && (
                      <span className="text-[10px] bg-orange-500 text-zinc-950 font-black px-2 py-0.5 rounded-full">
                        Ativo
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-700" />
                    <span className="w-6 h-6 rounded-full bg-orange-500" />
                    <span className="w-6 h-6 rounded-full bg-red-600" />
                  </div>
                  <p className="text-xs text-zinc-400">
                    Energético, apetitoso e de alta conversão, ideal para fast-food, lanches e combos.
                  </p>
                </button>

                {/* Theme 3: Dark Emerald */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...establishmentForm, visualTheme: 'dark-emerald' as VisualTheme };
                    setEstablishmentForm(updated);
                    onSaveEstablishment(updated);
                    showToast('✓ Tema Dark Emerald aplicado!');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    establishmentForm.visualTheme === 'dark-emerald'
                      ? 'bg-emerald-500/20 border-emerald-500 shadow-xl ring-2 ring-emerald-500/30'
                      : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-black text-sm text-emerald-400">
                      🍃 Dark Emerald & Teal (Moderno)
                    </span>
                    {establishmentForm.visualTheme === 'dark-emerald' && (
                      <span className="text-[10px] bg-emerald-500 text-zinc-950 font-black px-2 py-0.5 rounded-full">
                        Ativo
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-700" />
                    <span className="w-6 h-6 rounded-full bg-emerald-500" />
                    <span className="w-6 h-6 rounded-full bg-teal-600" />
                  </div>
                  <p className="text-xs text-zinc-400">
                    Visual moderno, clean e tecnológico, transmitindo frescor e qualidade.
                  </p>
                </button>

                {/* Theme 4: Clean Light */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...establishmentForm, visualTheme: 'clean-light' as VisualTheme };
                    setEstablishmentForm(updated);
                    onSaveEstablishment(updated);
                    showToast('✓ Tema Clean Gourmet aplicado!');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    establishmentForm.visualTheme === 'clean-light'
                      ? 'bg-amber-500/20 border-amber-500 shadow-xl ring-2 ring-amber-500/30'
                      : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-black text-sm text-zinc-200">
                      ✨ Clean Gourmet (Claro & Elegante)
                    </span>
                    {establishmentForm.visualTheme === 'clean-light' && (
                      <span className="text-[10px] bg-amber-500 text-zinc-950 font-black px-2 py-0.5 rounded-full">
                        Ativo
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-white border border-zinc-400" />
                    <span className="w-6 h-6 rounded-full bg-amber-600" />
                    <span className="w-6 h-6 rounded-full bg-zinc-800" />
                  </div>
                  <p className="text-xs text-zinc-400">
                    Fundo claro com tipografia requintada para confeitarias, bistrôs e restaurantes contemporâneos.
                  </p>
                </button>
              </div>

              {/* Demo Mode Toggle */}
              <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between mt-4">
                <div>
                  <span className="font-bold text-sm text-white block">
                    Modo Demonstração Comercial
                  </span>
                  <p className="text-xs text-zinc-400">
                    Mostra o cabeçalho superior identificando a versão de apresentação para proprietários.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...establishmentForm, isDemoMode: !establishmentForm.isDemoMode };
                    setEstablishmentForm(updated);
                    onSaveEstablishment(updated);
                    showToast(updated.isDemoMode ? '✓ Modo Demonstração Ativado' : '✓ Modo Produção Ativado');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    establishmentForm.isDemoMode
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {establishmentForm.isDemoMode ? 'Ativo (Demonstração)' : 'Desativado (Oficial)'}
                </button>
              </div>
            </div>
          )}

          {/* ================= ORDERS TAB ================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Histórico de Pedidos Registrados
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Pedidos enviados através deste navegador via WhatsApp:
                  </p>
                </div>

                {orders && orders.length > 0 && onClearOrders && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Deseja limpar o histórico de pedidos deste navegador?')) {
                        onClearOrders();
                      }
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800"
                  >
                    Limpar Histórico
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {orders && orders.length > 0 ? (
                  orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">{ord.id}</span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-zinc-300 font-bold">{ord.customerName}</span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-zinc-400">{ord.createdAt}</span>
                        </div>
                        <p className="text-zinc-400">{ord.itemsSummary}</p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="font-display font-black text-sm text-amber-400">
                          {formatCurrency(ord.total)}
                        </span>
                        <span className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-emerald-800/60">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-zinc-500 text-xs bg-zinc-950/40 rounded-xl">
                    Nenhum pedido foi enviado nesta sessão ainda. Ao finalizar uma compra no carrinho, o pedido aparecerá aqui.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= BACKUP & RESET TAB ================= */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Exportar / Importar Backup do Cardápio</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Salve todo o cardápio (produtos, adicionais, categorias, preços e dados) em um arquivo JSON para restaurar ou transferir para outro restaurante.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer border border-zinc-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Arquivo de Backup (.JSON)</span>
                  </button>

                  <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer border border-zinc-700">
                    <Upload className="w-4 h-4" />
                    <span>Importar Backup (.JSON)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset to Dois Irmãos reference */}
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <h3 className="font-bold text-sm text-rose-400 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Restaurar Demonstração Inicial (Lanchonete Dois Irmãos)</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Recarrega todos os produtos, preços originais, fotos e horários padrão da Lanchonete Dois Irmãos de Arapiraca - AL.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Tem certeza? Isso substituirá os dados atuais pelos dados originais de demonstração da Lanchonete Dois Irmãos.')) {
                        onResetAllData();
                        setEstablishmentForm(initialEstablishmentInfo);
                        showToast('✓ Dados restaurados para o padrão Dois Irmãos!');
                      }
                    }}
                    className="bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                  >
                    Restaurar Padrão de Demonstração
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
