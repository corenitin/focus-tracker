# FocusTracker — MERN Stack Focus Session App

A full-stack focus session tracker built with MongoDB, Express, React, and Node.js.

---

## Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | https://nodejs.org |
| npm | v9+ | (comes with Node.js) |
| MongoDB | v6+ | https://www.mongodb.com/try/download/community |
| Git | any | https://git-scm.com |

---

## Project Structure

```
focus-tracker/
├── backend/
│   ├── controllers/
│   │   ├── sessionController.js
│   │   └── statsController.js
│   ├── models/
│   │   └── Session.js
│   ├── routes/
│   │   ├── sessionRoutes.js
│   │   └── statsRoutes.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── Navbar.jsx
    │   ├── hooks/
    │   │   └── useTimer.js
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── NewSession.jsx
    │   │   ├── ActiveSession.jsx
    │   │   └── History.jsx
    │   ├── api.js
    │   ├── utils.js
    │   ├── App.jsx
    │   ├── App.css
    │   └── index.js
    └── package.json
```

---

## Setup & Installation

### Step 1 — Start MongoDB

**On macOS (with Homebrew):**
```bash
brew services start mongodb-community
```

**On Windows:**
```bash
# MongoDB runs as a service automatically after installation
# Or start manually:
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**On Linux (Ubuntu/Debian):**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod   # auto-start on boot
```

Verify it's running:
```bash
mongosh
# Should open a MongoDB shell — type 'exit' to quit
```

---

### Step 2 — Set Up the Backend

```bash
cd focus-tracker/backend
npm install
```

Check your `.env` file:
```
MONGO_URI=mongodb://localhost:27017/focustracker
PORT=5000
NODE_ENV=development
```

Start the backend:
```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
```

Test the API:
```bash
curl http://localhost:5000/api/health
# {"status":"ok","message":"Focus Tracker API running"}
```

---

### Step 3 — Set Up the Frontend

Open a **new terminal window/tab**:

```bash
cd focus-tracker/frontend
npm install
npm start
```

The React app opens at **http://localhost:3000** automatically.

---

## API Endpoints Reference

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/sessions | Create a new session |
| GET | /api/sessions | Get all sessions (with filters) |
| GET | /api/sessions/:id | Get single session |
| PUT | /api/sessions/:id | Update title/category/notes |
| DELETE | /api/sessions/:id | Delete a session |
| PATCH | /api/sessions/:id/pause | Pause active session |
| PATCH | /api/sessions/:id/resume | Resume paused session |
| PATCH | /api/sessions/:id/complete | Complete a session |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stats/overall | Total stats, by category |
| GET | /api/stats/daily?days=7 | Daily breakdown chart data |

### Query Parameters for GET /api/sessions
- `status` — filter by active/paused/completed
- `category` — filter by category name
- `page` — page number (default: 1)
- `limit` — results per page (default: 50)
- `startDate` — ISO date string
- `endDate` — ISO date string

---

## Troubleshooting

**MongoDB connection refused:**
- Make sure MongoDB service is running (see Step 1)
- Check MONGO_URI in `.env`

**Port 5000 already in use:**
- Change PORT in backend `.env` to 5001
- Update `"proxy"` in frontend `package.json` to match

**npm install fails:**
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

**React app shows network error:**
- Make sure backend is running on port 5000
- Check `"proxy": "http://localhost:5000"` is in frontend `package.json`

---

## Features

- ✅ Create focus sessions with title, category, and notes
- ⏱️ Live timer with animated ring progress
- ⏸️ Pause and resume sessions (paused time excluded from focus time)
- ✓ Complete sessions with final notes
- 📊 Dashboard with today/week stats and 7-day chart
- 📋 Full history with status and category filters + pagination
- 🗑️ Delete sessions
- 📱 Responsive design (mobile friendly)
