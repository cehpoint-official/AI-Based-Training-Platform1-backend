import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;
  token = req.cookies.jwt;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("-password");
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, Invalid Token");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized");
  }
});

// Simple middleware that allows requests through without authentication for now
const verifyToken = (req, res, next) => {
  // Just proceed to the next middleware/route handler
  next();
};

export { protect, verifyToken };
