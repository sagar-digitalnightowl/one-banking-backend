import mongoose from "mongoose";

const connectToDB = () => {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Database connect successfully");
    })
    .catch((err) => {
      console.log("Error in Database connection : ", err);
    });
};

export default connectToDB
