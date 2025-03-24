const Token = require("../models/token"); // Adjust path based on your structure

const checkBlacklistedToken = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.split(" ")[1]; // Extract Bearer token

    if (!sessionToken) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    // Check if token exists in the blacklist
    const blacklistedToken = await Token.findOne({ sessionToken });

    if (blacklistedToken) {
      return res.status(401).json({ success: false, message: "The token has been logged out. Please log in again." });
    }

    next(); // Token is valid, continue with request
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = checkBlacklistedToken;
