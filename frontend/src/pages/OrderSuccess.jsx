import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder } from '../services/api';

const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getOrder(id)
      .then(({ data }) => {
        if (active) setOrder(data.order);
      })
      .catch((err) => {
        console.error('Order fetch error:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="order-success-page">
      <div className="order-success-card">
        <div className="success-icon-wrap">
          <span className="success-checkmark">✓</span>
        </div>
        <span className="eyebrow-badge">ORDER CONFIRMED</span>
        <h1>Thank you for your order!</h1>
        <p className="success-subtitle">
          Your payment has been verified and your order is now being processed.
        </p>

        {loading ? (
          <div className="center-state my-4">Retrieving confirmation…</div>
        ) : order ? (
          <div className="success-order-summary">
            <div className="summary-meta-row">
              <span>Order Reference</span>
              <strong>#{order._id.slice(-8).toUpperCase()}</strong>
            </div>
            <div className="summary-meta-row">
              <span>Amount Paid</span>
              <strong className="text-success">{formatINR(order.totalAmount)}</strong>
            </div>
            <div className="summary-meta-row">
              <span>Payment ID</span>
              <span>{order.razorpayPaymentId || 'Verified'}</span>
            </div>
            <div className="summary-meta-row">
              <span>Delivery To</span>
              <span>
                {order.shippingAddress.fullName}, {order.shippingAddress.city}
              </span>
            </div>
          </div>
        ) : (
          <p className="muted my-4">Order #{id.slice(-8).toUpperCase()} placed successfully.</p>
        )}

        <div className="success-actions">
          <Link to={`/orders/${id}`} className="btn btn-primary btn-large">
            View Order Details
          </Link>
          <Link to="/products" className="btn btn-outline btn-large">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
