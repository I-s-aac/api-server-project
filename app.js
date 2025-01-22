import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import express from "express";
import jwt from "jsonwebtoken";
import { expressjwt } from "express-jwt";
import fsCallback from "node:fs";
import fsPromise from "node:fs/promises";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";

const app = express();
const port = 3000;

const usersFile = path.join(__dirname, "users.json");

const getUsers = async () => {
  let data = undefined;
  try {
    data = await fsPromise.readFile(usersFile, { encoding: "utf8" });
  } catch (err) {
    console.log("error reading file: ", err);
    data = undefined;
  }

  if (data === undefined) {
    await fsPromise.writeFile(usersFile, JSON.stringify([], null, 2), {
      encoding: "utf8",
    });
    return [];
  }
  // If the file is empty, reset it to an empty array
  if (!data.trim()) {
    console.log(`${usersFile} is empty. Resetting to an empty array.`);
    await fsPromise.writeFile(usersFile, JSON.stringify([], null, 2), {
      encoding: "utf8",
    });
    return [];
  }
  const users = JSON.parse(data);

  // Validate the file content
  if (!Array.isArray(users)) {
    console.error(`${usersFile} data corrupted. Expected an array.`);
    return [];
  }

  return users; // Return parsed users array
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
    const users = await getUsers();

    const sendToken = () => {
      // Generate JWT token
      const payload = { username: username };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "3s", // Token expires in 3 seconds (for testing purposes)
        algorithm: "HS256",
      });

      res.json({ token: token });
    };

    let storedPassword = null;
    let storedUsername = null;

    let foundUser = false;
    for (const storedUser of users) {
      if (username === storedUser.username) {
        if (foundUser) {
          console.log("duplicate user exists apparently");
        }
        storedUsername = storedUser.username;
        storedPassword = storedUser.password;
        foundUser = true;
      }
    }

    if (storedUsername && storedPassword) {
      const passwordMatch = await bcrypt.compare(password, storedPassword);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      console.log("loaded a previously existing user");
      sendToken();
    } else if (true) {
      // create a user with this username and password
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        username: username,
        password: hashedPassword,
      };
      users.push(user);
      await fsPromise.writeFile(usersFile, JSON.stringify(users, null, 2), {
        encoding: "utf8",
      });
      console.log("created new user");
      sendToken();
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
  const date = new Date();
  console.log(
    `server running on port ${port} at ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
  );
});

// this exists bc testing
process.stdin.setEncoding("utf8");
process.stdin.on("data", (data) => {
  if (data.trim() === "clear users") {
    fsPromise.writeFile(usersFile, "", { encoding: "utf8" });
    console.log("clearing users");
  }
});
