const bcrypt = require('bcrypt');
const Customer = require('../models/customer.model');
const generateToken = require('../utils/generateToken');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const publicCustomer = (customer) => ({
  _id: customer._id,
  fullName: customer.fullName,
  email: customer.email,
  phone: customer.phone,
});

const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body ?? {};
    if (![fullName, email, password, phone].every(hasText)) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (await Customer.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = await Customer.create({
      fullName: fullName.trim(), email: normalizedEmail, password: hashedPassword, phone: phone.trim(),
    });
    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: publicCustomer(customer),
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Email already exists' });
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Invalid customer data' });
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!hasText(email) || !hasText(password)) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const customer = await Customer.findOne({ email: email.trim().toLowerCase() });
    const valid = customer && await bcrypt.compare(password, customer.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = generateToken(customer._id.toString());
    res.cookie('token', token, cookieOptions);
    return res.status(200).json({
      success: true, message: 'Login successful', customer: publicCustomer(customer),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMyProfile = (req, res) => res.status(200).json(publicCustomer(req.user));

const logoutCustomer = (req, res) => {
  // clearCookie must match the path/sameSite/secure options of the login cookie.
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

module.exports = { registerCustomer, loginCustomer, getMyProfile, logoutCustomer };
