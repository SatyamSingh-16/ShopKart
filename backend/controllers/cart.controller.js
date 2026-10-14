const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

const populateCart = async (customerId) => {
  const customer = await Customer.findById(customerId).select('cart');
  if (!customer) return [];

  // Keep the original ObjectIds so a deleted product can still be removed from the cart.
  const rawProductIds = customer.cart.map((item) => item.product.toString());
  await customer.populate({ path: 'cart.product', select: 'name price category image stock' });

  return customer.cart.map((item, index) => {
    if (item.product) return item;
    return {
      product: {
        _id: rawProductIds[index],
        name: 'Unavailable product',
        category: 'Unavailable',
        image: '/images/placeholder.svg',
        price: 0,
        stock: 0,
        unavailable: true,
      },
      quantity: item.quantity,
    };
  });
};

const getCart = async (req, res) => {
  try {
    const cart = await populateCart(req.user._id);
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId).select('stock name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: `${product.name} is out of stock` });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const item = customer.cart.find((entry) => entry.product.toString() === productId);
    if (item) {
      if (item.quantity + 1 > product.stock) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} unit(s) available` });
      }
      item.quantity += 1;
    } else {
      customer.cart.push({ product: product._id, quantity: 1 });
    }

    await customer.save();
    const cart = await populateCart(customer._id);
    return res.status(200).json({ success: true, message: 'Cart updated', cart });
  } catch (error) {
    console.error('Add cart error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body ?? {};

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a whole number of at least 1' });
    }

    const product = await Product.findById(productId).select('stock name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} unit(s) available` });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const item = customer.cart.find((entry) => entry.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Product not in cart' });
    }

    item.quantity = quantity;
    await customer.save();
    const cart = await populateCart(customer._id);
    return res.status(200).json({ success: true, message: 'Cart updated', cart });
  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const index = customer.cart.findIndex((entry) => entry.product.toString() === productId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Product not in cart' });
    }

    customer.cart.splice(index, 1);
    await customer.save();
    const cart = await populateCart(customer._id);
    return res.status(200).json({ success: true, message: 'Product removed from cart', cart });
  } catch (error) {
    console.error('Remove cart error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getCart, addToCart, updateCartQuantity, removeFromCart };
