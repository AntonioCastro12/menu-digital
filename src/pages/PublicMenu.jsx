import React, { useState, useMemo } from 'react';
import MenuHeader from '../components/menu/MenuHeader';
import CategoryNav from '../components/menu/CategoryNav';
import ProductCard from '../components/menu/ProductCard';
import ProductDetailModal from '../components/menu/ProductDetailModal';
import CartDrawer from '../components/menu/CartDrawer';
import CartFloatingButton from '../components/menu/CartFloatingButton';
import MenuFooter from '../components/menu/MenuFooter';
import MenuIntroSplash from '../components/menu/MenuIntroSplash';
import { useCart } from '../hooks/useCart';
import { Search, X, UtensilsCrossed, RefreshCw } from 'lucide-react';

export default function PublicMenu({
  menuData,
  isLoading,
  error,
  onRefresh,
  onOpenAdmin
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Shopping cart hook
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItemsCount,
    totalPrice
  } = useCart();

  const { settings = {}, categories = [], products = [] } = menuData || {};

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: (products || []).length };
    (products || []).forEach((p) => {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter products by selected category and search query
  const filteredProducts = useMemo(() => {
    let result = products || [];

    // Filter by Category
    if (selectedCategoryId !== 'all') {
      result = result.filter((p) => p.categoryId === selectedCategoryId);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [products, selectedCategoryId, searchQuery]);

  // Loading Skeleton State
  if (isLoading && !menuData) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-600 animate-pulse flex items-center justify-center text-white mb-4 shadow-lg">
          <UtensilsCrossed className="w-7 h-7 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-stone-800">Cargando menú digital...</h2>
        <p className="text-xs text-stone-500 mt-1">Sincronizando platillos y precios en tiempo real</p>
      </div>
    );
  }

  // Error State
  if (error && !menuData) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <UtensilsCrossed className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-stone-800">No se pudo cargar el menú</h2>
        <p className="text-xs text-stone-500 max-w-sm mt-1 mb-6 leading-relaxed">
          {error}
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 shadow transition"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar conexión
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col relative pb-20">
      {/* Intro Splash Animation when opening menu */}
      <MenuIntroSplash settings={settings} />

      {/* Restaurant Header */}
      <MenuHeader
        settings={settings}
        cartCount={totalItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Search Input Bar */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-2 w-full">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tacos, cortes, bebidas, postres..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-stone-200/90 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sticky Categories Navigator */}
      <CategoryNav
        categories={categories}
        activeCategory={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        categoryCounts={categoryCounts}
      />

      {/* Main Dishes Grid */}
      <main className="max-w-4xl mx-auto px-4 py-6 w-full flex-1">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                index={idx}
                currency={settings?.currency || 'MXN'}
                onClick={setSelectedProduct}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-16 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-stone-200/80 p-8 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mb-3">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-800 text-base">
              No hay productos para mostrar
            </h3>
            <p className="text-xs text-stone-500 max-w-xs mt-1">
              {searchQuery
                ? `No encontramos coincidencias para "${searchQuery}". Prueba con otro término.`
                : 'Esta categoría aún no tiene platillos dados de alta.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 text-xs font-bold text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}
      </main>

      {/* Product Detail Modal (Con selector de ingredientes para desmarcar) */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          restaurantSettings={settings}
          onAddToCart={addToCart}
        />
      )}

      {/* Cart Drawer Slide-over */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        totalPrice={totalPrice}
        restaurantSettings={settings}
      />

      {/* Floating Cart Button at bottom */}
      <CartFloatingButton
        totalCount={totalItemsCount}
        totalPrice={totalPrice}
        currency={settings?.currency || 'MXN'}
        onClick={() => setIsCartOpen(true)}
      />

      {/* Footer */}
      <MenuFooter settings={settings} onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
