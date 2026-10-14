const express = require('express');
const { createProduct, getProducts, getProductById } = require('../controllers/product.controller');
const router = express.Router();

// Per Lab 03, product creation is intentionally open; Labs 04-06 do not add admin authorization.
router.post('/', createProduct);
router.get('/', getProducts);
router.get('/:id', getProductById);

module.exports = router;
