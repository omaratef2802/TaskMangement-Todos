const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

const authResetPassword = (stage) => {
  return (req, res, next) => {
    try {
      const { authorization } = req.headers;

      if (!authorization) {
        return next(new ApiError(401, "You must provide a token"));
      }

      const decoded = jwt.verify(
        authorization,
        process.env.RESET_PASSWORD_SECRET,
      );

      if (decoded.resetPassword !== true || !decoded.userId) {
        return next(new ApiError(401, "Invalid reset password token"));
      }

      if (stage === "verify" && decoded.otpVerified === true) {
        return next(new ApiError(401, "OTP already verified"));
      }

      if (stage === "reset" && decoded.otpVerified !== true) {
        return next(new ApiError(401, "You must verify OTP first"));
      }

      req.id = decoded.userId;
      next();
    } catch (err) {
      return next(new ApiError(401, "Invalid token or expired"));
    }
  };
};

module.exports = { authResetPassword };
