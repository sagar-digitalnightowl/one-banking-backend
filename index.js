import { config } from "dotenv";
import express from "express";
config();
import connectToDB from "./config/DB_connection.js";
import routes from "./routes/index.js";
import cookieParser from "cookie-parser";
import cors from 'cors'

const app = express();

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`${port} : Server start successfully`);
});

const allowedOrigins = process.env.ALLOWED_CLIENT.split(",").map((origin) =>
  origin.trim()
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1", routes);

connectToDB();

app.get("/", (req, res) => {
  return res.send("<h1>One banking Backend Server</h1>");
});
