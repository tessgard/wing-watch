// User interface
export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: Date;
}

// Bird sighting interface
export interface BirdSighting {
  id: string;
  userId: string;
  birdName: string;
  location?: string;
  notes?: string;
  createdAt: Date;
}

// Auth interfaces
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

export interface LeaderboardEntry {
  username: string;
  birdCount: number;
}
