const jwt = require('jsonwebtoken');

const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401);
      throw new Error('Unauthorized: token missing');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('Unauthorized: user not found or inactive');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401);
      return next(new Error('Unauthorized: invalid or expired token'));
    }

    return next(error);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Unauthorized: login required');
  }

  if (!roles.includes(req.user.role)) {
    res.status(403);
    throw new Error('Forbidden: insufficient role permissions');
  }

  next();
};

module.exports = {
  protect,
  authorize
};
