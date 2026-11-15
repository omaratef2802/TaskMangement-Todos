const ApiError = require("../utils/ApiError");
const util = require("util");
const jwt = require("jsonwebtoken");

const auth = async function (req, res, next) {
  try {
    const { authorization } = req.headers;
    if (!authorization)
      return next(new ApiError(403, "you must be loginFirst"));

    const decoded = await util.promisify(jwt.verify)(
      authorization,
      process.env.SECRET,
    );
    if (!decoded) return next(new ApiError(404, "invaild token "));
    req.id = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (err) {
    return next(new ApiError(404, err.message));
  }
};

const relasedTo = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return next(new ApiError(401, "you don't have access"));
    }
    next();
  };
};

module.exports = { auth, relasedTo };
