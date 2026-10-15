const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

const addToWishlist = async (req, res) => {
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

    const isDuplicate = customer.wishlist.some(
      (id) => id.toString() === productId
    );

    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: 'Product already in wishlist',
      });
    }

    customer.wishlist.push(productId);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while adding product to wishlist',
    });
  }
};

const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name price category image stock description',
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const activeWishlist = (customer.wishlist || []).filter(
      (product) => product !== null
    );

    return res.status(200).json({
      success: true,
      count: activeWishlist.length,
      wishlist: activeWishlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching wishlist',
    });
  }
};

const removeFromWishlist = async (req, res) => {
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

    const existsInWishlist = customer.wishlist.some(
      (id) => id.toString() === productId
    );

    if (!existsInWishlist) {
      return res.status(404).json({
        success: false,
        message: 'Product not in wishlist',
      });
    }

    customer.wishlist = customer.wishlist.filter(
      (id) => id.toString() !== productId
    );
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while removing product from wishlist',
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
};
