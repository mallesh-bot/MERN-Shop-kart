import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get('/cart');
      if (response.data?.success) {
        setCart(response.data.cart || []);
      } else {
        setError(true);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setCart([]);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId) => {
    try {
      const response = await api.post(`/cart/${productId}`);
      if (response.data?.success) {
        setCart(response.data.cart || []);
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data?.message || 'Failed to add item to cart' };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add item to cart';
      return { success: false, message };
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    try {
      const response = await api.patch(`/cart/${productId}`, { quantity: newQuantity });
      if (response.data?.success) {
        setCart(response.data.cart || []);
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed to update quantity' };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update quantity';
      return { success: false, message };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await api.delete(`/cart/${productId}`);
      if (response.data?.success) {
        setCart(response.data.cart || []);
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed to remove item' };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove item';
      return { success: false, message };
    }
  };

  const totalQuantity = useMemo(() => {
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.product?.price || 0;
      const qty = item.quantity || 0;
      return sum + price * qty;
    }, 0);
  }, [cart]);

  const value = {
    cart,
    loading,
    error,
    totalQuantity,
    subtotal,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
