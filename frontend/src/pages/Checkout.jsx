import { useState } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createPaymentOrder, verifyPayment, errorMessage } from '../services/api';
import CheckoutForm from '../components/CheckoutForm';
import OrderSummary from '../components/OrderSummary';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { user } = useOutletContext();
  const { cartItems, subtotal, clearLocalCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else {
      const cleanPhone = form.phone.replace(/[\s-]/g, '');
      if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
        errs.phone = 'Enter a valid 10-15 digit phone number';
      }
    }

    if (!form.addressLine1.trim()) errs.addressLine1 = 'Address line is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state.trim()) errs.state = 'State is required';
    if (!form.pincode.trim()) {
      errs.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(form.pincode.trim())) {
      errs.pincode = 'Pincode must be exactly 6 digits';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (checkoutError) setCheckoutError('');
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (cartItems.length === 0) {
      setCheckoutError('Your cart is empty. Please add items before checking out.');
      return;
    }

    setSubmitting(true);
    setCheckoutError('');

    try {
      // 1. Create order on backend & Razorpay
      const { data } = await createPaymentOrder({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        addressLine1: form.addressLine1.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      });

      const { shopKartOrderId, razorpayOrderId, amount, currency, key } = data;

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key,
        amount,
        currency,
        name: 'ShopKart',
        description: `Order #${shopKartOrderId.slice(-6).toUpperCase()}`,
        order_id: razorpayOrderId,
        prefill: {
          name: form.fullName.trim(),
          email: user?.email || '',
          contact: form.phone.trim(),
        },
        theme: {
          color: '#102d2c',
        },
        handler: async (response) => {
          try {
            // 4. Verify payment signature on backend
            await verifyPayment({
              shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // 5. Clear frontend cart context and navigate to success
            clearLocalCart();
            navigate(`/order-success/${shopKartOrderId}`, { replace: true });
          } catch (verifyErr) {
            setCheckoutError(
              errorMessage(verifyErr, 'Payment verification failed. Please contact support.')
            );
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', (failedRes) => {
        setCheckoutError(failedRes.error?.description || 'Payment was declined.');
        setSubmitting(false);
      });
      razorpayInstance.open();
    } catch (err) {
      setCheckoutError(
        errorMessage(err, 'Unable to initiate checkout. Please try again.')
      );
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="center-state">
        <p className="page-alert mb-4">Your cart is empty.</p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Secure Checkout</h1>
          <p className="page-desc">Enter your delivery address to complete your order</p>
        </div>
      </div>

      {checkoutError && (
        <div className="page-alert mb-4" role="alert">
          {checkoutError}
        </div>
      )}

      <form onSubmit={handlePay} className="checkout-layout">
        <div className="checkout-form-column">
          <CheckoutForm
            form={form}
            errors={errors}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>

        <div className="checkout-summary-column">
          <OrderSummary items={cartItems} subtotal={subtotal} />

          <button
            type="submit"
            className="btn btn-primary btn-large btn-block mt-4"
            disabled={submitting}
          >
            {submitting ? 'Preparing Payment…' : 'Proceed to Razorpay Payment →'}
          </button>

          <p className="security-notice">
            🔒 Encrypted 256-bit SSL · Razorpay Test Mode Checkout
          </p>
        </div>
      </form>
    </div>
  );
}
