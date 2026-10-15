const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: (arr) => arr && arr.length > 0,
      message: 'An order must contain at least one item',
    },
  },
  shippingAddress: {
    type: shippingAddressSchema,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative'],
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING',
  },
  orderStatus: {
    type: String,
    enum: ['PENDING_PAYMENT', 'PLACED', 'CANCELLED', 'DELIVERED'],
    default: 'PENDING_PAYMENT',
  },
  razorpayOrderId: {
    type: String,
    trim: true,
    default: '',
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    default: '',
  },
  razorpaySignature: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', orderSchema);
