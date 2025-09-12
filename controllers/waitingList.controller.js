import axios from "axios";
import UserModel from "../models/User.model.js";
import VerificationTokenModel from "../models/VerificationToken.model.js";
import { v4 as uuid } from "uuid";
import { generateUniqueReferralCode } from "../utils/referralCode.js";
import { sendEmail } from "../utils/nodemailer.js";

export const sendVerificationEmail = async (req, res) => {
  try {
    const { origin, email, fingerprint, ref } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const userExist = await UserModel.findOne({ email });

    if (userExist) {
      return res.status(409).json({
        success: false,
        userExist: true,
        userDetails: !!userExist.fullName,
        isVerified: userExist.isVerified,
        claimedGift: userExist.claimedGift,
        message: "User already registered",
      });
    }

    if (!fingerprint) {
      console.log("Browser fingerprint not receive");
      return res.status(400).json({
        message: "Something went wrong. Please try again.",
      });
    }

    const fingerPrintMatch = await UserModel.findOne({ fingerprint });
    if (fingerPrintMatch) {
      return res.status(400).json({
        message: "This device has already been used to claim a gift.",
      });
    }

    const ipMatch = await UserModel.findOne({ ip });
    if (ipMatch) {
      return res.status(400).json({
        message: "A gift has already been claimed from this network.",
      });
    }

    let token = "";
    let unique = false;

    while (!unique) {
      token = uuid();
      const exist = await VerificationTokenModel.findOne({ token });
      if (!exist) unique = true;
    }

    const baseUrl = origin || "https://wait.onebanking.app";
    const verificationLink = ref
      ? `${baseUrl}/welcome/${token}?ref=${ref}`
      : `${baseUrl}/welcome/${token}`;

    try {
      const hubspotUrl = `https://api.hsforms.com/submissions/v3/integration/submit/${process.env.HUBSPOT_PORTAL_ID}/${process.env.HUBSPOT_FORM_ID}`;
      const payload = {
        fields: [
          { name: "email", value: email },
          { name: "link", value: verificationLink },
        ],
      };

      await axios.post(hubspotUrl, payload);
    } catch (hubspotError) {
      console.error(
        "HubSpot API Error:",
        hubspotError.response?.data || hubspotError.message
      );
      return res.status(502).json({
        success: false,
        message: "Failed to send verification email",
        error: hubspotError.response?.data || hubspotError.message,
      });
    }

    await VerificationTokenModel.create({ email, token });

    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending verification email",
      error: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const tokenDoc = await VerificationTokenModel.findOne({ token });

    if (!tokenDoc) {
      return res.status(410).json({
        success: false,
        message: "Link expired or invalid",
      });
    }

    const { email } = tokenDoc;

    let user = await UserModel.findOne({ email });

    const referralCode = await generateUniqueReferralCode();

    if (!user) {
      user = await UserModel.create({
        email,
        referralCode,
        isVerified: true,
      });
    } else {
      user = await UserModel.findOneAndUpdate(
        { email },
        { isVerified: true, referralCode },
        { new: true }
      );
    }

    await VerificationTokenModel.deleteOne({ token });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user,
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while verifying email",
      error: error.message,
    });
  }
};

export const saveUserInfo = async (req, res) => {
  try {
    const {
      email,
      fullName,
      countryCode,
      phone,
      referredBy,
      fingerprint,
      agreedOnUpdates,
    } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    if (
      !email ||
      !fullName ||
      !countryCode ||
      !phone ||
      !fingerprint ||
      !ip ||
      !agreedOnUpdates
    ) {
      return res.status(400).json({
        message: "Fill all mandatory feilds.",
      });
    }

    const userexist = await UserModel.findOne({ email });
    if (!userexist) {
      return res.status(404).json({
        message: "User not found!",
      });
    }

    let whoReferred = null;
    if (referredBy) {
      whoReferred = await UserModel.findOne({ referralCode: referredBy });
    }

    try {
      const url = `https://api.hsforms.com/submissions/v3/integration/submit/${process.env.HUBSPOT_PORTAL_ID}/${process.env.HUBSPOT_FORM2_ID}`;

      const data = {
        fields: [
          {
            name: "email",
            value: email,
          },
          {
            name: "full_name",
            value: fullName,
          },
          {
            name: "country_code",
            value: countryCode,
          },
          {
            name: "phone",
            value: phone,
          },
          {
            name: "referral_code",
            value: userexist.referralCode,
          },
          {
            name: "referred_by",
            value: referredBy,
          },
          {
            name: "referred_by_name",
            value: whoReferred?.fullName || "",
          },
          {
            name: "referred_by_email",
            value: whoReferred?.email || "",
          },
          {
            name: "fingerprint",
            value: fingerprint,
          },
          {
            name: "ip",
            value: ip,
          },
          {
            name: "agreed_on_updates",
            value: agreedOnUpdates,
          },
        ],
      };

      await axios.post(url, data);
    } catch (hubspotError) {
      console.error(
        "HubSpot API Error:",
        hubspotError.response?.data || hubspotError.message
      );
      return res.status(502).json({
        success: false,
        message: "Failed to save user data",
        error: hubspotError.response?.data || hubspotError.message,
      });
    }

    const user = await UserModel.findOneAndUpdate(
      { email },
      {
        email,
        fullName,
        countryCode,
        phone,
        referredBy,
        referredByName: whoReferred?.fullName,
        referredByEmail: whoReferred?.email,
        fingerprint,
        ip,
        agreedOnUpdates,
      }
    );

    return res.status(200).json({
      success: true,
      user,
      message: "User information updated successfully",
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while verifying email",
      error: error.message,
    });
  }
};

export const giftClaimed = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOneAndUpdate(
      { email },
      { giftClaimed: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    if (user.referredByEmail) {
      const referrerUser = await UserModel.findOne({
        email: user.referredByEmail,
      });

      if (referrerUser) {
        try {
          await sendEmail(
            referrerUser.email,
            "🎉 Great news — your friend just claimed their gift!",
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <title>Referral Reward Email</title>
            </head>
            <body>
              <p>Dear ${referrerUser.fullName},</p>

              <p>
                Great news — your friend ${user.fullName} (${user.email}) has just claimed their welcome gift using your referral!
              </p>

              <p>
                This means you’re now eligible for your own special reward 🎁
              </p>

              <p>
                Thanks for helping us grow our community and shape the future of AI-powered banking.
              </p>

              <p>
                Warm regards,<br>
                Your oneBanking Team 💚
              </p>
            </body>
            </html>
            `
          );
        } catch (err) {
          console.error("Failed to send referral email:", err);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Gifts claimed!",
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while claiming gift",
      error: error.message,
    });
  }
};

export const getUserCount = async (req, res) => {
  try {
    const userCount = await UserModel.countDocuments();

    return res.status(200).json({
      success: true,
      userCount,
      message: "user count fetch successfully",
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const totalCount = await UserModel.countDocuments();
    const totalPage = Math.ceil(totalCount / limit);

    const allUsers = await UserModel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      allUsers,
      totalCount,
      totalPage,
      message: "Users fetch successfully",
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
      message: "User fetch successfully",
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
