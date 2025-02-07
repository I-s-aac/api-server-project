import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import express from "express";
import jwt from "jsonwebtoken";
import { expressjwt } from "express-jwt";
import fs from "node:fs/promises";
import bcrypt from "bcrypt";
import { body, param, validationResult } from "express-validator";

const app = express();
const port = 3000;

const usersFile = path.join(__dirname, "users.json");

const getUsers = async () => {
  let data = undefined;
  try {
    data = await fs.readFile(usersFile, { encoding: "utf8" });
  } catch (err) {
    console.log("error reading file: ", err);
    data = undefined;
  }

  if (data === undefined) {
    await fs.writeFile(usersFile, JSON.stringify([], null, 2), {
      encoding: "utf8",
    });
    return [];
  }
  // If the file is empty, reset it to an empty array
  if (!data.trim()) {
    console.log(`${usersFile} is empty. Resetting to an empty array.`);
    await fs.writeFile(usersFile, JSON.stringify([], null, 2), {
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
  process.exit(1);
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
        expiresIn: "5m", // 5 minutes
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

    if (storedUsername && storedPassword && foundUser) {
      const passwordMatch = await bcrypt.compare(password, storedPassword);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      console.log("loaded a previously existing user");
      sendToken();
    } else {
      // create a user with this username and password
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        username: username,
        password: hashedPassword,
      };
      users.push(user);
      await fs.writeFile(usersFile, JSON.stringify(users, null, 2), {
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
app.post(
  "/cards/create",
  validateJwt,
  [
    // Validation rules
    body("name")
      .isAlphanumeric("en-US", { ignore: " " }) // Allow alphanumeric with spaces
      .withMessage("Name must be alphanumeric")
      .notEmpty()
      .withMessage("Name is required"),
    body("type")
      .isAlphanumeric("en-US", { ignore: " " })
      .withMessage("Type must be alphanumeric")
      .notEmpty()
      .withMessage("Type is required"),
    body("rarity")
      .isAlphanumeric("en-US", { ignore: " " })
      .withMessage("Rarity must be alphanumeric")
      .notEmpty()
      .withMessage("Rarity is required"),
    body("set")
      .isAlphanumeric("en-US", { ignore: " " })
      .withMessage("Set must be alphanumeric")
      .notEmpty()
      .withMessage("Set is required"),
    body("power")
      .isInt()
      .withMessage("Power must be an integer")
      .notEmpty()
      .withMessage("Power is required"),
    body("toughness")
      .isInt()
      .withMessage("Toughness must be an integer")
      .notEmpty()
      .withMessage("Toughness is required"),
    body("cost")
      .isInt()
      .withMessage("cost should be an integer")
      .notEmpty()
      .withMessage("cost is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let problems = [];
      for (const error of errors.errors) {
        problems.push(error.msg);
      }
      return res.status(400).json(JSON.stringify(problems));
    }
    const { name, type, rarity, set, power, toughness, cost } = req.body;

    if (!name || !type || !rarity || !set || !power || !toughness || !cost) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const cardsFile = "cards.json";

      // Read the existing cards from the file
      let cards = [];
      try {
        const data = await fs.readFile(cardsFile, { encoding: "utf8" });
        cards = JSON.parse(data);
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err; // If it's not a "file not found" error, rethrow
        }
      }

      // Generate a unique ID for the new card
      let newId;
      do {
        newId = Math.floor(Math.random() * 1000000); // Example: Random ID
      } while (cards.some((card) => card.id === newId));

      let cardNumber = 1;
      for (const card of cards) {
        if (card.cardNumber <= cardNumber) {
          cardNumber = card.cardNumber + 1;
        }
      }
      // Create the new card object
      const newCard = {
        id: newId,
        name,
        type,
        rarity,
        set,
        cardNumber,
        power,
        toughness,
        cost,
      };

      // Add the new card to the array
      cards.push(newCard);
      // Save the updated cards array back to the file
      await fs.writeFile(cardsFile, JSON.stringify(cards, null, 2), {
        encoding: "utf8",
      });
      // Respond with the newly created card
      res.status(201).json(newCard);
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
app.put(
  "/cards/:id",
  validateJwt,
  [
    // Validation rules
    param("id")
      .isInt()
      .withMessage("id must be an int")
      .notEmpty()
      .withMessage("id is required"),
    body("name")
      .isAlphanumeric("en-US", { ignore: " " }) // Allow alphanumeric with spaces
      .withMessage("Name must be alphanumeric")
      .notEmpty()
      .withMessage("Name is required"),
    body("type")
      .isAlphanumeric("en-US", { ignore: " " })
      .withMessage("Type must be alphanumeric")
      .notEmpty()
      .withMessage("Type is required"),
    body("rarity")
      .isAlphanumeric("en-US", { ignore: " " })
      .withMessage("Rarity must be alphanumeric")
      .notEmpty()
      .withMessage("Rarity is required"),
    body("set")
      .isAlphanumeric("en-US", { ignore: " " })
      .withMessage("Set must be alphanumeric")
      .notEmpty()
      .withMessage("Set is required"),
    body("power")
      .isInt()
      .withMessage("Power must be an integer")
      .notEmpty()
      .withMessage("Power is required"),
    body("toughness")
      .isInt()
      .withMessage("Toughness must be an integer")
      .notEmpty()
      .withMessage("Toughness is required"),
    body("cost")
      .isInt()
      .withMessage("cost should be an integer")
      .notEmpty()
      .withMessage("cost is required"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let problems = [];
      for (const error of errors.errors) {
        problems.push(error.msg);
      }
      return res.status(400).json(JSON.stringify(problems));
    }
    const { name, type, rarity, set, power, toughness, cost } = req.body;
    const id = req.params.id;

    if (
      !id ||
      !name ||
      !type ||
      !rarity ||
      !set ||
      !power ||
      !toughness ||
      !cost
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }
  }
);
app.delete("/cards/:id", validateJwt, async (req, res) => {
  const cardId = Number(req.params.id);
  const cardsFile = "cards.json";

  // Read the existing cards from the file
  let cards = [];
  try {
    const data = await fs.readFile(cardsFile, { encoding: "utf8" });
    cards = JSON.parse(data);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err; // If it's not a "file not found" error, rethrow
    }
  }

  let removedCard;
  cards = cards.filter((card) => {
    if (card.id === cardId) {
      removedCard = card;
    }
    return card.id !== cardId;
  });

  try {
    await fs.writeFile(cardsFile, JSON.stringify(cards, null, 2), {
      encoding: "utf8",
    });
    // Respond with the deleted card
    res.status(201).json(removedCard);
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// read stuff
app.get("/cards", async (req, res) => {
  const { name, type, rarity, set, power, toughness, returnSpecial } =
    req.query;

  try {
    // Read the cards.json file
    const data = await fs.readFile(path.join(__dirname, "cards.json"), {
      encoding: "utf8",
    });

    const cards = JSON.parse(data); // Parse the JSON data into an array
    let filteredCards;
    if (returnSpecial) {
      switch (returnSpecial) {
        case "all": {
          filteredCards = cards;
          break;
        }
        case "sets": {
          filteredCards = [];
          for (const card of cards) {
            if (!filteredCards.some((fCard) => fCard === card.set)) {
              filteredCards.push(card.set);
            }
          }
          break;
        }
        case "types": {
          filteredCards = [];
          for (const card of cards) {
            if (!filteredCards.some((fCard) => fCard === card.type)) {
              filteredCards.push(card.type);
            }
          }
          break;
        }
        case "random": {
          filteredCards = [cards[Math.floor(Math.random() * cards.length)]];
          break;
        }
        case "count": {
          filteredCards = [cards.length];
          break;
        }
        case "rarities": {
          filteredCards = [];
          for (const card of cards) {
            if (!filteredCards.some((fCard) => fCard === card.rarity)) {
              filteredCards.push(card.rarity);
            }
          }
          break;
        }
        default: {
          console.log("invalid request");
          res.status(400).json({
            error: "invalid special for request",
          });
          break;
        }
      }
    } else {
      filteredCards = cards.filter(
        (card) =>
          (name && card.name && card.name.toLowerCase() === name) ||
          (type && card.type && card.type.toLowerCase() === type) ||
          (rarity && card.rarity && card.rarity.toLowerCase() === rarity) ||
          (set && card.set && card.set.toLowerCase() === set) ||
          (power && card.power && card.power.toString() === power) ||
          (toughness &&
            card.toughness &&
            card.toughness.toString() === toughness)
      );
    }

    // Return the filtered array of cards
    res.json(filteredCards);
  } catch (err) {
    console.error("Error reading cards.json:", err);
    res.status(500).json({ error: "Failed to retrieve cards" });
  }
});
app.get("/cards/random", (req, res) => {});
app.get("/cards/count", (req, res) => {});

// read stuff but special
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
    fs.writeFile(usersFile, "", { encoding: "utf8" });
    console.log("users cleared");
  }
});
