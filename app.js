import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import express from "express";
import jwt from "jsonwebtoken";
import { expressjwt } from "express-jwt";
import fs from "fs";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";

const app = express();
const port = 3000;
const usersFile = "users.json";

const initializeUsersFile = async () => {
  try {
    // Check if the file exists
    fs.access(usersFile, (err) => {
      if (err) {
        // If the file does not exist, create it with an empty array
        console.log(`${usersFile} not found. Creating a new one.`);
        fs.writeFile(
          usersFile,
          JSON.stringify([], null, 2),
          { encoding: "utf8" },
          (err) => {
            if (err) throw err;
          }
        );
        return [];
      } else {
        console.log("file written correctly probably");
      }
    });
    console.log("test")

    // Read and parse the file
    const data = fs.readFile(usersFile, { encoding: "utf8" }, (err) => {
      if (err) throw err;
    });
    console.log(data);
    // If the file is empty, reset it to an empty array
    if (!data.trim()) {
      console.log(`${usersFile} is empty. Resetting to an empty array.`);
      fs.writeFile(
        usersFile,
        JSON.stringify([], null, 2),
        { encoding: "utf8" },
        (err) => {
          if (err) throw err;
        }
      );
      return [];
    }
    console.log("test");
    const users = JSON.parse(data);

    // Validate the file content
    if (!Array.isArray(users)) {
      console.error(`${usersFile} data corrupted. Expected an array.`);
      process.exit(1); // Exit the server
    }

    return users; // Return parsed users array
  } catch (error) {
    console.error("Error initializing users.json:", error);
    process.exit(1); // Exit the server on unexpected errors
  }
};

if (!process.env.JWT_SECRET || !process.env.USER_PASSWORD_ENCRYPTION) {
  console.log("no secret");
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

// get a jwt token
app.post(
  "/getToken",
  [
    // Validation rules
    body("username")
      .isAlphanumeric()
      .withMessage("Username must be alphanumeric")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Username is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    try {
      // console.log(fs.readFileSync("users.json", {encoding: "utf8"}));
      const users = await initializeUsersFile();
      console.log(users);
      // Simulated user validation (e.g., checking username exists in a database)
      const validUsername = "exampleUser";
      const validPasswordHash = await bcrypt.hash("examplePassword", 10); // Pre-stored hash for testing

      if (username !== validUsername) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const passwordMatch = await bcrypt.compare(password, validPasswordHash);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Generate JWT token
      const payload = { username: username };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "3s", // Token expires in 3 seconds (for testing purposes)
        algorithm: "HS256",
      });

      res.json({ token: token });
    } catch (error) {
      console.error("Error generating token:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

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
  res.json({ cardStuff: "stuff" });
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
