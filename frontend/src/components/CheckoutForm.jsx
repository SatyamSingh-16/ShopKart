const fields = [
  ['fullName', 'Full Name', 'text', 'Aarav Sharma'],
  ['phone', 'Phone Number', 'tel', '9876543210'],
  ['addressLine1', 'Address Line', 'text', '22 MG Road'],
  ['city', 'City', 'text', 'Bengaluru'],
  ['state', 'State', 'text', 'Karnataka'],
  ['pincode', 'Pincode', 'text', '560001'],
];

export default function CheckoutForm({ form, errors, onChange, disabled }) {
  return (
    <div className="checkout-form">
      <h2>Shipping Details</h2>
      <div className="checkout-fields">
        {fields.map(([name, label, type, placeholder]) => (
          <label key={name} className={name === 'addressLine1' ? 'field-wide' : ''}>
            <span>{label}</span>
            <input
              name={name}
              type={type}
              value={form[name]}
              placeholder={placeholder}
              onChange={onChange}
              disabled={disabled}
              inputMode={name === 'phone' || name === 'pincode' ? 'numeric' : undefined}
            />
            {errors[name] && <small className="field-error">{errors[name]}</small>}
          </label>
        ))}
      </div>
    </div>
  );
}
