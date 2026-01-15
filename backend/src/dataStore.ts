import { User, BirdSighting, LeaderboardEntry } from "./types";

// In-memory storage (replace with database in production)
class DataStore {
  private users: User[] = [];
  private birdSightings: BirdSighting[] = [];

  // User methods
  createUser(user: User): void {
    this.users.push(user);
  }

  findUserByUsername(username: string): User | undefined {
    return this.users.find((u) => u.username === username);
  }

  findUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getAllUsers(): User[] {
    return this.users;
  }

  // Bird sighting methods
  addBirdSighting(sighting: BirdSighting): void {
    this.birdSightings.push(sighting);
  }

  getUserBirdSightings(userId: string): BirdSighting[] {
    return this.birdSightings.filter((s) => s.userId === userId);
  }

  deleteBirdSighting(id: string, userId: string): boolean {
    const index = this.birdSightings.findIndex(
      (s) => s.id === id && s.userId === userId
    );
    if (index > -1) {
      this.birdSightings.splice(index, 1);
      return true;
    }
    return false;
  }

  getLeaderboard(): LeaderboardEntry[] {
    const userCounts = this.users.map((user) => ({
      username: user.username,
      birdCount: this.birdSightings.filter((s) => s.userId === user.id).length,
    }));

    return userCounts.sort((a, b) => b.birdCount - a.birdCount);
  }
}

export const dataStore = new DataStore();
