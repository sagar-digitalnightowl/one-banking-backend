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

app.use(cors({
    origin: ["https://one-banking-landing-page.onrender.com","http://localhost:8080"],
    credentials: true
}))
app.use(cookieParser());
app.use(express.json());

app.use("/api/v1", routes);

connectToDB();

app.get("/", (req, res) => {
  return res.send("<h1>One banking Backend Server</h1>");
});
