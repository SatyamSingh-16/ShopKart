import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, errorMessage } from '../services/api';
import OrderCard from '../components/OrderCard';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getOrders();
      setOrders(data.orders || []);
    } catch (err) {
      setError(errorMessage(err, 'Failed to retrieve your orders.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="orders-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="page-desc">Track and view past purchases and delivery statuses</p>
        </div>
      </div>

      {error && (
        <div className="page-alert" role="alert">
          <span>{error}</span>
          <button className="btn btn-outline btn-small ml-4" onClick={fetchOrders}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="center-state" role="status">
          Loading your orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet. Discover our catalogue and place your first order!</p>
          <Link to="/products" className="btn btn-primary mt-4">
            Browse Catalogue
          </Link>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
