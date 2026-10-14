const Razorpay = require('razorpay');

let client = null;

const getRazorpayClient = () => {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    const error = new Error('Razorpay Test Mode keys are not configured');
    error.code = 'RAZORPAY_NOT_CONFIGURED';
    throw error;
  }
  if (!RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    const error = new Error('Only Razorpay Test Mode keys are allowed in this lab');
    error.code = 'RAZORPAY_NOT_CONFIGURED';
    throw error;
  }

  if (!client) {
    client = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  return client;
};

module.exports = getRazorpayClient;
