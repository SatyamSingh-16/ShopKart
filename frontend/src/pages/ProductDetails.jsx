import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, getWishlist, addWishlistItem, errorMessage } from '../services/api';
import { useCart } from '../context/CartContext';

const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart, busy } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistSaving, setWishlistSaving] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function fetchDetail() {
      setLoading(true);
      setError('');
      try {
        const [prodRes, wishRes] = await Promise.allSettled([
          getProduct(id),
          getWishlist(),
        ]);

        if (!active) return;

        if (prodRes.status === 'fulfilled' && prodRes.value.data.product) {
          setProduct(prodRes.value.data.product);
        } else {
          setError('Product not found.');
          return;
        }

        if (wishRes.status === 'fulfilled' && wishRes.value.data.wishlist) {
          const isWish = wishRes.value.data.wishlist.some((item) => {
            const itemId = typeof item === 'object' ? item._id : item;
            return itemId === id;
          });
          setWishlisted(isWish);
        }
      } catch (err) {
        if (active) setError(errorMessage(err, 'Unable to load product details.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      active = false;
    };
  }, [id]);

  const handleWishlistToggle = async () => {
    if (wishlisted || wishlistSaving) return;
    setWishlistSaving(true);
    try {
      await addWishlistItem(product._id);
      setWishlisted(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setWishlisted(true);
      } else {
        alert(errorMessage(err, 'Failed to save to wishlist.'));
      }
    } finally {
      setWishlistSaving(false);
    }
  };

  const handleAddToCart = async () => {
    setCartMessage('');
    try {
      await addToCart(product._id);
      setCartMessage('Product added to cart!');
    } catch (err) {
      setCartMessage(errorMessage(err, 'Could not add product to cart.'));
    }
  };

  const isCartBusy = product ? busy[product._id] === 'adding' : false;

  if (loading) {
    return <div className="center-state" role="status">Loading product details…</div>;
  }

  if (error || !product) {
    return (
      <div className="center-state">
        <p className="page-alert mb-4">{error || 'Product not found.'}</p>
        <Link to="/products" className="btn btn-outline">← Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="product-details-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/products">Products</Link>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <span className="current-crumb">{product.name}</span>
      </nav>

      <div className="product-details-container">
        <div className="product-details-media">
          <img
            src={product.image}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = '/images/placeholder.svg';
            }}
          />
        </div>

        <div className="product-details-info">
          <span className="product-category-badge">{product.category}</span>
          <h1 className="product-title">{product.name}</h1>
          <div className="product-price-row">
            <span className="price-tag">{formatINR(product.price)}</span>
            <span className={`stock-pill ${product.stock === 0 ? 'stock-out' : ''}`}>
              {product.stock === 0 ? 'Out of stock' : `${product.stock} units available`}
            </span>
          </div>

          <p className="product-description">{product.description}</p>

          <div className="product-action-stack">
            <button
              className="btn btn-primary btn-large btn-block"
              type="button"
              disabled={product.stock === 0 || isCartBusy}
              onClick={handleAddToCart}
            >
              {isCartBusy ? 'Adding to Cart…' : 'Add to Cart 🛒'}
            </button>

            <button
              className="btn btn-outline btn-large btn-block"
              type="button"
              disabled={wishlisted || wishlistSaving}
              onClick={handleWishlistToggle}
            >
              {wishlistSaving ? 'Saving…' : wishlisted ? '♥ Saved in Wishlist' : '♡ Add to Wishlist'}
            </button>
          </div>

          {cartMessage && (
            <p
              className={cartMessage.includes('added') ? 'inline-success' : 'inline-error'}
              role="status"
            >
              {cartMessage}
            </p>
          )}

          <div className="product-meta-details">
            <div className="meta-item">
              <span className="meta-label">Delivery</span>
              <span className="meta-value">Standard 2-4 Business Days</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Payment</span>
              <span className="meta-value">Secure Razorpay Gateway</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
