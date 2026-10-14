const crypto = require('crypto');
const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const getRazorpayClient = require('../config/razorpay');

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const validateShippingAddress = (shippingAddress) => {
  const fields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
  if (!shippingAddress || !fields.every((field) => hasText(shippingAddress[field]))) {
    return 'All shipping fields are required';
  }

  const phone = shippingAddress.phone.replace(/[\s-]/g, '');
  if (!/^\+?\d{10,15}$/.test(phone)) {
    return 'Phone number must contain 10 to 15 digits';
  }
  if (!/^\d{6}$/.test(shippingAddress.pincode.trim())) {
    return 'Pincode must contain 6 digits';
  }
  return '';
};

const cleanShippingAddress = (shippingAddress) => ({
  fullName: shippingAddress.fullName.trim(),
  phone: shippingAddress.phone.trim(),
  addressLine1: shippingAddress.addressLine1.trim(),
  city: shippingAddress.city.trim(),
  state: shippingAddress.state.trim(),
  pincode: shippingAddress.pincode.trim(),
});

const createPaymentOrder = async (req, res) => {
  let shopKartOrder = null;
  try {
    const { shippingAddress } = req.body ?? {};
    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) {
      return res.status(400).json({ success: false, message: addressError });
    }

    // Validate payment configuration before persisting a pending order.
    const razorpay = getRazorpayClient();

    const customer = await Customer.findById(req.user._id).select('cart');
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!customer.cart.length) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    const productIds = customer.cart.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productsById = new Map(products.map((product) => [product._id.toString(), product]));

    const items = [];
    let totalAmount = 0;
    for (const cartItem of customer.cart) {
      const product = productsById.get(cartItem.product.toString());
      if (!product) {
        return res.status(400).json({ success: false, message: 'A product in your cart no longer exists' });
      }
      if (cartItem.quantity > product.stock) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }

      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image,
      });
      totalAmount += product.price * cartItem.quantity;
    }

    shopKartOrder = await Order.create({
      user: req.user._id,
      items,
      shippingAddress: cleanShippingAddress(shippingAddress),
      totalAmount,
      paymentStatus: 'PENDING',
      status: 'PENDING_PAYMENT',
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: shopKartOrder._id.toString(),
    });

    shopKartOrder.razorpayOrderId = razorpayOrder.id;
    await shopKartOrder.save();

    return res.status(201).json({
      success: true,
      shopKartOrderId: shopKartOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    if (error.code === 'RAZORPAY_NOT_CONFIGURED') {
      return res.status(503).json({
        success: false,
        message: 'Razorpay Test Mode is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env.',
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Invalid order data' });
    }
    console.error('Create payment order error:', error);
    return res.status(502).json({ success: false, message: 'Unable to create payment order. Your cart is unchanged.' });
  }
};

const signaturesMatch = (expected, provided) => {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const providedBuffer = Buffer.from(provided, 'utf8');
  return expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer);
};

const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body ?? {};

    if (![shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature].every(hasText)) {
      return res.status(400).json({ success: false, message: 'Payment verification data is incomplete' });
    }
    if (!mongoose.isValidObjectId(shopKartOrderId)) {
      return res.status(400).json({ success: false, message: 'Invalid ShopKart order ID' });
    }
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ success: false, message: 'Razorpay Test Mode is not configured' });
    }

    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({ success: true, message: 'Payment already verified', order });
    }
    if (!order.razorpayOrderId || razorpay_order_id !== order.razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'Razorpay order ID does not match this ShopKart order' });
    }

    // Use the trusted Razorpay order ID stored in MongoDB, not a browser-supplied value.
    const body = `${order.razorpayOrderId}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (!signaturesMatch(expectedSignature, razorpay_signature)) {
      order.paymentStatus = 'FAILED';
      await order.save();
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    order.paymentStatus = 'PAID';
    order.status = 'PLACED';
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Cart is cleared only after signature verification succeeds.
    await Customer.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });

    return res.status(200).json({ success: true, message: 'Payment verified and order placed', order });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ success: false, message: 'Unable to verify payment' });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1, _id: -1 }).lean();
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load orders' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    // Including user in the query enforces ownership without revealing another user's order.
    const order = await Order.findOne({ _id: id, user: req.user._id }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load order' });
  }
};

module.exports = { createPaymentOrder, verifyPayment, getOrders, getOrderById };
