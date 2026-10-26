import React, { useState, useEffect, useCallback } from 'react';
import PublicMenu from './pages/PublicMenu';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProductsManager from './pages/ProductsManager';
import CategoriesManager from './pages/CategoriesManager';
import RestaurantSettings from './pages/RestaurantSettings';
import AdminNavbar from './components/admin/AdminNavbar';
import ProductFormModal from './components/admin/ProductFormModal';
import CategoryFormModal from './components/admin/CategoryFormModal';

import { getPublicMenu } from './services/menuService';
import {
  checkAuth,
  logout,
  getAdminCategories,
  getAdminProducts,
  getAdminSettings,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  updateAdminSettings
} from './services/adminService';

export default function App() {
  // Navigation: 'menu' | 'login' | 'admin'
  const [currentView, setCurrentView] = useState('menu');
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard' | 'products' | 'categories' | 'settings'

  // Public Menu Data
  const [menuData, setMenuData] = useState(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState(null);

  // Admin Data
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminCategories, setAdminCategories] = useState([]);
  const [adminSettingsData, setAdminSettingsData] = useState({});

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Load public menu
  const loadMenu = useCallback(async (forceRefresh = false) => {
    setIsLoadingMenu(true);
    setMenuError(null);
    try {
      const data = await getPublicMenu(forceRefresh);
      setMenuData(data);
      if (data.settings?.name) {
        document.title = `${data.settings.name} - Menú Digital`;
      }
    } catch (err) {
      console.error('Error loading public menu:', err);
      setMenuError(err.message || 'No fue posible cargar el menú.');
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  // Load admin data
  const loadAdminData = useCallback(async () => {
    try {
      const [prods, cats, sets] = await Promise.all([
        getAdminProducts(),
        getAdminCategories(),
        getAdminSettings()
      ]);
      setAdminProducts(prods || []);
      setAdminCategories(cats || []);
      setAdminSettingsData(sets || {});
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  }, []);

  // Initial mount: load menu & check auth
  useEffect(() => {
    loadMenu();

    const verifySession = async () => {
      const authed = await checkAuth();
      setIsAuthenticated(authed);
      if (authed) {
        loadAdminData();
      }
    };
    verifySession();

    // Check hash for direct URL access (e.g. #admin)
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setCurrentView(isAuthenticated ? 'admin' : 'login');
      } else if (hash === '#login') {
        setCurrentView('login');
      } else {
        setCurrentView('menu');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [loadMenu, loadAdminData, isAuthenticated]);

  // Handle Login success
  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    setCurrentView('admin');
    window.location.hash = '#admin';
    await loadAdminData();
    await loadMenu(true);
  };

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
    setCurrentView('menu');
    window.location.hash = '';
  };

  // --- Product Handlers ---
  const handleSaveProduct = async (productData) => {
    if (productData.id) {
      await updateAdminProduct(productData);
    } else {
      await createAdminProduct(productData);
    }
    // Refresh admin & public view immediately
    await loadAdminData();
    await loadMenu(true);
  };

  const handleToggleProductAvailability = async (product) => {
    const updated = {
      ...product,
      available: product.available === false ? true : false
    };
    await updateAdminProduct(updated);
    await loadAdminData();
    await loadMenu(true);
  };

  const handleDeleteProduct = async (productId) => {
    await deleteAdminProduct(productId);
    await loadAdminData();
    await loadMenu(true);
  };

  // --- Category Handlers ---
  const handleSaveCategory = async (catData) => {
    if (catData.id) {
      await updateAdminCategory(catData);
    } else {
      await createAdminCategory(catData);
    }
    await loadAdminData();
    await loadMenu(true);
  };

  const handleDeleteCategory = async (catId) => {
    await deleteAdminCategory(catId);
    await loadAdminData();
    await loadMenu(true);
  };

  // --- Settings Handlers ---
  const handleSaveSettings = async (settingsPayload) => {
    const res = await updateAdminSettings(settingsPayload);
    setAdminSettingsData(res.settings || settingsPayload);
    await loadMenu(true);
  };

  // 1. Admin Login View
  if (currentView === 'login') {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToMenu={() => {
          setCurrentView('menu');
          window.location.hash = '';
        }}
      />
    );
  }

  // 2. Admin Panel View
  if (currentView === 'admin' && isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
        <AdminNavbar
          activeTab={adminTab}
          onSelectTab={setAdminTab}
          restaurantName={adminSettingsData.name || menuData?.settings?.name}
          onViewPublic={() => {
            setCurrentView('menu');
            window.location.hash = '';
          }}
          onLogout={handleLogout}
        />

        <main className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
          {adminTab === 'dashboard' && (
            <AdminDashboard
              products={adminProducts}
              categories={adminCategories}
              settings={adminSettingsData}
              onNavigateTab={setAdminTab}
              onOpenCreateProduct={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onOpenCreateCategory={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
            />
          )}

          {adminTab === 'products' && (
            <ProductsManager
              products={adminProducts}
              categories={adminCategories}
              currency={adminSettingsData.currency || 'MXN'}
              onOpenCreate={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onOpenEdit={(prod) => {
                setEditingProduct(prod);
                setIsProductModalOpen(true);
              }}
              onToggleAvailability={handleToggleProductAvailability}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {adminTab === 'categories' && (
            <CategoriesManager
              categories={adminCategories}
              onOpenCreate={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              onOpenEdit={(cat) => {
                setEditingCategory(cat);
                setIsCategoryModalOpen(true);
              }}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {adminTab === 'settings' && (
            <RestaurantSettings
              settings={adminSettingsData}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>

        {/* Product Modal */}
        <ProductFormModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          categories={adminCategories}
          product={editingProduct}
        />

        {/* Category Modal */}
        <CategoryFormModal
          isOpen={isCategoryModalOpen}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
          category={editingCategory}
          nextOrder={adminCategories.length + 1}
        />
      </div>
    );
  }

  // 3. Public Menu (Default)
  return (
    <PublicMenu
      menuData={menuData}
      isLoading={isLoadingMenu}
      error={menuError}
      onRefresh={() => loadMenu(true)}
      onOpenAdmin={() => {
        if (isAuthenticated) {
          setCurrentView('admin');
          window.location.hash = '#admin';
        } else {
          setCurrentView('login');
          window.location.hash = '#login';
        }
      }}
    />
  );
}
