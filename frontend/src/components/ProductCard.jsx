import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { addWishlistItem, errorMessage } from '../services/api';

const formatINR = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function ProductCard({ product, wishlisted = false, onWishlisted }) {
  const { addToCart, busy } = useCart();
  const [wishlistState, setWishlistState] = useState(wishlisted ? 'saved' : 'idle');
  const [message, setMessage] = useState('');
  const cartBusy = busy[product._id] === 'adding';

  async function handleWishlist() {
    if (wishlistState === 'saving' || wishlistState === 'saved') return;
    setWishlistState('saving');
    setMessage('');
    try {
      await addWishlistItem(product._id);
      setWishlistState('saved');
      onWishlisted?.(product._id);
    } catch (error) {
      if (error.response?.status === 409) {
        setWishlistState('saved');
        onWishlisted?.(product._id);
      } else {
        setWishlistState('idle');
        setMessage(errorMessage(error, 'Unable to save product. Please try again.'));
      }
    }
  }

  async function handleCart() {
    setMessage('');
    try {
      await addToCart(product._id);
      setMessage('Cart updated.');
    } catch (error) {
      setMessage(errorMessage(error, 'Unable to add this product to cart.'));
    }
  }

  const isSaved = wishlisted || wishlistState === 'saved';

  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="product-media" aria-label={`View details for ${product.name}`}>
        <img src={product.image} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.src = '/images/placeholder.svg'; }} />
        <span className={`stock-pill ${product.stock === 0 ? 'stock-out' : ''}`}>{product.stock === 0 ? 'Out of stock' : 'In stock'}</span>
      </Link>
      <div className="product-content">
        <span className="product-category">{product.category}</span>
        <h3><Link to={`/products/${product._id}`}>{product.name}</Link></h3>
        <div className="product-bottom"><strong>{formatINR(product.price)}</strong><span>{product.stock > 0 ? `${product.stock} left` : 'Unavailable'}</span></div>
        <div className="product-card-actions">
          <Link className="btn btn-outline btn-small" to={`/products/${product._id}`}>View</Link>
          <button className="btn btn-outline btn-small" type="button" disabled={isSaved || wishlistState === 'saving'} onClick={handleWishlist}>
            {wishlistState === 'saving' ? 'Saving…' : isSaved ? '♥ Added to Wishlist' : '♡ Add to Wishlist'}
          </button>
        </div>
        <button className="btn btn-primary btn-block" type="button" disabled={product.stock === 0 || cartBusy} onClick={handleCart}>
          {cartBusy ? 'Adding…' : 'Add to Cart'}
        </button>
        {message && <p className={message === 'Cart updated.' ? 'inline-success' : 'inline-error'} role="status">{message}</p>}
      </div>
    </article>
  );
}
