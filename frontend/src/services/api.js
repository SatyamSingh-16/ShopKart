import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const errorMessage = (error, fallback = 'An unexpected error occurred.') => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return fallback;
};

// Customer Auth APIs
export const registerCustomer = (data) => api.post('/customers/register', data);
export const loginCustomer = (data) => api.post('/customers/login', data);
export const getMe = () => api.get('/customers/me');
export const logoutCustomer = () => api.post('/customers/logout');

// Products APIs
export const getProducts = (params = {}) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);

// Wishlist APIs
export const getWishlist = () => api.get('/wishlist');
export const addWishlistItem = (productId) => api.post(`/wishlist/${productId}`);
export const removeWishlistItem = (productId) => api.delete(`/wishlist/${productId}`);

// Cart APIs
export const getCart = () => api.get('/cart');
export const addCartItem = (productId) => api.post(`/cart/${productId}`);
export const updateCartItem = (productId, quantity) => api.patch(`/cart/${productId}`, { quantity });
export const removeCartItem = (productId) => api.delete(`/cart/${productId}`);

// Orders APIs
export const createPaymentOrder = (shippingAddress) => api.post('/orders/create-payment-order', { shippingAddress });
export const verifyPayment = (paymentData) => api.post('/orders/verify-payment', paymentData);
export const getOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);

export default api;
