const mongoose = require('mongoose');
const Product = require('../models/product.model');

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    if (
      !name ||
      !description ||
      price === undefined ||
      price === null ||
      !category ||
      !image ||
      stock === undefined ||
      stock === null
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, description, price, category, image, stock) are required',
      });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a number greater than 0',
      });
    }

    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a non-negative number',
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: numPrice,
      category: category.trim(),
      image: image.trim(),
      stock: numStock,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while creating product',
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const query = {};

    if (search && search.trim() !== '') {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
      query.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    }

    const products = await Product.find(query).sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching products',
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching product',
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
};
