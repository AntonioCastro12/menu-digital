import { useState, useEffect } from 'react';

const CART_STORAGE_KEY = 'menu_digital_cart_v1';

export function useCart() {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Could not save cart to localStorage', e);
    }
  }, [cart]);

  // Add item to cart with customization (excluded ingredients, combined ingredients, notes, quantity)
  const addToCart = (product, options = {}) => {
    const {
      quantity = 1,
      excludedIngredients = [],
      selectedCombinations = [],
      notes = ''
    } = options;

    const cleanExcluded = [...excludedIngredients].sort();
    const cleanCombinations = [...selectedCombinations].sort();
    const cleanNotes = (notes || '').trim();

    // Check if an identical product with the EXACT same combinations, excluded ingredients and notes already exists
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) =>
          item.productId === product.id &&
          JSON.stringify(item.excludedIngredients || []) === JSON.stringify(cleanExcluded) &&
          JSON.stringify(item.selectedCombinations || []) === JSON.stringify(cleanCombinations) &&
          item.notes === cleanNotes
      );

      if (existingIndex > -1) {
        // Increment quantity of existing item
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      // Add as new cart item
      const newItem = {
        cartItemId: `${product.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        displayImageUrl: product.displayImageUrl || product.imageUrl || '',
        categoryName: product.categoryName || '',
        quantity: Math.max(1, quantity),
        allIngredients: Array.isArray(product.ingredients) ? product.ingredients : [],
        excludedIngredients: cleanExcluded,
        selectedCombinations: cleanCombinations,
        notes: cleanNotes
      };

      return [...prevCart, newItem];
    });
  };

  // Update item quantity
  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Remove item
  const removeFromCart = (cartItemId) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  // Clear all
  const clearCart = () => {
    setCart([]);
  };

  // Metrics
  const totalItemsCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItemsCount,
    totalPrice
  };
}
