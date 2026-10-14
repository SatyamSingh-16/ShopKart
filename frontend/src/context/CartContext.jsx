import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
  errorMessage,
} from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState({});

  const markBusy = (productId, action) => {
    setBusy((current) => ({ ...current, [productId]: action || undefined }));
  };

  async function refreshCart() {
    setLoading(true);
    setError('');
    try {
      const { data } = await getCart();
      setCartItems(data.cart || []);
      return data.cart || [];
    } catch (err) {
      const message = errorMessage(err, 'Unable to load your cart.');
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(productId) {
    markBusy(productId, 'adding');
    try {
      const { data } = await addCartItem(productId);
      setCartItems(data.cart || []);
      setError('');
      return data;
    } finally {
      markBusy(productId, '');
    }
  }

  async function updateQuantity(productId, quantity) {
    markBusy(productId, 'updating');
    try {
      const { data } = await updateCartItem(productId, quantity);
      setCartItems(data.cart || []);
      setError('');
      return data;
    } finally {
      markBusy(productId, '');
    }
  }

  async function removeFromCart(productId) {
    markBusy(productId, 'removing');
    try {
      const { data } = await removeCartItem(productId);
      setCartItems(data.cart || []);
      setError('');
      return data;
    } finally {
      markBusy(productId, '');
    }
  }

  function clearLocalCart() {
    setCartItems([]);
    setError('');
  }

  useEffect(() => {
    refreshCart().catch(() => {});
  }, []);

  const totalUnits = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0),
    [cartItems]
  );

  const value = {
    cartItems,
    loading,
    error,
    busy,
    totalUnits,
    subtotal,
    refreshCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearLocalCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
