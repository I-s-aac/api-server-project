import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import express from "express";
import jwt from "jsonwebtoken";
import { expressjwt } from "express-jwt";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

// return a jwt token on successful authentication
app.get("/getToken", (req, res) => {});

// validate incoming jwts for protected routes
console.log("replace this");

// error handling
console.log("replace this");

// jwt protected read, update, delete operations, output to .json file, return the affected object
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
