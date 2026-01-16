import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, User, UserBirdList } from "./database";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// Handle preflight requests
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:3000");
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

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

// Routes
app.get("/api/health", (req, res) => {
  res.json({
    message: "Wing Watch API is running!",
    timestamp: new Date().toISOString(),
    database: "MongoDB Atlas Connected"
  });
});

// Auth routes
app.post("/api/login", async (req, res) => {
  try {
    const { username } = req.body;

    console.log("Login attempt for username:", username);

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Find or create user
    let user = await User.findOne({ username });
    let userBirdList = await UserBirdList.findOne({ username });

    if (!user) {
      console.log("Creating new user:", username);
      user = new User({ username });
      await user.save();
      
      userBirdList = new UserBirdList({
        userId: user._id,
        username: username,
        birdList: [],
        birdCount: 0
      });
      await userBirdList.save();
      console.log("User created successfully");
    } else {
      console.log("Existing user found:", user.username);
    }

    res.json({
      user: { id: user._id, username: user.username },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User routes
app.get("/api/users", async (req, res) => {
  try {
    const userBirdLists = await UserBirdList.find({}, 'username birdCount');
    const userList = userBirdLists.map((userList) => ({
      id: userList._id,
      username: userList.username,
      birdCount: userList.birdCount,
    }));
    res.json({ users: userList });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users/:username", async (req, res) => {
  try {
    const userBirdList = await UserBirdList.findOne({ username: req.params.username });
    if (!userBirdList) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: userBirdList._id,
      username: userBirdList.username,
      birdList: userBirdList.birdList,
      birdCount: userBirdList.birdCount,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Bird list routes
app.post("/api/users/:username/birds", async (req, res) => {
  try {
    const { birdName } = req.body;
    const username = req.params.username;

    console.log("Adding bird request for username:", username);

    if (!birdName) {
      return res.status(400).json({ error: "Bird name is required" });
    }

    const userBirdList = await UserBirdList.findOne({ username });

    if (!userBirdList) {
      console.log("User not found:", username);
      return res.status(404).json({ error: "User not found" });
    }

    // Check if bird already exists in user's list
    const existingBird = userBirdList.birdList.find(bird => bird.name === birdName);
    if (existingBird) {
      return res.status(409).json({ 
        error: "Nice try, but this bird is already on your list",
        duplicate: true 
      });
    }

    const newBird = {
      id: generateId(),
      name: birdName,
      dateAdded: new Date().toISOString(),
    };

    userBirdList.birdList.push(newBird);
    userBirdList.birdCount = userBirdList.birdList.length;
    await userBirdList.save();

    console.log(
      "Bird added successfully. User now has",
      userBirdList.birdCount,
      "birds"
    );

    res.json({
      bird: newBird,
      message: "Bird added successfully",
      totalCount: userBirdList.birdCount,
    });
  } catch (error) {
    console.error("Add bird error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/users/:username/birds/:birdId", async (req, res) => {
  try {
    const userBirdList = await UserBirdList.findOne({ username: req.params.username });

    if (!userBirdList) {
      return res.status(404).json({ error: "User not found" });
    }

    const birdIndex = userBirdList.birdList.findIndex(
      (bird) => bird.id === req.params.birdId
    );

    if (birdIndex === -1) {
      return res.status(404).json({ error: "Bird not found" });
    }

    const deletedBird = userBirdList.birdList.splice(birdIndex, 1)[0];
    userBirdList.birdCount = userBirdList.birdList.length;
    await userBirdList.save();

    res.json({
      bird: deletedBird,
      message: "Bird removed successfully",
      totalCount: userBirdList.birdCount,
    });
  } catch (error) {
    console.error("Delete bird error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Leaderboard route
app.get("/api/leaderboard", async (req, res) => {
  try {
    const userBirdLists = await UserBirdList.find({}, 'username birdCount')
      .sort({ birdCount: -1 });

    const leaderboard = userBirdLists.map((userList) => ({
      username: userList.username,
      birdCount: userList.birdCount,
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🐦 Wing Watch API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: MongoDB Atlas`);
});

export default app;