import { Link } from 'react-router-dom';

const formatINR = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
const formatDate = (value) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function OrderCard({ order }) {
  return (
    <article className="order-card">
      <div className="order-card-head">
        <div><span className="eyebrow">ORDER</span><h3>#{order._id.slice(-8).toUpperCase()}</h3></div>
        <span className={`order-status status-${order.status.toLowerCase()}`}>{order.status.replaceAll('_', ' ')}</span>
      </div>
      <p className="muted">{formatDate(order.createdAt)}</p>
      <div className="order-item-list">
        {order.items.map((item) => <span key={`${item.product}-${item.name}`}>{item.name} × {item.quantity}</span>)}
      </div>
      <div className="order-card-foot"><strong>{formatINR(order.totalAmount)}</strong><Link className="btn btn-outline btn-small" to={`/orders/${order._id}`}>View Details</Link></div>
    </article>
  );
}
