const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT || 5003);
const JWT_SECRET = process.env.JWT_SECRET || "task07_super_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

app.use(cors());
app.use(express.json());

let nextId = 4;
const users = [
  { userId: "1", username: "student1", password: "123456", role: "student" },
  { userId: "2", username: "teacher1", password: "123456", role: "teacher" },
  { userId: "3", username: "admin1", password: "123456", role: "admin" }
];

const publicUser = (user) => ({ userId: user.userId, username: user.username, role: user.role });

const issueToken = (user) => jwt.sign(publicUser(user), JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided" });
  }
  try {
    req.user = jwt.verify(authHeader.slice(7), JWT_SECRET);
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Authentication Service is running" });
});

app.post("/auth/register", (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: "username, password and role are required" });
  }
  if (!["student", "teacher", "admin"].includes(role)) {
    return res.status(400).json({ success: false, message: "role must be student, teacher, or admin" });
  }
  if (users.some((u) => u.username === username)) {
    return res.status(409).json({ success: false, message: "Username already exists" });
  }
  const user = { userId: String(nextId++), username, password, role };
  users.push(user);
  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: publicUser(user),
    token: issueToken(user)
  });
});

app.post("/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required" });
  }
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid username or password" });
  }
  return res.status(200).json({
    success: true,
    message: "Login successful",
    token: issueToken(user),
    data: publicUser(user)
  });
});

app.get("/auth/profile", verifyToken, (req, res) => {
  res.status(200).json({ success: true, message: "Protected profile data", user: req.user });
});

app.get("/auth/users", (req, res) => {
  res.status(200).json({ success: true, count: users.length, data: users.map(publicUser) });
});

app.listen(PORT, () => {
  console.log(`Authentication Service running on port ${PORT}`);
});
