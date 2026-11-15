const jwt = require("jsonwebtoken");

module.exports = function generateToken(varenv, date, objSig) {
  return jwt.sign(objSig, varenv, { expiresIn: date });
};
