import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import OrderSummary from '../components/OrderSummary';

export default function Cart() {
  const {
    cartItems,
    loading,
    error: contextError,
    busy,
    totalUnits,
    subtotal,
    updateQuantity,
    removeFromCart,
    refreshCart,
  } = useCart();

  const [localError, setLocalError] = useState('');

  const displayError = localError || contextError;

  const hasUnavailable = cartItems.some((item) => !item.product || item.product.unavailable);

  return (
    <div className="cart-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shopping Cart</h1>
          <p className="page-desc">
            {totalUnits > 0
              ? `You have ${totalUnits} item${totalUnits > 1 ? 's' : ''} in your cart.`
              : 'Your cart is ready for your picks.'}
          </p>
        </div>
      </div>

      {displayError && (
        <div className="page-alert" role="alert">
          <span>{displayError}</span>
          <button
            className="btn btn-outline btn-small ml-4"
            onClick={() => {
              setLocalError('');
              refreshCart();
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="center-state" role="status">
          Loading your cart…
        </div>
      ) : cartItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Explore our wide range of products and add your favorites to get started.</p>
          <Link to="/products" className="btn btn-primary mt-4">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-column">
            {hasUnavailable && (
              <div className="page-alert warning-alert mb-4">
                Some items in your cart are no longer available. Please remove them before proceeding to checkout.
              </div>
            )}
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <CartItem
                  key={item.product?._id || item._id}
                  item={item}
                  busy={busy[item.product?._id]}
                  onUpdate={updateQuantity}
                  onRemove={removeFromCart}
                  onError={(msg) => setLocalError(msg)}
                />
              ))}
            </div>
          </div>

          <div className="cart-summary-column">
            <OrderSummary items={cartItems} subtotal={subtotal} />

            <div className="cart-checkout-actions">
              <Link
                to="/checkout"
                className={`btn btn-primary btn-large btn-block ${hasUnavailable ? 'btn-disabled' : ''}`}
                onClick={(e) => {
                  if (hasUnavailable) e.preventDefault();
                }}
              >
                Proceed to Checkout ({totalUnits} items) →
              </Link>
              <Link to="/products" className="btn btn-outline btn-block mt-2">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
