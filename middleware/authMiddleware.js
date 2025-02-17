const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { authorizationFailed } = require("../utils/common");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return authorizationFailed(res);
    }

    const token = authHeader.split(" ")[1];
    const auth = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(auth.user_id);
    if (!user || user.is_deleted) {
      return authorizationFailed(res);
    }

    req.user = auth;
    next();
  } catch (err) {
    authorizationFailed(res, err);
  }
};

module.exports = authMiddleware;
