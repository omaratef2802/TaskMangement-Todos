const ApiError = require("../utils/ApiError");
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return next(new ApiError(401, "You must login first"));
    }

    const decoded = jwt.verify(authorization, process.env.SECRET);
    if (!decoded.userId) {
      return next(new ApiError(401, "Invalid token"));
    }

    req.id = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (err) {
    return next(new ApiError(401, "Invalid token or expired"));
  }
};

const relasedTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return next(new ApiError(403, "You do not have permission"));
    }
    next();
  };
};

module.exports = { auth, relasedTo };
