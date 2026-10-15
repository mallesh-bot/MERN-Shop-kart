const bcrypt = require('bcrypt');
const Customer = require('../models/customer.model');
const generateToken = require('../utils/generateToken');

const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const formatCustomer = (customer) => ({
  _id: customer._id,
  fullName: customer.fullName,
  email: customer.email,
  phone: customer.phone,
});

const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await Customer.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: formatCustomer(customer),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(customer._id);
    res.cookie('token', token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      customer: formatCustomer(customer),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      customer: formatCustomer(req.user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const logoutCustomer = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'strict',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getMe,
  logoutCustomer,
};
