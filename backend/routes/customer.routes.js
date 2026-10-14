const express = require('express');
const {
  registerCustomer,
  loginCustomer,
  getMyProfile,
  logoutCustomer,
} = require('../controllers/customer.controller');
const protect = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', registerCustomer);
router.post('/login', loginCustomer);
router.get('/me', protect, getMyProfile);
router.post('/logout', protect, logoutCustomer);

module.exports = router;
