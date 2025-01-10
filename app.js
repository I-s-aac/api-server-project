import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import express from "express";
import session from "express-session";
import jwt from "jsonwebtoken";
import { expressjwt } from "express-jwt";

const app = express();
const port = 3000;

app.use(
  session({
    secret: "very secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 10 * 1000 },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.get("/getToken", (req, res) => {});
app.get("/cards?", (req, res) => {});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
