import AdminModel from "../models/Admin.model.js";
import bcrypt from "bcrypt";
import { createToken } from "../utils/token.js";

export const login = async (req, res) => {
  try {
    const { userName, password } = req.body;

    const admin = await AdminModel.findOne({ userName });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid username",
      });
    }

    if (!(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({
        success: false,
        message: "Wrong password",
      });
    }

    const payload = {
      userName,
    };

    const token = createToken(payload);
    
    const cookieOptions = {
      httpOnly: process.env.NODE_ENV === "production",
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 60 * 60 * 1000,
    };

    return res.cookie("token", token, cookieOptions).status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.log("Error : ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const verifyAdminToken = async (req, res) => {
  try {
    const admin = req.admin;

    return res.status(200).json({
      success: true,
      admin,
      message: "Token verified",
    });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
