import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get('/wishlist');
      if (response.data?.success) {
        setWishlist(response.data.wishlist || []);
      } else {
        setError(true);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setWishlist([]);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const wishlistIds = useMemo(() => {
    return new Set(wishlist.map((item) => (item._id ? item._id : item)));
  }, [wishlist]);

  const isWishlisted = useCallback(
    (productId) => {
      if (!productId) return false;
      return wishlistIds.has(productId);
    },
    [wishlistIds]
  );

  const toggleWishlist = async (productId) => {
    if (!productId) return { success: false, message: 'Invalid product' };

    const currentlySaved = isWishlisted(productId);

    try {
      if (currentlySaved) {
        const response = await api.delete(`/wishlist/${productId}`);
        if (response.data?.success) {
          setWishlist((prev) => prev.filter((item) => item._id !== productId));
          return { success: true, isWishlisted: false, message: 'Removed from wishlist' };
        }
      } else {
        const response = await api.post(`/wishlist/${productId}`);
        if (response.data?.success) {
          // Re-fetch wishlist to get full populated product document
          await fetchWishlist();
          return { success: true, isWishlisted: true, message: 'Added to wishlist' };
        }
      }
      return { success: false, message: 'Operation failed' };
    } catch (err) {
      if (err.response?.status === 409) {
        await fetchWishlist();
        return { success: true, isWishlisted: true, message: 'Added to wishlist' };
      }
      const message = err.response?.data?.message || 'Failed to update wishlist';
      return { success: false, message };
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const response = await api.delete(`/wishlist/${productId}`);
      if (response.data?.success) {
        setWishlist((prev) => prev.filter((item) => item._id !== productId));
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed to remove' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to remove' };
    }
  };

  const value = {
    wishlist,
    loading,
    error,
    wishlistIds,
    isWishlisted,
    toggleWishlist,
    removeFromWishlist,
    fetchWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
