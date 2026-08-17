const jwt = require('jsonwebtoken');
const User = require('../models/User');

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email: email?.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }

    const user = await User.create({ name, email, password, role });
    const token = createToken(user._id);

    return res.status(201).json({
      success: true,
      data: { user: serializeUser(user), token },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (error.message === 'JWT_SECRET is not configured.') {
      return res.status(500).json({ success: false, message: 'Authentication is not configured' });
    }

    return res.status(500).json({ success: false, message: 'Unable to register user' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    const isPasswordValid = user && (await user.comparePassword(password));

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = createToken(user._id);
    return res.status(200).json({
      success: true,
      data: { user: serializeUser(user), token },
    });
  } catch (error) {
    if (error.message === 'JWT_SECRET is not configured.') {
      return res.status(500).json({ success: false, message: 'Authentication is not configured' });
    }

    return res.status(500).json({ success: false, message: 'Unable to log in' });
  }
};

module.exports = { register, login };
