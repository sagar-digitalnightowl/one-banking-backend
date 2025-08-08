import { verifyToken } from "../utils/token.js";

export const auth = (req, res, next) => {
  try {
    const token =
      req?.cookies?.token || req?.headers?.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const decode = verifyToken(token);

    req.admin = decode;

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

export const isAdmin = (req, res, next) => {
  try {
    if (!req.admin.userName) {
      return res.status(403).json({
        success: false,
        message: "This is for admin only",
      });
    }
    next();
  } catch (error) {
    console.log("Error : ", error);
    return res.status(500).json({
      message: "Somenthing went wrong",
    });
  }
};
