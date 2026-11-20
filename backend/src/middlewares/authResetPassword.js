const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const ApiError = require("../utils/ApiError");
const dbUser = require("../modules/dbUser");

const authResetPassword = (stage) => {
  return async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
      return next(new ApiError(401, "You must provide a token"));
    }

    let decoded;
    try {
      decoded = jwt.verify(
        authorization,
        process.env.RESET_PASSWORD_SECRET,
      );
    } catch (err) {
      return next(new ApiError(401, "Invalid token or expired"));
    }

    if (decoded.resetPassword !== true || !decoded.userId) {
      return next(new ApiError(401, "Invalid reset password token"));
    }

    if (stage === "verify") {
      if (decoded.otpVerified === true || !decoded.otpId) {
        return next(new ApiError(401, "Invalid or already verified OTP token"));
      }
    } else if (stage === "reset") {
      if (decoded.otpVerified !== true) {
        return next(new ApiError(401, "You must verify OTP first"));
      }

      try {
        const user = await dbUser.findById(decoded.userId).select("+resetTokenHash");
        if (!user || !user.resetTokenHash) {
          return next(new ApiError(401, "Reset token is invalid or already used"));
        }

        const isValid = await bcrypt.compare(authorization, user.resetTokenHash);
        if (!isValid) {
          return next(new ApiError(401, "Reset token is invalid or already used"));
        }
      } catch (err) {
        return next(err);
      }
    } else {
      return next(new ApiError(400, "Invalid password reset stage"));
    }

    req.id = decoded.userId;
    req.otpId = decoded.otpId;
    next();
  };
};

module.exports = { authResetPassword };
