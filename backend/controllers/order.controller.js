const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Customer = require('../models/customer.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured in environment variables');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const createPaymentOrder = async (req, res) => {
  try {
    const rawShipping = req.body.shippingAddress || req.body;
    const { fullName, phone, addressLine, city, state, pincode } = rawShipping;

    if (!fullName || !phone || !addressLine || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'All shipping fields (Full name, phone, address, city, state, pincode) are required',
      });
    }

    const trimmedFullName = String(fullName).trim();
    const trimmedPhone = String(phone).trim();
    const trimmedAddress = String(addressLine).trim();
    const trimmedCity = String(city).trim();
    const trimmedState = String(state).trim();
    const trimmedPincode = String(pincode).trim();

    if (
      !trimmedFullName ||
      !trimmedPhone ||
      !trimmedAddress ||
      !trimmedCity ||
      !trimmedState ||
      !trimmedPincode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Shipping fields cannot be empty or contain only whitespace',
      });
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number: must be exactly 10 digits',
      });
    }

    if (!/^\d{6}$/.test(trimmedPincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode: must be exactly 6 digits',
      });
    }

    const customer = await Customer.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name price image stock category',
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found',
      });
    }

    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please add items before placing an order',
      });
    }

    // Validate that all products exist and stock is sufficient
    for (const item of customer.cart) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: 'One or more items in your cart are no longer available',
        });
      }

      if (item.quantity > item.product.stock) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity for "${item.product.name}" exceeds available stock (${item.product.stock} available)`,
        });
      }
    }

    // Calculate total amount from current database prices and quantities
    const totalAmount = customer.cart.reduce((sum, item) => {
      const price = Number(item.product.price) || 0;
      const quantity = Number(item.quantity) || 1;
      return sum + price * quantity;
    }, 0);

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Order total must be greater than 0',
      });
    }

    // Build purchase-time snapshots
    const items = customer.cart.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image || '',
    }));

    const amountInPaise = Math.round(totalAmount * 100);

    // Create Razorpay order
    let razorpayOrder;
    try {
      const razorpay = getRazorpayInstance();
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${Date.now()}_${req.user._id.toString().slice(-4)}`,
      });
    } catch (rzpError) {
      console.error('Razorpay order creation error:', rzpError.message);
      return res.status(502).json({
        success: false,
        message: 'Payment gateway initialization failed. Please try again later.',
      });
    }

    // Persist pending ShopKart order
    const order = await Order.create({
      customer: req.user._id,
      items,
      shippingAddress: {
        fullName: trimmedFullName,
        phone: trimmedPhone,
        addressLine: trimmedAddress,
        city: trimmedCity,
        state: trimmedState,
        pincode: trimmedPincode,
      },
      totalAmount,
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING_PAYMENT',
      razorpayOrderId: razorpayOrder.id,
    });

    return res.status(201).json({
      success: true,
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      order,
    });
  } catch (error) {
    console.error('Error in createPaymentOrder:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating payment order',
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'All payment verification fields (orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature) are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this order',
      });
    }

    // Idempotent: If order is already PAID, return success without duplicate actions
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        order,
      });
    }

    // Ensure submitted razorpayOrderId matches the one recorded in the order
    if (order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay order ID mismatch',
      });
    }

    // Signature verification using crypto and server-side secret
    const textToSign = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(textToSign)
      .digest('hex');

    const expectedBuffer = Buffer.from(generatedSignature, 'utf-8');
    const receivedBuffer = Buffer.from(razorpaySignature, 'utf-8');

    const isMatch =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!isMatch) {
      order.paymentStatus = 'FAILED';
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature',
      });
    }

    // Valid verification: update order status
    order.paymentStatus = 'PAID';
    order.orderStatus = 'PLACED';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    await order.save();

    // Decrement product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear customer cart only after verified payment
    await Customer.findByIdAndUpdate(req.user._id, {
      $set: { cart: [] },
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order placed successfully',
      order,
    });
  } catch (error) {
    console.error('Error in verifyPayment:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying payment',
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching orders',
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching order details',
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById,
};
