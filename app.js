import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import express from "express";
import jwt from "jsonwebtoken";
import { expressjwt } from "express-jwt";
import fs from "fs";
import bcrypt from "bcrypt";

const app = express();
const port = 3000;
const userFile = "./users.json";

if (!process.env.JWT_SECRET || !process.env.USER_PASSWORD_ENCRYPTION) {
  console.log("no secret");
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

// return a jwt token on successful authentication
app.post("/getToken", (req, res) => {
  const { username, password } = req.body;

  bcrypt.hash(password, 10).then((hashedPassword) => {
    console.log(hashedPassword);

    const payload = { username: username };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "3s",
      algorithm: "HS256",
    });

    res.json({ token: token });
  });
});

// validate jwts
const validateJwt = expressjwt({
  secret: process.env.JWT_SECRET, // Same secret key used for signing tokens
  algorithms: ["HS256"], // Algorithm used to sign the tokens
});

// error handling
app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    // JWT validation errors
    return res.status(401).json({ message: "Invalid or missing token" });
  }
  if (err.name === "ValidationError") {
    // Example: Validation errors (if any validation logic is added later)
    return res.status(400).json({ message: err.message });
  }
  // General error handler
  res.status(500).json({ message: "Internal server error" });
});

// jwt protected create, update, delete operations, output to .json file, return the affected object
app.post("/cards/create", validateJwt, (req, res) => {});
app.put("/cards/:id", validateJwt, (req, res) => {});
app.delete("/cards/:id", validateJwt, (req, res) => {});

// read stuff
app.get("/cards", (req, res) => {
  const filter = req.query;
  console.log(filter);
  res.json({cardStuff: "stuff"});
});
app.get("/cards/random", (req, res) => {});
app.get("/cards/count", (req, res) => {});

// read stuff but special (go through properties of cards maybe?)
app.get("/sets", (req, res) => {});
app.get("/types", (req, res) => {});
app.get("/rarities", (req, res) => {});

// start server
app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
