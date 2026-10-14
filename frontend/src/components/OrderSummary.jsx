const formatINR = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function OrderSummary({ items, subtotal, title = 'Order Summary' }) {
  return (
    <aside className="order-summary">
      <h2>{title}</h2>
      <div className="summary-lines">
        {items.map((item) => (
          <div className="summary-row" key={item.product?._id || item.name}>
            <span>{item.product?.name || item.name} × {item.quantity}</span>
            <strong>{formatINR((item.product?.price ?? item.price) * item.quantity)}</strong>
          </div>
        ))}
      </div>
      <div className="summary-total"><span>Total</span><strong>{formatINR(subtotal)}</strong></div>
    </aside>
  );
}
