import { useEffect, useState, useCallback } from 'react';
import { getProducts, getWishlist, errorMessage } from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category.trim()) params.category = category.trim();
      if (sort.trim()) params.sort = sort.trim();

      const [prodRes, wishRes] = await Promise.allSettled([
        getProducts(params),
        getWishlist(),
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value.data.success) {
        setProducts(prodRes.value.data.products || []);
        if (prodRes.value.data.categories) {
          setCategories(prodRes.value.data.categories);
        }
      } else if (prodRes.status === 'rejected') {
        throw prodRes.reason;
      }

      if (wishRes.status === 'fulfilled' && wishRes.value.data.wishlist) {
        const ids = new Set(
          wishRes.value.data.wishlist
            .filter(Boolean)
            .map((item) => (typeof item === 'object' ? item._id : item))
        );
        setWishlistIds(ids);
      }
    } catch (err) {
      setError(errorMessage(err, 'Failed to load products. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [search, category, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadProducts]);

  const handleWishlisted = (id) => {
    setWishlistIds((prev) => new Set([...prev, id]));
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Catalogue</h1>
          <p className="page-desc">Discover our range of products with real-time stock availability</p>
        </div>
      </div>

      <SearchBar
        search={search}
        onSearch={setSearch}
        category={category}
        categories={categories}
        onCategory={setCategory}
        sort={sort}
        onSort={setSort}
      />

      {error && (
        <div className="page-alert" role="alert">
          <span>{error}</span>
          <button className="btn btn-outline btn-small ml-4" onClick={loadProducts}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="center-state" role="status">
          Loading products…
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try clearing your search or filtering by another category.</p>
          {(search || category || sort) && (
            <button
              className="btn btn-outline btn-small mt-4"
              onClick={() => {
                setSearch('');
                setCategory('');
                setSort('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              wishlisted={wishlistIds.has(product._id)}
              onWishlisted={handleWishlisted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
