import { Link } from 'react-router-dom';

const formatINR = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function WishlistCard({ product, removing, onRemove }) {
  if (!product) return null;
  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="product-media">
        <img src={product.image} alt={product.name} onError={(event) => { event.currentTarget.src = '/images/placeholder.svg'; }} />
        <span className={`stock-pill ${product.stock === 0 ? 'stock-out' : ''}`}>{product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}</span>
      </Link>
      <div className="product-content">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <div className="product-bottom"><strong>{formatINR(product.price)}</strong></div>
        <div className="stack-actions">
          <Link className="btn btn-outline btn-block" to={`/products/${product._id}`}>View Details</Link>
          <button className="btn btn-danger btn-block" type="button" disabled={removing} onClick={() => onRemove(product._id)}>{removing ? 'Removing…' : 'Remove ♥'}</button>
        </div>
      </div>
    </article>
  );
}
