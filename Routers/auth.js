const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.decode(token);
    if (!decoded) {
      return res.status(403).json({ message: "Failed to decode token" });
    }

    const secretKey = decoded.isAdmin
      ? process.env.SECRET_KEY_ADMIN
      : process.env.SECRET_KEY_USER;

    const verified = jwt.verify(token, secretKey);
    req.user = verified;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const adminAuth = async (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

module.exports = { auth, adminAuth };
