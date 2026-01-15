import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// Handle preflight requests
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(200);
  }
  next();
});

// Simple in-memory data store
interface User {
  id: string;
  username: string;
  birdList: BirdItem[];
}

interface BirdItem {
  id: string;
  name: string;
  dateAdded: string;
}

const users: User[] = [];

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const findUser = (username: string) =>
  users.find((u) => u.username === username);

// Routes
app.get("/api/health", (req, res) => {
  res.json({
    message: "Birding App API is running!",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.post("/api/login", (req, res) => {
  const { username } = req.body;

  console.log("Login attempt for username:", username);

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  let user = findUser(username);

  // Create user if doesn't exist (simple registration)
  if (!user) {
    console.log("Creating new user:", username);
    user = {
      id: generateId(),
      username,
      birdList: [],
    };
    users.push(user);
    console.log("User created. Total users:", users.length);
  } else {
    console.log("Existing user found:", user.username);
  }

  console.log(
    "All users:",
    users.map((u) => u.username)
  );

  res.json({
    user: { id: user.id, username: user.username },
    message: "Login successful",
  });
});

// User routes
app.get("/api/users", (req, res) => {
  const userList = users.map((user) => ({
    id: user.id,
    username: user.username,
    birdCount: user.birdList.length,
  }));
  res.json({ users: userList });
});

app.get("/api/users/:username", (req, res) => {
  const user = findUser(req.params.username);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    username: user.username,
    birdList: user.birdList,
    birdCount: user.birdList.length,
  });
});

// Bird list routes
app.post("/api/users/:username/birds", (req, res) => {
  const { birdName } = req.body;
  const username = req.params.username;

  console.log("Adding bird request for username:", username);
  console.log(
    "All users available:",
    users.map((u) => u.username)
  );

  const user = findUser(username);

  if (!user) {
    console.log("User not found:", username);
    return res.status(404).json({ error: "User not found" });
  }

  if (!birdName) {
    return res.status(400).json({ error: "Bird name is required" });
  }

  // Check if bird already exists in user's list
  const existingBird = user.birdList.find(bird => bird.name === birdName);
  if (existingBird) {
    return res.status(409).json({ 
      error: "Nice try, but this bird is already on your list",
      duplicate: true 
    });
  }

  const newBird: BirdItem = {
    id: generateId(),
    name: birdName,
    dateAdded: new Date().toISOString(),
  };

  user.birdList.push(newBird);

  console.log(
    "Bird added successfully. User now has",
    user.birdList.length,
    "birds"
  );

  res.json({
    bird: newBird,
    message: "Bird added successfully",
    totalCount: user.birdList.length,
  });
});

app.delete("/api/users/:username/birds/:birdId", (req, res) => {
  const user = findUser(req.params.username);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const birdIndex = user.birdList.findIndex(
    (bird) => bird.id === req.params.birdId
  );

  if (birdIndex === -1) {
    return res.status(404).json({ error: "Bird not found" });
  }

  const deletedBird = user.birdList.splice(birdIndex, 1)[0];

  res.json({
    bird: deletedBird,
    message: "Bird removed successfully",
    totalCount: user.birdList.length,
  });
});

// Leaderboard route
app.get("/api/leaderboard", (req, res) => {
  const leaderboard = users
    .map((user) => ({
      username: user.username,
      birdCount: user.birdList.length,
    }))
    .sort((a, b) => b.birdCount - a.birdCount);

  res.json({ leaderboard });
});

// Start server
app.listen(PORT, () => {
  console.log(`🐦 Birding App API server running on port ${PORT}`);
});

export default app;
