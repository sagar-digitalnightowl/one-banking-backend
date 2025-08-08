import UserModel from "../models/User.model.js";
import crypto from "crypto";

export const generateUniqueReferralCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = crypto.randomBytes(6).toString("base64url"); // URL-safe base64
    exists = await UserModel.exists({ referralCode: code });
  }

  return code;
};
