import mongoose from "mongoose";

const verificationTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600
  }
});

export default mongoose.model("VerificationToken", verificationTokenSchema);
