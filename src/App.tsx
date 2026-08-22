import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Flame, 
  Search, 
  Sparkles, 
  Check, 
  ArrowRight,
  SlidersHorizontal,
  Utensils
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, CartItemExtra, Category, EstablishmentInfo, Product, RegisteredOrder } from './types';
import { initialCategories, initialEstablishmentInfo, initialProducts } from './data/initialData';
import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { HighlightSection } from './components/HighlightSection';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Footer } from './components/Footer';
import { formatCurrency, getThemeConfig, calculateCartSubtotal, calculateItemTotal } from './utils';

export default function App() {
  // 1. Establishment Info Persistence
  const [establishment, setEstablishment] = useState<EstablishmentInfo>(() => {
    const saved = localStorage.getItem('dois_irmaos_establishment_info');
    if (saved) {
      try {
        return { ...initialEstablishmentInfo, ...JSON.parse(saved) };
      } catch {
        return initialEstablishmentInfo;
      }
    }
    return initialEstablishmentInfo;
  });

  // 2. Categories Persistence
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('dois_irmaos_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialCategories;
      }
    }
    return initialCategories;
  });

  // 3. Products Persistence
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('dois_irmaos_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialProducts;
      }
    }
    return initialProducts;
  });

  // 4. Cart Persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('dois_irmaos_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // 5. Orders History Persistence
  const [orders, setOrders] = useState<RegisteredOrder[]>(() => {
    const saved = localStorage.getItem('dois_irmaos_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // UI States
  const [activeCategoryId, setActiveCategoryId] = useState<string>('destaques');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Security & Admin States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return (
      localStorage.getItem('dois_irmaos_admin_auth') === 'true' ||
      sessionStorage.getItem('dois_irmaos_admin_auth') === 'true'
    );
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Detect ?admin or #admin in URL to open admin flow
  useEffect(() => {
    const checkUrlForAdmin = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        if (params.has('admin') || hash === '#admin') {
          if (isAdminAuthenticated) {
            setIsAdminOpen(true);
          } else {
            setIsAdminLoginOpen(true);
          }
        }
      } catch (e) {
        console.error('Error checking admin URL:', e);
      }
    };

    checkUrlForAdmin();
    window.addEventListener('popstate', checkUrlForAdmin);
    return () => window.removeEventListener('popstate', checkUrlForAdmin);
  }, [isAdminAuthenticated]);

  // Admin access handlers
  const handleOpenAdminTrigger = () => {
    if (isAdminAuthenticated) {
      setIsAdminOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = (rememberMe: boolean) => {
    setIsAdminAuthenticated(true);
    if (rememberMe) {
      localStorage.setItem('dois_irmaos_admin_auth', 'true');
    } else {
      sessionStorage.setItem('dois_irmaos_admin_auth', 'true');
    }
    setIsAdminLoginOpen(false);
    setIsAdminOpen(true);
    showToast('✓ Acesso administrativo autorizado!');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('dois_irmaos_admin_auth');
    sessionStorage.removeItem('dois_irmaos_admin_auth');
    setIsAdminOpen(false);
    setIsAdminLoginOpen(false);
    
    // Clean URL
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      if (url.hash === '#admin') url.hash = '';
      window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
    } catch (e) {
      console.error(e);
    }
    showToast('✓ Sessão administrativa encerrada');
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('admin') || url.hash === '#admin') {
        url.searchParams.delete('admin');
        if (url.hash === '#admin') url.hash = '';
        window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseAdminLogin = () => {
    setIsAdminLoginOpen(false);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('admin') || url.hash === '#admin') {
        url.searchParams.delete('admin');
        if (url.hash === '#admin') url.hash = '';
        window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('dois_irmaos_establishment_info', JSON.stringify(establishment));
  }, [establishment]);

  useEffect(() => {
    localStorage.setItem('dois_irmaos_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('dois_irmaos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('dois_irmaos_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('dois_irmaos_orders', JSON.stringify(orders));
  }, [orders]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        (p.badge && p.badge.toLowerCase().includes(q))
    );
  }, [searchQuery, products]);

  // Products by Category
  const productsByCategory = useMemo(() => {
    const map: Record<string, Product[]> = {};
    categories.forEach((cat) => {
      if (cat.id === 'destaques') {
        map[cat.id] = filteredProducts.filter((p) => p.isHighlight);
      } else {
        map[cat.id] = filteredProducts.filter((p) => p.categoryId === cat.id);
      }
    });
    return map;
  }, [filteredProducts, categories]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      if (cat.id === 'destaques') {
        counts[cat.id] = products.filter((p) => p.isHighlight && p.available !== false).length;
      } else {
        counts[cat.id] = products.filter((p) => p.categoryId === cat.id && p.available !== false).length;
      }
    });
    return counts;
  }, [categories, products]);

  // Flagship Highlights
  const highlightItems = useMemo(() => {
    return products.filter((p) => p.isHighlight && p.available !== false);
  }, [products]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartValue = calculateCartSubtotal(cart);

  // Cart operations
  const handleAddToCart = (
    product: Product,
    quantity: number,
    selectedExtras: CartItemExtra[],
    notes: string
  ) => {
    const itemTotal = calculateItemTotal(product.price, selectedExtras, quantity);
    const cartItemId = `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newItem: CartItem = {
      cartItemId,
      product,
      quantity,
      selectedExtras,
      notes,
      itemTotal,
    };

    setCart((prev) => [...prev, newItem]);
    showToast(`✓ ${quantity}x "${product.name}" adicionado à sacola!`);

    try {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.85 },
      });
    } catch {
      // ignore
    }
  };

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.extras && product.extras.length > 0) {
      setSelectedProduct(product);
      setIsProductModalOpen(true);
    } else {
      handleAddToCart(product, 1, [], '');
    }
  };

  const handleUpdateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const itemTotal = calculateItemTotal(item.product.price, item.selectedExtras, newQty);
          return {
            ...item,
            quantity: newQty,
            itemTotal,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    if (window.confirm('Tem certeza que deseja limpar sua sacola?')) {
      setCart([]);
    }
  };

  const handleOrderCompleted = (newOrder: RegisteredOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
  };

  const handleResetAllData = () => {
    setEstablishment(initialEstablishmentInfo);
    setCategories(initialCategories);
    setProducts(initialProducts);
    setCart([]);
    localStorage.removeItem('dois_irmaos_establishment_info');
    localStorage.removeItem('dois_irmaos_categories');
    localStorage.removeItem('dois_irmaos_products');
    localStorage.removeItem('dois_irmaos_cart');
    showToast('✓ Cardápio restaurado para o padrão original!');
  };

  const handleSelectCategory = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    const section = document.getElementById(`category-section-${categoryId}`);
    if (section) {
      const yOffset = -125;
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    } else if (categoryId === 'destaques') {
      const destaquesSection = document.getElementById('destaques-section');
      if (destaquesSection) {
        const yOffset = -125;
        const y = destaquesSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  const handleScrollToMenu = () => {
    const menuEl = document.getElementById('menu-content-area');
    if (menuEl) {
      const yOffset = -125;
      const y = menuEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const theme = getThemeConfig(establishment.visualTheme);

  return (
    <div 
      id="app-container" 
      className={`min-h-screen ${theme.bg} text-zinc-100 flex flex-col relative selection:bg-amber-500 selection:text-zinc-950`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="toast-notification"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-zinc-950 font-black px-4 py-2 rounded-2xl shadow-2xl text-xs sm:text-sm flex items-center gap-2 animate-bounce border border-emerald-400"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        establishment={establishment}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        isAdminLoggedIn={isAdminAuthenticated}
        onOpenAdmin={handleOpenAdminTrigger}
        onLogoutAdmin={handleAdminLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onScrollToMenu={handleScrollToMenu}
      />

      {/* Sticky Category Pills Navigation */}
      <CategoryNav
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={handleSelectCategory}
        categoryCounts={categoryCounts}
      />

      {/* Main Content Area */}
      <main id="menu-content-area" className="flex-1 pb-16">
        {/* If no search query, show Flagship Highlights */}
        {!searchQuery && highlightItems.length > 0 && (
          <HighlightSection
            products={highlightItems}
            onOpenProductModal={(p) => {
              setSelectedProduct(p);
              setIsProductModalOpen(true);
            }}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {/* Categories & Product Cards */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 space-y-8 mt-4">
          {categories
            .filter((cat) => cat.id !== 'destaques')
            .map((cat) => {
              const catProducts = productsByCategory[cat.id] || [];
              if (catProducts.length === 0 && searchQuery) return null;

              return (
                <section
                  key={cat.id}
                  id={`category-section-${cat.id}`}
                  className="scroll-mt-32 space-y-3"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <h3 className="font-display text-base sm:text-xl font-extrabold text-white">
                          {cat.name}
                        </h3>
                        <span className="bg-zinc-900 text-zinc-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-zinc-800">
                          {catProducts.length}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-zinc-400 mt-0.5">{cat.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Products Grid: Mobile 1 column, Tablet/Desktop 2 columns */}
                  {catProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {catProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onOpenProductModal={(p) => {
                            setSelectedProduct(p);
                            setIsProductModalOpen(true);
                          }}
                          onQuickAdd={handleQuickAdd}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-zinc-900/40 rounded-xl p-4 text-center text-xs text-zinc-500 border border-zinc-800/50">
                      Nenhum item cadastrado nesta categoria no momento.
                    </div>
                  )}
                </section>
              );
            })}

          {/* Search 0 items fallback */}
          {searchQuery && filteredProducts.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mx-auto mb-3">
                <Search className="w-8 h-8" />
              </div>
              <h4 className="font-display font-bold text-lg text-white">
                Nenhum produto encontrado
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
                Não encontramos itens correspondentes a "<strong>{searchQuery}</strong>". Tente buscar por "Big", "Lasanha", "Combo" ou "Bebida".
              </p>
              <button
                id="btn-reset-search"
                onClick={() => setSearchQuery('')}
                className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Limpar busca e ver cardápio completo
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar (Prominent on Mobile) */}
      {totalCartCount > 0 && !isCartOpen && (
        <div
          id="floating-cart-bar"
          className="fixed bottom-4 left-3 right-3 max-w-md mx-auto z-40 animate-slide-up"
        >
          <button
            id="btn-floating-cart"
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black p-3.5 rounded-2xl flex items-center justify-between shadow-2xl shadow-amber-500/30 active:scale-[0.98] transition-all cursor-pointer border border-amber-300/40"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-950 text-amber-400 flex items-center justify-center font-black text-xs shadow-inner">
                {totalCartCount}
              </div>
              <div className="text-left">
                <span className="block text-xs uppercase tracking-wider font-extrabold text-zinc-950">
                  Ver Minha Sacola
                </span>
                <span className="text-[11px] font-medium text-zinc-900/80">
                  {totalCartCount === 1 ? '1 item adicionado' : `${totalCartCount} itens adicionados`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-display font-black text-base text-zinc-950">
                {formatCurrency(totalCartValue)}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        </div>
      )}

      {/* Product Details Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        establishment={establishment}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderCompleted={handleOrderCompleted}
      />

      {/* Admin Login Modal (Protection for Management Area) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={handleCloseAdminLogin}
        onSuccess={handleAdminLoginSuccess}
        establishment={establishment}
      />

      {/* Admin Panel Modal (Exclusive for authenticated merchant) */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        establishment={establishment}
        categories={categories}
        products={products}
        orders={orders}
        onSaveEstablishment={(updated) => setEstablishment(updated)}
        onSaveCategories={(updated) => setCategories(updated)}
        onSaveProducts={(updated) => setProducts(updated)}
        onClearOrders={() => setOrders([])}
        onResetAllData={handleResetAllData}
        onLogout={handleAdminLogout}
      />

      {/* Footer */}
      <Footer
        establishment={establishment}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdminAuth={handleOpenAdminTrigger}
        isAdminLoggedIn={isAdminAuthenticated}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />
    </div>
  );
}
