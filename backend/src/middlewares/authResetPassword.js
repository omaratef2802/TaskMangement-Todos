const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const ApiError = require("../utils/ApiError");
const dbUser = require("../modules/dbUser");

const authResetPassword = (stage) => {
  return async (req, res, next) => {
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

      if (stage === "reset") {
        if (decoded.otpVerified !== true) {
          return next(new ApiError(401, "You must verify OTP first"));
        }

        const user = await dbUser.findById(decoded.userId).select("+resetTokenHash");
        if (!user || !user.resetTokenHash) {
          return next(new ApiError(401, "Reset token is invalid or already used"));
        }

        const isValid = await bcrypt.compare(authorization, user.resetTokenHash);
        if (!isValid) {
          return next(new ApiError(401, "Reset token is invalid or already used"));
        }
      }

      req.id = decoded.userId;
      next();
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      return next(new ApiError(401, "Invalid token or expired"));
    }
  };
};

module.exports = { authResetPassword };
