import { errorMessage } from '../services/api';

const formatINR = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function CartItem({ item, busy, onUpdate, onRemove, onError }) {
  const product = item.product;
  const isBusy = Boolean(busy);
  const unavailable = !product || product.unavailable;

  async function changeQuantity(nextQuantity) {
    if (unavailable || isBusy || nextQuantity < 1 || nextQuantity > product.stock) return;
    try {
      await onUpdate(product._id, nextQuantity);
    } catch (error) {
      onError(errorMessage(error, 'Unable to update quantity.'));
    }
  }

  async function remove() {
    if (isBusy || !product?._id) return;
    try {
      await onRemove(product._id);
    } catch (error) {
      onError(errorMessage(error, 'Unable to remove product.'));
    }
  }

  return (
    <article className="cart-item">
      <img className="cart-thumb" src={product?.image || '/images/placeholder.svg'} alt={product?.name || 'Unavailable product'} onError={(event) => { event.currentTarget.src = '/images/placeholder.svg'; }} />
      <div className="cart-copy">
        <span className="product-category">{product?.category || 'Unavailable'}</span>
        <h3>{product?.name || 'Unavailable product'}</h3>
        {unavailable ? <p>This product no longer exists. Remove it before checkout.</p> : <p>{formatINR(product.price)} each · {product.stock} in stock</p>}
        <button className="text-button danger-text" onClick={remove} disabled={isBusy || !product?._id} type="button">{busy === 'removing' ? 'Removing…' : 'Remove'}</button>
      </div>
      {!unavailable && (
        <div className="quantity-control" aria-label={`Quantity for ${product.name}`}>
          <button type="button" onClick={() => changeQuantity(item.quantity - 1)} disabled={isBusy || item.quantity <= 1}>−</button>
          <strong>{item.quantity}</strong>
          <button type="button" onClick={() => changeQuantity(item.quantity + 1)} disabled={isBusy || item.quantity >= product.stock}>+</button>
        </div>
      )}
      <strong className="cart-line-total">{unavailable ? 'Unavailable' : formatINR(product.price * item.quantity)}</strong>
    </article>
  );
}
