const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

const validProductId = (id) => mongoose.isValidObjectId(id);

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!validProductId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId).select('_id').lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const alreadySaved = customer.wishlist.some((id) => id.equals(product._id));
    if (alreadySaved) {
      return res.status(409).json({ success: false, message: 'Product already in wishlist' });
    }

    customer.wishlist.push(product._id);
    await customer.save();
    return res.status(201).json({ success: true, message: 'Product added to wishlist' });
  } catch (error) {
    console.error('Add wishlist error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id)
      .select('wishlist')
      .populate({ path: 'wishlist', select: 'name price category image stock' });

    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    return res.status(200).json({
      success: true,
      count: customer.wishlist.length,
      wishlist: customer.wishlist,
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!validProductId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const index = customer.wishlist.findIndex((id) => id.toString() === productId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Product not in wishlist' });
    }

    customer.wishlist.splice(index, 1);
    await customer.save();
    return res.status(200).json({ success: true, message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Remove wishlist error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { addToWishlist, getWishlist, removeFromWishlist };
