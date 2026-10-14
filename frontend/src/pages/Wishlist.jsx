import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWishlist, removeWishlistItem, errorMessage } from '../services/api';
import WishlistCard from '../components/WishlistCard';

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState('');

  const fetchWishlist = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getWishlist();
      setWishlist((data.wishlist || []).filter(Boolean));
    } catch (err) {
      setError(errorMessage(err, 'Failed to load your wishlist.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await removeWishlistItem(productId);
      setWishlist((prev) => prev.filter((item) => item._id !== productId));
    } catch (err) {
      alert(errorMessage(err, 'Could not remove item from wishlist.'));
    } finally {
      setRemovingId('');
    }
  };

  return (
    <div className="wishlist-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Wishlist</h1>
          <p className="page-desc">Your curated list of saved items. Ready when you are.</p>
        </div>
      </div>

      {error && (
        <div className="page-alert" role="alert">
          <span>{error}</span>
          <button className="btn btn-outline btn-small ml-4" onClick={fetchWishlist}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="center-state" role="status">
          Loading your wishlist…
        </div>
      ) : wishlist.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤍</div>
          <h3>Your wishlist is empty</h3>
          <p>Explore our catalogue and click the heart icon to save products you love.</p>
          <Link to="/products" className="btn btn-primary mt-4">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {wishlist.map((product) => (
            <WishlistCard
              key={product._id}
              product={product}
              removing={removingId === product._id}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
