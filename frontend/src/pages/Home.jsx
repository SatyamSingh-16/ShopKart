import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { getProducts, getWishlist } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const { user } = useOutletContext();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [prodRes, wishRes] = await Promise.allSettled([
          getProducts(),
          getWishlist(),
        ]);

        if (active) {
          if (prodRes.status === 'fulfilled' && prodRes.value.data.products) {
            setFeaturedProducts(prodRes.value.data.products.slice(0, 4));
          }
          if (wishRes.status === 'fulfilled' && wishRes.value.data.wishlist) {
            const ids = new Set(
              wishRes.value.data.wishlist
                .filter(Boolean)
                .map((item) => (typeof item === 'object' ? item._id : item))
            );
            setWishlistIds(ids);
          }
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const handleWishlisted = (id) => {
    setWishlistIds((prev) => new Set([...prev, id]));
  };

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Shopper';

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-banner">
        <div className="hero-content">
          <span className="eyebrow-badge">SHOPKART PREMIUM ESSENTIALS</span>
          <h1 className="hero-title">
            Welcome back, <span className="highlight-text">{firstName}</span>!
          </h1>
          <p className="hero-subtitle">
            Explore carefully crafted electronics, fashion, and lifestyle items. Fast checkout, secure payments, and reliable delivery.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary">
              Browse All Products →
            </Link>
            <Link to="/wishlist" className="btn btn-outline">
              View Wishlist
            </Link>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <span className="stat-number">100%</span>
            <span className="stat-label">Verified Quality</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">Fast</span>
            <span className="stat-label">Razorpay Checkout</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">Realtime</span>
            <span className="stat-label">Stock & Cart State</span>
          </div>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="quick-nav-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-nav-grid">
          <Link to="/products" className="nav-card">
            <div className="nav-card-icon">🛍️</div>
            <h3>Product Catalogue</h3>
            <p>Search, filter by category, and find the perfect match.</p>
          </Link>

          <Link to="/wishlist" className="nav-card">
            <div className="nav-card-icon">❤️</div>
            <h3>Saved Wishlist</h3>
            <p>Keep track of your favorite items and purchase when ready.</p>
          </Link>

          <Link to="/cart" className="nav-card">
            <div className="nav-card-icon">🛒</div>
            <h3>Shopping Cart</h3>
            <p>Review quantities, subtotal calculation, and proceed to checkout.</p>
          </Link>

          <Link to="/orders" className="nav-card">
            <div className="nav-card-icon">📦</div>
            <h3>Order History</h3>
            <p>Track your past orders, payment receipts, and delivery details.</p>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Featured Products</h2>
            <p className="section-desc">Hand-picked selections from our latest catalogue</p>
          </div>
          <Link to="/products" className="btn btn-outline btn-small">
            View All ({featuredProducts.length}+)
          </Link>
        </div>

        {loading ? (
          <div className="center-state" role="status">
            Loading products…
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                wishlisted={wishlistIds.has(product._id)}
                onWishlisted={handleWishlisted}
              />
            ))}
          </div>
        ) : (
          <div className="center-state">
            <p>No products available right now.</p>
          </div>
        )}
      </section>

      {/* Developer Credit Banner */}
      <section className="developer-showcase">
        <div className="developer-box">
          <span className="developer-pill">Project Lead</span>
          <h3>Developed by Satyam Singh</h3>
          <p>
            Complete MERN Stack implementation encompassing Customer Authentication, Product Catalogue, Persistent Wishlist, Global React Context Cart, and Razorpay HMAC-verified Checkout.
          </p>
        </div>
      </section>
    </div>
  );
}
