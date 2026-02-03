import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

// Types
interface Bird {
  id: string;
  name: string;
  dateAdded: Date;
  userId: string;
}

interface User {
  id: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
  birds: Bird[];
}

const app = express();
const port = process.env.PORT || 3001;

// Initialize Prisma Client
const prisma = new PrismaClient();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'postgresql' });
});

// Login endpoint - create user if doesn't exist
app.post('/api/login', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { username },
      include: { birds: true }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { username },
        include: { birds: true }
      });
    }

    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        birdCount: user.birds.length 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { birds: true }
    });

    const usersWithCounts = users.map((user: User) => ({
      id: user.id,
      username: user.username,
      birdCount: user.birds.length
    }));

    res.json({ users: usersWithCounts });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { birds: true }
    });

    const leaderboard = users
      .map((user: User) => ({
        username: user.username,
        birdCount: user.birds.length
      }))
      .sort((a: { username: string; birdCount: number }, b: { username: string; birdCount: number }) => b.birdCount - a.birdCount)
      .slice(0, 10);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      include: { birds: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const birdList = user.birds.map((bird: Bird) => ({
      id: bird.id,
      name: bird.name,
      dateAdded: bird.dateAdded.toISOString()
    }));

    res.json({
      id: user.id,
      username: user.username,
      birdList,
      birdCount: user.birds.length
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add bird to user's list
app.post('/api/users/:username/birds', async (req, res) => {
  try {
    const { username } = req.params;
    const { birdName } = req.body;

    if (!birdName || birdName.trim().length === 0) {
      return res.status(400).json({ error: 'Bird name is required' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { birds: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if bird already exists
    const existingBird = user.birds.find((bird: Bird) => bird.name === birdName);
    if (existingBird) {
      return res.status(409).json({ error: 'Bird already in list' });
    }

    const bird = await prisma.bird.create({
      data: {
        name: birdName,
        userId: user.id
      }
    });

    res.json({
      id: bird.id,
      name: bird.name,
      dateAdded: bird.dateAdded.toISOString()
    });
  } catch (error) {
    console.error('Add bird error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete bird from user's list
app.delete('/api/users/:username/birds/:birdId', async (req, res) => {
  try {
    const { username, birdId } = req.params;

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.bird.deleteMany({
      where: {
        id: birdId,
        userId: user.id
      }
    });

    res.json({ message: 'Bird deleted successfully' });
  } catch (error) {
    console.error('Delete bird error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Database: PostgreSQL via Prisma`);
});