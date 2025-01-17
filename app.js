import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import express from "express";
import jwt from "jsonwebtoken";
import { expressjwt } from "express-jwt";

const app = express();
const port = 3000;

if (!process.env.SECRET) {
  console.log("no secret");
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

// return a jwt token on successful authentication
app.get("/getToken", (req, res) => {
  const payload = { username: "exampleUser" }; // Customize payload as needed
  const token = jwt.sign(payload, process.env.SECRET, {
    expiresIn: "10m",
    algorithm: "HS256",
  }); // Token expires in 10 minutes
  res.json({ token });
});

// validate jwts
const validateJwt = expressjwt({
  secret: process.env.SECRET, // Same secret key used for signing tokens
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

app.get("/", (req, res) => {
  res.send("<h1>hello</h1>");
});

// jwt protected read, update, delete operations, output to .json file, return the affected object
app.post("/cards/create", validateJwt, (req, res) => {});
app.put("/cards/:id", validateJwt, (req, res) => {});
app.delete("/cards/:id", validateJwt, (req, res) => {});

// read stuff
app.get("/cards/count", validateJwt, (req, res) => {
  const thing = req.headers.authorization;
  console.log(thing);
  res.send("<h1>test</h1>");
});
app.get("/cards/random", (req, res) => {});
app.get("/cards?", (req, res) => {});

// read stuff but special (go through properties of cards maybe?)
app.get("/sets", (req, res) => {});
app.get("/types", (req, res) => {});
app.get("/rarities", (req, res) => {});

// start server
app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
