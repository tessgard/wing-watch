import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { searchBirds, Bird } from "./australianBirds";

interface User {
  id: string;
  username: string;
  birdCount?: number;
}

interface BirdItem {
  id: string;
  name: string;
  dateAdded: string;
}

interface UserProfile {
  id: string;
  username: string;
  birdList: BirdItem[];
  birdCount: number;
}

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<
    "login" | "dashboard" | "myList" | "userList"
  >("login");
  const [leaderboard, setLeaderboard] = useState<
    { username: string; birdCount: number }[]
  >([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check for stored user on app load
  useEffect(() => {
    const storedUser = localStorage.getItem("wingwatch-user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setView("dashboard");
        loadDashboardData();
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("wingwatch-user");
      }
    }
  }, []);

  // Login function
  const handleLogin = async (username: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user);
        // Store user in localStorage for persistence
        localStorage.setItem("wingwatch-user", JSON.stringify(data.user));
        setView("dashboard");
        loadDashboardData();
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      const leaderboardRes = await fetch(`${API_BASE}/leaderboard`);
      const leaderboardData = await leaderboardRes.json();
      setLeaderboard(leaderboardData.leaderboard);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  // Load user profile
  const loadUserProfile = async (username: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/users/${username}`);
      const data = await response.json();
      if (response.ok) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add bird
  const addBird = async () => {
    if (!selectedBird || !currentUser || !userProfile) return;

    const birdName = `${selectedBird.commonName} (${selectedBird.scientificName})`;

    // Check if bird already exists in user's list
    if (userProfile.birdList.some((bird) => bird.name === birdName)) {
      setShowDuplicatePopup(true);
      setTimeout(() => setShowDuplicatePopup(false), 3000);
      return;
    }

    try {
      setLoading(true);
      console.log("Adding bird:", birdName, "for user:", currentUser.username);

      const response = await fetch(
        `${API_BASE}/users/${currentUser.username}/birds`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ birdName }),
        },
      );

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (response.ok) {
        setSelectedBird(null);
        setSearchQuery("");
        setShowDropdown(false);
        loadUserProfile(currentUser.username);
        loadDashboardData();
      } else {
        console.error("Failed to add bird:", responseData);
        alert(`Failed to add bird: ${responseData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding bird:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Error adding bird: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete bird
  const deleteBird = async (birdId: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch(
        `${API_BASE}/users/${currentUser.username}/birds/${birdId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        loadUserProfile(currentUser.username);
        loadDashboardData();
      }
    } catch (error) {
      console.error("Error deleting bird:", error);
    }
  };

  // Navigation handlers
  const viewMyList = () => {
    setView("myList");
    if (currentUser) {
      loadUserProfile(currentUser.username);
    }
  };

  const viewUserList = (username: string) => {
    setSelectedUser(username);
    setView("userList");
    loadUserProfile(username);
  };

  const backToDashboard = () => {
    setView("dashboard");
    loadDashboardData();
  };

  // Login Screen
  if (view === "login") {
    return (
      <div className="App login-screen">
        <div className="login-container">
          <h1>🐦</h1>
          <h1>Wing Watch</h1>
          <p>A bit of counting, a lot of chirping</p>
          <LoginForm onLogin={handleLogin} loading={loading} />
        </div>
      </div>
    );
  }

  // Dashboard Screen
  if (view === "dashboard") {
    return (
      <div className="App dashboard">
        <header className="app-header">
          <h1>Dashboard</h1>
          <p>Welcome, {currentUser?.username}!</p>
        </header>

        <nav className="bottom-nav">
          <button onClick={backToDashboard} className="nav-btn active">
            🏠 Dashboard
          </button>
          <button onClick={viewMyList} className="nav-btn">
            📝 My List
          </button>
        </nav>

        <main className="dashboard-content">
          <Leaderboard leaderboard={leaderboard} onViewUser={viewUserList} />
        </main>

        <footer className="app-footer">
          <button
            className="logout-btn"
            onClick={() => {
              setCurrentUser(null);
              localStorage.removeItem("wingwatch-user");
              setView("login");
            }}
          >
            Logout
          </button>
        </footer>
      </div>
    );
  }

  // My List Screen
  if (view === "myList") {
    return (
      <div className="App my-list">
        <header className="app-header">
          <h1>📝 My List</h1>
          <p>{userProfile?.birdCount || 0} birds spotted</p>
        </header>

        <nav className="bottom-nav">
          <button onClick={backToDashboard} className="nav-btn">
            🏠 Dashboard
          </button>
          <button onClick={viewMyList} className="nav-btn active">
            📝 My List
          </button>
        </nav>

        <main className="list-content">
          <AddBirdForm
            selectedBird={selectedBird}
            setSelectedBird={setSelectedBird}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            onAddBird={addBird}
            loading={loading}
          />
          {showDuplicatePopup && (
            <div className="duplicate-popup">
              Nice try, but this bird is already on your list! 🐦
            </div>
          )}
          {userProfile && (
            <BirdList
              birds={userProfile.birdList}
              onDeleteBird={deleteBird}
              canEdit={true}
            />
          )}
        </main>

        <footer className="app-footer">
          <button
            className="logout-btn"
            onClick={() => {
              setCurrentUser(null);
              localStorage.removeItem("wingwatch-user");
              setView("login");
            }}
          >
            Logout
          </button>
        </footer>
      </div>
    );
  }

  // User List Screen
  if (view === "userList") {
    return (
      <div className="App user-list">
        <header className="app-header">
          <button className="back-btn" onClick={backToDashboard}>
            ←
          </button>
          <h1>📝 {selectedUser}'s List</h1>
          <p>{userProfile?.birdCount || 0} birds spotted</p>
        </header>

        <main className="list-content">
          {userProfile && (
            <BirdList
              birds={userProfile.birdList}
              onDeleteBird={() => {}}
              canEdit={false}
            />
          )}
        </main>

        <footer className="app-footer">
          <button
            className="logout-btn"
            onClick={() => {
              setCurrentUser(null);
              localStorage.removeItem("wingwatch-user");
              setView("login");
            }}
          >
            Logout
          </button>
        </footer>
      </div>
    );
  }

  return null;
}

// Login Form Component
const LoginForm: React.FC<{
  onLogin: (username: string) => void;
  loading: boolean;
}> = ({ onLogin, loading }) => {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <input
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={loading}
        className="username-input"
      />
      <button
        type="submit"
        disabled={loading || !username.trim()}
        className="login-btn"
      >
        {loading ? "Logging in..." : "Start Birding"}
      </button>
    </form>
  );
};

// Leaderboard Component
const Leaderboard: React.FC<{
  leaderboard: { username: string; birdCount: number }[];
  onViewUser: (username: string) => void;
}> = ({ leaderboard, onViewUser }) => {
  const truncateUsername = (username: string) => {
    return username.length > 14 ? username.substring(0, 14) + "..." : username;
  };

  return (
    <section className="leaderboard">
      <h2>🏆 Leaderboard</h2>
      {leaderboard.length > 0 ? (
        <div className="leaderboard-list">
          {leaderboard.map((user, index) => (
            <button
              key={user.username}
              onClick={() => onViewUser(user.username)}
              className="leaderboard-item"
            >
              <span className="rank">#{index + 1}</span>
              <span className="username">
                {truncateUsername(user.username)}
              </span>
              <span className="count">{user.birdCount} birds</span>
              {index === 0 && <span className="crown">👑</span>}
            </button>
          ))}
        </div>
      ) : (
        <p className="empty-message">No birders yet!</p>
      )}
    </section>
  );
};

// Users List Component
// Add Bird Form Component
const AddBirdForm: React.FC<{
  selectedBird: Bird | null;
  setSelectedBird: (bird: Bird | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  onAddBird: () => void;
  loading: boolean;
}> = ({
  selectedBird,
  setSelectedBird,
  searchQuery,
  setSearchQuery,
  showDropdown,
  setShowDropdown,
  onAddBird,
  loading,
}) => {
  const filteredBirds = searchBirds(searchQuery);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowDropdown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);
    if (!value.trim()) {
      setSelectedBird(null);
    }
  };

  const handleBirdSelect = (bird: Bird) => {
    setSelectedBird(bird);
    setSearchQuery(`${bird.commonName} (${bird.scientificName})`);
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBird) {
      onAddBird();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-bird-form">
      <div className="search-container" ref={searchContainerRef}>
        <input
          type="text"
          placeholder="Search for a bird..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          disabled={loading}
          className="bird-input"
        />

        {showDropdown && searchQuery.trim() && (
          <div className="dropdown">
            {filteredBirds.length > 0 ? (
              filteredBirds.slice(0, 10).map((bird, index) => (
                <div
                  key={index}
                  className="dropdown-item"
                  onClick={() => handleBirdSelect(bird)}
                >
                  <div className="bird-common-name">{bird.commonName}</div>
                  <div className="bird-scientific-name">
                    {bird.scientificName}
                  </div>
                  <div className="bird-family">{bird.family}</div>
                </div>
              ))
            ) : (
              <div className="dropdown-item no-results">
                No birds found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !selectedBird}
        className="add-btn"
      >
        {loading ? "Adding..." : "Add Bird"}
      </button>
    </form>
  );
};

// Bird List Component
const BirdList: React.FC<{
  birds: BirdItem[];
  onDeleteBird: (birdId: string) => void;
  canEdit: boolean;
}> = ({ birds, onDeleteBird, canEdit }) => {
  return (
    <div className="bird-list">
      {birds.length > 0 ? (
        birds
          .slice()
          .reverse()
          .map((bird, index) => (
            <div key={bird.id} className="bird-item">
              <span className="bird-number">#{birds.length - index}</span>
              <span className="bird-name">{bird.name}</span>
              {canEdit && (
                <button
                  onClick={() => onDeleteBird(bird.id)}
                  className="delete-btn"
                >
                  ×
                </button>
              )}
            </div>
          ))
      ) : (
        <p className="empty-message">No birds spotted yet!</p>
      )}
    </div>
  );
};

export default App;
