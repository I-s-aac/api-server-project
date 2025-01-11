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
    secret: "replace later with env variable",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 10 * 1000 },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

// return a jwt token on successful authentication
app.get("/getToken", (req, res) => {});

// error handling
console.log("replace this");

// validate incoming jwts for protected routes
console.log("replace this");

// CRUD things, only accessable with a valid jwt, return an error message or a success message and the created/updated/deleted object
// read and save these CRUD operations in some json file
app.post("/cards/create", (req, res) => {});
app.put("/cards/:id", (req, res) => {});
app.delete("/cards/:id", (req, res) => {});

// read stuff
app.get("/cards/count", (req, res) => {});
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
