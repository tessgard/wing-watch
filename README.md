# 🐦 Wing Watch

_A bit of counting, a lot of chirping_

A full-stack birding application for bird watchers to track their sightings, compete with friends

## ✨ Features

### 🔐 User Management

- Individual user authentication and login
- Personal birding profiles and statistics
- Multi-user support with unique bird lists

### 🐦 Bird Tracking

- Australian bird catalog with scientific names and family classifications
- New Caledonian bird catalog for the Worldwide competition
- **Smart search dropdown** with real-time filtering
- **Duplicate prevention** - no cheating allowed!
- Add and delete birds from personal lists
- Automatic bird counting and statistics

### 🏆 Social Features

- Australian and Worldwide leaderboards with rankings by eligible bird count
- Per-user competition choice remembered in the current browser
- **Crown for the leader** - competitive birding at its finest
- Browse other users' bird lists
- See who's the top birder in your area

### 📱 Mobile-First Design

- Optimized for phone screens and outdoor use
- Responsive navigation with bottom bar
- Modern icons using React Icons

### 🎯 User Experience

- Clean, intuitive interface
- Real-time updates and validation
- Loading states and error handling
- Smooth navigation between views

## Project Structure

```
wing-watch/
├── frontend/          # React TypeScript frontend
├── backend/           # Node.js Express TypeScript backend
├── .github/          # Development guidelines
└── README.md         # This file
```

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/tessgard/wing-watch.git
   cd wing-watch
   ```

2. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

### Running the Application

#### Option 1: VS Code Tasks (Recommended)

Use the built-in VS Code tasks:

- **Start Frontend Dev Server** - React development server
- **Start Backend Dev Server** - Express API server

Access via `Ctrl+Shift+P` → "Tasks: Run Task"

#### Option 2: Manual Start

**Backend Server:**

```bash
cd backend
npm run dev
```

- Runs on: http://localhost:3001
- Auto-restarts on file changes

**Frontend Server:**

```bash
cd frontend
npm start
```

- Runs on: http://localhost:3000
- Hot reloading enabled

### First Time Setup

1. Start both servers
2. Open http://localhost:3000
3. Create a username to begin birding
4. Start adding birds to your list!

## 🛠 Technology Stack

### Frontend

- **React 19** with TypeScript
- **React Icons** (Lucide and FontAwesome)
- **Modern CSS** with mobile-first responsive design
- **Dark olive green theme** (#556B2F)
- Create React App for development workflow

### Backend

- **Node.js** with Express framework
- **TypeScript** for type safety
- **CORS** enabled for cross-origin requests
- **PostgreSQL** persistence through Prisma
- RESTful API design

### Data

- Australian bird species plus New Caledonian species not already present in the Australian catalog, with:
  - Common names (e.g., "Rainbow Lorikeet")
  - Scientific names (e.g., "Trichoglossus moluccanus")
  - Family classifications (e.g., "Psittacidae")

## 🔧 API Endpoints

### Authentication

- `POST /api/login` - User login/registration
- `GET /api/users` - Get all users
- `GET /api/users/:username?competition=australia|worldwide` - Get a scoped user profile and bird list (defaults to Australia)

### Bird Management

- `POST /api/users/:username/birds` - Add bird to user's list
- `DELETE /api/users/:username/birds/:birdId` - Remove bird from list

### Leaderboard

- `GET /api/leaderboard?competition=australia|worldwide` - Get scoped user rankings by bird count (defaults to Australia)

## 📱 How to Use

1. **Login**: Enter your username to create/access your account
2. **Choose a competition**: Australia is selected by default; select the dashboard's current-scope icon to toggle between Australian and Worldwide competitions. The choice is remembered for your username in this browser.
3. **Dashboard**: View the selected competition's leaderboard and browse scoped user lists
4. **Add Birds**: My List is the complete sighting list and always searches Australian plus New Caledonian species; the active competition only controls leaderboard scoring and competitor views
5. **My List**: View the sightings and count eligible for the selected competition
6. **Compete**: Australian sightings count in both competitions; non-Australian sightings count only in Worldwide

## 🚀 Development

### Building for Production

**Frontend:**

```bash
cd frontend
npm run build
```

**Backend:**

```bash
cd backend
npm run build
```

### Code Quality

- TypeScript for type safety
- ESLint and Prettier for code formatting
- Semantic commit messages
- Mobile-first responsive design principles

## 🎯 Future Enhancements

- Location-based bird sightings with GPS
- Photo upload for bird documentation
- Bird call audio recordings
- Social features (following other birders)
- Achievements and badges system
- Export personal bird lists
- Advanced filtering and search
- Seasonal migration tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow TypeScript and React best practices
4. Test your changes thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

---

**Happy Bird Watching!** 🐦 _Get out there and start counting!_
