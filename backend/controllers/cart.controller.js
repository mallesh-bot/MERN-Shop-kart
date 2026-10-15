const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

const helperGetCleanCart = (customer) => {
  return (customer.cart || []).filter((item) => item.product !== null);
};

const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const existingItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: 'Requested quantity exceeds available stock',
        });
      }
      existingItem.quantity = newQuantity;
    } else {
      if (product.stock < 1) {
        return res.status(400).json({
          success: false,
          message: 'Requested quantity exceeds available stock',
        });
      }
      customer.cart.push({ product: productId, quantity: 1 });
    }

    await customer.save();
    await customer.populate({
      path: 'cart.product',
      select: 'name price category image stock',
    });

    const cleanCart = helperGetCleanCart(customer);

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: cleanCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while adding product to cart',
    });
  }
};

const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name price category image stock',
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const cleanCart = helperGetCleanCart(customer);

    return res.status(200).json({
      success: true,
      cart: cleanCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching cart',
    });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (numQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity exceeds available stock',
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const existingItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart',
      });
    }

    existingItem.quantity = numQty;
    await customer.save();
    await customer.populate({
      path: 'cart.product',
      select: 'name price category image stock',
    });

    const cleanCart = helperGetCleanCart(customer);

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: cleanCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while updating cart quantity',
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const existsInCart = customer.cart.some(
      (item) => item.product.toString() === productId
    );

    if (!existsInCart) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart',
      });
    }

    customer.cart = customer.cart.filter(
      (item) => item.product.toString() !== productId
    );
    await customer.save();
    await customer.populate({
      path: 'cart.product',
      select: 'name price category image stock',
    });

    const cleanCart = helperGetCleanCart(customer);

    return res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart: cleanCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while removing product from cart',
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
};
