# 🐦 Birding App

A full-stack application for bird watchers to track and log their bird sightings.

## Project Structure

```
birding-app/
├── frontend/          # React TypeScript frontend
├── backend/           # Node.js Express TypeScript backend
└── .github/
    └── copilot-instructions.md
```

## Features

- 🐦 Bird identification and logging
- 📍 Location-based sightings
- 📸 Photo upload capabilities
- 📚 Species information database
- 📖 Personal birding journal
- 📱 Responsive mobile design

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
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

#### Start both servers concurrently:

**Frontend Development Server:**

```bash
cd frontend
npm start
```

- Runs on: http://localhost:3000
- Hot reloading enabled

**Backend Development Server:**

```bash
cd backend
npm run dev
```

- Runs on: http://localhost:5000
- API endpoints: `/api/health`, `/api/birds`
- Auto-restarts on file changes

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

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/birds` - Get all bird sightings
- `POST /api/birds` - Log new bird sighting

## Technology Stack

### Frontend

- React 18 with TypeScript
- Create React App
- Modern CSS with responsive design
- Functional components with hooks

### Backend

- Node.js with Express
- TypeScript
- CORS enabled
- Environment variables with dotenv
- Nodemon for development

## VS Code Tasks

The project includes VS Code tasks for development:

- **Start Frontend Dev Server** - Launches React development server
- **Start Backend Dev Server** - Launches Express API server with nodemon

Access tasks via `Ctrl+Shift+P` → "Tasks: Run Task"

## Next Steps

1. Implement bird species database
2. Add user authentication
3. Create bird logging form
4. Implement photo upload functionality
5. Add location services
6. Create species identification guide
7. Build personal journal features

## Contributing

1. Follow TypeScript best practices
2. Use semantic commit messages
3. Implement proper error handling
4. Add comprehensive testing
5. Follow ESLint and Prettier formatting rules

---

**Happy Bird Watching!** 🐦
