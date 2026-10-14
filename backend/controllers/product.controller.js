const mongoose = require('mongoose');
const Product = require('../models/product.model');

// Escape regex metacharacters so a search like "[" is treated as literal text.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const present = (value) => typeof value === 'string' && value.trim().length > 0;

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body ?? {};
    if (![name, description, category, image].every(present) ||
        typeof price !== 'number' || !Number.isFinite(price) || price <= 0 ||
        typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, category, image, positive numeric price and non-negative integer stock are required',
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price,
      category: category.trim(),
      image: image.trim(),
      stock,
    });
    return res.status(201).json({ success: true, product });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Invalid product data' });
    }
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getProducts = async (req, res) => {
  try {
    const { search = '', category = '', sort = '' } = req.query;
    if ([search, category, sort].some((value) => typeof value !== 'string')) {
      return res.status(400).json({ success: false, message: 'Query parameters must be strings' });
    }
    if (sort && !['price_asc', 'price_desc'].includes(sort)) {
      return res.status(400).json({ success: false, message: 'Invalid sort value' });
    }

    const filter = {};
    if (search.trim()) filter.name = { $regex: escapeRegex(search.trim()), $options: 'i' };
    if (category.trim()) filter.category = { $regex: `^${escapeRegex(category.trim())}$`, $options: 'i' };

    const sortOrder = sort === 'price_asc' ? { price: 1, _id: 1 }
      : sort === 'price_desc' ? { price: -1, _id: 1 }
      : { createdAt: -1, _id: -1 };

    const [products, categories] = await Promise.all([
      Product.find(filter).select('name price category image stock').sort(sortOrder).lean(),
      Product.distinct('category'),
    ]);
    return res.status(200).json({
      success: true,
      count: products.length,
      products,
      categories: categories.sort((a, b) => a.localeCompare(b)),
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { createProduct, getProducts, getProductById };
