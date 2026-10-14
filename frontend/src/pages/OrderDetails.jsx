import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder, errorMessage } from '../services/api';

const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date(value));

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function fetchOrder() {
      setLoading(true);
      setError('');
      try {
        const { data } = await getOrder(id);
        if (active) setOrder(data.order);
      } catch (err) {
        if (active) setError(errorMessage(err, 'Could not retrieve this order.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchOrder();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="center-state" role="status">Loading order details…</div>;
  }

  if (error || !order) {
    return (
      <div className="center-state">
        <p className="page-alert mb-4">{error || 'Order not found.'}</p>
        <Link to="/orders" className="btn btn-outline">← Back to Orders</Link>
      </div>
    );
  }

  const { shippingAddress, items, totalAmount, status, paymentStatus, createdAt } = order;

  return (
    <div className="order-details-page">
      <div className="order-details-header">
        <div>
          <Link to="/orders" className="back-link">← All Orders</Link>
          <h1 className="page-title">Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="order-date">Placed on {formatDate(createdAt)}</p>
        </div>
        <div className="order-badges">
          <span className={`order-status status-${status.toLowerCase()}`}>
            {status.replaceAll('_', ' ')}
          </span>
          <span className={`payment-pill payment-${paymentStatus.toLowerCase()}`}>
            Payment: {paymentStatus}
          </span>
        </div>
      </div>

      <div className="order-details-grid">
        <div className="order-items-card">
          <h2>Items in this order ({items.length})</h2>
          <div className="order-item-rows">
            {items.map((item, idx) => (
              <div className="order-item-row" key={`${item.product}-${idx}`}>
                <img
                  src={item.image || '/images/placeholder.svg'}
                  alt={item.name}
                  className="order-item-thumb"
                  onError={(e) => { e.currentTarget.src = '/images/placeholder.svg'; }}
                />
                <div className="order-item-info">
                  <h4>{item.name}</h4>
                  <p className="muted">
                    {formatINR(item.price)} × {item.quantity} unit{item.quantity > 1 ? 's' : ''}
                  </p>
                </div>
                <strong className="order-item-total">
                  {formatINR(item.price * item.quantity)}
                </strong>
              </div>
            ))}
          </div>

          <div className="order-total-bar">
            <span>Total Amount Paid</span>
            <span className="total-highlight">{formatINR(totalAmount)}</span>
          </div>
        </div>

        <div className="order-sidebar">
          <div className="order-info-box">
            <h3>Shipping Address</h3>
            <p><strong>{shippingAddress.fullName}</strong></p>
            <p>{shippingAddress.addressLine1}</p>
            <p>{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}</p>
            <p className="phone-line">📞 {shippingAddress.phone}</p>
          </div>

          <div className="order-info-box">
            <h3>Payment Details</h3>
            <p><strong>Gateway:</strong> Razorpay Test Mode</p>
            {order.razorpayPaymentId && (
              <p><strong>Payment ID:</strong> {order.razorpayPaymentId}</p>
            )}
            {order.razorpayOrderId && (
              <p><strong>Razorpay Order ID:</strong> {order.razorpayOrderId}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
