const express = require('express');
const protect = require('../middlewares/auth.middleware');
const { getCart, addToCart, updateCartQuantity, removeFromCart } = require('../controllers/cart.controller');

const router = express.Router();
router.use(protect);
router.get('/', getCart);
router.post('/:productId', addToCart);
router.patch('/:productId', updateCartQuantity);
router.delete('/:productId', removeFromCart);

module.exports = router;
